import { EditorError } from "./EditorError.js";
import { NumberValue } from "./NumberValue.js";
import { ShapeFactory } from "./ShapeFactory.js";
import { SvgDocument } from "./SvgDocument.js";
import { XmlText } from "./XmlText.js";
import { GroupShape } from "./shapes/GroupShape.js";
import type { Shape } from "./shapes/Shape.js";

interface ParsedElement {
  tag: string;
  attributes: Record<string, string>;
  children: ParsedElement[];
  text: string;
}

export interface SvgParseResult {
  document: SvgDocument;
  warnings: string[];
}

export class SvgParser {
  public constructor(private readonly factory: ShapeFactory) {}

  public parse(xml: string, sourcePath: string | null = null): SvgParseResult {
    const root = this.parseXml(xml);
    if (root.tag !== "svg") throw new EditorError("root element must be <svg>");
    const width = this.dimension(root, "width", 2, 800);
    const height = this.dimension(root, "height", 3, 600);
    const document = new SvgDocument(width, height, sourcePath);
    const warnings: string[] = [];
    const used = this.collectExplicitIds(root);
    const counters = new Map<string, number>();
    for (const child of root.children) document.insertChild(this.toShape(child, used, counters, warnings));
    return { document, warnings };
  }

  private parseXml(xml: string): ParsedElement {
    const cleaned = xml.replace(/<!--[\s\S]*?-->/g, "").replace(/<\?[\s\S]*?\?>/g, "");
    const tokens = cleaned.match(/<[^>]+>|[^<]+/g) ?? [];
    const stack: ParsedElement[] = [];
    let root: ParsedElement | null = null;

    for (const token of tokens) {
      if (!token.startsWith("<")) {
        if (stack.length > 0) stack[stack.length - 1]!.text += token;
        continue;
      }
      if (/^<\s*!/.test(token)) continue;
      if (/^<\s*\//.test(token)) {
        const name = token.replace(/^<\s*\//, "").replace(/\s*>$/, "").replace(/^.*:/, "");
        const current = stack.pop();
        if (!current || current.tag !== name) throw new EditorError("malformed SVG near </" + name + ">");
        continue;
      }

      const selfClosing = /\/\s*>$/.test(token);
      const body = token.slice(1, selfClosing ? token.lastIndexOf("/") : token.length - 1).trim();
      const nameMatch = /^([A-Za-z_:][\w:.-]*)/.exec(body);
      if (!nameMatch) throw new EditorError("malformed SVG tag");
      const tag = nameMatch[1]!.replace(/^.*:/, "");
      const attributes = this.parseAttributes(body.slice(nameMatch[0].length));
      const node: ParsedElement = { tag, attributes, children: [], text: "" };
      if (stack.length > 0) stack[stack.length - 1]!.children.push(node);
      else {
        if (root) throw new EditorError("multiple root elements");
        root = node;
      }
      if (!selfClosing) stack.push(node);
    }

    if (stack.length > 0) throw new EditorError("unclosed SVG element: " + stack[stack.length - 1]!.tag);
    if (!root) throw new EditorError("empty SVG document");
    return root;
  }

  private parseAttributes(source: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const regex = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      attributes[match[1]!.replace(/^.*:/, "")] = XmlText.decode(match[2] ?? match[3] ?? "");
    }
    return attributes;
  }

  private collectExplicitIds(root: ParsedElement): Set<string> {
    const used = new Set<string>();
    const walk = (node: ParsedElement): void => {
      if (node !== root) {
        const id = node.attributes.id;
        if (id) {
          if (used.has(id)) throw new EditorError("id already exists: " + id);
          used.add(id);
        }
      }
      node.children.forEach(walk);
    };
    walk(root);
    return used;
  }

  private toShape(node: ParsedElement, used: Set<string>, counters: Map<string, number>, warnings: string[]): Shape {
    if (!["rect", "circle", "ellipse", "line", "text", "g"].includes(node.tag)) throw new EditorError("unsupported SVG element: " + node.tag);
    const id = node.attributes.id ?? this.assignId(node.tag, used, counters, warnings);
    const shape = this.factory.fromSvg(node.tag, id, node.attributes, XmlText.decode(node.text));
    if (node.tag !== "g" && node.children.length > 0) throw new EditorError("unsupported nested content in <" + node.tag + ">");
    if (shape instanceof GroupShape) {
      for (const child of node.children) shape.insertChild(this.toShape(child, used, counters, warnings));
    }
    return shape;
  }

  private assignId(tag: string, used: Set<string>, counters: Map<string, number>, warnings: string[]): string {
    let next = counters.get(tag) ?? 0;
    let id: string;
    do { next += 1; id = tag + next; } while (used.has(id));
    counters.set(tag, next);
    used.add(id);
    warnings.push("warning: assigned id " + id + " to unnamed <" + tag + ">");
    return id;
  }

  private dimension(root: ParsedElement, name: string, viewBoxIndex: number, fallback: number): number {
    const direct = root.attributes[name];
    if (direct !== undefined) {
      const parsed = parseFloat(direct);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
      throw new EditorError("invalid canvas " + name + ": " + direct);
    }
    const viewBox = root.attributes.viewBox?.trim().split(/[ ,]+/);
    const value = viewBox?.[viewBoxIndex];
    return value === undefined ? fallback : NumberValue.positive(value, name);
  }
}

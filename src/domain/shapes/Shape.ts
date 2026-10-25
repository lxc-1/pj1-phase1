import { EditorError } from "../EditorError.js";
import { NumberValue } from "../NumberValue.js";
import type { ShapeContainer } from "../ShapeContainer.js";
import { XmlText } from "../XmlText.js";

export abstract class Shape {
  private parent: ShapeContainer | null = null;
  private readonly styles = new Map<string, string>();

  protected constructor(
    private readonly id: string,
    styles: Readonly<Record<string, string>> = {},
  ) {
    if (!id.trim()) {
      throw new EditorError("id must not be empty");
    }
    for (const [name, value] of Object.entries(styles)) {
      this.styles.set(name, value);
    }
  }

  public getId(): string { return this.id; }
  public getParent(): ShapeContainer | null { return this.parent; }
  public bindParent(parent: ShapeContainer | null): void { this.parent = parent; }
  public findById(id: string): Shape | null { return this.id === id ? this : null; }
  public countElements(): number { return 1; }

  public setAttribute(name: string, value: string): void {
    if (name === "fill" || name === "stroke") {
      this.styles.set(name, value);
      return;
    }
    if (name === "stroke-width") {
      NumberValue.nonNegative(value, "stroke-width");
      this.styles.set(name, value);
      return;
    }
    if (!this.setSpecificAttribute(name, value)) {
      throw new EditorError("unknown attribute: " + name);
    }
  }

  protected setSpecificAttribute(_name: string, _value: string): boolean { return false; }
  protected styleSnapshot(): Record<string, string> { return Object.fromEntries(this.styles); }
  protected styleSummary(): string { return [...this.styles.entries()].map(([name, value]) => name + "=" + value).join(" "); }

  protected svgAttributes(geometry: ReadonlyArray<readonly [string, string]>): string {
    const pairs: Array<readonly [string, string]> = [["id", this.id], ...geometry, ...this.styles.entries()];
    return pairs.map(([name, value]) => name + "=\"" + XmlText.escapeAttribute(value) + "\"").join(" ");
  }

  public abstract getTagName(): string;
  public abstract move(dx: number, dy: number): void;
  public abstract scale(factor: number): void;
  public abstract summary(): string;
  public abstract detailLines(): string[];
  public abstract toSvgLines(indent: number): string[];
  public abstract clone(): Shape;
}

import { EditorError } from "../EditorError.js";
import type { ShapeContainer } from "../ShapeContainer.js";
import { Shape } from "./Shape.js";

export class GroupShape extends Shape implements ShapeContainer {
  private readonly children: Shape[] = [];
  public constructor(id: string, styles: Readonly<Record<string, string>> = {}) { super(id, styles); }
  public getTagName(): string { return "g"; }
  public getChildren(): readonly Shape[] { return this.children; }
  public containerLabel(): string { return "g#" + this.getId(); }
  public indexOf(shape: Shape): number { return this.children.indexOf(shape); }
  public insertChild(shape: Shape, index = this.children.length): void { if (shape.getParent()) throw new EditorError("shape already has a parent: " + shape.getId()); this.children.splice(index, 0, shape); shape.bindParent(this); }
  public removeChild(shape: Shape): number { const index = this.indexOf(shape); if (index < 0) throw new EditorError("shape is not a child: " + shape.getId()); this.children.splice(index, 1); shape.bindParent(null); return index; }
  public override findById(id: string): Shape | null { if (this.getId() === id) return this; for (const child of this.children) { const found = child.findById(id); if (found) return found; } return null; }
  public override countElements(): number { return 1 + this.children.reduce((sum, child) => sum + child.countElements(), 0); }
  public contains(shape: Shape): boolean { return this.children.some((child) => child === shape || (child instanceof GroupShape && child.contains(shape))); }
  public move(dx: number, dy: number): void { for (const child of this.children) child.move(dx, dy); }
  public scale(factor: number): void { for (const child of this.children) child.scale(factor); }
  public summary(): string { const style = this.styleSummary(); return "g#" + this.getId() + (style ? "  " + style : ""); }
  public detailLines(): string[] { const style = this.styleSummary(); return ["children=" + this.children.length, ...(style ? [style] : [])]; }
  public toSvgLines(indent: number): string[] { const prefix = "  ".repeat(indent); const attrs = this.svgAttributes([]); if (this.children.length === 0) return [prefix + "<g " + attrs + "/>"]; return [prefix + "<g " + attrs + ">", ...this.children.flatMap((child) => child.toSvgLines(indent + 1)), prefix + "</g>"]; }
  public clone(): GroupShape { const copy = new GroupShape(this.getId(), this.styleSnapshot()); for (const child of this.children) copy.insertChild(child.clone()); return copy; }
}

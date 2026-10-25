import { EditorError } from "./EditorError.js";
import { NumberValue } from "./NumberValue.js";
import type { ShapeContainer } from "./ShapeContainer.js";
import type { Shape } from "./shapes/Shape.js";

export class SvgDocument implements ShapeContainer {
  private readonly children: Shape[] = [];

  public constructor(
    private width: number,
    private height: number,
    private sourcePath: string | null = null,
  ) {
    if (width <= 0 || height <= 0) throw new EditorError("canvas dimensions must be positive");
  }

  public getWidth(): number { return this.width; }
  public getHeight(): number { return this.height; }
  public getSourcePath(): string | null { return this.sourcePath; }
  public setSourcePath(path: string): void { this.sourcePath = path; }
  public setSize(width: number, height: number): void { if (width <= 0 || height <= 0) throw new EditorError("canvas dimensions must be positive"); this.width = width; this.height = height; }
  public getChildren(): readonly Shape[] { return this.children; }
  public containerLabel(): string { return "svg"; }
  public indexOf(shape: Shape): number { return this.children.indexOf(shape); }
  public insertChild(shape: Shape, index = this.children.length): void { if (shape.getParent()) throw new EditorError("shape already has a parent: " + shape.getId()); this.children.splice(index, 0, shape); shape.bindParent(this); }
  public removeChild(shape: Shape): number { const index = this.indexOf(shape); if (index < 0) throw new EditorError("shape is not a child: " + shape.getId()); this.children.splice(index, 1); shape.bindParent(null); return index; }
  public findShape(id: string): Shape | null { for (const child of this.children) { const found = child.findById(id); if (found) return found; } return null; }
  public requireShape(id: string): Shape { const shape = this.findShape(id); if (!shape) throw new EditorError("no such shape: " + id); return shape; }
  public assertIdAvailable(id: string): void { if (this.findShape(id)) throw new EditorError("id already exists: " + id); }
  public countElements(): number { return this.children.reduce((sum, child) => sum + child.countElements(), 0); }
  public sizeLabel(): string { return NumberValue.format(this.width) + "x" + NumberValue.format(this.height); }
  public clone(): SvgDocument { const copy = new SvgDocument(this.width, this.height, this.sourcePath); for (const child of this.children) copy.insertChild(child.clone()); return copy; }
}

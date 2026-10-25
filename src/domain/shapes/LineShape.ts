import { NumberValue } from "../NumberValue.js";
import { Shape } from "./Shape.js";

export class LineShape extends Shape {
  public constructor(id: string, private x1: number, private y1: number, private x2: number, private y2: number, styles: Readonly<Record<string, string>> = {}) { super(id, styles); }
  public getTagName(): string { return "line"; }
  public move(dx: number, dy: number): void { this.x1 += dx; this.y1 += dy; this.x2 += dx; this.y2 += dy; }
  public scale(factor: number): void { this.x1 *= factor; this.y1 *= factor; this.x2 *= factor; this.y2 *= factor; }
  protected override setSpecificAttribute(name: string, value: string): boolean {
    if (name === "x1") this.x1 = NumberValue.parse(value, name);
    else if (name === "y1") this.y1 = NumberValue.parse(value, name);
    else if (name === "x2") this.x2 = NumberValue.parse(value, name);
    else if (name === "y2") this.y2 = NumberValue.parse(value, name);
    else return false;
    return true;
  }
  public summary(): string { const style = this.styleSummary(); return "line#" + this.getId() + "  (" + NumberValue.format(this.x1) + "," + NumberValue.format(this.y1) + ") -> (" + NumberValue.format(this.x2) + "," + NumberValue.format(this.y2) + ")" + (style ? " " + style : ""); }
  public detailLines(): string[] { const style = this.styleSummary(); return ["x1=" + NumberValue.format(this.x1) + " y1=" + NumberValue.format(this.y1) + " x2=" + NumberValue.format(this.x2) + " y2=" + NumberValue.format(this.y2), ...(style ? [style] : [])]; }
  public toSvgLines(indent: number): string[] { const attrs = this.svgAttributes([["x1", NumberValue.format(this.x1)], ["y1", NumberValue.format(this.y1)], ["x2", NumberValue.format(this.x2)], ["y2", NumberValue.format(this.y2)]]); return ["  ".repeat(indent) + "<line " + attrs + "/>"]; }
  public clone(): LineShape { return new LineShape(this.getId(), this.x1, this.y1, this.x2, this.y2, this.styleSnapshot()); }
}

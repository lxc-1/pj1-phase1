import { NumberValue } from "../NumberValue.js";
import { Shape } from "./Shape.js";

export class EllipseShape extends Shape {
  public constructor(id: string, private cx: number, private cy: number, private rx: number, private ry: number, styles: Readonly<Record<string, string>> = {}) { super(id, styles); }
  public getTagName(): string { return "ellipse"; }
  public move(dx: number, dy: number): void { this.cx += dx; this.cy += dy; }
  public scale(factor: number): void { this.cx *= factor; this.cy *= factor; this.rx *= factor; this.ry *= factor; }
  protected override setSpecificAttribute(name: string, value: string): boolean {
    if (name === "cx") this.cx = NumberValue.parse(value, name);
    else if (name === "cy") this.cy = NumberValue.parse(value, name);
    else if (name === "rx") this.rx = NumberValue.nonNegative(value, name);
    else if (name === "ry") this.ry = NumberValue.nonNegative(value, name);
    else return false;
    return true;
  }
  public summary(): string { const style = this.styleSummary(); return "ellipse#" + this.getId() + "  cx=" + NumberValue.format(this.cx) + " cy=" + NumberValue.format(this.cy) + " rx=" + NumberValue.format(this.rx) + " ry=" + NumberValue.format(this.ry) + (style ? " " + style : ""); }
  public detailLines(): string[] { const style = this.styleSummary(); return ["cx=" + NumberValue.format(this.cx) + " cy=" + NumberValue.format(this.cy) + " rx=" + NumberValue.format(this.rx) + " ry=" + NumberValue.format(this.ry), ...(style ? [style] : [])]; }
  public toSvgLines(indent: number): string[] { const attrs = this.svgAttributes([["cx", NumberValue.format(this.cx)], ["cy", NumberValue.format(this.cy)], ["rx", NumberValue.format(this.rx)], ["ry", NumberValue.format(this.ry)]]); return ["  ".repeat(indent) + "<ellipse " + attrs + "/>"]; }
  public clone(): EllipseShape { return new EllipseShape(this.getId(), this.cx, this.cy, this.rx, this.ry, this.styleSnapshot()); }
}

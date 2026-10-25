import { NumberValue } from "../NumberValue.js";
import { Shape } from "./Shape.js";

export class CircleShape extends Shape {
  public constructor(id: string, private cx: number, private cy: number, private radius: number, styles: Readonly<Record<string, string>> = {}) { super(id, styles); }
  public getTagName(): string { return "circle"; }
  public move(dx: number, dy: number): void { this.cx += dx; this.cy += dy; }
  public scale(factor: number): void { this.cx *= factor; this.cy *= factor; this.radius *= factor; }
  protected override setSpecificAttribute(name: string, value: string): boolean {
    if (name === "cx") this.cx = NumberValue.parse(value, name);
    else if (name === "cy") this.cy = NumberValue.parse(value, name);
    else if (name === "r") this.radius = NumberValue.nonNegative(value, name);
    else return false;
    return true;
  }
  public summary(): string { const style = this.styleSummary(); return "circle#" + this.getId() + "  cx=" + NumberValue.format(this.cx) + " cy=" + NumberValue.format(this.cy) + " r=" + NumberValue.format(this.radius) + (style ? " " + style : ""); }
  public detailLines(): string[] { const style = this.styleSummary(); return ["cx=" + NumberValue.format(this.cx) + " cy=" + NumberValue.format(this.cy) + " r=" + NumberValue.format(this.radius), ...(style ? [style] : [])]; }
  public toSvgLines(indent: number): string[] { const attrs = this.svgAttributes([["cx", NumberValue.format(this.cx)], ["cy", NumberValue.format(this.cy)], ["r", NumberValue.format(this.radius)]]); return ["  ".repeat(indent) + "<circle " + attrs + "/>"]; }
  public clone(): CircleShape { return new CircleShape(this.getId(), this.cx, this.cy, this.radius, this.styleSnapshot()); }
}

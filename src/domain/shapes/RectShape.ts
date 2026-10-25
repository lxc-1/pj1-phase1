import { NumberValue } from "../NumberValue.js";
import { Shape } from "./Shape.js";

export class RectShape extends Shape {
  public constructor(
    id: string,
    private x: number,
    private y: number,
    private width: number,
    private height: number,
    styles: Readonly<Record<string, string>> = {},
  ) { super(id, styles); }

  public getTagName(): string { return "rect"; }
  public move(dx: number, dy: number): void { this.x += dx; this.y += dy; }
  public scale(factor: number): void { this.x *= factor; this.y *= factor; this.width *= factor; this.height *= factor; }

  protected override setSpecificAttribute(name: string, value: string): boolean {
    if (name === "x") this.x = NumberValue.parse(value, name);
    else if (name === "y") this.y = NumberValue.parse(value, name);
    else if (name === "width") this.width = NumberValue.nonNegative(value, name);
    else if (name === "height") this.height = NumberValue.nonNegative(value, name);
    else return false;
    return true;
  }

  public summary(): string {
    const style = this.styleSummary();
    return "rect#" + this.getId() + "  x=" + NumberValue.format(this.x) + " y=" + NumberValue.format(this.y) + " w=" + NumberValue.format(this.width) + " h=" + NumberValue.format(this.height) + (style ? " " + style : "");
  }
  public detailLines(): string[] {
    const style = this.styleSummary();
    return ["x=" + NumberValue.format(this.x) + " y=" + NumberValue.format(this.y) + " width=" + NumberValue.format(this.width) + " height=" + NumberValue.format(this.height), ...(style ? [style] : [])];
  }
  public toSvgLines(indent: number): string[] {
    const attrs = this.svgAttributes([["x", NumberValue.format(this.x)], ["y", NumberValue.format(this.y)], ["width", NumberValue.format(this.width)], ["height", NumberValue.format(this.height)]]);
    return ["  ".repeat(indent) + "<rect " + attrs + "/>"];
  }
  public clone(): RectShape { return new RectShape(this.getId(), this.x, this.y, this.width, this.height, this.styleSnapshot()); }
}

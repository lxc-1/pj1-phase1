import { NumberValue } from "../NumberValue.js";
import { XmlText } from "../XmlText.js";
import { Shape } from "./Shape.js";

export class TextShape extends Shape {
  public constructor(id: string, private x: number, private y: number, private text: string, styles: Readonly<Record<string, string>> = {}) { super(id, styles); }
  public getTagName(): string { return "text"; }
  public move(dx: number, dy: number): void { this.x += dx; this.y += dy; }
  public scale(factor: number): void { this.x *= factor; this.y *= factor; }
  protected override setSpecificAttribute(name: string, value: string): boolean {
    if (name === "x") this.x = NumberValue.parse(value, name);
    else if (name === "y") this.y = NumberValue.parse(value, name);
    else if (name === "text") this.text = value;
    else return false;
    return true;
  }
  public summary(): string { const style = this.styleSummary(); return "text#" + this.getId() + "  (" + NumberValue.format(this.x) + "," + NumberValue.format(this.y) + ") \"" + this.text + "\"" + (style ? " " + style : ""); }
  public detailLines(): string[] { const style = this.styleSummary(); return ["x=" + NumberValue.format(this.x) + " y=" + NumberValue.format(this.y), "text=\"" + this.text + "\"", ...(style ? [style] : [])]; }
  public toSvgLines(indent: number): string[] { const attrs = this.svgAttributes([["x", NumberValue.format(this.x)], ["y", NumberValue.format(this.y)]]); return ["  ".repeat(indent) + "<text " + attrs + ">" + XmlText.escapeText(this.text) + "</text>"]; }
  public clone(): TextShape { return new TextShape(this.getId(), this.x, this.y, this.text, this.styleSnapshot()); }
}

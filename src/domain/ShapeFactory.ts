import { EditorError } from "./EditorError.js";
import { NumberValue } from "./NumberValue.js";
import { CircleShape } from "./shapes/CircleShape.js";
import { EllipseShape } from "./shapes/EllipseShape.js";
import { GroupShape } from "./shapes/GroupShape.js";
import { LineShape } from "./shapes/LineShape.js";
import { RectShape } from "./shapes/RectShape.js";
import type { Shape } from "./shapes/Shape.js";
import { TextShape } from "./shapes/TextShape.js";

export class ShapeFactory {
  public create(type: string, id: string, args: readonly string[]): Shape {
    switch (type) {
      case "rect": this.expect(type, args, 4, 5); return new RectShape(id, NumberValue.parse(args[0]!, "x"), NumberValue.parse(args[1]!, "y"), NumberValue.nonNegative(args[2]!, "width"), NumberValue.nonNegative(args[3]!, "height"), this.optionalStyle("fill", args[4]));
      case "circle": this.expect(type, args, 3, 4); return new CircleShape(id, NumberValue.parse(args[0]!, "cx"), NumberValue.parse(args[1]!, "cy"), NumberValue.nonNegative(args[2]!, "r"), this.optionalStyle("fill", args[3]));
      case "ellipse": this.expect(type, args, 4, 5); return new EllipseShape(id, NumberValue.parse(args[0]!, "cx"), NumberValue.parse(args[1]!, "cy"), NumberValue.nonNegative(args[2]!, "rx"), NumberValue.nonNegative(args[3]!, "ry"), this.optionalStyle("fill", args[4]));
      case "line": this.expect(type, args, 4, 5); return new LineShape(id, NumberValue.parse(args[0]!, "x1"), NumberValue.parse(args[1]!, "y1"), NumberValue.parse(args[2]!, "x2"), NumberValue.parse(args[3]!, "y2"), this.optionalStyle("stroke", args[4]));
      case "text": this.expect(type, args, 3, 3); return new TextShape(id, NumberValue.parse(args[0]!, "x"), NumberValue.parse(args[1]!, "y"), args[2]!);
      case "g": this.expect(type, args, 0, 0); return new GroupShape(id);
      default: throw new EditorError("unknown shape type: " + type + " (is the plugin loaded?)");
    }
  }

  public fromSvg(type: string, id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    const styles = this.stylesFrom(attributes);
    const value = (name: string): string => attributes[name] ?? "0";
    switch (type) {
      case "rect": return new RectShape(id, NumberValue.parse(value("x"), "x"), NumberValue.parse(value("y"), "y"), NumberValue.nonNegative(value("width"), "width"), NumberValue.nonNegative(value("height"), "height"), styles);
      case "circle": return new CircleShape(id, NumberValue.parse(value("cx"), "cx"), NumberValue.parse(value("cy"), "cy"), NumberValue.nonNegative(value("r"), "r"), styles);
      case "ellipse": return new EllipseShape(id, NumberValue.parse(value("cx"), "cx"), NumberValue.parse(value("cy"), "cy"), NumberValue.nonNegative(value("rx"), "rx"), NumberValue.nonNegative(value("ry"), "ry"), styles);
      case "line": return new LineShape(id, NumberValue.parse(value("x1"), "x1"), NumberValue.parse(value("y1"), "y1"), NumberValue.parse(value("x2"), "x2"), NumberValue.parse(value("y2"), "y2"), styles);
      case "text": return new TextShape(id, NumberValue.parse(value("x"), "x"), NumberValue.parse(value("y"), "y"), text, styles);
      case "g": return new GroupShape(id, styles);
      default: throw new EditorError("unsupported SVG element: " + type);
    }
  }

  private expect(type: string, args: readonly string[], min: number, max: number): void { if (args.length < min || args.length > max) throw new EditorError("invalid arguments for create " + type); }
  private optionalStyle(name: string, value: string | undefined): Record<string, string> { return value === undefined ? {} : { [name]: value }; }
  private stylesFrom(attributes: Readonly<Record<string, string>>): Record<string, string> { const styles: Record<string, string> = {}; for (const name of ["fill", "stroke", "stroke-width"]) { const value = attributes[name]; if (value !== undefined) styles[name] = value; } return styles; }
}

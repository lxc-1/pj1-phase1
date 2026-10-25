import { NumberValue } from "./NumberValue.js";
import type { SvgDocument } from "./SvgDocument.js";

export class SvgSerializer {
  public serialize(document: SvgDocument): string {
    const width = NumberValue.format(document.getWidth());
    const height = NumberValue.format(document.getHeight());
    const lines = [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + width + "\" height=\"" + height + "\" viewBox=\"0 0 " + width + " " + height + "\">",
      ...document.getChildren().flatMap((shape) => shape.toSvgLines(1)),
      "</svg>",
    ];
    return lines.join("\n") + "\n";
  }
}

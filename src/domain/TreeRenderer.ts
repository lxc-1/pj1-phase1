import { EditorError } from "./EditorError.js";
import type { SvgDocument } from "./SvgDocument.js";
import { GroupShape } from "./shapes/GroupShape.js";
import type { Shape } from "./shapes/Shape.js";

export class TreeRenderer {
  public render(document: SvgDocument, id?: string): string {
    if (id) {
      const shape = document.findShape(id);
      if (!shape) throw new EditorError("no such shape: " + id);
      return this.renderShape(shape, "", true, true).join("\n");
    }
    const lines = ["svg (" + document.sizeLabel() + ")"];
    const children = document.getChildren();
    children.forEach((shape, index) => lines.push(...this.renderShape(shape, "", index === children.length - 1, false)));
    return lines.join("\n");
  }

  private renderShape(shape: Shape, prefix: string, isLast: boolean, rootOnly: boolean): string[] {
    const connector = rootOnly ? "" : (isLast ? "└── " : "├── ");
    const lines = [prefix + connector + shape.summary()];
    if (shape instanceof GroupShape) {
      const childPrefix = rootOnly ? "" : prefix + (isLast ? "    " : "│   ");
      const children = shape.getChildren();
      children.forEach((child, index) => lines.push(...this.renderShape(child, childPrefix, index === children.length - 1, false)));
    }
    return lines;
  }
}

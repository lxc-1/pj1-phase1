import type { Shape } from "./shapes/Shape.js";

export class ShowRenderer {
  public render(shape: Shape): string {
    const parent = shape.getParent();
    const header = shape.getTagName() + "#" + shape.getId() + "  parent=" + (parent ? parent.containerLabel() : "none");
    return [header, ...shape.detailLines().map((line) => "  " + line)].join("\n");
  }
}

import { EditorError } from "../../domain/EditorError.js";
import { SvgDocument } from "../../domain/SvgDocument.js";
import { GroupShape } from "../../domain/shapes/GroupShape.js";
import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class UngroupCommand extends SnapshotCommand {
  public constructor(private readonly id: string) { super(); }
  protected perform(context: CommandContext): CommandResult {
    const shape = context.requireDocument().requireShape(this.id);
    if (!(shape instanceof GroupShape)) throw new EditorError("not a container: " + this.id);
    const parent = shape.getParent();
    if (!parent) throw new Error("group has no parent");
    if (parent instanceof SvgDocument) throw new EditorError("cannot ungroup top-level container: " + this.id);
    const index = parent.removeChild(shape);
    const children = [...shape.getChildren()];
    let offset = 0;
    for (const child of children) {
      shape.removeChild(child);
      parent.insertChild(child, index + offset);
      offset += 1;
    }
    return { forward: "g#" + this.id + " ungrouped", undo: "g#" + this.id + " restored" };
  }
}

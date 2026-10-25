import { EditorError } from "../../domain/EditorError.js";
import { GroupShape } from "../../domain/shapes/GroupShape.js";
import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class AddToCommand extends SnapshotCommand {
  public constructor(private readonly groupId: string, private readonly shapeId: string) { super(); }
  protected perform(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    const candidate = document.findShape(this.groupId);
    if (!candidate) throw new EditorError("no such container: " + this.groupId);
    if (!(candidate instanceof GroupShape)) throw new EditorError("not a container: " + this.groupId);
    const shape = document.requireShape(this.shapeId);
    if (shape === candidate || (shape instanceof GroupShape && shape.contains(candidate))) {
      throw new EditorError("cannot add a container into its own descendant: " + shape.getId());
    }
    const oldParent = shape.getParent();
    if (!oldParent) throw new Error("shape has no parent");
    oldParent.removeChild(shape);
    candidate.insertChild(shape);
    const label = shape.getTagName() + "#" + shape.getId();
    return { forward: label + " moved into g#" + this.groupId, undo: label + " restored into " + oldParent.containerLabel() };
  }
}

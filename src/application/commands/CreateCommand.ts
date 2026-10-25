import { EditorError } from "../../domain/EditorError.js";
import { GroupShape } from "../../domain/shapes/GroupShape.js";
import type { ShapeContainer } from "../../domain/ShapeContainer.js";
import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class CreateCommand extends SnapshotCommand {
  public constructor(
    private readonly type: string,
    private readonly id: string,
    private readonly args: readonly string[],
    private readonly parentId: string | null,
  ) { super(); }

  protected perform(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    document.assertIdAvailable(this.id);
    let parent: ShapeContainer = document;
    if (this.parentId) {
      const candidate = document.findShape(this.parentId);
      if (!candidate) throw new EditorError("no such container: " + this.parentId);
      if (!(candidate instanceof GroupShape)) throw new EditorError("not a container: " + this.parentId);
      parent = candidate;
    }
    const shape = context.getShapeFactory().create(this.type, this.id, this.args);
    parent.insertChild(shape);
    const label = shape.getTagName() + "#" + shape.getId();
    return {
      forward: label + " created" + (parent instanceof GroupShape ? " in " + parent.containerLabel() : ""),
      undo: label + " removed",
    };
  }
}

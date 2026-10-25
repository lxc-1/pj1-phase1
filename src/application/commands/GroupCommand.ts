import { EditorError } from "../../domain/EditorError.js";
import { GroupShape } from "../../domain/shapes/GroupShape.js";
import type { Shape } from "../../domain/shapes/Shape.js";
import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class GroupCommand extends SnapshotCommand {
  public constructor(private readonly groupId: string, private readonly shapeIds: readonly string[]) { super(); }

  protected perform(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    document.assertIdAvailable(this.groupId);
    if (this.shapeIds.length === 0) throw new EditorError("group requires at least one shape");
    if (new Set(this.shapeIds).size !== this.shapeIds.length) throw new EditorError("group contains duplicate shape ids");
    const shapes = this.shapeIds.map((id) => document.requireShape(id));
    this.assertNoAncestorConflict(shapes);
    const targetParent = shapes[0]!.getParent();
    if (!targetParent) throw new Error("shape has no parent");
    const siblingIndexes = shapes.filter((shape) => shape.getParent() === targetParent).map((shape) => targetParent.indexOf(shape));
    const insertionIndex = Math.min(...siblingIndexes);
    for (const shape of shapes) {
      const parent = shape.getParent();
      if (!parent) throw new Error("shape has no parent");
      parent.removeChild(shape);
    }
    const group = new GroupShape(this.groupId);
    targetParent.insertChild(group, insertionIndex);
    for (const shape of shapes) group.insertChild(shape);
    return {
      forward: "g#" + this.groupId + " created with " + shapes.length + " children",
      undo: "g#" + this.groupId + " removed and children restored",
    };
  }

  private assertNoAncestorConflict(shapes: readonly Shape[]): void {
    for (const candidate of shapes) {
      if (!(candidate instanceof GroupShape)) continue;
      for (const other of shapes) {
        if (candidate !== other && candidate.contains(other)) {
          throw new EditorError("cannot group a container into its own descendant: " + candidate.getId());
        }
      }
    }
  }
}

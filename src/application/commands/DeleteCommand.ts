import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class DeleteCommand extends SnapshotCommand {
  public constructor(private readonly id: string) { super(); }
  protected perform(context: CommandContext): CommandResult {
    const shape = context.requireDocument().requireShape(this.id);
    const parent = shape.getParent();
    if (!parent) throw new Error("shape has no parent");
    parent.removeChild(shape);
    const label = shape.getTagName() + "#" + shape.getId();
    return { forward: label + " deleted", undo: label + " restored into " + parent.containerLabel() };
  }
}

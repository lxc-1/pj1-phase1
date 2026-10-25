import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export type ReorderDirection = "front" | "back";

export class ReorderCommand extends SnapshotCommand {
  public constructor(private readonly id: string, private readonly direction: ReorderDirection) { super(); }
  protected perform(context: CommandContext): CommandResult {
    const shape = context.requireDocument().requireShape(this.id);
    const parent = shape.getParent();
    if (!parent) throw new Error("shape has no parent");
    parent.removeChild(shape);
    parent.insertChild(shape, this.direction === "front" ? parent.getChildren().length : 0);
    const label = shape.getTagName() + "#" + shape.getId();
    return { forward: label + " moved to " + this.direction, undo: label + " z-order restored" };
  }
}

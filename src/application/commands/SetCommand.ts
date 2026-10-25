import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class SetCommand extends SnapshotCommand {
  public constructor(private readonly id: string, private readonly attribute: string, private readonly value: string) { super(); }
  protected perform(context: CommandContext): CommandResult {
    const shape = context.requireDocument().requireShape(this.id);
    shape.setAttribute(this.attribute, this.value);
    const label = shape.getTagName() + "#" + shape.getId();
    return { forward: label + " updated: " + this.attribute + "=\"" + this.value + "\"", undo: label + " restored: " + this.attribute };
  }
}

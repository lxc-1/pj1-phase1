import { NumberValue } from "../../domain/NumberValue.js";
import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class MoveCommand extends SnapshotCommand {
  public constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) { super(); }
  protected perform(context: CommandContext): CommandResult {
    const shape = context.requireDocument().requireShape(this.id);
    shape.move(this.dx, this.dy);
    const label = shape.getTagName() + "#" + shape.getId();
    const delta = "(" + NumberValue.format(this.dx) + "," + NumberValue.format(this.dy) + ")";
    const reverse = "(" + NumberValue.format(-this.dx) + "," + NumberValue.format(-this.dy) + ")";
    return { forward: label + " moved by " + delta, undo: label + " moved back by " + reverse };
  }
}

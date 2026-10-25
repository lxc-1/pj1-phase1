import { EditorError } from "../../domain/EditorError.js";
import { NumberValue } from "../../domain/NumberValue.js";
import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import { SnapshotCommand } from "./SnapshotCommand.js";

export class ScaleCommand extends SnapshotCommand {
  public constructor(private readonly id: string, private readonly factor: number) { super(); }
  protected perform(context: CommandContext): CommandResult {
    if (this.factor <= 0) throw new EditorError("scale factor must be positive");
    const shape = context.requireDocument().requireShape(this.id);
    shape.scale(this.factor);
    const label = shape.getTagName() + "#" + shape.getId();
    return { forward: label + " scaled by " + NumberValue.format(this.factor), undo: label + " scale restored" };
  }
}

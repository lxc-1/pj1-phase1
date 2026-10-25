import type { SvgDocument } from "../../domain/SvgDocument.js";
import type { CommandContext } from "../CommandContext.js";
import type { CommandResult } from "./CommandResult.js";
import type { EditingCommand } from "./EditingCommand.js";

export abstract class SnapshotCommand implements EditingCommand {
  private before: SvgDocument | null = null;
  private after: SvgDocument | null = null;
  private result: CommandResult | null = null;

  public execute(context: CommandContext): string {
    this.before = context.requireDocument().clone();
    try {
      this.result = this.perform(context);
      this.after = context.requireDocument().clone();
      return this.result.forward;
    } catch (error) {
      context.replaceDocument(this.before.clone());
      throw error;
    }
  }

  public undo(context: CommandContext): string {
    if (!this.before || !this.result) throw new Error("command has not been executed");
    context.replaceDocument(this.before.clone());
    return this.result.undo;
  }

  public redo(context: CommandContext): string {
    if (!this.after || !this.result) throw new Error("command has not been executed");
    context.replaceDocument(this.after.clone());
    return this.result.forward;
  }

  protected abstract perform(context: CommandContext): CommandResult;
}

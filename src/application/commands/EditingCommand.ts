import type { CommandContext } from "../CommandContext.js";

export interface EditingCommand {
  execute(context: CommandContext): string;
  undo(context: CommandContext): string;
  redo(context: CommandContext): string;
}

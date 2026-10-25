import { EditorError } from "../domain/EditorError.js";
import type { CommandContext } from "./CommandContext.js";
import type { EditingCommand } from "./commands/EditingCommand.js";

export class CommandManager {
  private readonly undoStack: EditingCommand[] = [];
  private readonly redoStack: EditingCommand[] = [];
  private ioLocked = true;

  public execute(command: EditingCommand, context: CommandContext): string {
    const message = command.execute(context);
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.ioLocked = false;
    return message;
  }

  public undo(context: CommandContext): string {
    this.assertHistoryAllowed();
    const command = this.undoStack.pop();
    if (!command) throw new EditorError("nothing to undo");
    const message = command.undo(context);
    this.redoStack.push(command);
    return message;
  }

  public redo(context: CommandContext): string {
    this.assertHistoryAllowed();
    const command = this.redoStack.pop();
    if (!command) throw new EditorError("nothing to redo");
    const message = command.redo(context);
    this.undoStack.push(command);
    return message;
  }

  public markIoBoundary(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.ioLocked = true;
  }

  private assertHistoryAllowed(): void {
    if (this.ioLocked) throw new EditorError("undo not allowed after io command");
  }
}

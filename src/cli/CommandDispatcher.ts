import { AddToCommand } from "../application/commands/AddToCommand.js";
import { CreateCommand } from "../application/commands/CreateCommand.js";
import { DeleteCommand } from "../application/commands/DeleteCommand.js";
import { GroupCommand } from "../application/commands/GroupCommand.js";
import { MoveCommand } from "../application/commands/MoveCommand.js";
import { ReorderCommand } from "../application/commands/ReorderCommand.js";
import { ScaleCommand } from "../application/commands/ScaleCommand.js";
import { SetCommand } from "../application/commands/SetCommand.js";
import { UngroupCommand } from "../application/commands/UngroupCommand.js";
import { EditorSession } from "../application/EditorSession.js";
import { EditorError } from "../domain/EditorError.js";
import { NumberValue } from "../domain/NumberValue.js";
import { CommandLineTokenizer } from "./CommandLineTokenizer.js";
import { HelpText } from "./HelpText.js";

export class CommandDispatcher {
  private readonly tokenizer = new CommandLineTokenizer();
  private readonly helpText = new HelpText();
  public constructor(private readonly session: EditorSession) {}

  public async dispatch(line: string): Promise<string[]> {
    const tokens = this.tokenizer.tokenize(line);
    if (tokens.length === 0) return [];
    const command = tokens[0]!;
    switch (command) {
      case "init": return [this.init(tokens)];
      case "read": this.exact(tokens, 2); return this.session.read(tokens[1]!);
      case "save": this.range(tokens, 1, 2); return [await this.session.save(tokens[1])];
      case "canvas": return [this.canvas(tokens)];
      case "create": return [this.create(tokens)];
      case "delete": this.exact(tokens, 2); return [this.session.execute(new DeleteCommand(tokens[1]!))];
      case "move": this.exact(tokens, 4); return [this.session.execute(new MoveCommand(tokens[1]!, NumberValue.parse(tokens[2]!, "dx"), NumberValue.parse(tokens[3]!, "dy")))];
      case "scale": this.exact(tokens, 3); return [this.session.execute(new ScaleCommand(tokens[1]!, NumberValue.parse(tokens[2]!, "factor")))];
      case "set": this.exact(tokens, 4); return [this.session.execute(new SetCommand(tokens[1]!, tokens[2]!, tokens[3]!))];
      case "group": this.minimum(tokens, 3); return [this.session.execute(new GroupCommand(tokens[1]!, tokens.slice(2)))];
      case "ungroup": this.exact(tokens, 2); return [this.session.execute(new UngroupCommand(tokens[1]!))];
      case "addto": this.exact(tokens, 3); return [this.session.execute(new AddToCommand(tokens[1]!, tokens[2]!))];
      case "front": this.exact(tokens, 2); return [this.session.execute(new ReorderCommand(tokens[1]!, "front"))];
      case "back": this.exact(tokens, 2); return [this.session.execute(new ReorderCommand(tokens[1]!, "back"))];
      case "tree": this.range(tokens, 1, 2); return [this.session.tree(tokens[1])];
      case "show": this.exact(tokens, 2); return [this.session.show(tokens[1]!)];
      case "help": this.exact(tokens, 1); return [this.helpText.render()];
      case "undo": this.exact(tokens, 1); return [this.session.undo()];
      case "redo": this.exact(tokens, 1); return [this.session.redo()];
      default: throw new EditorError("unknown command: " + command);
    }
  }

  private init(tokens: readonly string[]): string {
    this.range(tokens, 1, 3);
    if (tokens.length === 2) throw new EditorError("usage: init [w] [h]");
    return tokens.length === 1 ? this.session.init() : this.session.init(NumberValue.positive(tokens[1]!, "width"), NumberValue.positive(tokens[2]!, "height"));
  }

  private canvas(tokens: readonly string[]): string {
    this.range(tokens, 1, 3);
    if (tokens.length === 2) throw new EditorError("usage: canvas [w] [h]");
    return tokens.length === 1 ? this.session.canvas() : this.session.canvas(NumberValue.positive(tokens[1]!, "width"), NumberValue.positive(tokens[2]!, "height"));
  }

  private create(tokens: readonly string[]): string {
    this.minimum(tokens, 3);
    let parentId: string | null = null;
    let argsEnd = tokens.length;
    if (tokens.length >= 5 && tokens[tokens.length - 2] === "in") {
      parentId = tokens[tokens.length - 1]!;
      argsEnd -= 2;
    }
    return this.session.execute(new CreateCommand(tokens[1]!, tokens[2]!, tokens.slice(3, argsEnd), parentId));
  }

  private exact(tokens: readonly string[], count: number): void { if (tokens.length !== count) throw new EditorError("invalid arguments for " + tokens[0]); }
  private minimum(tokens: readonly string[], count: number): void { if (tokens.length < count) throw new EditorError("invalid arguments for " + tokens[0]); }
  private range(tokens: readonly string[], min: number, max: number): void { if (tokens.length < min || tokens.length > max) throw new EditorError("invalid arguments for " + tokens[0]); }
}

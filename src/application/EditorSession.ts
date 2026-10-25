import { EditorError } from "../domain/EditorError.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { ShowRenderer } from "../domain/ShowRenderer.js";
import { SvgDocument } from "../domain/SvgDocument.js";
import { SvgParser } from "../domain/SvgParser.js";
import { SvgSerializer } from "../domain/SvgSerializer.js";
import { TreeRenderer } from "../domain/TreeRenderer.js";
import type { CommandContext } from "./CommandContext.js";
import { CommandManager } from "./CommandManager.js";
import type { EditingCommand } from "./commands/EditingCommand.js";
import type { FilePort } from "./ports/FilePort.js";

export class EditorSession implements CommandContext {
  private document: SvgDocument | null = null;
  private readonly factory = new ShapeFactory();
  private readonly parser = new SvgParser(this.factory);
  private readonly serializer = new SvgSerializer();
  private readonly treeRenderer = new TreeRenderer();
  private readonly showRenderer = new ShowRenderer();
  private readonly history = new CommandManager();

  public constructor(private readonly files: FilePort) {}

  public init(width = 800, height = 600): string {
    this.document = new SvgDocument(width, height);
    this.history.markIoBoundary();
    return "canvas " + this.document.sizeLabel() + " created";
  }

  public async read(path: string): Promise<string[]> {
    let source: string;
    try { source = await this.files.read(path); }
    catch { throw new EditorError("cannot read file: " + path); }
    const result = this.parser.parse(source, path);
    this.document = result.document;
    this.history.markIoBoundary();
    return [...result.warnings, "read " + path + " (" + result.document.countElements() + " elements)"];
  }

  public async save(path?: string): Promise<string> {
    const document = this.requireDocument();
    const target = path ?? document.getSourcePath();
    if (!target) throw new EditorError("no save path. use 'save <file.svg>' first");
    try { await this.files.write(target, this.serializer.serialize(document)); }
    catch { throw new EditorError("cannot write file: " + target); }
    document.setSourcePath(target);
    this.history.markIoBoundary();
    return "saved to " + target + " (" + document.countElements() + " elements)";
  }

  public canvas(width?: number, height?: number): string {
    const document = this.requireDocument();
    if (width === undefined || height === undefined) return "canvas " + document.sizeLabel();
    document.setSize(width, height);
    this.history.markIoBoundary();
    return "canvas resized to " + document.sizeLabel();
  }

  public execute(command: EditingCommand): string { return this.history.execute(command, this); }
  public undo(): string { return this.history.undo(this); }
  public redo(): string { return this.history.redo(this); }
  public tree(id?: string): string { return this.treeRenderer.render(this.requireDocument(), id); }
  public show(id: string): string { return this.showRenderer.render(this.requireDocument().requireShape(id)); }
  public requireDocument(): SvgDocument { if (!this.document) throw new EditorError("no document. use 'init' or 'read' first"); return this.document; }
  public replaceDocument(document: SvgDocument): void { this.document = document; }
  public getShapeFactory(): ShapeFactory { return this.factory; }
}

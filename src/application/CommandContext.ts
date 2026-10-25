import type { ShapeFactory } from "../domain/ShapeFactory.js";
import type { SvgDocument } from "../domain/SvgDocument.js";

export interface CommandContext {
  requireDocument(): SvgDocument;
  replaceDocument(document: SvgDocument): void;
  getShapeFactory(): ShapeFactory;
}

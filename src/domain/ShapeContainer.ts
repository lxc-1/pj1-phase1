import type { Shape } from "./shapes/Shape.js";

export interface ShapeContainer {
  getChildren(): readonly Shape[];
  insertChild(shape: Shape, index?: number): void;
  removeChild(shape: Shape): number;
  indexOf(shape: Shape): number;
  containerLabel(): string;
}

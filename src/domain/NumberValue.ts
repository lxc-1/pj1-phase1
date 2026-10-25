import { EditorError } from "./EditorError.js";

export class NumberValue {
  public static parse(value: string, label: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new EditorError("invalid number for " + label + ": " + value);
    }
    return parsed;
  }

  public static nonNegative(value: string, label: string): number {
    const parsed = this.parse(value, label);
    if (parsed < 0) {
      throw new EditorError(label + " must be non-negative");
    }
    return parsed;
  }

  public static positive(value: string, label: string): number {
    const parsed = this.parse(value, label);
    if (parsed <= 0) {
      throw new EditorError(label + " must be positive");
    }
    return parsed;
  }

  public static format(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  }
}

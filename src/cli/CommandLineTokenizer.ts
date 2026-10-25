import { EditorError } from "../domain/EditorError.js";

export class CommandLineTokenizer {
  public tokenize(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith("#")) return [];
    const tokens: string[] = [];
    let current = "";
    let inQuotes = false;
    let escaped = false;
    let tokenStarted = false;

    for (const character of line) {
      if (escaped) { current += character; escaped = false; tokenStarted = true; continue; }
      if (inQuotes && character === "\\") { escaped = true; continue; }
      if (character === "\"") { inQuotes = !inQuotes; tokenStarted = true; continue; }
      if (!inQuotes && /\s/.test(character)) {
        if (tokenStarted) { tokens.push(current); current = ""; tokenStarted = false; }
        continue;
      }
      current += character;
      tokenStarted = true;
    }
    if (escaped) current += "\\";
    if (inQuotes) throw new EditorError("unterminated quoted string");
    if (tokenStarted) tokens.push(current);
    return tokens;
  }
}

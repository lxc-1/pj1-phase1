import { readFile, writeFile } from "node:fs/promises";
import type { FilePort } from "../application/ports/FilePort.js";

export class FileGateway implements FilePort {
  public async read(path: string): Promise<string> { return readFile(path, "utf8"); }
  public async write(path: string, content: string): Promise<void> { await writeFile(path, content, "utf8"); }
}

import { readFile, writeFile } from "node:fs/promises";

export class FileGateway {
  public async read(path: string): Promise<string> { return readFile(path, "utf8"); }
  public async write(path: string, content: string): Promise<void> { await writeFile(path, content, "utf8"); }
}

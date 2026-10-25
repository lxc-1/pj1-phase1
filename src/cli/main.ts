import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { EditorSession } from "../application/EditorSession.js";
import { EditorError } from "../domain/EditorError.js";
import { CommandDispatcher } from "./CommandDispatcher.js";

const session = new EditorSession();
const dispatcher = new CommandDispatcher(session);
const terminal = Boolean(input.isTTY && output.isTTY);
const readline = createInterface({ input, output, terminal });

console.log("svg-editor 0.1 — type 'help' for commands");
if (terminal) readline.setPrompt("svg> ");
if (terminal) readline.prompt();

for await (const line of readline) {
  if (line.trim() === "exit" || line.trim() === "quit") break;
  try {
    const messages = await dispatcher.dispatch(line);
    for (const message of messages) console.log(message);
  } catch (error) {
    const message = error instanceof EditorError || error instanceof Error ? error.message : String(error);
    console.log("error: " + message);
  }
  if (terminal) readline.prompt();
}

readline.close();

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { EditorSession } from "../application/EditorSession.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";

test("read assigns missing ids and save-read round trip preserves structure", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "svg-cli-"));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const sourcePath = join(directory, "input.svg");
  const outputPath = join(directory, "output.svg");
  await writeFile(sourcePath, [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\">",
    "  <rect x=\"0\" y=\"0\" width=\"400\" height=\"300\" fill=\"#ffffff\"/>",
    "  <text id=\"t1\" x=\"10\" y=\"290\">A &amp; B</text>",
    "  <g id=\"g1\"><circle cx=\"5\" cy=\"5\" r=\"2\"/></g>",
    "</svg>",
  ].join("\n"), "utf8");

  const session = new EditorSession();
  const messages = await session.read(sourcePath);
  assert.deepEqual(messages.slice(0, 2), [
    "warning: assigned id rect1 to unnamed <rect>",
    "warning: assigned id circle1 to unnamed <circle>",
  ]);
  assert.match(session.tree(), /rect#rect1/);
  assert.match(session.tree(), /circle#circle1/);
  assert.match(session.show("t1"), /text="A & B"/);
  await session.save(outputPath);
  const saved = await readFile(outputPath, "utf8");
  assert.match(saved, /<rect id="rect1"/);
  assert.match(saved, /<circle id="circle1"/);
  assert.match(saved, />A &amp; B<\/text>/);

  const reloaded = new EditorSession();
  await reloaded.read(outputPath);
  assert.equal(reloaded.tree(), session.tree());
});

test("IO commands establish undo boundaries until a new edit succeeds", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "svg-cli-"));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const outputPath = join(directory, "saved.svg");
  const dispatcher = new CommandDispatcher(new EditorSession());
  await dispatcher.dispatch("init 100 80");
  await assert.rejects(dispatcher.dispatch("undo"), /undo not allowed after io command/);
  await dispatcher.dispatch("create rect r1 0 0 10 10");
  await dispatcher.dispatch("undo");
  await dispatcher.dispatch("create rect r1 0 0 10 10");
  await dispatcher.dispatch("save \"" + outputPath + "\"");
  await assert.rejects(dispatcher.dispatch("undo"), /undo not allowed after io command/);
  await dispatcher.dispatch("move r1 5 0");
  await dispatcher.dispatch("undo");
  assert.match((await dispatcher.dispatch("show r1"))[0]!, /x=0 y=0/);
});

test("read and save failures use stable error messages", async () => {
  const session = new EditorSession();
  await assert.rejects(session.read("definitely-missing.svg"), /cannot read file: definitely-missing.svg/);
  session.init();
  await assert.rejects(session.save(), /no save path/);
});

test("duplicate ids in imported SVG are rejected", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "svg-cli-"));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const sourcePath = join(directory, "duplicate.svg");
  await writeFile(sourcePath, "<svg width=\"10\" height=\"10\"><rect id=\"same\" x=\"0\" y=\"0\" width=\"1\" height=\"1\"/><circle id=\"same\" cx=\"1\" cy=\"1\" r=\"1\"/></svg>", "utf8");
  await assert.rejects(new EditorSession().read(sourcePath), /id already exists: same/);
});

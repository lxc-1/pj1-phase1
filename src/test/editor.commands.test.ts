import assert from "node:assert/strict";
import test from "node:test";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";
import { EditorSession } from "../application/EditorSession.js";
import { FileGateway } from "../infrastructure/FileGateway.js";

test("creates all built-in shape types and renders a useful tree", async () => {
  const dispatcher = new CommandDispatcher(new EditorSession(new FileGateway()));
  await dispatcher.dispatch("init 400 300");
  await dispatcher.dispatch("create g scene");
  await dispatcher.dispatch("create rect r1 10 20 100 50 #eee in scene");
  await dispatcher.dispatch("create circle c1 100 100 20 red in scene");
  await dispatcher.dispatch("create ellipse e1 200 100 30 15 blue in scene");
  await dispatcher.dispatch("create line l1 0 0 20 30 black in scene");
  await dispatcher.dispatch("create text t1 20 40 \"My Diagram\" in scene");
  const tree = (await dispatcher.dispatch("tree"))[0]!;
  assert.match(tree, /svg \(400x300\)/);
  assert.match(tree, /rect#r1.*x=10 y=20 w=100 h=50 fill=#eee/);
  assert.match(tree, /circle#c1.*cx=100 cy=100 r=20 fill=red/);
  assert.match(tree, /ellipse#e1.*rx=30 ry=15 fill=blue/);
  assert.match(tree, /line#l1.*\(0,0\) -> \(20,30\) stroke=black/);
  assert.match(tree, /text#t1.*"My Diagram"/);
  await dispatcher.dispatch("set t1 text \"开始 节点\"");
  assert.match((await dispatcher.dispatch("show t1"))[0]!, /text="开始 节点"/);
});

test("move, scale, set, undo and redo operate as command-sized units", async () => {
  const dispatcher = new CommandDispatcher(new EditorSession(new FileGateway()));
  await dispatcher.dispatch("init");
  await dispatcher.dispatch("create circle c1 50 60 10 red");
  await dispatcher.dispatch("move c1 5 -10");
  assert.match((await dispatcher.dispatch("show c1"))[0]!, /cx=55 cy=50 r=10/);
  await dispatcher.dispatch("undo");
  assert.match((await dispatcher.dispatch("show c1"))[0]!, /cx=50 cy=60 r=10/);
  await dispatcher.dispatch("redo");
  assert.match((await dispatcher.dispatch("show c1"))[0]!, /cx=55 cy=50 r=10/);
  await dispatcher.dispatch("scale c1 2");
  assert.match((await dispatcher.dispatch("show c1"))[0]!, /cx=110 cy=100 r=20/);
  await dispatcher.dispatch("set c1 fill #123456");
  assert.match((await dispatcher.dispatch("show c1"))[0]!, /fill=#123456/);
});

test("a failed edit is atomic and does not destroy redo history", async () => {
  const dispatcher = new CommandDispatcher(new EditorSession(new FileGateway()));
  await dispatcher.dispatch("init");
  await dispatcher.dispatch("create rect r1 1 2 3 4");
  await dispatcher.dispatch("move r1 10 0");
  await dispatcher.dispatch("undo");
  const before = (await dispatcher.dispatch("tree"))[0]!;
  await assert.rejects(dispatcher.dispatch("scale r1 0"), /scale factor must be positive/);
  assert.equal((await dispatcher.dispatch("tree"))[0]!, before);
  await dispatcher.dispatch("redo");
  assert.match((await dispatcher.dispatch("show r1"))[0]!, /x=11 y=2/);
});

test("a successful edit after undo clears redo history", async () => {
  const dispatcher = new CommandDispatcher(new EditorSession(new FileGateway()));
  await dispatcher.dispatch("init");
  await dispatcher.dispatch("create rect r1 0 0 10 10");
  await dispatcher.dispatch("move r1 10 0");
  await dispatcher.dispatch("undo");
  await dispatcher.dispatch("set r1 fill red");
  await assert.rejects(dispatcher.dispatch("redo"), /nothing to redo/);
});

test("group, addto, z-order, delete and undo preserve hierarchy", async () => {
  const dispatcher = new CommandDispatcher(new EditorSession(new FileGateway()));
  await dispatcher.dispatch("init");
  await dispatcher.dispatch("create rect a 0 0 10 10");
  await dispatcher.dispatch("create rect b 20 0 10 10");
  await dispatcher.dispatch("create circle c 40 5 5");
  await dispatcher.dispatch("group pair a b");
  await dispatcher.dispatch("addto pair c");
  await dispatcher.dispatch("back c");
  let tree = (await dispatcher.dispatch("tree pair"))[0]!;
  assert.ok(tree.indexOf("circle#c") < tree.indexOf("rect#a"));
  await dispatcher.dispatch("front c");
  tree = (await dispatcher.dispatch("tree pair"))[0]!;
  assert.ok(tree.indexOf("circle#c") > tree.indexOf("rect#b"));
  await dispatcher.dispatch("delete b");
  assert.doesNotMatch((await dispatcher.dispatch("tree"))[0]!, /rect#b/);
  await dispatcher.dispatch("undo");
  assert.match((await dispatcher.dispatch("tree"))[0]!, /rect#b/);
});

test("invalid ancestor grouping is rejected without changing the tree", async () => {
  const dispatcher = new CommandDispatcher(new EditorSession(new FileGateway()));
  await dispatcher.dispatch("init");
  await dispatcher.dispatch("create g outer");
  await dispatcher.dispatch("create g inner in outer");
  await dispatcher.dispatch("create rect r1 0 0 1 1 in inner");
  const before = (await dispatcher.dispatch("tree"))[0]!;
  await assert.rejects(dispatcher.dispatch("group bad inner r1"), /cannot group a container into its own descendant: inner/);
  assert.equal((await dispatcher.dispatch("tree"))[0]!, before);
  await assert.rejects(dispatcher.dispatch("ungroup outer"), /cannot ungroup top-level container: outer/);
  await dispatcher.dispatch("ungroup inner");
  assert.match((await dispatcher.dispatch("tree outer"))[0]!, /rect#r1/);
  assert.doesNotMatch((await dispatcher.dispatch("tree outer"))[0]!, /g#inner/);
});

test("duplicate ids, bad containers and unknown attributes report specified errors", async () => {
  const dispatcher = new CommandDispatcher(new EditorSession(new FileGateway()));
  await assert.rejects(dispatcher.dispatch("tree"), /no document/);
  await dispatcher.dispatch("init");
  await dispatcher.dispatch("create rect r1 0 0 10 10");
  await assert.rejects(dispatcher.dispatch("create circle r1 1 1 1"), /id already exists: r1/);
  await assert.rejects(dispatcher.dispatch("create circle c1 1 1 1 in missing"), /no such container: missing/);
  await assert.rejects(dispatcher.dispatch("create circle c1 1 1 1 in r1"), /not a container: r1/);
  await assert.rejects(dispatcher.dispatch("set r1 opacity 0.5"), /unknown attribute: opacity/);
  await assert.rejects(dispatcher.dispatch("create box n1 0 0 10 10 title"), /unknown shape type: box/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
const appsCss=fs.readFileSync(path.join(root,"css/apps.css"),"utf8");
const mobileCss=fs.readFileSync(path.join(root,"css/mobile.css"),"utf8");

// This is a presentation-only repair. No state migration is warranted.
assert.equal(SAVE_VERSION,13);
assert.equal(WORLD_SCHEMA,10);

// Remote desktop and tools are now explicit mutually-exclusive mobile workspace modes.
assert.match(desktop,/remote-tool-active/);
assert.match(desktop,/remote-desktop-active/);
assert.match(desktop,/data-remote-desktop/);
assert.match(desktop,/← REMOTE DESKTOP/);
assert.match(desktop,/serviceDeskView\.remoteTool="desktop"/);

// Phone portrait replaces the simulated desktop with the chosen tool instead of stacking two cramped panes.
assert.match(mobileCss,/\.remote-workspace\.remote-desktop-active \.remote-tool-window\{display:none\}/);
assert.match(mobileCss,/\.remote-workspace\.remote-tool-active \.remote-screen\{display:none\}/);
assert.match(mobileCss,/\.remote-workspace\.remote-tool-active \.remote-tool-window\{grid-column:1;grid-row:1;min-height:0;height:100%\}/);
assert.match(mobileCss,/\.remote-workspace\.remote-tool-active \.remote-tool-content\{min-height:0;height:100%;overflow:auto;-webkit-overflow-scrolling:touch\}/);
assert.match(mobileCss,/\.remote-workspace\.remote-tool-active \.remote-tool-back\{display:inline-block/);
assert.match(appsCss,/\.remote-tool-back\{display:none/);

// Short landscape retains the established two-pane Remote Assistance layout.
assert.match(mobileCss,/@media \(orientation:landscape\) and \(max-height:520px\) and \(pointer:coarse\)[\s\S]*\.remote-workspace\{grid-template-columns:minmax\(285px,42%\) minmax\(0,1fr\);grid-template-rows:1fr/);

console.log("BLACKBOX v0.4.0 Alpha 4.6.1 Remote Assistance mobile polish guards passed");

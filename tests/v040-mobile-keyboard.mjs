import assert from "node:assert/strict";
import fs from "node:fs";
import { resetState, baseState } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { executeCommand } from "../js/systems/terminal.js";
import { AUTOSAVE_EVENTS } from "../js/core/autosave.js";

const read=path=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const html=read("../index.html");
const ui=read("../js/ui/terminalUI.js");
const terminalCss=read("../css/terminal.css");
const mobileCss=read("../css/mobile.css");

// Custom keyboard structure and safe system-keyboard fallback.
assert.match(html,/id="terminal-input-controls"/);
assert.match(html,/id="terminal-keys-collapse"/);
assert.match(html,/id="terminal-input-mode"/);
assert.match(html,/id="terminal-custom-keyboard"/);
assert.match(ui,/input\.readOnly=custom/);
assert.match(ui,/input\.setAttribute\("inputmode",custom\?"none":"text"\)/);
assert.match(ui,/if\(custom\)input\.blur\(\)/);
assert.match(ui,/input\.addEventListener\("pointerdown"/);
assert.match(ui,/currentInputMode!=="blackbox"/);
assert.match(ui,/e\.preventDefault\(\)/);
assert.ok(ui.includes('"|"'));
assert.match(ui,/SYSTEM KEYBOARD/);
assert.match(ui,/BLACKBOX KEYS/);
assert.match(ui,/form\.requestSubmit/);
assert.match(ui,/historyStep\(-1\)/);
assert.match(ui,/historyStep\(1\)/);
assert.match(ui,/document\.addEventListener\("keydown"/);
assert.match(ui,/e\.key\.length===1/);
assert.match(ui,/updateLatestOffset/);
assert.match(terminalCss,/\.terminal-custom-keyboard\.is-active\{display:block\}/);
assert.match(mobileCss,/@media \(pointer:coarse\)[\s\S]*\.terminal-input-controls,\.nexus-input-controls\{display:flex/);
assert.match(mobileCss,/@media \(orientation:landscape\) and \(max-height:520px\) and \(pointer:coarse\)[\s\S]*\.terminal-key,\.nexus-key\{min-height:29px/);

// Preference is safe in old/malformed saves without a schema bump.
{
  const s=resetState();
  assert.equal(s.ui.terminalInputMode,"auto");
  assert.ok(AUTOSAVE_EVENTS.includes("ui:terminal-input-mode"));
  const old=baseState();
  old.ui.terminalInputMode="nonsense";
  const migrated=migrateSave(structuredClone(old));
  assert.equal(migrated.ui.terminalInputMode,"auto");
}

// Real shell syntax: cd.. is rejected, cd .. works.
{
  const s=resetState();
  s.terminal.cwd="/home";
  const bad=await executeCommand("cd..");
  assert.equal(s.terminal.cwd,"/home");
  assert.ok(bad.lines.some(line=>line.type==="error"&&/command not found/.test(line.text)));
  assert.ok(bad.lines.some(line=>/use \"cd \.\.\"/.test(line.text)));

  const good=await executeCommand("cd ..");
  assert.equal(good.lines.some(line=>line.type==="error"),false);
  assert.equal(s.terminal.cwd,"/");

  s.terminal.cwd="/home";
  const badRoot=await executeCommand("cd/");
  assert.equal(s.terminal.cwd,"/home");
  assert.ok(badRoot.lines.some(line=>/use "cd \/"/.test(line.text)));
  const goodRoot=await executeCommand("cd /");
  assert.equal(goodRoot.lines.some(line=>line.type==="error"),false);
  assert.equal(s.terminal.cwd,"/");
}

console.log("BLACKBOX v0.4.0 Alpha 4.4 mobile terminal keyboard guards passed");

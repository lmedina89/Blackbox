import assert from "node:assert/strict";
import fs from "node:fs";
import { resetState, baseState } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { AUTOSAVE_EVENTS } from "../js/core/autosave.js";

const read=path=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const desktop=read("../js/ui/desktop.js");
const terminal=read("../js/ui/terminalUI.js");
const apps=read("../css/apps.css");
const terminalCss=read("../css/terminal.css");
const mobile=read("../css/mobile.css");

function inventory(rows){return [...new Set(rows.join("").toLowerCase().replace(/[^a-z0-9]/g,""))].sort().join("");}
const expectedLetters="abcdefghijklmnopqrstuvwxyz";
const expectedDigits="0123456789";

const nexusRows=["1234567890","qwertyuiop","asdfghjkl","zxcvbnm"];
const blackboxRows=["qwertyuiop","asdfghjkl","zxcvbnm"];
assert.equal(inventory(nexusRows).includes("l"),true);
assert.equal([...expectedLetters].every(ch=>inventory(nexusRows).includes(ch)),true);
assert.equal([...expectedDigits].every(ch=>inventory(nexusRows).includes(ch)),true);
assert.equal([...expectedLetters].every(ch=>inventory(blackboxRows).includes(ch)),true);
assert.match(desktop,/const NEXUS_KEYBOARD_ROWS=\["1234567890","qwertyuiop","asdfghjkl","zxcvbnm"\]/);
assert.match(terminal,/const BLACKBOX_KEYBOARD_ROWS=\["qwertyuiop","asdfghjkl","zxcvbnm"\]/);
assert.match(desktop,/NEXUS PERSONAL KEYBOARD/);
assert.match(terminal,/BLACKBOX SECURE INPUT DEVICE/);
assert.match(desktop,/SYSTEM KEYBOARD/);
assert.match(desktop,/NEXUS KEYS/);
assert.match(desktop,/ta\.readOnly=custom/);
assert.match(desktop,/ta\.setAttribute\("inputmode",custom\?"none":"text"\)/);
assert.match(apps,/\.nexus-keyboard-case/);
assert.match(apps,/clip-path:polygon\(6% 0,94% 0,100% 100%,0 100%\)/);
assert.match(terminalCss,/\.terminal-keyboard-case/);
assert.match(terminalCss,/clip-path:polygon\(6% 0,94% 0,100% 100%,0 100%\)/);
assert.match(mobile,/\.terminal-input-controls,\.nexus-input-controls\{display:flex/);
assert.match(mobile,/\.terminal-key,\.nexus-key\{min-height:29px/);

{
  const s=resetState();
  assert.equal(s.ui.nexusInputMode,"auto");
  assert.ok(AUTOSAVE_EVENTS.includes("ui:nexus-input-mode"));
  const old=baseState(); old.ui.nexusInputMode="garbage";
  const migrated=migrateSave(structuredClone(old));
  assert.equal(migrated.ui.nexusInputMode,"auto");
}
console.log("BLACKBOX v0.4.0 Alpha 4.4 dual keyboard polish guards passed");

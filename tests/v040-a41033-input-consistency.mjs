import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const desktop=read("../js/ui/desktop.js");
const terminal=read("../js/ui/terminalUI.js");
const apps=read("../css/apps.css");
const mobile=read("../css/mobile.css");
const index=read("../index.html");

// Service Desk Work Notes now use the same NEXUS personal keyboard path on touch devices.
assert.match(desktop,/function mountNexusTextKeyboard/);
assert.match(desktop,/class="nexus-custom-keyboard sd-note-keyboard"/);
assert.match(desktop,/class="nexus-input-mode sd-note-input-mode"/);
assert.match(desktop,/class="nexus-keys-collapse sd-note-keys-collapse"/);
assert.match(desktop,/startCollapsed:true/);
assert.match(desktop,/expandOnTap:true/);
assert.match(desktop,/ta\.readOnly=custom/);
assert.match(desktop,/ta\.setAttribute\("inputmode",custom\?"none":"text"\)/);
assert.match(desktop,/if\(custom\)ta\.blur\(\)/);
assert.match(desktop,/event\.preventDefault\(\);ta\.blur\(\)/);
assert.match(desktop,/NEXUS PERSONAL KEYBOARD/);
assert.match(desktop,/SYSTEM KEYBOARD/);
assert.match(desktop,/setTicketNotes\(selected\.id,el\.querySelector\("\.sd-notes"\)\?\.value\|\|""\)/,
  "SAVE NOTE should remain the persistence boundary for Work Notes");
assert.match(apps,/\.notepad-custom-input,\.nexus-custom-input\{caret-color:transparent\}/);
assert.match(mobile,/\.terminal-form-custom \.terminal-input,\.notepad-custom-input,\.nexus-custom-input\{user-select:none;-webkit-user-select:none\}/);

// The player-facing terminal banner hides QA and all four rails stay on one 44-character box.
const banner=[
  "┌──────────────────────────────────────────┐",
  "│       B L A C K B O X   S E C U R E      │",
  "│    INTERACTIVE SHELL 0.4.0-A4.10.3.3     │",
  "└──────────────────────────────────────────┘"
];
assert.deepEqual(banner.map(line=>line.length),[44,44,44,44]);
for(const line of banner)assert.ok(terminal.includes(JSON.stringify(line).slice(1,-1)),`missing terminal banner line: ${line}`);
assert.doesNotMatch(terminal,/INTERACTIVE SHELL[^\n]*-QA/);
assert.match(index,/v0\.4\.0 A4\.10\.3\.3 QA/);

console.log("BLACKBOX v0.4.0 A4.10.3.3 input consistency / terminal banner regression tests passed");

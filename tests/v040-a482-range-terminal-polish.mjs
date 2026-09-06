import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resetState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { executeCommand } from "../js/systems/terminal.js";
import { initNightwire, rangeTelemetry } from "../js/systems/nightwire.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);
initNightwire();
const text=result=>(result.lines||[]).map(x=>x.text).join("\n");
const run=async command=>text(await executeCommand(command));

const s=resetState();
s.player.alias="rangeqa";s.terminal.user="rangeqa";
s.world.completedMissions=["mission_cascade"];
s.world.flags.push("mission_cascade_complete");

// Concise beginner-facing syntax guidance must intercept malformed commands.
let out=await run("enum 0");
assert.match(out,/expected a target and service/i);
assert.match(out,/Example: enum 0 80/);
out=await run("probe 0");
assert.match(out,/not a fictional BBX profile/i);
assert.match(out,/Example: probe BBX-014 0/);
assert.doesNotMatch(out,/legacy-access host/i);
out=await run("probe scan 0");
assert.match(out,/not a fictional BBX profile/i);
out=await run("auth 0 ssh");
assert.match(out,/expected target, service, and known credential/i);
assert.match(out,/Example: auth 0 ssh rangeops/);

// Range 01 completion remains manual-detach but is unmistakable in NightWire.
await run("nightwire");await run("4");await run("start 01");
out=await run("scan");assert.match(out,/RANGE-WEB-01/);
assert.deepEqual(rangeTelemetry(),{labId:"range01",code:"01",title:"Enumeration Basics",noise:0,threshold:5,completedThisRun:false});
await run("enum 0 80");await run("probe BBX-014 0");
out=await run("access artifact 0");assert.match(out,/NW-RANGE-PROOF-01/);
assert.equal(rangeTelemetry().completedThisRun,true);
assert.equal(rangeTelemetry().noise,1);
out=await run("nightwire");
assert.match(out,/\*\*\* OBJECTIVE COMPLETE \*\*\*/);
assert.match(out,/Proof accepted\. Training result recorded/);
assert.match(out,/finish.*resume.*return/i);
out=await run("finish");
assert.match(out,/Training result saved\. Range segment detached/);
assert.match(out,/Next unlocked: RANGE 02 \/\/ Credential Foothold/);
assert.equal(rangeTelemetry(),null);

// Static physical-device UX guards.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const ui=fs.readFileSync(path.join(root,"js/ui/terminalUI.js"),"utf8");
const terminalCss=fs.readFileSync(path.join(root,"css/terminal.css"),"utf8");
const mobile=fs.readFileSync(path.join(root,"css/mobile.css"),"utf8");
assert.match(index,/id="terminal-custom-input-display"/);
assert.match(index,/id="terminal-custom-caret"[^>]*>█<\/span>/);
assert.match(index,/A4\.8\.2 QA/);
assert.match(ui,/\[ RANGE OBJECTIVE COMPLETE \]/);
assert.match(ui,/`RANGE-\$\{range\.code\}`/);
assert.match(ui,/range\?`\$\{range\.noise\}\/\$\{range\.threshold\}`/);
assert.match(terminalCss,/blackbox-caret-blink/);
assert.match(terminalCss,/\.terminal-form-custom \.terminal-input\{display:none\}/);
assert.match(mobile,/\.terminal-key\{font-size:14px\}/);
assert.match(mobile,/\.terminal-form\.terminal-form-custom\{flex-direction:row;align-items:center/);
assert.match(mobile,/clamp\(340px,44vw,560px\)/);
assert.match(mobile,/\.terminal-key\{min-height:38px;height:38px;padding:1px;font-size:12px/);

console.log("BLACKBOX v0.4.0 A4.8.2 Range & Terminal Mobile Polish tests passed");

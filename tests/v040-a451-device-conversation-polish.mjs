import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { resetState, setFlag } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { makeChoice } from "../js/systems/communications.js";
import { initTimeline } from "../js/systems/timeline.js";
import { THREADS } from "../js/data/messages.js";
import { contentAvailable } from "../js/systems/contentAvailability.js";
import { chronologyAvailable, contentTimeLabel, sortChronologically } from "../js/systems/contentChronology.js";

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const at=(s,h,m)=>{s.world.day=1;s.world.minute=h*60+m;};
const maya=THREADS.find(t=>t.id==="maya");
const msg=id=>maya.messages.find(m=>m.id===id);
const due=(s)=>sortChronologically(maya.messages.filter(m=>contentAvailable(m)&&chronologyAvailable(m,{kind:"message",state:s})),s,{direction:"asc"});

// Reproduce the physical-device late Easy Money sequence from A4.5.
// Mission completion at 19:27 may intentionally create a two-message Maya burst,
// but the player's reply must never jump backward to 19:04 and the follow-up must
// be anchored after the actual choice.
{
  const s=resetState();at(s,19,27);setFlag("alias_created");setFlag("mission_first_complete");
  s.world.caseHistory.push({id:"mission:mission_first",kind:"mission",day:1,minute:19*60+27,title:"Easy Money"});
  let visible=due(s);
  assert(visible.some(m=>m.id==="m4"));
  assert(visible.some(m=>m.id==="m5"));
  assert.equal(contentTimeLabel(msg("m4"),s),"19:27");
  assert.equal(contentTimeLabel(msg("m5"),s),"19:27");

  const result=makeChoice("mirror_send");
  assert(result.ok);
  assert.equal(s.communications.choiceTimes.mirror_send,19*60+27);
  assert.equal(contentTimeLabel(msg("m6"),s),"19:27","player reply must use actual choice time");
  assert.equal(contentTimeLabel(msg("m8"),s),"19:30","Maya follow-up must be relative to actual choice time");
  assert.equal(chronologyAvailable(msg("m8"),{kind:"message",state:s}),false,"follow-up must not be visible before its relative time");
  visible=due(s);
  assert.deepEqual(visible.slice(-3).map(m=>m.id),["m4","m5","m6"],"choice must not reorder the conversation into the past");

  at(s,19,30);
  assert.equal(chronologyAvailable(msg("m8"),{kind:"message",state:s}),true);
  visible=due(s);
  assert.deepEqual(visible.slice(-4).map(m=>m.id),["m4","m5","m6","m8"]);
  assert.deepEqual(visible.slice(-4).map(m=>contentTimeLabel(m,s)),["19:27","19:27","19:27","19:30"]);
}

// Real event wiring: the existing dialogue action advances three minutes, making the
// choice-relative Maya follow-up due at exactly the new world time rather than back-dating it.
{
  const s=resetState();at(s,19,27);setFlag("alias_created");setFlag("mission_first_complete");
  s.world.caseHistory.push({id:"mission:mission_first",kind:"mission",day:1,minute:19*60+27,title:"Easy Money"});
  initTimeline();
  const result=makeChoice("mirror_why");
  assert(result.ok);
  assert.equal(s.world.minute,19*60+30);
  assert.equal(contentTimeLabel(msg("m7"),s),"19:27");
  assert.equal(contentTimeLabel(msg("m8"),s),"19:30");
  assert.equal(chronologyAvailable(msg("m8"),{kind:"message",state:s}),true);
}

// A4.5 -> A4.5.1 migration preserves the already-known thread choice timestamp.
{
  const old=resetState();
  old.meta.saveVersion=11;
  old.communications={choicesMade:["mirror_send"],threads:{maya:{lastDeliveredNode:null,lastDeliveryAt:null,lastPresentedNode:"m5",lastPresentedAt:19*60+27,waitingForReply:null,lastChoiceId:"mirror_send",lastChoiceAt:19*60+27,cooldownUntil:null}}};
  const migrated=migrateSave(structuredClone(old));
  assert.equal(migrated.meta.saveVersion,12);
  assert.equal(migrated.communications.choiceTimes.mirror_send,19*60+27);
}

// Landscape input is a right-side dock rather than a vertically flattened full-width keyboard.
{
  const css=fs.readFileSync(path.join(root,"css/mobile.css"),"utf8");
  const ui=fs.readFileSync(path.join(root,"js/ui/terminalUI.js"),"utf8");
  assert.match(css,/\.terminal-shell\.terminal-shell-custom\.terminal-shell-keys-open\{\s*display:grid;/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) clamp\(320px,42vw,520px\)/);
  assert.match(css,/\.terminal-shell\.terminal-shell-custom\.terminal-shell-keys-open \.terminal-output\{[^}]*grid-column:1;grid-row:1 \/ 3/);
  assert.match(css,/\.terminal-shell\.terminal-shell-custom\.terminal-shell-keys-open \.terminal-custom-keyboard\{[^}]*grid-column:2;grid-row:2 \/ 4/);
  assert.match(css,/\.terminal-shell\.terminal-shell-custom\.terminal-shell-keys-open \.terminal-key\{[^}]*min-height:34px[^}]*height:34px/);
  assert.match(ui,/terminal-shell-keys-open/);
  assert.match(ui,/customKeyboard\.offsetWidth/);
  assert.match(ui,/landscapeTouch\(\)/);
}

console.log("BLACKBOX v0.4.0 Alpha 4.5.1 device/conversation polish tests passed");

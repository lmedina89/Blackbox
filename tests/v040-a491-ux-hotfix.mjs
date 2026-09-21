import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resetState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { executeCommand, buildHelpIndex } from "../js/systems/terminal.js";
import { THREATDESK_QUESTIONS } from "../js/data/learning.js";
import { questionInstruction, shuffleOrderOptions, validateQuestionSubmission, optionFeedback } from "../js/ui/threatDeskQuestion.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);

// Multi-select must communicate and validate the authored count without recording malformed submissions.
{
  const q=THREATDESK_QUESTIONS.find(item=>item.id==="q_event_evidence");
  assert.equal(questionInstruction(q),"SELECT 2 ANSWERS");
  assert.equal(validateQuestionSubmission(q,["time"]).ok,false);
  assert.match(validateQuestionSubmission(q,["time"]).message,/exactly 2/i);
  assert.equal(validateQuestionSubmission(q,["time","source"]).ok,true);
  assert.equal(validateQuestionSubmission(q,["time","source","color"]).ok,false);
  assert.deepEqual(optionFeedback(q,["time","color"],"time"),{selected:true,correct:true,incorrect:false});
  assert.deepEqual(optionFeedback(q,["time","color"],"color"),{selected:true,correct:false,incorrect:true});
}

// Order questions must never be initially handed to the player solved, even if RNG preserves source order.
{
  const q=THREATDESK_QUESTIONS.find(item=>item.id==="q_troubleshoot_order");
  const displayed=shuffleOrderOptions(q,()=>0.999999).map(option=>option.id);
  assert.notDeepEqual(displayed,q.answer);
  assert.deepEqual(new Set(displayed),new Set(q.answer));
  assert.equal(questionInstruction(q),"ORDER ALL STEPS");
}

// Structured help remains complete while preserving a plain-text fallback for non-UI callers/tests.
{
  const s=resetState();s.player.alias="qa";
  const index=buildHelpIndex();
  assert(index.some(section=>section.title==="SYSTEM"));
  assert(index.some(section=>section.title==="FILES"));
  assert(index.some(section=>section.title==="NETWORK"));
  assert(index.some(section=>section.title==="GAME"));
  const network=index.find(section=>section.title==="NETWORK");
  assert(network.entries.some(entry=>entry.command==="enum"&&entry.args==="<host> <service>"));
  const result=await executeCommand("help");
  assert(Array.isArray(result.helpIndex));
  assert.match(result.lines[0].text,/BLACKBOX COMMAND INDEX/);
}

// Static guards for the physical-device fixes.
{
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const questionUi=fs.readFileSync(path.join(root,"js/ui/threatDeskQuestion.js"),"utf8");
  const terminalUi=fs.readFileSync(path.join(root,"js/ui/terminalUI.js"),"utf8");
  const terminalCss=fs.readFileSync(path.join(root,"css/terminal.css"),"utf8");
  const mobileCss=fs.readFileSync(path.join(root,"css/mobile.css"),"utf8");
  const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(questionUi,/SELECT \$\{count\|\|"ALL REQUIRED"\} ANSWER/);
  assert.match(desktop,/lastSubmission/);
  assert.match(desktop,/orderPresentation/);
  assert.match(terminalUi,/renderHelpIndex/);
  assert.match(terminalUi,/terminal-key-space/);
  assert.match(terminalUi,/terminal-key-backspace/);
  assert.match(terminalUi,/terminal-key-history/);
  assert.match(terminalUi,/terminal-form-stacked/);
  assert.match(terminalCss,/\.terminal-help-row\{display:grid/);
  assert.match(terminalCss,/\.terminal-latest\{position:static/);
  assert.match(mobileCss,/terminal-form-stacked/);
  assert.match(index,/A4\.10\.0 QA/);
}

console.log("BLACKBOX v0.4.0 A4.9.1 ThreatDesk & Mobile Terminal UX hotfix tests passed");

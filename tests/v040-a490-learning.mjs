import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resetState, getState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { emit } from "../js/core/events.js";
import { initLearning, answerQuestion, learningSnapshot, conceptStatus, reviewQueue, recordLearningExperience } from "../js/systems/learning.js";
import { THREATDESK_QUESTIONS, LEARNING_TRACKS } from "../js/data/learning.js";

assert.equal(SAVE_VERSION,15,"A4.9 reuses the existing learning save shape and does not require a schema bump");
assert.equal(WORLD_SCHEMA,10);
assert(THREATDESK_QUESTIONS.length>=24,"A4.9 should seed a compact but meaningful question bank");
assert.equal(LEARNING_TRACKS.length,5);

// Fresh learning state: a miss enters review, two later correct review passes clear it.
{
  resetState();initLearning();
  let snap=learningSnapshot();
  assert.equal(snap.reviewQueue.length,0);
  const wrong=answerQuestion("q_apipa","dns");
  assert.equal(wrong.correct,false);
  assert(reviewQueue().includes("q_apipa"));
  assert.equal(conceptStatus("network.apipa"),"NEEDS REVIEW");
  const firstReview=answerQuestion("q_apipa","dhcp",{mode:"review"});
  assert.equal(firstReview.correct,true);
  assert(reviewQueue().includes("q_apipa"),"one correct review pass should not instantly erase a miss");
  const secondReview=answerQuestion("q_apipa","dhcp",{mode:"review"});
  assert.equal(secondReview.correct,true);
  assert(!reviewQueue().includes("q_apipa"));
  assert.equal(conceptStatus("network.apipa"),"PRACTICED");
}

// Multiple-select and ordering formats are evaluated as authored, not as single-choice aliases.
{
  resetState();initLearning();
  assert.equal(answerQuestion("q_dns_isolation",["name_problem","ip_path"]).correct,true,"multi-select should be order-insensitive");
  assert.equal(answerQuestion("q_dhcp_order",["confirm","start","renew","verify"]).correct,true);
  assert.equal(answerQuestion("q_dhcp_order",["start","confirm","renew","verify"]).correct,false,"ordering should be sequence-sensitive");
}

// Existing A4.0 Training Lab completions are backfilled without changing their stable IDs.
{
  const s=resetState();s.world.completedLabs=["lab_dns","lab_access"];
  initLearning();const snap=learningSnapshot();
  assert.equal(snap.questionAttempts.lab_dns.correct,1);
  assert.equal(snap.questionAttempts.lab_access.correct,1);
  assert.equal(conceptStatus("network.dns"),"PRACTICED");
}

// Range applied experience is idempotent and remains distinct from explicit knowledge checks.
{
  resetState();initLearning();
  emit("range:completed",{labId:"range01",noise:1,failedAuth:0,hintsUsed:0});
  let snap=learningSnapshot();
  assert.equal(snap.topicStats["security.enumeration"].appliedCount,1);
  assert.equal(conceptStatus("security.enumeration"),"PRACTICED");
  emit("range:completed",{labId:"range01",noise:2,failedAuth:1,hintsUsed:1});
  snap=learningSnapshot();
  assert.equal(snap.topicStats["security.enumeration"].appliedCount,1,"replaying a Range lab must not farm applied progression");
  assert.equal(answerQuestion("q_enum_vs_scan","detail").correct,true);
  assert.equal(conceptStatus("security.enumeration"),"DEMONSTRATED","knowledge + applied evidence should produce demonstrated status");
}

// Service Desk resolved events count as applied practice; escalations do not.
{
  resetState();initLearning();
  emit("helpdesk:changed",{ticketId:"INC-0002",type:"escalated",score:30});
  assert.equal(learningSnapshot().topicStats["network.dns"],undefined);
  emit("helpdesk:changed",{ticketId:"INC-0002",type:"resolved",score:95});
  assert.equal(learningSnapshot().topicStats["network.dns"].appliedCount,1);
  emit("helpdesk:changed",{ticketId:"INC-0002",type:"resolved",score:100});
  assert.equal(learningSnapshot().topicStats["network.dns"].appliedCount,1);
}

// Generic learning experience API provides the common hook later missions/exploration can use.
{
  resetState();initLearning();
  const a=recordLearningExperience({concepts:["analysis.evidence_correlation"],kind:"discovered",source:"mission",refId:"future-case"});
  const b=recordLearningExperience({concepts:["analysis.evidence_correlation"],kind:"discovered",source:"mission",refId:"future-case"});
  assert.equal(a.recorded,true);assert.equal(b.recorded,false);
  assert.equal(learningSnapshot().topicStats["analysis.evidence_correlation"].discoveredCount,1);
}

// Static integration guards: ThreatDesk is data-driven and learning changes autosave.
{
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const autosave=fs.readFileSync(path.join(root,"js/core/autosave.js"),"utf8");
  const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(desktop,/Learning Tracks/);
  assert.match(desktop,/Review Queue/);
  assert.match(desktop,/answerQuestion/);
  assert.doesNotMatch(desktop,/LABS\.map/);
  assert.match(autosave,/learning:changed/);
  assert.match(index,/A4\.9\.1 QA/);
}

console.log("BLACKBOX v0.4.0 A4.9 Learning Architecture & ThreatDesk v2 foundation tests passed");

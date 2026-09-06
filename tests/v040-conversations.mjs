import assert from "node:assert/strict";
import { resetState, replaceState } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { getThreadState, makeChoice, recordPresentedThread, setThreadCooldown, setWaitingForReply } from "../js/systems/communications.js";

// Conversation state can persist presentation, waiting, choices, and cooldown without changing mission content.
{
  const s=resetState();s.world.day=1;s.world.minute=19*60+3;
  assert(setWaitingForReply("maya","m5"));
  assert(recordPresentedThread("maya","m5",19*60+3));
  assert(setThreadCooldown("maya",19*60+30));
  let thread=getThreadState("maya");
  assert.equal(thread.waitingForReply,"m5");
  assert.equal(thread.lastPresentedNode,"m5");
  assert.equal(thread.lastPresentedAt,19*60+3);
  assert.equal(thread.cooldownUntil,19*60+30);

  const result=makeChoice("mirror_send");
  assert(result.ok);
  thread=getThreadState("maya");
  assert.equal(thread.waitingForReply,null);
  assert.equal(thread.lastChoiceId,"mirror_send");
  assert.equal(thread.lastChoiceAt,19*60+3);
  assert.equal(s.communications.choiceTimes.mirror_send,19*60+3,"choice timestamp must persist by choice id");
  assert(s.world.flags.includes("mirror_lead_accepted"),"existing Old Mirror choice semantics changed");
}

// New per-thread state survives migration/save normalization and malformed values are safely repaired.
{
  const s=resetState();
  s.communications.threads={
    maya:{lastDeliveredNode:"m13",lastDeliveryAt:1135,lastPresentedNode:"m13",lastPresentedAt:1136,waitingForReply:null,lastChoiceId:null,lastChoiceAt:null,cooldownUntil:1200},
    broken:"oops"
  };
  const restored=migrateSave(structuredClone(s));replaceState(restored);
  assert.equal(restored.communications.threads.maya.lastDeliveredNode,"m13");
  assert.equal(restored.communications.threads.maya.lastDeliveryAt,1135);
  assert.equal(restored.communications.threads.maya.cooldownUntil,1200);
  assert(!("broken" in restored.communications.threads));
}

console.log("BLACKBOX v0.4.0 Alpha 4 conversation-state tests passed");

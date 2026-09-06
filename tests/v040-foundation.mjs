import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { baseState, SAVE_VERSION, WORLD_SCHEMA, resetState, setFlag } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { SCENARIO_METADATA } from "../js/data/scenarioMetadata.js";
import { MISSIONS } from "../js/data/missions.js";
import { contentAvailable } from "../js/systems/contentAvailability.js";

assert.equal(SAVE_VERSION,12);
assert.equal(WORLD_SCHEMA,10);

// A genuine v9 shape must migrate without altering current campaign progress.
{
  const v9=baseState();
  v9.meta.saveVersion=9;v9.meta.worldSchema=9;
  v9.player.alias="v9qa";
  v9.world.flags=["alias_created","mission_first_complete","mission_mirror_started"];
  v9.world.completedMissions=["mission_first"];
  v9.missions.active=["mission_mirror"];
  v9.missions.progress={mission_mirror:{find_mirror:true}};
  v9.world.readEmails=["welcome","first_job","job_paid"];
  v9.world.readMessages=["m1","m2","m3","m4","m5","m6","m8"];
  v9.communications.choicesMade=["mirror_send"];
  // Remove fields that did not exist in v9.
  delete v9.world.timeline;delete v9.communications.threads;delete v9.learning;delete v9.helpDesk;delete v9.behavior;
  const migrated=migrateSave(structuredClone(v9));
  assert.equal(migrated.meta.saveVersion,12);
  assert.equal(migrated.meta.worldSchema,10);
  assert.deepEqual(migrated.world.completedMissions,["mission_first"]);
  assert.deepEqual(migrated.missions.active,["mission_mirror"]);
  assert.equal(migrated.missions.progress.mission_mirror.find_mirror,true);
  assert.deepEqual(migrated.communications.choicesMade,["mirror_send"]);
  assert(migrated.world.timeline&&typeof migrated.world.timeline.scheduled==="object");
  assert.deepEqual(migrated.world.timeline.delivered,[]);
  assert.deepEqual(migrated.communications.threads,{});
  assert.deepEqual(migrated.helpDesk.completedTickets,[]);
  assert.deepEqual(migrated.behavior.decisions,[]);
}


// Legacy visibility semantics remain exact while scheduler-managed content requires delivery.
{
  const s=resetState();
  const legacy={visibleWhen:["legacy_ready"]};
  assert.equal(contentAvailable(legacy),false);
  setFlag("legacy_ready");
  assert.equal(contentAvailable(legacy),true);

  const scheduled={scheduleId:"future_message",visibleWhen:["legacy_ready"]};
  assert.equal(contentAvailable(scheduled),false);
  s.world.timeline.delivered.push("future_message");
  assert.equal(contentAvailable(scheduled),true);
  s.world.timeline.cancelled.push("future_message");
  assert.equal(contentAvailable(scheduled),false);
}

// Every current mission has metadata without changing the mission data file.
assert.equal(Object.keys(SCENARIO_METADATA).length,9);
for(const mission of MISSIONS){
  const meta=SCENARIO_METADATA[mission.id];
  assert(meta,`missing scenario metadata for ${mission.id}`);
  assert(meta.concepts.length>0,`${mission.id} has no learning concepts`);
  assert(meta.alignment.length>0,`${mission.id} has no certification alignment`);
}

// The mission data remains the same nine IDs/order.
assert.deepEqual(MISSIONS.map(m=>m.id),[
  "mission_first","mission_mirror","mission_recovery","mission_ghost","mission_deaddrop",
  "mission_relay","mission_dns","mission_beacon","mission_cascade"
]);

// Content availability helper exists and is imported by desktop rendering.
const desktop=readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
assert.match(desktop,/contentAvailable/);

console.log("BLACKBOX v0.4.0 Alpha 1 compatibility foundation tests passed");

import assert from "node:assert/strict";
import { baseState, resetState } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { emit } from "../js/core/events.js";
import { HOSTS } from "../js/data/hosts.js";
import { REMOTE_MACHINE_TEMPLATES } from "../js/data/serviceDesk.js";
import {
  WORLD_REGISTRY_VERSION,
  WORLD_ENTITIES,
  HOME_PC_CANONICAL,
  resolveWorldEntity,
  worldRegistryDiagnostics
} from "../js/data/worldRegistry.js";
import {
  initWorldConsistency,
  observeWorldEntity,
  worldConsistencySnapshot
} from "../js/systems/worldConsistency.js";

assert.equal(WORLD_REGISTRY_VERSION,1);
assert.equal(HOME_PC_CANONICAL.hostname,"HOME-PC");
assert.equal(HOME_PC_CANONICAL.address,HOSTS.home.address);
assert.ok(Object.keys(WORLD_ENTITIES).length>=Object.keys(HOSTS).length,"registry must include all campaign hosts");

const diagnostics=worldRegistryDiagnostics();
assert.deepEqual(diagnostics.issues,[],"canonical registry must not contain orphan tickets, template identity mismatches, or duplicate campaign addresses");

assert.equal(resolveWorldEntity("home")?.id,"host:home");
assert.equal(resolveWorldEntity("HOME-PC")?.id,"host:home");
assert.equal(resolveWorldEntity(HOSTS.home.address)?.id,"host:home");
assert.equal(resolveWorldEntity("msantos")?.id,"person:nexus:msantos");
assert.equal(resolveWorldEntity("FIN-WS-07")?.id,"support-machine:FIN-WS-07");
assert.equal(resolveWorldEntity("definitely-not-real"),null);

for(const [machineId,machine] of Object.entries(REMOTE_MACHINE_TEMPLATES)){
  const machineEntity=resolveWorldEntity(machineId,{kind:"support-machine"});
  assert(machineEntity,`missing canonical support-machine entity for ${machineId}`);
  assert.equal(machineEntity.assignedPersonId,`person:nexus:${machine.user.username}`);
  const person=WORLD_ENTITIES[machineEntity.assignedPersonId];
  assert(person,`missing canonical person for ${machine.user.username}`);
  assert.equal(person.displayName,machine.user.name);
  assert.equal(person.department,machine.user.department);
}

// A4.10.4.0 closes the old HOME-PC/FAMILY-PC address collision. Existing
// identities carrying the uneditable legacy HOME-PC .24 lease normalize to .12,
// while a genuinely different stored address is preserved.
{
  const fresh=baseState();
  assert.equal(fresh.nexusSystem.network.ip,HOSTS.home.address);
  assert.notEqual(fresh.nexusSystem.network.ip,HOSTS.familypc.address);

  const legacy=baseState();
  legacy.nexusSystem.network.ip="192.168.1.24";
  const migrated=migrateSave(structuredClone(legacy));
  assert.equal(migrated.nexusSystem.network.ip,HOSTS.home.address);

  const custom=baseState();
  custom.nexusSystem.network.ip="192.168.1.77";
  const preserved=migrateSave(structuredClone(custom));
  assert.equal(preserved.nexusSystem.network.ip,"192.168.1.77");
}

// The persistent identity memory is bounded and records cross-app encounters
// without exposing or unlocking content on its own.
{
  const s=resetState();
  initWorldConsistency();
  let snapshot=worldConsistencySnapshot();
  assert(snapshot.seen["host:home"],"local host should be recognized when a NEXUS session initializes");

  emit("host:connected",{hostId:"archives01",fromHostId:"home",universe:"campaign"});
  snapshot=worldConsistencySnapshot();
  assert(snapshot.seen["host:archives01"]);
  assert(snapshot.seen["host:archives01"].sources.includes("blackbox:connect"));

  emit("helpdesk:changed",{ticketId:"INC-0001",type:"remote:connect"});
  snapshot=worldConsistencySnapshot();
  assert(snapshot.seen["support-machine:FIN-WS-07"]);
  assert(snapshot.seen["person:nexus:msantos"]);

  const before=snapshot.recent.length;
  observeWorldEntity("FIN-WS-07","helpdesk:repeat");
  snapshot=worldConsistencySnapshot();
  assert.equal(snapshot.recent.length,before,"repeat observations should not grow the discovery ledger indefinitely");
  assert(snapshot.seen["support-machine:FIN-WS-07"].sources.includes("helpdesk:repeat"));

  emit("message:read",{messageId:"m1",threadId:"maya"});
  snapshot=worldConsistencySnapshot();
  assert(snapshot.seen["person:maya"]);

  assert.equal(s.world.flags.length,0,"world-consistency observations must not unlock story flags");
  assert.equal(s.player.discoveredClues.length,0,"world-consistency observations must not award clues");
  assert.equal(s.world.consistency.registryVersion,1);
}

// Malformed future-facing registry memory is normalized safely and bounded.
{
  const malformed=baseState();
  malformed.world.consistency={registryVersion:"1",seen:{"host:home":{firstSeenAt:"12",lastSeenAt:"18",sources:["a","a",7]}},recent:Array.from({length:90},(_,i)=>({entityId:`host:test-${i}`,source:"qa",day:1,minute:i,absolute:i}))};
  const normalized=migrateSave(structuredClone(malformed));
  assert.equal(normalized.world.consistency.registryVersion,1);
  assert.deepEqual(normalized.world.consistency.seen["host:home"].sources,["a"]);
  assert.equal(normalized.world.consistency.recent.length,64);
}

console.log("BLACKBOX v0.4.0 A4.10.4.0 world-consistency foundation regression passed");

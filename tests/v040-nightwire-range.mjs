import assert from "node:assert/strict";
import { resetState, getState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { executeCommand, getPrompt } from "../js/systems/terminal.js";
import { initNightwire, activeRangeLab } from "../js/systems/nightwire.js";
import { accessSnapshot } from "../js/systems/intrusion.js";
import { canReach } from "../js/systems/network.js";
import { HOSTS } from "../js/data/hosts.js";
import { RANGE_LABS } from "../js/data/nightwire.js";
import fs from "node:fs";
import path from "node:path";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);
assert.equal(RANGE_LABS.length,3);
for(const id of ["rangeweb01","rangefile02","rangeops03"]){
  assert.equal(HOSTS[id].universe,"range");
  assert.equal(HOSTS[id].accessModel,"advanced");
  assert.equal(HOSTS.home.routes.includes(id),false,"Range hosts must not be permanently attached to campaign routes");
}

initNightwire();
const text=result=>(result.lines||[]).map(x=>x.text).join("\n");
const run=async command=>text(await executeCommand(command));

const s=resetState();
s.player.alias="rangeqa";
s.terminal.user="rangeqa";

// Private node is gated behind the completed legacy Act-I capstone.
assert.match(await run("nightwire"),/private relay unavailable/i);
assert.equal(s.terminal.serviceSession,null);
s.world.completedMissions=["mission_cascade"];
s.world.flags.push("mission_cascade_complete");

let out=await run("nightwire");
assert.match(out,/NIGHTWIRE NODE \/\/ PRIVATE RELAY/);
assert.equal(getPrompt(),"nightwire>");
out=await run("4");
assert.match(out,/THE RANGE/);assert.equal(getPrompt(),"nightwire/range>");
assert.match(out,/01  Enumeration Basics/);assert.match(out,/02  Credential Foothold/);assert.match(out,/LOCKED/);

// RANGE-01: scan -> enumerate -> probe -> inspect exposed artifact. No shell required.
out=await run("start 01");
assert.match(out,/RANGE 01 MOUNTED/);assert.equal(s.terminal.serviceSession,null);assert.equal(activeRangeLab().id,"range01");
assert.equal(canReach("rangeweb01"),true);assert.equal(canReach("archives01"),false);
const tick0=s.world.actionTick,epoch0=s.world.networkEpoch,minute0=s.world.minute;
out=await run("scan");
assert.match(out,/RANGE-WEB-01/);assert.match(out,/80\/tcp http/);
assert.equal(s.terminal.lastScanResults[0],"rangeweb01");
assert.equal(s.world.actionTick,tick0);assert.equal(s.world.networkEpoch,epoch0);assert(s.world.minute>minute0);
assert.match(await run("connect scan 0"),/ACCESS DENIED/);
assert.match(await run("probe BBX-014 0"),/enumerate the http service/i);
const beforeCatalog=s.world.minute;
out=await run("probe list");assert.match(out,/BBX-014/);assert.match(out,/BBX-037/);assert.equal(s.world.minute,beforeCatalog,"profile catalog is reference, not an attack action");
out=await run("enum 0 80");assert.match(out,/Northstar Web/);assert.match(out,/Backup artifact pattern observed/);
out=await run("probe BBX-014 0");assert.match(out,/Artifact exposed: proof\.txt/);assert.match(out,/Noise: 1\/5/);
out=await run("access artifacts");assert.match(out,/\[0\].*proof\.txt/);
out=await run("access artifact 0");assert.match(out,/NW-RANGE-PROOF-01/);
assert(s.nightwire.range.completed.includes("range01"));assert.equal(s.nightwire.range.results.range01.failedAuth,0);

out=await run("nightwire");assert.equal(getPrompt(),"nightwire/range>");assert.match(out,/ACTIVE: 01 Enumeration Basics/);
out=await run("finish");assert.match(out,/RANGE 01 COMPLETE/);assert.equal(s.intrusion.activeSandbox,null);assert.equal(s.nightwire.range.activeLabId,null);assert.equal(s.player.seenHosts.includes("rangeweb01"),false,"detached Range hosts should not pollute campaign discovery state");

// RANGE-02: recover credential -> authenticate -> USER session -> permission boundary -> proof.
await run("nightwire");await run("4");out=await run("start 02");assert.match(out,/RANGE 02 MOUNTED/);
out=await run("scan");assert.match(out,/22\/tcp ssh/);assert.match(out,/8080\/tcp http/);
assert.match(await run("enum 0 8080"),/Legacy backup directory exposed/);
out=await run("probe BBX-014 0");assert.match(out,/rangeops/);
out=await run("access credentials");assert.match(out,/rangeops/);assert.match(out,/\[0\]/);
out=await run("auth 0 ssh rangeops");assert.match(out,/Session staged/);assert.match(out,/Privilege: USER/);
out=await run("connect scan 0");assert.match(out,/Connected to RANGE-FILE-02/);assert.match(getPrompt(),/^rangeops@range-file-02:/);
assert.match(await run("cat /root/admin-only.txt"),/Permission denied/i);
out=await run("cat /home/rangeops/proof.txt");assert.match(out,/NW-RANGE-PROOF-02/);assert(s.nightwire.range.completed.includes("range02"));
await run("exit");await run("nightwire");out=await run("finish");assert.match(out,/RANGE 02 COMPLETE/);

// RANGE-03: service-boundary foothold -> restricted SERVICE session -> local fictional elevation.
await run("nightwire");await run("4");out=await run("start 03");assert.match(out,/RANGE 03 MOUNTED/);
out=await run("scan");assert.match(out,/445\/tcp files/);
assert.match(await run("enum 0 files"),/Range File Service/);
out=await run("probe BBX-021 0");assert.match(out,/Restricted session established: svc-range \[SERVICE\]/);
out=await run("connect scan 0");assert.match(out,/Connected to RANGE-OPS-03/);assert.equal(await run("whoami"),"svc-range");
assert.match(await run("cat /root/proof.txt"),/Permission denied/i);
out=await run("probe BBX-037");assert.match(out,/Session privilege updated: ROOT/);
out=await run("cat /root/proof.txt");assert.match(out,/NW-RANGE-PROOF-03/);assert(s.nightwire.range.completed.includes("range03"));
await run("exit");await run("nightwire");out=await run("finish");assert.match(out,/RANGE 03 COMPLETE/);
assert.deepEqual(new Set(s.nightwire.range.completed),new Set(["range01","range02","range03"]));
assert.equal(s.intrusion.activeSandbox,null);
assert.equal(accessSnapshot().credentials.length,0,"finished Range runtime credentials should be detached from campaign access state");
assert.equal(s.world.actionTick,tick0,"all Range hacking remains isolated from campaign actionTick");
assert.equal(s.world.networkEpoch,epoch0,"all Range hacking remains isolated from campaign networkEpoch");
const persisted=migrateSave(structuredClone(s));
assert.deepEqual(new Set(persisted.nightwire.range.completed),new Set(["range01","range02","range03"]));
assert.equal(persisted.nightwire.range.results.range03.labId,"range03");

// Save 14 migrates to A4.8 NightWire/Range state cleanly.
const old=resetState();old.meta.saveVersion=14;delete old.nightwire;delete old.terminal.serviceSession;
const migrated=migrateSave(structuredClone(old));
assert.equal(migrated.meta.saveVersion,15);assert.deepEqual(migrated.nightwire.range.completed,[]);assert.equal(migrated.terminal.serviceSession,null);


// Static continuity/safety guards: public NightWire remains NEXUS-facing, private node stays CLI-only, and no real network primitive is introduced.
{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const terminal=fs.readFileSync(path.join(root,"js/systems/terminal.js"),"utf8");
  const nodeSource=fs.readFileSync(path.join(root,"js/systems/nightwire.js"),"utf8")+fs.readFileSync(path.join(root,"js/data/nightwire.js"),"utf8");
  assert.match(desktop,/NIGHTWIRE \/\/ PUBLIC MESSAGE BOARD/);
  assert.match(terminal,/name:"nightwire"/);
  assert.doesNotMatch(nodeSource,/\bfetch\s*\(|\bWebSocket\b|XMLHttpRequest|node:net|node:dgram|child_process/);
}

console.log("BLACKBOX v0.4.0 A4.8 NightWire Node + Range tests passed");

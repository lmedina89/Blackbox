import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { clearSave, loadProfile, beginNewIdentity, beginQaNightwireIdentity, getProfileSummary, saveGame, restoreArchivedIdentity } from "../js/core/save.js";
import { MISSIONS } from "../js/data/missions.js";
import { nightwireUnlocked } from "../js/systems/nightwire.js";
import { executeCommand } from "../js/systems/terminal.js";

const storage=new Map();
globalThis.localStorage={
  getItem:key=>storage.has(key)?storage.get(key):null,
  setItem:(key,value)=>storage.set(key,String(value)),
  removeItem:key=>storage.delete(key)
};

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);
assert.equal(MISSIONS.length,9);
const expectedCredits=MISSIONS.reduce((sum,m)=>sum+(m.rewards?.credits||0),0);
const expectedRep=MISSIONS.reduce((sum,m)=>sum+(m.rewards?.reputation||0),0);
assert.equal(expectedCredits,3080);
assert.equal(expectedRep,50);

clearSave();
loadProfile();

// Normal New Identity remains completely unchanged and NightWire stays gated.
let normal=beginNewIdentity("tester",{archiveActive:false});
assert.equal(normal.player.credits,0);
assert.equal(normal.player.reputation,0);
assert.deepEqual(normal.world.completedMissions,[]);
assert.equal(normal.meta.qaMode,undefined);
assert.equal(nightwireUnlocked(normal),false);
normal.player.credits=123;
saveGame();

// QA entry archives the current identity and creates a separate, quiet post-Act-I test identity.
const qa=beginQaNightwireIdentity("range_qa",{archiveActive:true});
assert.equal(qa.player.alias,"range_qa");
assert.equal(qa.meta.qaMode,"nightwire_range");
assert.equal(qa.meta.qaSource,"A4.8.2");
assert.deepEqual(new Set(qa.world.completedMissions),new Set(MISSIONS.map(m=>m.id)));
assert.equal(qa.player.credits,3080);
assert.equal(qa.player.reputation,50);
assert.equal(qa.missions.active.length,0);
assert.equal(qa.nightwire.range.activeLabId,null);
assert.deepEqual(qa.nightwire.range.completed,[]);
assert.equal(qa.intrusion.activeSandbox,null);
assert.deepEqual(qa.intrusion.credentials,[]);
assert.deepEqual(qa.intrusion.artifacts,[]);
assert.deepEqual(qa.terminal.lastScanResults,[]);
assert.equal(qa.terminal.hostId,"home");
assert.equal(nightwireUnlocked(qa),true);
assert.deepEqual(qa.world.flags,["qa_nightwire_range"],"QA identity should not seed old mission-complete communication flags");
assert.equal(qa.world.flags.includes("alias_created"),false);
assert.equal(qa.world.flags.some(flag=>/^mission_.*_complete$/.test(flag)),false);

const nwText=(await executeCommand("nightwire")).lines.map(x=>x.text).join("\n");
assert.match(nwText,/NIGHTWIRE NODE \/\/ PRIVATE RELAY/);
assert.match(nwText,/THE RANGE/);

let summary=getProfileSummary();
assert.equal(summary.active.alias,"range_qa");
assert.equal(summary.active.qaMode,"nightwire_range");
assert.equal(summary.archives.length,1);
assert.equal(summary.archives[0].alias,"tester");
assert.equal(summary.archives[0].credits,123,"the pre-QA active identity should be preserved, not replaced by the QA seed");
assert.equal(summary.archives[0].reason,"qa_nightwire_test");

// Restoring the original identity moves the QA identity into archives and returns the real save unchanged.
assert.equal(restoreArchivedIdentity(summary.archives[0].archiveId),true);
assert.equal(getState().player.alias,"tester");
assert.equal(getState().player.credits,123);
assert.equal(getState().meta.qaMode,undefined);
assert.deepEqual(getState().world.completedMissions,[]);
summary=getProfileSummary();
assert(summary.archives.some(entry=>entry.alias==="range_qa"));

// A later normal identity remains a normal clean start rather than inheriting QA state.
const fresh=beginNewIdentity("fresh",{archiveActive:true});
assert.equal(fresh.meta.qaMode,undefined);
assert.equal(fresh.player.credits,0);
assert.equal(fresh.player.reputation,0);
assert.deepEqual(fresh.world.completedMissions,[]);
assert.equal(nightwireUnlocked(fresh),false);

// Static UI/version guards make the QA path obvious and keep it out of normal New Identity semantics.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const main=fs.readFileSync(path.join(root,"js/main.js"),"utf8");
const save=fs.readFileSync(path.join(root,"js/core/save.js"),"utf8");
assert.match(index,/id="qa-nightwire-button"/);
assert.match(index,/QA: NightWire Range/);
assert.match(index,/A4\.8\.2 QA/);
assert.match(main,/beginQaNightwireIdentity\("range_qa"/);
assert.match(save,/state\.world\.completedMissions=MISSIONS\.map/);
assert.match(save,/state\.world\.flags=\["qa_nightwire_range"\]/);

console.log("BLACKBOX v0.4.0 A4.8.1 QA NightWire Range access tests passed");

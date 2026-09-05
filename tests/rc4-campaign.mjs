import assert from "node:assert/strict";
import { getState, setFlag } from "../js/core/state.js";
import { emit } from "../js/core/events.js";
import { initClues } from "../js/systems/clues.js";
import { initMissions } from "../js/systems/missions.js";
import { initTimeline } from "../js/systems/timeline.js";
import { initAutosave } from "../js/core/autosave.js";
import { executeCommand } from "../js/systems/terminal.js";
import { makeChoice } from "../js/systems/communications.js";
import { clearSave, beginNewIdentity, loadProfile, saveGame } from "../js/core/save.js";

const stored=new Map();
globalThis.localStorage={
  getItem:key=>stored.has(key)?stored.get(key):null,
  setItem:(key,value)=>stored.set(key,String(value)),
  removeItem:key=>stored.delete(key)
};

initClues();initMissions();initTimeline();initAutosave();
clearSave();beginNewIdentity("campaignqa",{archiveActive:false});setFlag("alias_created");saveGame();

const out=r=>(r.lines||[]).map(x=>x.text).join("\n");
async function run(command){
  const result=out(await executeCommand(command));
  const saved=saveGame();assert(saved.ok,`save failed after ${command}`);
  const before=JSON.stringify(getState());
  const loaded=loadProfile();assert(loaded.hasActive&&!loaded.error,`reload failed after ${command}`);
  assert.equal(JSON.stringify(getState()),before,`reload changed state after ${command}`);
  return result;
}
function event(name,payload){emit(name,payload);assert(saveGame().ok);const loaded=loadProfile();assert(loaded.hasActive&&!loaded.error);}
async function home(){if(getState().terminal.hostId!=="home")await run("exit");}
async function driveUntil(flag,commands){
  await home();
  for(const command of commands){if(getState().world.flags.includes(flag))break;await run(command);}
  assert(getState().world.flags.includes(flag),`${flag} was not delivered naturally`);
}

// 1 Easy Money
event("email:read",{emailId:"first_job"});event("forum:read",{postId:"f1"});
await run("connect ARCHIVES-01");await run("cat /archive/employees.db");assert(getState().world.completedMissions.includes("mission_first"));await run("exit");

// 2 Old Mirror through a real choice/event route.
assert(makeChoice("mirror_send").ok);assert(saveGame().ok);loadProfile();
event("social:read",{postId:"s5"});await run("connect MIRROR-02");await run("cat /var/www/status.txt");assert(getState().world.completedMissions.includes("mission_mirror"));await run("exit");

// 3 Recovery Index
event("email:read",{emailId:"meridian_job"});event("forum:read",{postId:"f4"});await run("connect MERIDIAN-01");
assert.match(await run("cat /srv/projects/recovery.log"),/\/srv\/projects\/recovered\/halcyon\.txt/);
await run("find / halcyon");await run("cat /srv/projects/recovered/halcyon.txt");assert(getState().world.completedMissions.includes("mission_recovery"));await run("exit");

// 4 Ghost Account
event("email:read",{emailId:"helix_job"});await run("scan");let index=getState().terminal.lastScanResults.indexOf("helixedge");assert(index>=0);await run(`connect scan ${index}`);await run("ip");await run("scan");index=getState().terminal.lastScanResults.indexOf("helixlog");assert(index>=0);await run(`connect scan ${index}`);await run("grep SVC_OLD /var/log/auth.log");assert(getState().world.completedMissions.includes("mission_ghost"));await run("exit");

// 5 Dead Drop
event("email:read",{emailId:"deaddrop_job"});event("forum:read",{postId:"f6"});await run("connect AXIOM-RELAY");await run("services");await run("download /etc/relay.conf");assert(getState().world.completedMissions.includes("mission_deaddrop"));await run("exit");

// 6 The Relay
event("email:read",{emailId:"relay_job"});await run("connect AXIOM-RELAY");await run("netstat");await run("traceroute 198.51.100.27");await run("cat /etc/relay.conf");assert(getState().world.completedMissions.includes("mission_relay"));await run("exit");

// Natural post-Relay contract timing: no injected contract flags.
await driveUntil("lumen_contract_available",["ip","services","netstat"]);

// 7 False Name
event("email:read",{emailId:"lumen_job"});event("threat:read",{threatId:"td_lumen"});await run("nslookup updates.lumen.test");await run("connect LUMEN-EDGE");await run("cat /var/www/dns-audit.txt");assert(getState().world.completedMissions.includes("mission_dns"));await run("exit");
await driveUntil("iris_contract_available",["nslookup lumen.test MX","ping LUMEN-EDGE","traceroute LUMEN-EDGE","services LUMEN-EDGE"]);

// 8 Quiet Hours
event("email:read",{emailId:"iris_job"});event("threat:read",{threatId:"td_iris"});await run("nslookup status.iris-transit.test");await run("connect IRIS-GATE");await run("ip");await run("scan");index=getState().terminal.lastScanResults.indexOf("irisops");assert(index>=0);await run(`connect scan ${index}`);await run("grep BEACON-LEGACY /var/log/overnight.log");assert(getState().world.completedMissions.includes("mission_beacon"));await run("exit");
await driveUntil("harbor_contract_available",["ping IRIS-GATE","traceroute IRIS-GATE","services IRIS-GATE","nslookup juno-open.test"]);

// 9 Glass Harbor
event("email:read",{emailId:"harbor_job"});event("threat:read",{threatId:"td_harbor"});await run("nslookup edge.harbor.test");await run("connect HARBOR-EDGE");await run("ip");await run("nslookup ns.harbor-int.test");await run("connect HARBOR-NS");await run("cat /var/named/harbor.zone");await run("nslookup claims.harbor.test");await run("connect HARBOR-VAULT");await run("cat /cases/incident-17.txt");await run("download /cases/resolution.txt");

assert.deepEqual(getState().world.completedMissions,["mission_first","mission_mirror","mission_recovery","mission_ghost","mission_deaddrop","mission_relay","mission_dns","mission_beacon","mission_cascade"]);
assert.equal(getState().missions.active.length,0);
assert.equal(getState().player.credits,3080);
assert.equal(getState().player.reputation,50);

// 25 additional persistence cycles on the completed campaign.
for(let i=0;i<25;i++){
  assert(saveGame().ok);const snapshot=JSON.stringify(getState());
  const result=loadProfile();assert(result.hasActive&&!result.error);assert.equal(JSON.stringify(getState()),snapshot);
}

console.log("BLACKBOX v0.3.0 RC4 continuous nine-case campaign + reload tests passed");

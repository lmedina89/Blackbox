import assert from "node:assert/strict";
import { baseState, getState, resetState, replaceState, setFlag } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { emit } from "../js/core/events.js";
import { initClues } from "../js/systems/clues.js";
import { initMissions } from "../js/systems/missions.js";
import { initTimeline, advanceWorld } from "../js/systems/timeline.js";
import { executeCommand } from "../js/systems/terminal.js";
import { HOSTS } from "../js/data/hosts.js";
import { THREADS } from "../js/data/messages.js";
import { FILESYSTEMS } from "../js/data/filesystems.js";

const output=result=>(result.lines||[]).map(x=>x.text).join("\n");
const run=async command=>output(await executeCommand(command));

initClues();
initMissions();
initTimeline();

// v0.2.3.4 save migration preserves canonical progress and initializes v0.3 state.
{
  const old=baseState();
  old.meta.saveVersion=8;
  old.meta.worldSchema=8;
  old.player.alias="legacy";
  old.world.completedMissions=["mission_first"];
  old.world.flags=["alias_created","mission_first_complete"];
  delete old.player.installedSoftware;
  for(const key of ["readMessages","readThreats","completedLabs","actionTick","networkEpoch","scanCounters","deliveredEvents","eventEligibleAt","countedActions","caseHistory"])delete old.world[key];
  const migrated=migrateSave(structuredClone(old));
  assert.equal(migrated.meta.saveVersion,9);
  assert.equal(migrated.meta.worldSchema,9);
  assert.deepEqual(migrated.player.installedSoftware,["resolver_basic"]);
  assert(migrated.world.completedMissions.includes("mission_first"));
  assert(migrated.world.caseHistory.some(x=>x.id==="mission:mission_first"));
  assert(migrated.world.readMessages.includes("m4"));
  assert(migrated.world.readMessages.includes("m5"));
  assert(!migrated.world.readMessages.includes("m8"),"future mirror lead was incorrectly migrated as read");
  assert(!migrated.world.readMessages.includes("m9"),"future mirror completion was incorrectly migrated as read");
}

// Every host with a shell has a filesystem and addresses are unique.
{
  const addresses=new Set();
  for(const host of Object.values(HOSTS)){
    assert(!addresses.has(host.address),`duplicate address ${host.address}`);
    addresses.add(host.address);
    if(host.connectable!==false)assert(FILESYSTEMS[host.filesystem],`missing filesystem for ${host.id}`);
  }
  assert.equal(Object.keys(HOSTS).length,36);
}

// Scan ordering changes, membership is stable within an epoch, and active targets are pinned.
{
  const s=resetState();s.player.alias="scanqa";setFlag("alias_created");
  emit("email:read",{emailId:"first_job"});
  emit("forum:read",{postId:"f1"});
  const first=await run("scan"),firstIds=[...s.terminal.lastScanResults];
  assert(firstIds.includes("archives01"),"active mission target not pinned");
  const second=await run("scan"),secondIds=[...s.terminal.lastScanResults];
  assert.notDeepEqual(firstIds,secondIds,"scan order did not rotate");
  assert.deepEqual(new Set(firstIds),new Set(secondIds),"membership changed inside the same epoch");
  assert.match(first,/connect scan <#>/);
  assert.match(second,/connect scan <#>/);
}

// Explicit numeric namespaces cannot silently select different targets.
{
  const s=getState();
  s.player.savedTargets=[{hostId:"mirror02",source:"manual"}];
  s.terminal.lastScanResults=["archives01"];
  assert.match(await run("connect 0"),/ambiguous/);
  assert.match(await run("connect scan 0"),/Connected to ARCHIVES-01/);
  await run("exit");
  assert.match(await run("connect target 0"),/Connected to MIRROR-02/);
  await run("exit");
}


// Case DNS records cannot reveal mission hosts before their intended contract/network context.
{
  const s=resetState();s.player.alias="dnsqa";setFlag("alias_created");
  assert.match(await run("nslookup updates.lumen.test"),/no simulated record found/);
  assert(!s.player.identifiedHosts.includes("lumenedge"),"LUMEN-EDGE leaked before contract");

  setFlag("lumen_contract_available");
  assert.match(await run("nslookup updates.lumen.test"),/staging-cache\.lumen\.test/);
  assert(s.player.identifiedHosts.includes("lumenedge"));

  setFlag("harbor_contract_available");
  assert.match(await run("nslookup claims.harbor.test"),/no simulated record found/);
  assert(!s.world.flags.includes("harbor_vault_revealed"),"Harbor vault leaked from HOME-PC");
  s.player.identifiedHosts.push("harborvault");
  assert.match(await run("connect HARBOR-VAULT"),/not currently available/);
}

// Resolver Pro adds real diagnostics beyond the basic resolver output.
{
  const s=resetState();s.player.alias="resolverqa";setFlag("lumen_contract_available");
  const basic=await run("nslookup updates.lumen.test");
  assert(!basic.includes("TTL "));
  assert(!basic.includes("Alias chain:"));
  s.player.installedSoftware.push("resolver_pro");
  const proAlias=await run("nslookup updates.lumen.test");
  assert.match(proAlias,/TTL 300/);
  assert.match(proAlias,/Alias chain: updates\.lumen\.test -> staging-cache\.lumen\.test -> 10\.84\.2\.20/);
  const proMx=await run("nslookup lumen.test MX");
  assert.match(proMx,/Mail context: lumen\.test mail host mail\.lumen\.test -> 10\.84\.2\.25/);
}

// World-event-driven messenger lines use their event clock instead of hardcoded v0.3 times.
{
  const dynamic=["m10","m11","m12","sam4","sam5","c4","n1","n2"];
  const messages=THREADS.flatMap(thread=>thread.messages);
  for(const id of dynamic)assert(messages.find(message=>message.id===id)?.timeFromEvent,`${id} is missing an event timestamp source`);
}

// Alternating harmless terminal commands do not advance the world or unlock timed leads.
{
  const s=resetState();s.player.alias="antispam";setFlag("alias_created");
  const before=s.world.actionTick;
  for(let i=0;i<4;i++){await run("whoami");await run("hostname");}
  assert.equal(s.world.actionTick,before);
  assert(!s.world.flags.includes("threatdesk_online"));
  assert(!s.world.flags.includes("cedar_lead_available"));
  assert(!s.world.flags.includes("juno_advisory_available"));
  assert(!s.world.flags.includes("quartz_thread_available"));
}

// Reading the Quartz relay thread now starts the optional Relay Cache chain.
{
  const s=resetState();s.player.alias="quartzqa";setFlag("quartz_thread_available");
  s.player.identifiedHosts.push("quartzbbs");
  await run("connect QUARTZ-BBS");
  await run("cat /var/bbs/relay-thread.txt");
  assert(s.player.discoveredClues.includes("relay_cache_host"));
  assert(!s.world.flags.includes("relay_cache_available"));
  await run("exit");
  await run("scan");
  await run("services QUARTZ-BBS");
  assert(s.world.flags.includes("relay_cache_available"),"Relay Cache event never became available");
}

// The complete v0.2.3.4 investigation sequence remains playable.
{
  const s=resetState();s.player.alias="legacyqa";setFlag("alias_created");
  emit("email:read",{emailId:"first_job"});
  emit("forum:read",{postId:"f1"});
  await run("connect ARCHIVES-01");
  await run("cat /archive/employees.db");
  assert(s.world.completedMissions.includes("mission_first"));
  await run("exit");

  emit("dialogue:choice",{choiceId:"mirror_send"});
  emit("social:read",{postId:"s5"});
  await run("connect MIRROR-02");
  await run("cat /var/www/status.txt");
  assert(s.world.completedMissions.includes("mission_mirror"));
  await run("exit");

  emit("email:read",{emailId:"meridian_job"});
  emit("forum:read",{postId:"f4"});
  await run("connect MERIDIAN-01");
  await run("find / halcyon");
  await run("cat /srv/projects/recovered/halcyon.txt");
  assert(s.world.completedMissions.includes("mission_recovery"));
  await run("exit");

  emit("email:read",{emailId:"helix_job"});
  await run("scan");
  let index=s.terminal.lastScanResults.indexOf("helixedge");
  assert(index>=0,"HELIX-EDGE not pinned");
  await run(`connect scan ${index}`);
  await run("ip");
  await run("scan");
  index=s.terminal.lastScanResults.indexOf("helixlog");
  assert(index>=0,"HELIX-LOG not pinned");
  await run(`connect scan ${index}`);
  await run("grep svc_old /var/log/auth.log");
  assert(s.world.completedMissions.includes("mission_ghost"));
  await run("exit");

  emit("email:read",{emailId:"deaddrop_job"});
  emit("forum:read",{postId:"f6"});
  await run("connect AXIOM-RELAY");
  await run("services");
  await run("download /etc/relay.conf");
  assert(s.world.completedMissions.includes("mission_deaddrop"));
  await run("exit");

  emit("email:read",{emailId:"relay_job"});
  await run("connect AXIOM-RELAY");
  await run("netstat");
  await run("traceroute 198.51.100.27");
  await run("cat /etc/relay.conf");
  assert.deepEqual(s.world.completedMissions.slice(0,6),["mission_first","mission_mirror","mission_recovery","mission_ghost","mission_deaddrop","mission_relay"]);
  await run("exit");
}

// Complete all three new investigations through the actual terminal/event paths.
{
  const s=resetState();s.player.alias="caseqa";s.player.credits=1000;setFlag("alias_created");

  setFlag("lumen_contract_available");
  emit("email:read",{emailId:"lumen_job"});
  emit("threat:read",{threatId:"td_lumen"});
  await run("nslookup updates.lumen.test");
  await run("connect LUMEN-EDGE");
  await run("cat /var/www/dns-audit.txt");
  assert(s.world.completedMissions.includes("mission_dns"));
  await run("exit");

  setFlag("iris_contract_available");
  emit("email:read",{emailId:"iris_job"});
  emit("threat:read",{threatId:"td_iris"});
  await run("nslookup status.iris-transit.test");
  await run("connect IRIS-GATE");
  await run("ip");
  await run("scan");
  const irisIndex=s.terminal.lastScanResults.indexOf("irisops");
  assert(irisIndex>=0,"IRIS-OPS not pinned in mission scan");
  await run(`connect scan ${irisIndex}`);
  await run("grep beacon-legacy /var/log/overnight.log");
  assert(s.world.completedMissions.includes("mission_beacon"));
  await run("exit");

  setFlag("harbor_contract_available");
  emit("email:read",{emailId:"harbor_job"});
  emit("threat:read",{threatId:"td_harbor"});
  await run("nslookup edge.harbor.test");
  await run("connect HARBOR-EDGE");
  await run("ip");
  await run("nslookup ns.harbor-int.test");
  await run("connect HARBOR-NS");
  await run("cat /var/named/harbor.zone");
  await run("nslookup claims.harbor.test");
  await run("connect HARBOR-VAULT");
  await run("cat /cases/incident-17.txt");
  await run("download /cases/resolution.txt");
  assert(s.world.completedMissions.includes("mission_cascade"));
  assert.equal(s.missions.active.length,0);
}

// Identical low-value actions cannot fast-forward the timeline indefinitely.
{
  const s=resetState();s.player.alias="timeqa";setFlag("alias_created");
  const before=s.world.actionTick;
  assert.equal(advanceWorld("same-action"),true);
  assert.equal(advanceWorld("same-action"),false);
  assert.equal(s.world.actionTick,before+1);
}

console.log("BLACKBOX v0.3.0 smoke tests passed");

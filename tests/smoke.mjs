import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { baseState, getState, resetState, replaceState, setFlag } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { emit, on } from "../js/core/events.js";
import { initClues } from "../js/systems/clues.js";
import { initMissions } from "../js/systems/missions.js";
import { initTimeline, advanceWorld, processTimeline } from "../js/systems/timeline.js";
import { executeCommand } from "../js/systems/terminal.js";
import { HOSTS } from "../js/data/hosts.js";
import { THREADS } from "../js/data/messages.js";
import { FILESYSTEMS } from "../js/data/filesystems.js";
import { escapeHtml } from "../js/ui/safeText.js";
import { AUTOSAVE_EVENTS, initAutosave } from "../js/core/autosave.js";
import { beginNewIdentity, clearSave, loadProfile } from "../js/core/save.js";

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

// Every host with a shell has a filesystem, addresses are unique, and service PIDs resolve.
{
  const addresses=new Set();
  for(const host of Object.values(HOSTS)){
    assert(!addresses.has(host.address),`duplicate address ${host.address}`);
    addresses.add(host.address);
    if(host.connectable!==false)assert(FILESYSTEMS[host.filesystem],`missing filesystem for ${host.id}`);
    const processIds=new Set(host.processes.map(process=>process.pid));
    for(const service of host.services)if(service.pid)assert(processIds.has(service.pid),`${host.id} ${service.name} references missing PID ${service.pid}`);
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

// Established command objectives require the intended host and relay peer.
{
  let s=resetState();s.player.alias="contextqa";setFlag("alias_created");
  emit("email:read",{emailId:"meridian_job"});
  await run("find / halcyon");
  assert(!s.missions.progress.mission_recovery?.meridian_find,"Recovery Index find completed on HOME-PC");

  s=resetState();s.player.alias="contextqa";setFlag("alias_created");
  emit("email:read",{emailId:"helix_job"});
  await run("ip");
  assert(!s.missions.progress.mission_ghost?.inspect_interfaces,"Ghost Account ip completed on HOME-PC");

  s=resetState();s.player.alias="contextqa";setFlag("alias_created");
  emit("email:read",{emailId:"deaddrop_job"});
  await run("services");
  assert(!s.missions.progress.mission_deaddrop?.drop_services,"Dead Drop services completed on HOME-PC");

  s=resetState();s.player.alias="contextqa";setFlag("alias_created");
  emit("email:read",{emailId:"relay_job"});
  s.player.identifiedHosts.push("axiomrelay");
  await run("connect AXIOM-RELAY");
  await run("traceroute AXIOM-RELAY");
  assert(!s.missions.progress.mission_relay?.relay_trace,"Relay traceroute accepted the wrong peer");
  await run("traceroute 198.51.100.27");
  assert(s.missions.progress.mission_relay?.relay_trace,"Relay traceroute rejected the intended peer");
}

// Equivalent command spellings share one canonical timeline action.
{
  let s=resetState();s.player.alias="semanticsqa";setFlag("alias_created");
  s.player.identifiedHosts.push("archives01");
  const beforeConnect=s.world.actionTick;
  await run("connect ARCHIVES-01");await run("exit");
  await run(`connect ${HOSTS.archives01.address}`);await run("exit");
  await run("connect archives01");await run("exit");
  assert.equal(s.world.actionTick,beforeConnect+1,"host aliases counted as different actions");

  s=resetState();s.player.alias="semanticsqa";setFlag("lumen_contract_available");
  const beforeDns=s.world.actionTick;
  await run("nslookup updates.lumen.test");
  await run("nslookup UPDATES.LUMEN.TEST");
  await run("nslookup updates.lumen.test.");
  assert.equal(s.world.actionTick,beforeDns+1,"DNS case/trailing-dot variants counted as different actions");

  s=resetState();s.player.alias="semanticsqa";s.terminal.hostId="archives01";s.terminal.user="archive";s.terminal.cwd="/archive";
  const beforePath=s.world.actionTick;
  await run("cat employees.db");
  await run("cat ./employees.db");
  await run("cat /archive/employees.db");
  assert.equal(s.world.actionTick,beforePath+1,"relative and absolute paths counted as different actions");
}

// Eligibility anchors at the prerequisite transition, independent of clock polling.
{
  const deliveryTick=withPoll=>{
    const s=resetState();s.player.alias="timelineqa";setFlag("alias_created");
    assert.equal(s.world.eventEligibleAt.threatdesk_online,0);
    if(withPoll){processTimeline();processTimeline();}
    advanceWorld(withPoll?"timeline:polled":"timeline:direct");
    assert(s.world.deliveredEvents.includes("threatdesk_online"));
    return s.world.actionTick;
  };
  assert.equal(deliveryTick(false),deliveryTick(true));
}

// Mutable player text is encoded, and the audited desktop sinks use safe DOM boundaries.
{
  assert.equal(escapeHtml(`<img src=x onerror='bad'>&"`),"&lt;img src=x onerror=&#39;bad&#39;&gt;&amp;&quot;");
  const desktopSource=readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
  assert(!desktopSource.includes("${s.player.notes"),"notes are still interpolated into innerHTML");
  assert.match(desktopSource,/escapeHtml\(s\.player\.alias\)/);
  assert.match(desktopSource,/body\.querySelector\("b"\)\.textContent=site/);
  assert(AUTOSAVE_EVENTS.includes("notes:changed"));
  assert(AUTOSAVE_EVENTS.includes("browser:navigated"));
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
  await run("grep SVC_OLD /var/log/auth.log");
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
  await run("grep BEACON-LEGACY /var/log/overnight.log");
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

// Every successful terminal command commits its final state to storage.
{
  const stored=new Map();
  globalThis.localStorage={
    getItem:key=>stored.has(key)?stored.get(key):null,
    setItem:(key,value)=>stored.set(key,String(value)),
    removeItem:key=>stored.delete(key)
  };
  clearSave();
  beginNewIdentity("saveqa",{archiveActive:false});
  setFlag("alias_created");
  initAutosave();

  const commits=[];
  on("command:committed",payload=>commits.push({payload,hostId:getState().terminal.hostId,actionTick:getState().world.actionTick}));
  await run("scan");
  await run("scan");
  let memory=getState(),disk=JSON.parse(stored.get("blackbox_firstboot_save")).activeIdentity;
  assert.equal(disk.world.scanCounters.home,2);
  assert.deepEqual(disk.terminal.lastScanResults,memory.terminal.lastScanResults);
  assert.equal(disk.world.actionTick,memory.world.actionTick);

  memory.player.identifiedHosts.push("archives01");
  await run("connect ARCHIVES-01");
  await run("exit");
  disk=JSON.parse(stored.get("blackbox_firstboot_save")).activeIdentity;
  assert.equal(disk.terminal.hostId,"home");
  assert.deepEqual(disk.terminal.lastScanResults,[]);
  assert.equal(commits.at(-1).hostId,"home");

  memory.player.notes="<b>literal notes</b>";emit("notes:changed",{notes:memory.player.notes});
  memory.ui.lastBrowserSite="forum";emit("browser:navigated",{site:"forum"});
  disk=JSON.parse(stored.get("blackbox_firstboot_save")).activeIdentity;
  assert.equal(disk.player.notes,"<b>literal notes</b>");
  assert.equal(disk.ui.lastBrowserSite,"forum");

  memory.terminal.hostId="archives01";
  loadProfile();
  assert.equal(getState().terminal.hostId,"home","reload did not restore the committed disconnect");
  assert.equal(getState().world.scanCounters.home,2,"reload lost the repeated scan counter");
}

console.log("BLACKBOX v0.3.0 RC3 smoke tests passed");

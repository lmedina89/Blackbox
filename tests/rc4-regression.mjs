import assert from "node:assert/strict";
import { baseState, getState, resetState, replaceState, setFlag } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { emit } from "../js/core/events.js";
import { initClues, reconcilePresentedMessageClues } from "../js/systems/clues.js";
import { initMissions } from "../js/systems/missions.js";
import { initTimeline } from "../js/systems/timeline.js";
import { executeCommand } from "../js/systems/terminal.js";
import { readFile } from "../js/systems/filesystem.js";
import { clearSave, beginNewIdentity, loadProfile, saveGame, archiveCurrentIdentity, hasActiveIdentity, getProfileSummary, getPersistenceStatus } from "../js/core/save.js";

const text=result=>(result.lines||[]).map(line=>line.text).join("\n");
const run=async command=>text(await executeCommand(command));

initClues();
initMissions();
initTimeline();

// B01/M04: mandatory evidence is reserved, duplicate downloads are idempotent,
// and feedback no longer claims a file was copied into /home/downloads.
{
  const s=resetState();s.player.alias="capacity";s.player.installedHardware.push("hdd_20gb");
  s.player.downloads=Array.from({length:8},(_,i)=>`optional${i}:/evidence/${i}.txt`);
  s.terminal.hostId="axiomrelay";s.terminal.user="review";s.terminal.cwd="/home/review";
  emit("email:read",{emailId:"deaddrop_job"});emit("forum:read",{postId:"f6"});
  const first=await run("download /etc/relay.conf");
  assert.match(first,/evidence reference recorded/i);
  assert(!first.includes("/home/downloads"));
  assert.equal(s.player.downloads.length,9);
  assert(s.missions.progress.mission_deaddrop.drop_download);
  const second=await run("download /etc/relay.conf");
  assert.match(second,/already recorded/i);
  assert.equal(s.player.downloads.length,9,"duplicate required evidence consumed another slot");

  // Optional evidence remains capped even after mandatory evidence is present.
  s.terminal.hostId="archives01";s.terminal.user="guest";s.terminal.cwd="/home/guest";
  assert.match(await run("download /home/guest/motd.txt"),/optional evidence storage full \(8 files\)/i);
}

// B01 at the base 2-slot tier and early/pre-collected evidence replay.
{
  const s=resetState();s.player.alias="basecap";s.player.downloads=["opt:/1","opt:/2"];
  s.terminal.hostId="harborvault";s.terminal.user="records";s.terminal.cwd="/cases";
  const early=await run("download /cases/resolution.txt");
  assert.match(early,/evidence reference recorded/i);
  assert.equal(s.player.downloads.length,3);
  emit("email:read",{emailId:"harbor_job"});
  const replay=await run("download /cases/resolution.txt");
  assert.match(replay,/already recorded/i);
  assert(s.missions.progress.mission_cascade.harbor_download,"pre-collected required evidence could not be credited after mission start");
}

// M05: the Meridian index now points at the real canonical file.
{
  const body=readFile("meridian01","/srv/projects/recovery.log");
  assert.match(body,/HALCYON -> \/srv\/projects\/recovered\/halcyon\.txt/);
}

// M06: CNAME-only output cannot award an address-bearing clue; ANY can.
{
  const s=resetState();s.player.alias="dnsfacts";setFlag("harbor_contract_available");
  s.terminal.hostId="harborresolver";s.terminal.user="resolver";s.terminal.cwd="/home/resolver";
  const cname=await run("nslookup claims.harbor.test CNAME");
  assert.match(cname,/CNAME\s+vault-int\.harbor\.test/);
  assert(!s.player.discoveredClues.includes("harbor_vault_record"));
  assert(!s.player.identifiedHosts.includes("harborvault"));
  assert(!s.world.flags.includes("harbor_vault_revealed"));
  const any=await run("nslookup claims.harbor.test ANY");
  assert.match(any,/172\.29\.22\.40/);
  assert(s.player.discoveredClues.includes("harbor_vault_record"));
  assert(s.player.identifiedHosts.includes("harborvault"));
  assert(s.world.flags.includes("harbor_vault_revealed"));
}

// M02: migrated historical unread suppression does not suppress clue learning.
{
  const old=baseState();old.meta.saveVersion=8;old.meta.worldSchema=8;old.player.alias="legacychat";
  delete old.world.readMessages;
  const migrated=migrateSave(structuredClone(old));
  assert(migrated.world.readMessages.includes("sam2"));
  assert(!migrated.player.discoveredClues.includes("cobalt_from_im"));
  replaceState(migrated);
  assert(reconcilePresentedMessageClues("sam2"));
  assert(getState().player.discoveredClues.includes("cobalt_from_im"));
}

// M01: read acknowledgement is no longer itself a world-time action.
{
  const s=resetState();s.player.alias="readtime";const before=s.world.actionTick;
  emit("thread:read",{threadId:"maya",messageIds:["m1"]});
  assert.equal(s.world.actionTick,before);
}

// H01: structurally partial current saves are repaired to a runnable shape.
{
  const partial={meta:{saveVersion:9,worldSchema:9},player:{alias:"partial"},world:{day:"bad"},terminal:{hostId:"missing-host",cwd:"/does/not/exist"}};
  const migrated=migrateSave(structuredClone(partial));
  assert(migrated.player.installedHardware.includes("base_pc"));
  assert(Array.isArray(migrated.player.identifiedHosts));
  assert.equal(migrated.world.day,1);
  assert.throws(()=>migrateSave({...baseState(),meta:{...baseState().meta,saveVersion:100,worldSchema:100}}),/Unsupported future/);
}

// Save/profile recovery tests use isolated in-memory storage.
{
  const originalError=console.error,originalWarn=console.warn;console.error=()=>{};console.warn=()=>{};
  const stored=new Map();
  globalThis.localStorage={
    getItem:key=>stored.has(key)?stored.get(key):null,
    setItem:(key,value)=>stored.set(key,String(value)),
    removeItem:key=>stored.delete(key)
  };
  clearSave();
  beginNewIdentity("healthy",{archiveActive:false});
  getState().player.credits=123;assert(saveGame().ok);
  const healthy=structuredClone(JSON.parse(stored.get("blackbox_firstboot_save")).activeIdentity);

  // H01: one unsupported archive is quarantined without hiding the healthy active identity.
  const badArchive=structuredClone(healthy);badArchive.meta.saveVersion=100;badArchive.meta.worldSchema=100;
  stored.set("blackbox_firstboot_save",JSON.stringify({
    format:"blackbox_profile",profileVersion:1,profileId:"profile-test",createdAt:1,updatedAt:1,
    activeIdentity:healthy,
    archivedIdentities:[{archiveId:"bad",alias:"bad",state:badArchive}]
  }));
  const loaded=loadProfile();
  assert(loaded.hasActive);assert(loaded.error,"quarantined archive was not reported");
  assert.equal(getState().player.alias,"healthy");
  assert.equal(getProfileSummary().quarantinedCount,1);

  // H01: unknown terminal state is safely returned to HOME rather than crashing prompt/scan.
  const badTerminal=structuredClone(healthy);badTerminal.terminal.hostId="no-such-host";badTerminal.terminal.cwd="/bad";badTerminal.terminal.user="nobody";
  stored.set("blackbox_firstboot_save",JSON.stringify({format:"blackbox_profile",profileVersion:1,profileId:"profile-terminal",activeIdentity:badTerminal,archivedIdentities:[]}));
  loadProfile();
  assert.equal(getState().terminal.hostId,"home");
  assert.equal(getState().terminal.cwd,"/home");
  assert.doesNotReject(()=>executeCommand("scan"));

  // H01: malformed JSON is reported and not overwritten just by attempting load.
  stored.set("blackbox_firstboot_save","{not json");
  const malformed=loadProfile();
  assert(malformed.error);
  assert.equal(stored.get("blackbox_firstboot_save"),"{not json");

  // Restore a healthy profile for write-failure and purge tests.
  stored.clear();clearSave();beginNewIdentity("writeqa",{archiveActive:false});getState().player.credits=10;assert(saveGame().ok);
  const lastGood=stored.get("blackbox_firstboot_save");
  const originalSet=globalThis.localStorage.setItem;
  globalThis.localStorage.setItem=()=>{throw new Error("quota blocked");};
  getState().player.credits=999;
  const failed=saveGame();
  assert.equal(failed.ok,false);assert.equal(getPersistenceStatus().ok,false);
  assert.equal(stored.get("blackbox_firstboot_save"),lastGood,"failed write replaced last good save");
  globalThis.localStorage.setItem=originalSet;
  assert(saveGame().ok);assert.equal(getPersistenceStatus().ok,true);
  assert.equal(JSON.parse(stored.get("blackbox_firstboot_save")).activeIdentity.player.credits,999);

  // H02: a purged identity cannot be recreated by a later shutdown-style save.
  const archived=archiveCurrentIdentity("purged");
  assert(archived);assert.equal(hasActiveIdentity(),false);assert.equal(getState().player.alias,"");
  const shutdownSave=saveGame();
  assert.equal(shutdownSave.ok,false);assert.equal(shutdownSave.reason,"no-active-identity");
  const disk=JSON.parse(stored.get("blackbox_firstboot_save"));
  assert.equal(disk.activeIdentity,null);assert.equal(disk.archivedIdentities.length,1);
  console.error=originalError;console.warn=originalWarn;
}

console.log("BLACKBOX v0.3.0 RC4 regression tests passed");

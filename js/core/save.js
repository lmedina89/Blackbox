import { getState, replaceState, resetState, touch } from "./state.js";
import { migrateSave } from "./migrations.js";
import { emit } from "./events.js";
import { HOSTS } from "../data/hosts.js";
import { MISSIONS } from "../data/missions.js";
import { getNode } from "../systems/filesystem.js";

const KEY="blackbox_firstboot_save";
const PROFILE_VERSION=1;
let profile=null;
let persistenceStatus={ok:true,error:null};

function makeId(prefix){
  const value=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  return `${prefix}-${value}`;
}

function clone(value){return JSON.parse(JSON.stringify(value));}
function freshProfile(){return {format:"blackbox_profile",profileVersion:PROFILE_VERSION,profileId:makeId("profile"),createdAt:Date.now(),updatedAt:Date.now(),activeIdentity:null,archivedIdentities:[],recovery:{quarantinedArchives:[]}};}
function isProfileEnvelope(value){return !!value&&value.format==="blackbox_profile"&&Array.isArray(value.archivedIdentities);}
function safeError(err){return err instanceof Error?err:new Error(String(err||"Unknown storage error"));}

function updatePersistenceStatus(ok,error=null){
  const nextError=error?safeError(error):null;
  const changed=persistenceStatus.ok!==ok||String(persistenceStatus.error?.message||"")!==String(nextError?.message||"");
  persistenceStatus={ok,error:nextError};
  if(changed)emit("save:status",{ok,error:nextError?.message||null});
}

function storageGet(){
  try{return globalThis.localStorage?.getItem(KEY)??null;}
  catch(err){updatePersistenceStatus(false,err);throw err;}
}
function storageSet(value){
  try{
    if(!globalThis.localStorage)throw new Error("Browser storage is unavailable");
    globalThis.localStorage.setItem(KEY,value);
    updatePersistenceStatus(true,null);
    return true;
  }catch(err){
    console.error("Profile save failed",err);
    updatePersistenceStatus(false,err);
    return false;
  }
}
function storageRemove(){
  try{
    globalThis.localStorage?.removeItem(KEY);
    updatePersistenceStatus(true,null);
    return true;
  }catch(err){
    console.error("Profile clear failed",err);
    updatePersistenceStatus(false,err);
    return false;
  }
}

function validateRunnableState(state){
  const validHostIds=new Set(Object.keys(HOSTS));
  for(const key of ["discoveredHosts","seenHosts","identifiedHosts"]){
    state.player[key]=(state.player[key]||[]).filter(id=>validHostIds.has(id));
  }
  if(!state.player.identifiedHosts.includes("home"))state.player.identifiedHosts.unshift("home");
  state.player.savedTargets=(state.player.savedTargets||[]).filter(entry=>validHostIds.has(entry.hostId));
  state.terminal.lastScanResults=(state.terminal.lastScanResults||[]).filter(id=>validHostIds.has(id));

  let host=HOSTS[state.terminal.hostId];
  if(!host||!host.filesystem){
    state.terminal.hostId="home";
    state.terminal.cwd=HOSTS.home.homeDir;
    state.terminal.user=(state.player.alias||"user").toLowerCase().replace(/\s+/g,"_");
    state.terminal.sessionOpen=false;
    state.terminal.suspended=false;
    state.terminal.pendingAction=null;
    state.terminal.lastScanResults=[];
    state.terminal.accessSessionId=null;
    host=HOSTS.home;
  }
  const cwdNode=getNode(state.terminal.hostId,state.terminal.cwd);
  if(!cwdNode||cwdNode.type!=="dir")state.terminal.cwd=host.homeDir||"/";
  if(state.terminal.hostId==="home"){state.terminal.user=(state.player.alias||"user").toLowerCase().replace(/\s+/g,"_");state.terminal.accessSessionId=null;}
  else if((host.accessModel||"legacy")==="advanced"){
    const session=Object.values(state.intrusion?.sessions||{}).find(x=>x&&x.hostId===host.id&&x.status==="established");
    if(!session){
      state.terminal.hostId="home";state.terminal.cwd=HOSTS.home.homeDir;state.terminal.user=(state.player.alias||"user").toLowerCase().replace(/\s+/g,"_");state.terminal.accessSessionId=null;
    }else{state.terminal.user=session.user;state.terminal.accessSessionId=session.id;}
  }else if(!host.users.includes(state.terminal.user))state.terminal.user=host.users[0]||"guest";
  return state;
}

function normalizeIdentity(raw){return validateRunnableState(migrateSave(clone(raw)));}

function normalizeArchive(entry){
  if(!entry||!entry.state)throw new Error("Archive is missing identity state");
  const state=normalizeIdentity(entry.state);
  return {
    archiveId:entry.archiveId||makeId("archive"),
    alias:entry.alias||state.player.alias||"unknown",
    day:Number.isFinite(Number(entry.day))?Number(entry.day):state.world.day,
    credits:Number.isFinite(Number(entry.credits))?Number(entry.credits):state.player.credits,
    reputation:Number.isFinite(Number(entry.reputation))?Number(entry.reputation):state.player.reputation,
    archivedAt:Number.isFinite(Number(entry.archivedAt))?Number(entry.archivedAt):Date.now(),
    reason:entry.reason||"archived",
    state
  };
}

function quarantineArchive(entry,err){
  return {
    archiveId:entry?.archiveId||makeId("quarantine"),
    alias:typeof entry?.alias==="string"?entry.alias:"unreadable archive",
    archivedAt:Number.isFinite(Number(entry?.archivedAt))?Number(entry.archivedAt):Date.now(),
    error:safeError(err).message,
    raw:clone(entry)
  };
}

function persist(){
  if(!profile)profile=freshProfile();
  profile.updatedAt=Date.now();
  return storageSet(JSON.stringify(profile));
}

export function loadProfile(){
  let raw;
  try{raw=storageGet();}
  catch(err){
    profile=freshProfile();
    return {loaded:false,legacyMigrated:false,hasActive:false,error:true,message:`Browser storage could not be read: ${safeError(err).message}`};
  }
  if(!raw){profile=freshProfile();return {loaded:false,legacyMigrated:false,hasActive:false};}

  try{
    const parsed=JSON.parse(raw);
    let legacyMigrated=false,loadError=null;
    if(isProfileEnvelope(parsed)){
      const declaredProfileVersion=Number(parsed.profileVersion||1);
      if(!Number.isFinite(declaredProfileVersion)||declaredProfileVersion<1)throw new Error("Invalid profile version");
      if(declaredProfileVersion>PROFILE_VERSION)throw new Error(`Unsupported future profile version ${declaredProfileVersion}`);
      const next=freshProfile();
      next.profileId=parsed.profileId||next.profileId;
      next.createdAt=Number.isFinite(Number(parsed.createdAt))?Number(parsed.createdAt):next.createdAt;
      next.profileVersion=PROFILE_VERSION;
      next.recovery={...(parsed.recovery&&typeof parsed.recovery==="object"?parsed.recovery:{}),quarantinedArchives:Array.isArray(parsed.recovery?.quarantinedArchives)?[...parsed.recovery.quarantinedArchives]:[]};
      for(const entry of parsed.archivedIdentities||[]){
        try{next.archivedIdentities.push(normalizeArchive(entry));}
        catch(err){
          console.warn("Archive quarantined during profile load",err);
          next.recovery.quarantinedArchives.push(quarantineArchive(entry,err));
          loadError=loadError||"One archived identity could not be loaded and was preserved for recovery.";
        }
      }
      if(parsed.activeIdentity){
        try{next.activeIdentity=normalizeIdentity(parsed.activeIdentity);}
        catch(err){
          console.error("Active identity could not be loaded",err);
          next.recovery.quarantinedActive={error:safeError(err).message,raw:clone(parsed.activeIdentity)};
          loadError=`The active identity could not be loaded safely: ${safeError(err).message}`;
        }
      }
      profile=next;
    }else{
      profile=freshProfile();
      try{profile.activeIdentity=normalizeIdentity(parsed);legacyMigrated=true;}
      catch(err){
        profile.recovery.quarantinedActive={error:safeError(err).message,raw:clone(parsed)};
        loadError=`The legacy identity could not be loaded safely: ${safeError(err).message}`;
      }
    }

    if(profile.activeIdentity)replaceState(profile.activeIdentity);
    else resetState();

    // Do not overwrite the only original copy when active data is unreadable.
    const hasQuarantinedActive=!!profile.recovery?.quarantinedActive;
    if(!hasQuarantinedActive)persist();
    return {loaded:true,legacyMigrated,hasActive:!!profile.activeIdentity,error:!!loadError,message:loadError};
  }catch(err){
    console.error("Profile load failed",err);
    profile=freshProfile();
    profile.recovery={quarantinedArchives:[],rawProfile:{error:safeError(err).message,rawText:raw}};
    return {loaded:false,legacyMigrated:false,hasActive:false,error:true,message:`Save data could not be parsed safely: ${safeError(err).message}`};
  }
}

export function saveGame(){
  if(!profile)loadProfile();
  if(!profile?.activeIdentity)return {ok:false,reason:"no-active-identity"};
  touch();
  profile.activeIdentity=getState();
  const ok=persist();
  return ok?{ok:true}:{ok:false,reason:"storage-failure",error:persistenceStatus.error?.message||"Save failed"};
}

export function hasSave(){
  try{return !!storageGet();}catch{return false;}
}
export function hasActiveIdentity(){return !!profile?.activeIdentity;}
export function getPersistenceStatus(){return {ok:persistenceStatus.ok,error:persistenceStatus.error?.message||null};}

export function getProfileSummary(){
  if(!profile)loadProfile();
  const active=profile.activeIdentity;
  return {
    profileId:profile.profileId,
    active:active?{identityId:active.meta?.identityId,alias:active.player?.alias||"unknown",day:active.world?.day||1,credits:active.player?.credits||0,reputation:active.player?.reputation||0,qaMode:active.meta?.qaMode||null}:null,
    archives:profile.archivedIdentities.map(a=>({archiveId:a.archiveId,alias:a.alias,day:a.day,credits:a.credits,reputation:a.reputation,archivedAt:a.archivedAt,reason:a.reason})),
    quarantinedCount:(profile.recovery?.quarantinedArchives||[]).length+(profile.recovery?.quarantinedActive?1:0)+(profile.recovery?.rawProfile?1:0)
  };
}

export function archiveCurrentIdentity(reason="archived"){
  if(!profile)loadProfile();
  if(!profile?.activeIdentity)return null;
  const current=clone(getState());
  if(!current.player?.alias)return null;
  const archive={
    archiveId:makeId("archive"),
    alias:current.player.alias,
    day:current.world.day,
    credits:current.player.credits,
    reputation:current.player.reputation,
    archivedAt:Date.now(),
    reason,
    state:current
  };
  profile.archivedIdentities.unshift(archive);
  profile.activeIdentity=null;
  const ok=persist();
  if(ok){resetState();return archive;}
  profile.archivedIdentities=profile.archivedIdentities.filter(entry=>entry.archiveId!==archive.archiveId);
  profile.activeIdentity=getState();
  return null;
}

export function beginNewIdentity(alias,{archiveActive=true}={}){
  if(!profile)loadProfile();
  if(profile.activeIdentity&&archiveActive){
    const active=clone(profile.activeIdentity);
    profile.archivedIdentities.unshift({archiveId:makeId("archive"),alias:active.player.alias,day:active.world.day,credits:active.player.credits,reputation:active.player.reputation,archivedAt:Date.now(),reason:"new_identity",state:active});
  }
  resetState();
  getState().player.alias=String(alias||"").slice(0,18);
  profile.activeIdentity=getState();
  persist();
  return getState();
}

export function beginQaNightwireIdentity(alias="range_qa",{archiveActive=true}={}){
  if(!profile)loadProfile();
  if(profile.activeIdentity&&archiveActive){
    const active=clone(profile.activeIdentity);
    profile.archivedIdentities.unshift({archiveId:makeId("archive"),alias:active.player.alias,day:active.world.day,credits:active.player.credits,reputation:active.player.reputation,archivedAt:Date.now(),reason:"qa_nightwire_test",state:active});
  }

  resetState();
  const state=getState();
  state.player.alias=String(alias||"range_qa").slice(0,18)||"range_qa";
  state.meta.qaMode="nightwire_range";
  state.meta.qaSource="A4.8.1";
  state.world.completedMissions=MISSIONS.map(m=>m.id);
  state.world.flags=["qa_nightwire_range"];
  state.world.caseHistory=MISSIONS.map((m,index)=>({
    id:`mission:${m.id}`,kind:"mission",refId:m.id,day:1,minute:state.world.minute,index,historical:true,qaSeeded:true
  }));
  state.missions.active=[];
  state.missions.progress={};
  state.player.credits=MISSIONS.reduce((sum,m)=>sum+(m.rewards?.credits||0),0);
  state.player.reputation=MISSIONS.reduce((sum,m)=>sum+(m.rewards?.reputation||0),0);
  state.intrusion.credentials=[];
  state.intrusion.sessions={};
  state.intrusion.serviceIntel={};
  state.intrusion.artifacts=[];
  state.intrusion.noise={};
  state.intrusion.attempts=[];
  state.intrusion.activeSandbox=null;
  state.nightwire={readPosts:[],readMessages:[],range:{activeLabId:null,completed:[],runs:{},results:{}}};
  state.terminal.hostId="home";
  state.terminal.user=state.player.alias.toLowerCase().replace(/\s+/g,"_");
  state.terminal.cwd=HOSTS.home.homeDir;
  state.terminal.sessionOpen=false;
  state.terminal.suspended=false;
  state.terminal.pendingAction=null;
  state.terminal.lastScanResults=[];
  state.terminal.accessSessionId=null;
  state.terminal.serviceSession=null;

  profile.activeIdentity=state;
  persist();
  return state;
}

export function restoreArchivedIdentity(archiveId){
  if(!profile)loadProfile();
  let index=profile.archivedIdentities.findIndex(a=>a.archiveId===archiveId);
  if(index<0)return false;
  if(profile.activeIdentity){
    const active=clone(profile.activeIdentity);
    profile.archivedIdentities.unshift({archiveId:makeId("archive"),alias:active.player.alias,day:active.world.day,credits:active.player.credits,reputation:active.player.reputation,archivedAt:Date.now(),reason:"switched_identity",state:active});
    index++;
  }
  const [entry]=profile.archivedIdentities.splice(index,1);
  let restored;
  try{restored=normalizeIdentity(entry.state);}
  catch(err){
    profile.recovery??={quarantinedArchives:[]};
    profile.recovery.quarantinedArchives??=[];
    profile.recovery.quarantinedArchives.push(quarantineArchive(entry,err));
    persist();
    return false;
  }
  restored.terminal.sessionOpen=false;
  restored.terminal.suspended=false;
  restored.terminal.pendingAction=null;
  profile.activeIdentity=restored;
  replaceState(restored);
  return persist();
}

export function clearSave(){storageRemove();profile=null;resetState();}

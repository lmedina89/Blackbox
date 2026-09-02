import { getState, replaceState, resetState, touch } from "./state.js";
import { migrateSave } from "./migrations.js";

const KEY="blackbox_firstboot_save";
const PROFILE_VERSION=1;
let profile=null;

function makeId(prefix){
  const value=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  return `${prefix}-${value}`;
}

function clone(value){return JSON.parse(JSON.stringify(value));}

function freshProfile(){
  return {format:"blackbox_profile",profileVersion:PROFILE_VERSION,profileId:makeId("profile"),createdAt:Date.now(),updatedAt:Date.now(),activeIdentity:null,archivedIdentities:[]};
}

function isProfileEnvelope(value){return !!value&&value.format==="blackbox_profile"&&Array.isArray(value.archivedIdentities);}

function normalizeArchive(entry){
  if(!entry||!entry.state)return null;
  const state=migrateSave(entry.state);
  return {
    archiveId:entry.archiveId||makeId("archive"),
    alias:entry.alias||state.player.alias||"unknown",
    day:Number(entry.day||state.world.day||1),
    credits:Number(entry.credits??state.player.credits??0),
    reputation:Number(entry.reputation??state.player.reputation??0),
    archivedAt:Number(entry.archivedAt||Date.now()),
    reason:entry.reason||"archived",
    state
  };
}

function persist(){
  if(!profile)profile=freshProfile();
  profile.updatedAt=Date.now();
  localStorage.setItem(KEY,JSON.stringify(profile));
}

export function loadProfile(){
  const raw=localStorage.getItem(KEY);
  if(!raw){profile=freshProfile();return {loaded:false,legacyMigrated:false,hasActive:false};}
  try{
    const parsed=JSON.parse(raw);
    let legacyMigrated=false;
    if(isProfileEnvelope(parsed)){
      profile=parsed;
      profile.profileVersion=PROFILE_VERSION;
      profile.archivedIdentities=(profile.archivedIdentities||[]).map(normalizeArchive).filter(Boolean);
      if(profile.activeIdentity)profile.activeIdentity=migrateSave(profile.activeIdentity);
    }else{
      profile=freshProfile();
      profile.activeIdentity=migrateSave(parsed);
      legacyMigrated=true;
    }
    if(profile.activeIdentity)replaceState(profile.activeIdentity);
    persist();
    return {loaded:true,legacyMigrated,hasActive:!!profile.activeIdentity};
  }catch(err){
    console.error("Profile load failed",err);
    profile=freshProfile();
    return {loaded:false,legacyMigrated:false,hasActive:false,error:true};
  }
}

export function saveGame(){
  if(!profile)loadProfile();
  touch();
  profile.activeIdentity=getState();
  persist();
}

export function hasSave(){return !!localStorage.getItem(KEY);}
export function hasActiveIdentity(){return !!profile?.activeIdentity;}

export function getProfileSummary(){
  if(!profile)loadProfile();
  const active=profile.activeIdentity;
  return {
    profileId:profile.profileId,
    active:active?{identityId:active.meta?.identityId,alias:active.player?.alias||"unknown",day:active.world?.day||1,credits:active.player?.credits||0,reputation:active.player?.reputation||0}:null,
    archives:profile.archivedIdentities.map(a=>({archiveId:a.archiveId,alias:a.alias,day:a.day,credits:a.credits,reputation:a.reputation,archivedAt:a.archivedAt,reason:a.reason}))
  };
}

export function archiveCurrentIdentity(reason="archived"){
  if(!profile)loadProfile();
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
  persist();
  return archive;
}

export function beginNewIdentity(alias,{archiveActive=true}={}){
  if(!profile)loadProfile();
  if(profile.activeIdentity&&archiveActive){
    const active=clone(profile.activeIdentity);
    profile.archivedIdentities.unshift({archiveId:makeId("archive"),alias:active.player.alias,day:active.world.day,credits:active.player.credits,reputation:active.player.reputation,archivedAt:Date.now(),reason:"new_identity",state:active});
  }
  resetState();
  getState().player.alias=alias;
  profile.activeIdentity=getState();
  persist();
  return getState();
}

export function restoreArchivedIdentity(archiveId){
  if(!profile)loadProfile();
  let index=profile.archivedIdentities.findIndex(a=>a.archiveId===archiveId);
  if(index<0)return false;
  if(profile.activeIdentity){
    const active=clone(profile.activeIdentity);
    profile.archivedIdentities.unshift({archiveId:makeId("archive"),alias:active.player.alias,day:active.world.day,credits:active.player.credits,reputation:active.player.reputation,archivedAt:Date.now(),reason:"switched_identity",state:active});
    if(index>=0)index++;
  }
  const [entry]=profile.archivedIdentities.splice(index,1);
  const restored=migrateSave(entry.state);
  restored.terminal.sessionOpen=false;
  restored.terminal.suspended=false;
  restored.terminal.pendingAction=null;
  profile.activeIdentity=restored;
  replaceState(restored);
  persist();
  return true;
}

export function clearSave(){localStorage.removeItem(KEY);profile=null;resetState();}

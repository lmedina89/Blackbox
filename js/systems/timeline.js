import { WORLD_EVENTS } from "../data/worldEvents.js";
import { getState, hasFlag, setFlag } from "../core/state.js";
import { emit, on } from "../core/events.js";

function eligible(def){
  const s=getState(),when=def.when||{};
  if((when.flagsAll||[]).some(flag=>!hasFlag(flag)))return false;
  if((when.flagsNone||[]).some(flag=>hasFlag(flag)))return false;
  if((when.missionsComplete||[]).some(id=>!s.world.completedMissions.includes(id)))return false;
  if((when.cluesAll||[]).some(id=>!s.player.discoveredClues.includes(id)))return false;
  return true;
}

export function addCaseHistory(entry){
  const s=getState();s.world.caseHistory??=[];
  if(s.world.caseHistory.some(x=>x.id===entry.id))return false;
  s.world.caseHistory.push({day:s.world.day,minute:s.world.minute,...entry});
  return true;
}

export function processTimeline(){
  const s=getState();
  s.world.deliveredEvents??=[];s.world.eventEligibleAt??={};
  for(const def of WORLD_EVENTS){
    if(s.world.deliveredEvents.includes(def.id))continue;
    if(!eligible(def)){delete s.world.eventEligibleAt[def.id];continue;}
    if(s.world.eventEligibleAt[def.id]===undefined)s.world.eventEligibleAt[def.id]=s.world.actionTick;
    if(s.world.actionTick-s.world.eventEligibleAt[def.id]<(def.afterActions||0))continue;
    s.world.deliveredEvents.push(def.id);
    for(const flag of def.setFlags||[])setFlag(flag);
    if(def.notice)s.world.notifications.push({id:`event:${def.id}`,text:def.notice,day:s.world.day,minute:s.world.minute,read:false});
    addCaseHistory({id:`event:${def.id}`,kind:"world",title:def.notice||def.id});
    emit("timeline:event",{event:def});
  }
}

export function advanceWorld(actionKey,{minutes=3,once=false}={}){
  const s=getState();s.world.countedActions??=[];
  const key=String(actionKey||"");
  if(!key)return false;
  if(once&&s.world.countedActions.includes(key))return false;
  if(!once&&s.world.lastActionKey===key)return false;
  if(once){s.world.countedActions.push(key);if(s.world.countedActions.length>300)s.world.countedActions.shift();}
  s.world.lastActionKey=key;
  s.world.actionTick=(s.world.actionTick||0)+1;
  s.world.minute=(s.world.minute||0)+Math.max(1,minutes);
  while(s.world.minute>=1440){s.world.minute-=1440;s.world.day=(s.world.day||1)+1;}
  s.world.networkEpoch=Math.floor(s.world.actionTick/5);
  processTimeline();
  emit("clock:tick",{minute:s.world.minute,day:s.world.day,actionDriven:true});
  return true;
}

export function initTimeline(){
  processTimeline();
  on("state:flag-set",processTimeline);
  on("clue:discovered",processTimeline);
  on("mission:completed",processTimeline);
  on("email:read",({emailId})=>advanceWorld(`email:${emailId}`,{minutes:4,once:true}));
  on("forum:read",({postId})=>advanceWorld(`forum:${postId}`,{minutes:3,once:true}));
  on("social:read",({postId})=>advanceWorld(`social:${postId}`,{minutes:2,once:true}));
  on("news:read",({newsId})=>advanceWorld(`news:${newsId}`,{minutes:2,once:true}));
  on("threat:read",({threatId})=>advanceWorld(`threat:${threatId}`,{minutes:3,once:true}));
  on("lab:completed",({labId})=>advanceWorld(`lab:${labId}`,{minutes:6,once:true}));
  on("dialogue:choice",({choiceId})=>advanceWorld(`choice:${choiceId}`,{minutes:3,once:true}));
  on("mission:progress",({mission,objective})=>addCaseHistory({id:`objective:${mission.id}:${objective.id}`,kind:"objective",refId:mission.id,title:objective.label}));
  on("mission:completed",({mission})=>addCaseHistory({id:`mission:${mission.id}`,kind:"mission",refId:mission.id,title:mission.title}));
}

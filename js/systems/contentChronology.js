import { getState } from "../core/state.js";
import { WORLD_EVENTS } from "../data/worldEvents.js";
import { MISSIONS } from "../data/missions.js";
import { contentDelivery } from "./contentAvailability.js";

const DAY_MINUTES=1440;
const MISSION_SOCIAL_TARGETS=new Set(
  MISSIONS.flatMap(mission=>(mission.objectives||[])
    .filter(objective=>objective.type==="social_read")
    .map(objective=>objective.target))
);

const WORLD_FLAG_EVENTS=new Map();
for(const event of WORLD_EVENTS){
  for(const flag of event.setFlags||[])WORLD_FLAG_EVENTS.set(flag,event.id);
}
const MISSION_COMPLETE_FLAGS=new Map();
const MISSION_START_FLAGS=new Map();
for(const mission of MISSIONS){
  for(const flag of mission.flagsOnComplete||[])MISSION_COMPLETE_FLAGS.set(flag,mission.id);
  for(const flag of mission.flagsOnStart||[])MISSION_START_FLAGS.set(flag,mission.id);
}

export function worldAbsoluteMinute(state=getState()){
  return (Math.max(1,Number(state.world.day)||1)-1)*DAY_MINUTES+Math.max(0,Number(state.world.minute)||0);
}

function historyAbsolute(entry){
  if(!entry)return null;
  const day=Number(entry.day),minute=Number(entry.minute);
  if(!Number.isFinite(day)||!Number.isFinite(minute))return null;
  return (Math.max(1,day)-1)*DAY_MINUTES+Math.max(0,Math.min(DAY_MINUTES-1,minute));
}

function historyById(state,id){
  return (state.world.caseHistory||[]).find(entry=>entry.id===id)||null;
}

function parseClock(value){
  const match=/^(\d{1,2}):(\d{2})$/.exec(String(value||"").trim());
  if(!match)return null;
  const hour=Number(match[1]),minute=Number(match[2]);
  if(hour<0||hour>23||minute<0||minute>59)return null;
  return hour*60+minute;
}

function inferredAnchorAbsolute(item,state){
  const anchors=[];
  for(const flag of item.visibleWhen||[]){
    const eventId=WORLD_FLAG_EVENTS.get(flag);
    if(eventId){
      const value=historyAbsolute(historyById(state,`event:${eventId}`));
      if(value!==null)anchors.push(value);
    }
    const completedMission=MISSION_COMPLETE_FLAGS.get(flag);
    if(completedMission){
      const value=historyAbsolute(historyById(state,`mission:${completedMission}`));
      if(value!==null)anchors.push(value);
    }
    const startedMission=MISSION_START_FLAGS.get(flag);
    if(startedMission){
      const value=historyAbsolute(historyById(state,`mission-start:${startedMission}`));
      if(value!==null)anchors.push(value);
    }
  }
  return anchors.length?Math.max(...anchors):null;
}

function fixedClockAbsolute(clockMinute,anchorAbsolute=null){
  if(anchorAbsolute===null)return clockMinute; // legacy clock-only content begins on Day 1
  const anchorDay=Math.floor(anchorAbsolute/DAY_MINUTES);
  const anchorClock=anchorAbsolute%DAY_MINUTES;
  let planned=anchorDay*DAY_MINUTES+clockMinute;
  // A small-after-midnight authored time following a late-night anchor belongs to the next day.
  if(clockMinute<4*60&&anchorClock>=20*60)planned+=DAY_MINUTES;
  return Math.max(anchorAbsolute,planned);
}

export function contentAbsoluteTime(item,state=getState()){
  const delivery=contentDelivery(item);
  if(delivery&&Number.isFinite(Number(delivery.absolute)))return Number(delivery.absolute);

  if(item?.timeFromEvent){
    const value=historyAbsolute(historyById(state,`event:${item.timeFromEvent}`));
    if(value!==null)return value;
  }

  const clockMinute=parseClock(item?.time);
  if(clockMinute===null)return null;
  return fixedClockAbsolute(clockMinute,inferredAnchorAbsolute(item,state));
}

export function contentTimeParts(item,state=getState()){
  const absolute=contentAbsoluteTime(item,state);
  if(!Number.isFinite(absolute))return null;
  return {absolute,day:Math.floor(absolute/DAY_MINUTES)+1,minute:absolute%DAY_MINUTES};
}

export function contentTimeLabel(item,state=getState(),{includeDay=false}={}){
  const time=contentTimeParts(item,state);
  if(!time)return item?.time||"";
  const hh=String(Math.floor(time.minute/60)).padStart(2,"0");
  const mm=String(time.minute%60).padStart(2,"0");
  return includeDay?`Day ${time.day} · ${hh}:${mm}`:`${time.day>1?`D${time.day} `:""}${hh}:${mm}`;
}

export function sortChronologically(items,state=getState(),{direction="asc"}={}){
  const sign=direction==="desc"?-1:1;
  return (items||[]).map((item,index)=>({item,index,time:contentAbsoluteTime(item,state)})).sort((a,b)=>{
    const aFinite=Number.isFinite(a.time),bFinite=Number.isFinite(b.time);
    if(aFinite&&bFinite){
      const delta=(a.time-b.time)*sign;
      if(delta)return delta;
    }else if(aFinite!==bFinite){
      return aFinite?-1:1;
    }
    return a.index-b.index;
  }).map(entry=>entry.item);
}

export function chronologyAvailable(item,{kind="generic",state=getState()}={}){
  // Mission-critical FriendSpace objectives remain on their proven legacy availability path.
  if(kind==="social"&&MISSION_SOCIAL_TARGETS.has(item?.id))return true;
  if(item?.scheduleId)return true; // scheduler delivery itself already gates availability
  if(!item?.time)return true;
  const absolute=contentAbsoluteTime(item,state);
  if(!Number.isFinite(absolute))return true;
  return worldAbsoluteMinute(state)>=absolute;
}

export function isMissionCriticalSocial(itemId){return MISSION_SOCIAL_TARGETS.has(itemId);}

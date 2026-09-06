import { getState, hasFlag, setFlag } from "../core/state.js";
import { emit } from "../core/events.js";

const DAY_MINUTES=1440;
const READ_BUCKETS={
  email:"readEmails",
  forum:"readForumPosts",
  social:"readSocialPosts",
  news:"readNewsStories",
  message:"readMessages",
  threat:"readThreats"
};

function uniquePush(list,value){
  if(!list.includes(value))list.push(value);
}

function absoluteMinute(day,minute){
  return (Math.max(1,Number(day)||1)-1)*DAY_MINUTES+Math.max(0,Math.min(DAY_MINUTES-1,Number(minute)||0));
}

export function currentWorldMinute(){
  const s=getState();
  return absoluteMinute(s.world.day,s.world.minute);
}

function fromAbsoluteMinute(value){
  const total=Math.max(0,Math.trunc(Number(value)||0));
  return {day:Math.floor(total/DAY_MINUTES)+1,minute:total%DAY_MINUTES,absolute:total};
}

function hash32(text){
  let h=2166136261;
  for(const ch of String(text||"")){
    h^=ch.charCodeAt(0);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function deterministicBetween(min,max,seed){
  let lo=Math.trunc(Number(min)||0),hi=Math.trunc(Number(max)||0);
  if(hi<lo)[lo,hi]=[hi,lo];
  if(hi===lo)return lo;
  return lo+(hash32(seed)%(hi-lo+1));
}

function conditionRead(entry,s){
  if(typeof entry==="string"){
    return Object.values(READ_BUCKETS).some(key=>(s.world[key]||[]).includes(entry));
  }
  if(!entry||typeof entry!=="object")return false;
  const key=READ_BUCKETS[entry.type];
  return !!key&&(s.world[key]||[]).includes(entry.id);
}

function conditionsMet(when={}){
  const s=getState(),timeline=s.world.timeline||{};
  if((when.flagsAll||[]).some(flag=>!hasFlag(flag)))return false;
  if((when.flagsNone||[]).some(flag=>hasFlag(flag)))return false;
  if((when.missionsComplete||[]).some(id=>!s.world.completedMissions.includes(id)))return false;
  if((when.missionsActive||[]).some(id=>!s.missions.active.includes(id)))return false;
  if((when.cluesAll||[]).some(id=>!s.player.discoveredClues.includes(id)))return false;
  if((when.contentDelivered||[]).some(id=>!(timeline.delivered||[]).includes(id)))return false;
  if((when.contentCancelled||[]).some(id=>!(timeline.cancelled||[]).includes(id)))return false;
  if((when.contentExpired||[]).some(id=>!(timeline.expired||[]).includes(id)))return false;
  if((when.choicesAll||[]).some(id=>!s.communications.choicesMade.includes(id)))return false;
  if((when.readAll||[]).some(entry=>!conditionRead(entry,s)))return false;
  if(Number.isFinite(Number(when.dayMin))&&s.world.day<Number(when.dayMin))return false;
  if(Number.isFinite(Number(when.dayMax))&&s.world.day>Number(when.dayMax))return false;
  return true;
}

function timeWindowTarget(now,window={},seed){
  const start=Math.max(0,Math.min(1439,Math.trunc(Number(window.startMinute) || 0)));
  const rawEnd=window.endMinute===undefined?start:Number(window.endMinute);
  const end=Math.max(0,Math.min(1439,Math.trunc(Number.isFinite(rawEnd)?rawEnd:start)));
  const minLead=Math.max(0,Math.trunc(Number(window.minLeadMinutes)||0));
  const earliest=now+minLead;
  const baseDay=Math.floor(earliest/DAY_MINUTES);
  const intervals=[];
  for(let offset=0;offset<3;offset++){
    const dayBase=(baseDay+offset)*DAY_MINUTES;
    if(start<=end){
      intervals.push([dayBase+start,dayBase+end]);
    }else{
      // Overnight window, e.g. 22:00–02:00. The early segment belongs
      // to the same human "night" even though it crosses a day boundary.
      intervals.push([dayBase+start,dayBase+DAY_MINUTES-1]);
      intervals.push([dayBase+DAY_MINUTES,dayBase+DAY_MINUTES+end]);
    }
  }
  for(const [from,to] of intervals.sort((a,b)=>a[0]-b[0])){
    if(to<earliest)continue;
    const low=Math.max(from,earliest);
    if(low>to)continue;
    return deterministicBetween(low,to,`${seed}:window:${from}:${to}`);
  }
  return earliest;
}

function timingTarget(def,now){
  const s=getState(),timing=def.timing||{};
  const mode=timing.mode||"afterMinutes";
  const seed=`${s.meta.identityId}:${def.id}:${now}:${s.world.actionTick||0}`;
  if(mode==="afterActions"){
    const min=Math.max(0,Math.trunc(Number(timing.minActions ?? timing.actions ?? 0)||0));
    const max=Math.max(min,Math.trunc(Number(timing.maxActions ?? timing.actions ?? min)||min));
    const delay=deterministicBetween(min,max,`${seed}:actions`);
    return {mode,eligibleAt:now,eligibleActionTick:s.world.actionTick||0,dueActionTick:(s.world.actionTick||0)+delay};
  }
  if(mode==="absolute"){
    const at=absoluteMinute(timing.day||s.world.day,timing.minute||0);
    return {mode,eligibleAt:now,at};
  }
  if(mode==="timeWindow"){
    const at=timeWindowTarget(now,timing,seed);
    return {mode,eligibleAt:now,at};
  }
  if(mode==="afterEvent"){
    const anchorId=timing.eventId;
    const anchor=s.world.timeline?.deliveryTimes?.[anchorId];
    const anchorAt=Number(anchor?.absolute ?? anchor);
    if(!anchorId||!Number.isFinite(anchorAt))return null;
    const min=Math.max(0,Math.trunc(Number(timing.minMinutes ?? timing.minutes ?? 0)||0));
    const max=Math.max(min,Math.trunc(Number(timing.maxMinutes ?? timing.minutes ?? min)||min));
    const delay=deterministicBetween(min,max,`${seed}:event:${anchorId}`);
    return {mode,eligibleAt:now,anchorId,at:anchorAt+delay};
  }
  const min=Math.max(0,Math.trunc(Number(timing.minMinutes ?? timing.minutes ?? 0)||0));
  const max=Math.max(min,Math.trunc(Number(timing.maxMinutes ?? timing.minutes ?? min)||min));
  const delay=deterministicBetween(min,max,`${seed}:minutes`);
  return {mode:"afterMinutes",eligibleAt:now,at:now+delay};
}

function schedulerState(){
  const timeline=getState().world.timeline;
  timeline.scheduled??={};timeline.delivered??=[];timeline.deliveryTimes??={};
  timeline.cancelled??=[];timeline.expired??=[];timeline.cooldowns??={};timeline.occurrenceCounters??={};
  return timeline;
}

function terminalState(timeline,id){
  return timeline.delivered.includes(id)||timeline.cancelled.includes(id)||timeline.expired.includes(id);
}

function schedule(def,defsById,{replacement=false}={}){
  const timeline=schedulerState();
  if(!def?.id||terminalState(timeline,def.id)||timeline.scheduled[def.id])return false;
  if(def.replacementOnly&&!replacement)return false;
  if(!conditionsMet(def.when||{}))return false;
  const now=currentWorldMinute();
  const record=timingTarget(def,now);
  if(!record)return false;
  const expiry=Math.max(0,Math.trunc(Number(def.expiresAfterMinutes)||0));
  if(expiry)record.expiresAt=now+expiry;
  timeline.scheduled[def.id]=record;
  emit("timeline:scheduled",{contentId:def.id,definition:def,scheduled:record});
  return true;
}

function scheduleReplacement(def,defsById){
  if(!def.replaceWith)return false;
  const replacement=defsById.get(def.replaceWith);
  if(!replacement)return false;
  const replacementDef={...replacement,when:{...(replacement.when||{}),contentCancelled:[...new Set([...(replacement.when?.contentCancelled||[]),def.id])]}};
  const scheduled=schedule(replacementDef,defsById,{replacement:true});
  if(scheduled)emit("content:replaced",{contentId:def.id,replacementId:def.replaceWith,reason:"cancelled"});
  return scheduled;
}

function cancel(def,defsById,reason="condition"){
  const timeline=schedulerState();
  if(terminalState(timeline,def.id))return false;
  delete timeline.scheduled[def.id];
  uniquePush(timeline.cancelled,def.id);
  emit("content:cancelled",{contentId:def.id,definition:def,reason});
  scheduleReplacement(def,defsById);
  return true;
}

function expire(def,defsById){
  const timeline=schedulerState();
  if(terminalState(timeline,def.id))return false;
  delete timeline.scheduled[def.id];
  uniquePush(timeline.expired,def.id);
  emit("content:expired",{contentId:def.id,definition:def});
  if(def.replaceWith){
    const replacement=defsById.get(def.replaceWith);
    if(replacement){
      const replacementDef={...replacement,when:{...(replacement.when||{}),contentExpired:[...new Set([...(replacement.when?.contentExpired||[]),def.id])]}};
      if(schedule(replacementDef,defsById,{replacement:true}))emit("content:replaced",{contentId:def.id,replacementId:def.replaceWith,reason:"expired"});
    }
  }
  return true;
}

function due(record,now,actionTick){
  if(record.mode==="afterActions")return actionTick>=Number(record.dueActionTick||0);
  return now>=Number(record.at||0);
}

function dueSortValue(record){
  return record.mode==="afterActions" ? Number(record.dueActionTick||0)*100000000 : Number(record.at||0);
}

function deliver(def){
  const s=getState(),timeline=schedulerState(),record=timeline.scheduled[def.id];
  if(!record||terminalState(timeline,def.id))return false;
  delete timeline.scheduled[def.id];
  uniquePush(timeline.delivered,def.id);
  const deliveryAbsolute=record.mode==="afterActions"?currentWorldMinute():Number(record.at);
  const deliveredAt=fromAbsoluteMinute(Number.isFinite(deliveryAbsolute)?deliveryAbsolute:currentWorldMinute());
  timeline.deliveryTimes[def.id]=deliveredAt;
  for(const flag of def.setFlags||[])setFlag(flag);
  if(def.notice)s.world.notifications.push({id:`content:${def.id}`,text:def.notice,day:deliveredAt.day,minute:deliveredAt.minute,read:false});
  emit("content:delivered",{contentId:def.id,definition:def,scheduled:record,deliveredAt});
  return true;
}

export function processScheduledContent(definitions=[]){
  const defs=(definitions||[]).filter(def=>def&&typeof def.id==="string");
  if(!defs.length)return {scheduled:0,delivered:0,cancelled:0,expired:0};
  const defsById=new Map(defs.map(def=>[def.id,def]));
  const timeline=schedulerState();
  let scheduledCount=0,deliveredCount=0,cancelledCount=0,expiredCount=0;

  // First cancel/expire anything already scheduled whose context became invalid.
  for(const def of defs){
    if(terminalState(timeline,def.id))continue;
    const record=timeline.scheduled[def.id];
    if(!record)continue;
    if(def.cancelWhen&&conditionsMet(def.cancelWhen)){
      if(cancel(def,defsById))cancelledCount++;
      continue;
    }
    if(def.expireWhen&&conditionsMet(def.expireWhen)){
      if(expire(def,defsById))expiredCount++;
      continue;
    }
    const now=currentWorldMinute();
    if(Number.isFinite(Number(record.expiresAt))&&now>=Number(record.expiresAt)){
      if(expire(def,defsById))expiredCount++;
    }
  }

  // New eligibility is persisted immediately. This is what prevents load-time rerolls.
  for(const def of defs){
    if(terminalState(timeline,def.id)||timeline.scheduled[def.id])continue;
    if(schedule(def,defsById))scheduledCount++;
  }

  // Deliver due content in stable chronological order.
  const now=currentWorldMinute(),actionTick=getState().world.actionTick||0;
  const candidates=defs
    .filter(def=>timeline.scheduled[def.id]&&due(timeline.scheduled[def.id],now,actionTick))
    .sort((a,b)=>{
      const av=dueSortValue(timeline.scheduled[a.id]),bv=dueSortValue(timeline.scheduled[b.id]);
      return av-bv||a.id.localeCompare(b.id);
    });
  for(const def of candidates){
    const record=timeline.scheduled[def.id];
    if(!record)continue;
    if(Number.isFinite(Number(record.expiresAt))&&now>=Number(record.expiresAt)){
      if(expire(def,defsById))expiredCount++;
      continue;
    }
    if(def.cancelWhen&&conditionsMet(def.cancelWhen)){
      if(cancel(def,defsById))cancelledCount++;
      continue;
    }
    if(deliver(def))deliveredCount++;
  }

  // A delivery/cancellation can make an afterEvent/replacement item eligible in the same pass.
  for(const def of defs){
    if(terminalState(timeline,def.id)||timeline.scheduled[def.id])continue;
    if(schedule(def,defsById))scheduledCount++;
  }

  return {scheduled:scheduledCount,delivered:deliveredCount,cancelled:cancelledCount,expired:expiredCount};
}

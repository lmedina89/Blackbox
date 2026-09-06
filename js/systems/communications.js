import { THREADS } from "../data/messages.js";
import { getState, setFlag } from "../core/state.js";
import { emit, on } from "../core/events.js";
import { learn } from "./progression.js";

let initialized=false;

function absoluteNow(){const s=getState();return (s.world.day-1)*1440+s.world.minute;}

function ensureThreadState(threadId){
  const communications=getState().communications;
  communications.threads??={};
  const current=communications.threads[threadId];
  if(!current||typeof current!=="object"||Array.isArray(current))communications.threads[threadId]={};
  const state=communications.threads[threadId];
  if(state.lastDeliveredNode===undefined)state.lastDeliveredNode=null;
  if(state.lastDeliveryAt===undefined)state.lastDeliveryAt=null;
  if(state.lastPresentedNode===undefined)state.lastPresentedNode=null;
  if(state.lastPresentedAt===undefined)state.lastPresentedAt=null;
  if(state.waitingForReply===undefined)state.waitingForReply=null;
  if(state.lastChoiceId===undefined)state.lastChoiceId=null;
  if(state.lastChoiceAt===undefined)state.lastChoiceAt=null;
  if(state.cooldownUntil===undefined)state.cooldownUntil=null;
  return state;
}

function threadForChoice(choiceId){
  for(const thread of THREADS){
    for(const message of thread.messages){
      if(message.choice?.options?.some(option=>option.id===choiceId))return {thread,message};
    }
  }
  return null;
}

export function recordPresentedThread(threadId,messageId,absolute=absoluteNow()){
  const state=ensureThreadState(threadId);
  if(state.lastPresentedNode===messageId&&state.lastPresentedAt===absolute)return false;
  state.lastPresentedNode=messageId||null;
  const parsed=absolute==null?NaN:Number(absolute);
  state.lastPresentedAt=Number.isFinite(parsed)?parsed:absoluteNow();
  emit("conversation:advanced",{threadId,messageId:state.lastPresentedNode,kind:"presented"});
  return true;
}

export function setWaitingForReply(threadId,messageId){
  const state=ensureThreadState(threadId),next=messageId||null;
  if(state.waitingForReply===next)return false;
  state.waitingForReply=next;
  emit("conversation:advanced",{threadId,messageId:next,kind:"waiting"});
  return true;
}

export function setThreadCooldown(threadId,untilAbsolute){
  const state=ensureThreadState(threadId),next=untilAbsolute==null?null:Math.max(0,Math.trunc(Number(untilAbsolute)||0));
  if(state.cooldownUntil===next)return false;
  state.cooldownUntil=next;
  emit("conversation:advanced",{threadId,kind:"cooldown",untilAbsolute:next});
  return true;
}

export function getThreadState(threadId){return {...ensureThreadState(threadId)};}

export function makeChoice(choiceId){
  const s=getState();
  if(s.communications.choicesMade.includes(choiceId))return {ok:false,message:"Already answered."};

  const match=threadForChoice(choiceId);
  const option=match?.message.choice?.options?.find(x=>x.id===choiceId)||null;
  if(!option)return {ok:false,message:"Choice unavailable."};

  s.communications.choicesMade.push(choiceId);
  setFlag(`choice_${choiceId}`);
  for(const flag of option.setFlags||[])setFlag(flag);

  if(option.relationship){
    for(const [npc,amount] of Object.entries(option.relationship)){
      s.player.relationships[npc]=(s.player.relationships[npc]||0)+amount;
    }
  }

  const threadState=ensureThreadState(match.thread.id);
  threadState.lastChoiceId=choiceId;
  threadState.lastChoiceAt=absoluteNow();
  threadState.waitingForReply=null;

  learn(`dialogue:${choiceId}`,"social");
  emit("dialogue:choice",{choiceId,threadId:match.thread.id,messageId:match.message.id});
  emit("communications:changed",{choiceId,threadId:match.thread.id});
  emit("conversation:advanced",{threadId:match.thread.id,messageId:match.message.id,choiceId,kind:"choice"});
  return {ok:true};
}

export function choiceMade(choiceId){
  return getState().communications.choicesMade.includes(choiceId);
}

export function initCommunications(){
  if(initialized)return;initialized=true;
  on("content:delivered",({definition,deliveredAt})=>{
    if(definition?.kind!=="message"||!definition.threadId||!definition.itemId)return;
    const state=ensureThreadState(definition.threadId);
    const absolute=Number(deliveredAt?.absolute);
    state.lastDeliveredNode=definition.itemId;
    state.lastDeliveryAt=Number.isFinite(absolute)?absolute:absoluteNow();
    emit("conversation:advanced",{threadId:definition.threadId,messageId:definition.itemId,kind:"delivered"});
  });
}

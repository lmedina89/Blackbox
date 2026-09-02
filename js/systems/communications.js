import { THREADS } from "../data/messages.js";
import { getState, setFlag } from "../core/state.js";
import { emit } from "../core/events.js";
import { learn } from "./progression.js";

export function makeChoice(choiceId){
  const s=getState();
  if(s.communications.choicesMade.includes(choiceId))return {ok:false,message:"Already answered."};

  let option=null;
  for(const thread of THREADS){
    for(const message of thread.messages){
      option=message.choice?.options?.find(x=>x.id===choiceId);
      if(option)break;
    }
    if(option)break;
  }
  if(!option)return {ok:false,message:"Choice unavailable."};

  s.communications.choicesMade.push(choiceId);
  setFlag(`choice_${choiceId}`);
  for(const flag of option.setFlags||[])setFlag(flag);

  if(option.relationship){
    for(const [npc,amount] of Object.entries(option.relationship)){
      s.player.relationships[npc]=(s.player.relationships[npc]||0)+amount;
    }
  }

  learn(`dialogue:${choiceId}`,"social");
  emit("dialogue:choice",{choiceId});
  emit("communications:changed",{choiceId});
  return {ok:true};
}

export function choiceMade(choiceId){
  return getState().communications.choicesMade.includes(choiceId);
}

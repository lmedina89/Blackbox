import { getState, setFlag } from "../core/state.js";
import { emit } from "../core/events.js";

export function applyChatChoice(threadId,choiceId,option){
  const s=getState();
  s.world.chatChoices ??= {};
  if(s.world.chatChoices[choiceId])return false;
  s.world.chatChoices[choiceId]={threadId,optionId:option.id,playerText:option.playerText||option.label};
  for(const flag of option.flags||[])setFlag(flag);
  for(const [npc,delta] of Object.entries(option.relationship||{})){
    s.player.relationships ??= {};
    s.player.relationships[npc]=(s.player.relationships[npc]||0)+Number(delta||0);
  }
  emit("chat:choice",{threadId,choiceId,optionId:option.id,target:option.eventTarget||choiceId});
  return true;
}

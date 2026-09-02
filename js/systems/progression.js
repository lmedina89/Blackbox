import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

const LABELS={systems:"Systems",network:"Network",analysis:"Analysis",social:"Social"};
export function learn(action,skill,amount=1){
  const s=getState();
  s.player.learnedActions ??=[];
  s.player.proficiencies ??={systems:0,network:0,analysis:0,social:0};
  if(s.player.learnedActions.includes(action))return false;
  s.player.learnedActions.push(action);
  const before=s.player.proficiencies[skill]||0;
  const beforeLevel=proficiencyLabel(before);
  s.player.proficiencies[skill]=before+amount;
  const value=s.player.proficiencies[skill],afterLevel=proficiencyLabel(value);
  emit("proficiency:changed",{skill,label:LABELS[skill],value,amount,action,beforeLevel,afterLevel,milestone:beforeLevel!==afterLevel});
  return true;
}
export function proficiencyLabel(value){
  if(value>=8)return "Practiced";
  if(value>=4)return "Familiar";
  if(value>=1)return "Learning";
  return "Novice";
}

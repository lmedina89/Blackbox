import { HARDWARE } from "../data/hardware.js";
import { getState, addCredits } from "../core/state.js";
import { emit } from "../core/events.js";

export function buyHardware(id){
  const item=HARDWARE.find(x=>x.id===id);
  if(!item) return {ok:false,message:"Item not found."};
  const s=getState();
  if(s.player.installedHardware.includes(id)) return {ok:false,message:"Already installed."};
  if(s.player.credits<item.price) return {ok:false,message:"Not enough credits."};
  addCredits(-item.price);
  s.player.installedHardware.push(id);
  emit("hardware:purchased",{item});
  return {ok:true,message:`Installed ${item.name}.`};
}

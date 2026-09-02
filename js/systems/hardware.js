import { HARDWARE } from "../data/hardware.js";
import { getState, addCredits } from "../core/state.js";
import { emit } from "../core/events.js";
import { SOFTWARE } from "../data/software.js";

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

export function buySoftware(id){
  const item=SOFTWARE.find(x=>x.id===id);if(!item)return {ok:false,message:"Software not found."};
  const s=getState();s.player.installedSoftware??=["resolver_basic"];
  if(s.player.installedSoftware.includes(id))return {ok:false,message:"Already installed."};
  const missing=(item.requires||[]).filter(req=>!s.player.installedHardware.includes(req)&&!s.player.installedSoftware.includes(req));
  if(missing.length)return {ok:false,message:"Required hardware/software is not installed."};
  if(s.player.credits<item.price)return {ok:false,message:"Not enough credits."};
  addCredits(-item.price);s.player.installedSoftware.push(id);emit("software:purchased",{item});
  return {ok:true,message:`Installed ${item.name}.`};
}

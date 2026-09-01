import { getState } from "./state.js";
import { emit } from "./events.js";

let timer=null;

export function startClock(){
  stopClock();
  timer=setInterval(()=>{
    const s=getState();
    s.world.minute+=1;
    if(s.world.minute>=1440){ s.world.minute=0; s.world.day+=1; }
    emit("clock:tick",{minute:s.world.minute,day:s.world.day});
  },60000);
}

export function stopClock(){ if(timer){clearInterval(timer);timer=null;} }

export function formatClock(){
  const {minute,day}=getState().world;
  const h=Math.floor(minute/60)%24;
  const m=minute%60;
  return {time:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`,date:`DAY ${day}`};
}

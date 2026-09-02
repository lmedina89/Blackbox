import { MISSIONS } from "../data/missions.js";
import { getState, setFlag, addCredits } from "../core/state.js";
import { on, emit } from "../core/events.js";

function mission(id){return MISSIONS.find(m=>m.id===id);}
function startFor(type,target){
  for(const m of MISSIONS)if(m.startWhen?.type===type && m.startWhen?.target===target)startMission(m.id);
}
export function initMissions(){
  on("email:read",({emailId})=>startFor("email_read",emailId));
  on("chat:choice",({target})=>startFor("chat_choice",target));
  on("forum:read",({postId})=>recordObjective("forum_read",postId));
  on("host:connected",({hostId})=>recordObjective("host_connected",hostId));
  on("file:read",({hostId,path})=>recordObjective("file_read",`${hostId}:${path}`));
}
export function startMission(id){
  const s=getState(),m=mission(id);
  if(!m||s.missions.active.includes(id)||s.world.completedMissions.includes(id))return;
  s.missions.active.push(id);s.missions.progress[id]={};
  for(const f of m.flagsOnStart||[])setFlag(f);
  emit("mission:started",{mission:m});
}
function recordObjective(type,target){
  const s=getState();
  for(const id of [...s.missions.active]){
    const m=mission(id);if(!m)continue;
    const obj=m.objectives.find(o=>o.type===type&&o.target===target);if(!obj)continue;
    s.missions.progress[id]??={};s.missions.progress[id][obj.id]=true;
    emit("mission:progress",{mission:m,objective:obj});
    if(m.objectives.every(o=>s.missions.progress[id]?.[o.id]))completeMission(id);
  }
}
function completeMission(id){
  const s=getState(),m=mission(id);if(!m)return;
  s.missions.active=s.missions.active.filter(x=>x!==id);
  if(!s.world.completedMissions.includes(id))s.world.completedMissions.push(id);
  for(const f of m.flagsOnComplete||[])setFlag(f);
  addCredits(m.rewards?.credits||0);s.player.reputation+=(m.rewards?.reputation||0);
  emit("mission:completed",{mission:m});
}
export function missionView(){
  const s=getState();return s.missions.active.map(id=>{const m=mission(id);return {...m,progress:s.missions.progress[id]||{}};});
}

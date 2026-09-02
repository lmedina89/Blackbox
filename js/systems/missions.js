import { MISSIONS } from "../data/missions.js";
import { getState, setFlag, addCredits } from "../core/state.js";
import { on, emit } from "../core/events.js";
import { autoSaveSeenTargetsForMission } from "./targets.js";

function mission(id){return MISSIONS.find(m=>m.id===id);}
function startByEvent(eventName,target){
  for(const m of MISSIONS){
    if(m.startWhen?.event!==eventName)continue;
    const allowed=String(m.startWhen.target||"").split("|");
    if(allowed.includes(String(target)))startMission(m.id);
  }
}
export function initMissions(){
  on("email:read",({emailId})=>{startByEvent("email:read",emailId);recordObjective("email_read",emailId);});
  on("forum:read",({postId})=>{startByEvent("forum:read",postId);recordObjective("forum_read",postId);});
  on("social:read",({postId})=>{startByEvent("social:read",postId);recordObjective("social_read",postId);});
  on("dialogue:choice",({choiceId})=>{startByEvent("dialogue:choice",choiceId);recordObjective("dialogue_choice",choiceId);});
  on("threat:read",({threatId})=>{startByEvent("threat:read",threatId);recordObjective("threat_read",threatId);});
  on("dns:lookup",({dnsName})=>recordObjective("dns_lookup",dnsName));
  on("lab:completed",({labId})=>recordObjective("lab_completed",labId));
  on("host:connected",({hostId})=>recordObjective("host_connected",hostId));
  on("file:read",({hostId,path})=>recordObjective("file_read",`${hostId}:${path}`));
  on("file:downloaded",({hostId,path})=>recordObjective("file_downloaded",`${hostId}:${path}`));
  on("file:searched",({hostId,path,query})=>recordObjective("file_searched",`${hostId}:${path}:${query}`));
  on("command:used",({name,hostId})=>{recordObjective("command_used",name);recordObjective("command_used_at",`${hostId}:${name}`);});
}
export function startMission(id){
  const s=getState(),m=mission(id);
  if(!m||s.missions.active.includes(id)||s.world.completedMissions.includes(id))return;
  s.missions.active.push(id);s.missions.progress[id]={};
  for(const f of m.flagsOnStart||[])setFlag(f);
  autoSaveSeenTargetsForMission(m);
  emit("mission:started",{mission:m});
}
function recordObjective(type,target){
  const s=getState();
  for(const id of [...s.missions.active]){
    const m=mission(id);if(!m)continue;
    for(const obj of m.objectives.filter(o=>o.type===type&&o.target===target)){
      s.missions.progress[id]??={};
      if(s.missions.progress[id][obj.id])continue;
      s.missions.progress[id][obj.id]=true;
      emit("mission:progress",{mission:m,objective:obj});
    }
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
export function missionView(){const s=getState();return s.missions.active.map(id=>{const m=mission(id);return {...m,progress:s.missions.progress[id]||{}};});}

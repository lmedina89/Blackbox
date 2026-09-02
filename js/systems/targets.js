import { HOSTS } from "../data/hosts.js";
import { MISSIONS } from "../data/missions.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

function missionHostIds(mission){
  const ids=new Set();
  for(const obj of mission?.objectives||[]){
    const raw=String(obj.target||"");
    for(const id of Object.keys(HOSTS)){
      if(raw===id||raw.startsWith(`${id}:`))ids.add(id);
    }
  }
  return [...ids];
}

export function activeMissionForHost(hostId){
  const s=getState();
  for(const id of s.missions.active||[]){
    const m=MISSIONS.find(x=>x.id===id);
    if(m&&missionHostIds(m).includes(hostId))return m;
  }
  return null;
}

export function saveTarget(hostId,{source="manual",missionId=null}={}){
  const s=getState();
  if(!HOSTS[hostId]||hostId==="home")return {ok:false,message:"target: invalid host"};
  s.player.savedTargets ??=[];
  const existing=s.player.savedTargets.find(x=>x.hostId===hostId);
  if(existing){
    if(source==="mission"){
      existing.source="mission";
      existing.missionId=missionId||existing.missionId;
    }
    return {ok:true,added:false,target:existing};
  }
  const entry={hostId,source,missionId,savedAt:Date.now()};
  s.player.savedTargets.push(entry);
  emit("target:saved",{target:entry,host:HOSTS[hostId]});
  return {ok:true,added:true,target:entry};
}

export function autoSaveMissionTarget(hostId){
  const m=activeMissionForHost(hostId);
  if(!m)return {ok:false,added:false};
  return saveTarget(hostId,{source:"mission",missionId:m.id});
}

export function autoSaveSeenTargetsForMission(mission){
  const s=getState(),seen=new Set(s.player.seenHosts||[]);
  for(const hostId of missionHostIds(mission)){
    if(seen.has(hostId))saveTarget(hostId,{source:"mission",missionId:mission.id});
  }
}

export function removeTarget(index){
  const s=getState();
  s.player.savedTargets ??=[];
  if(!Number.isInteger(index)||index<0||index>=s.player.savedTargets.length)return null;
  const [removed]=s.player.savedTargets.splice(index,1);
  emit("target:removed",{target:removed});
  return removed;
}

export function getSavedTargets(){return getState().player.savedTargets||[];}
export function missionTitle(missionId){return MISSIONS.find(m=>m.id===missionId)?.title||null;}

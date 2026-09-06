import { HOSTS } from "../data/hosts.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";
import { MISSIONS } from "../data/missions.js";
import { accessModel, getEstablishedSession, universeOf } from "./intrusion.js";

export function isIdentified(id){
  const s=getState(),h=HOSTS[id];
  if(!h)return false;
  if(h.identity==="known"||id==="home")return true;
  return (s.player.identifiedHosts||[]).includes(id);
}

export function identifyHost(id){
  const s=getState();
  if(!HOSTS[id])return false;
  s.player.identifiedHosts ??= ["home"];
  if(!s.player.identifiedHosts.includes(id))s.player.identifiedHosts.push(id);
  return true;
}

export function displayName(id){
  return isIdentified(id)?HOSTS[id]?.hostname||"UNKNOWN":"UNKNOWN";
}

function hash(value){
  let h=2166136261;
  for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return h>>>0;
}

function available(host,s){
  const flags=new Set(s.world.flags||[]);
  if((host.visibleWhen||[]).some(x=>!flags.has(x)))return false;
  if((host.hiddenWhen||[]).some(x=>flags.has(x)))return false;
  return true;
}

function effectiveRoutes(current,s){
  const sandbox=s.intrusion?.activeSandbox;
  if(sandbox?.universe&&sandbox.universe!=="campaign"){
    if(current.id==="home"){
      const explicit=(sandbox.targetIds||[]).filter(id=>HOSTS[id]&&universeOf(HOSTS[id])===sandbox.universe);
      if(explicit.length)return explicit;
      return (current.routes||[]).filter(id=>HOSTS[id]&&universeOf(HOSTS[id])===sandbox.universe);
    }
    return (current.routes||[]).filter(id=>HOSTS[id]&&universeOf(HOSTS[id])===sandbox.universe);
  }
  return current.routes||[];
}

function activeMissionHosts(s){
  const ids=new Set();
  for(const missionId of s.missions.active||[]){
    const mission=MISSIONS.find(x=>x.id===missionId);if(!mission)continue;
    const progress=s.missions.progress[missionId]||{};
    for(const objective of mission.objectives||[]){
      if(progress[objective.id])continue;
      const raw=String(objective.target||"");
      const hostId=Object.keys(HOSTS).find(id=>raw===id||raw.startsWith(`${id}:`));
      if(hostId)ids.add(hostId);
      // A scan objective and the host it is meant to reveal happen in the same
      // command, so allow the immediately following host objective to be pinned.
      if(!hostId&&((objective.type==="command_used"&&raw==="scan")||(objective.type==="command_used_at"&&raw.endsWith(":scan"))))continue;
      break;
    }
  }
  return ids;
}

export function scan(){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  const isolatedUniverse=s.intrusion?.activeSandbox?.universe||((universeOf(current)!=="campaign")?universeOf(current):null);
  const routes=effectiveRoutes(current,s).filter(id=>HOSTS[id]&&available(HOSTS[id],s)&&(!isolatedUniverse||universeOf(HOSTS[id])===isolatedUniverse));
  s.world.scanCounters??={};
  const count=(s.world.scanCounters[current.id]||0)+1;
  s.world.scanCounters[current.id]=count;
  const missionHosts=activeMissionHosts(s);
  const pinned=routes.filter(id=>missionHosts.has(id)||HOSTS[id].visibility==="essential");
  const base=current.id==="home"?7:6;
  const detail=s.player.installedHardware.includes("nic_fast")?2:0;
  const suite=(s.player.installedSoftware||[]).includes("scan_suite")?2:0;
  const limit=Math.max(pinned.length,Math.min(routes.length,base+detail+suite));
  const seed=`${s.meta.identityId}|${current.id}|${s.world.networkEpoch||0}`;
  const pool=routes.filter(id=>!pinned.includes(id)).sort((a,b)=>hash(`${seed}|member|${a}`)-hash(`${seed}|member|${b}`));
  const selected=[...new Set([...pinned,...pool.slice(0,Math.max(0,limit-pinned.length))])];
  return selected.sort((a,b)=>hash(`${seed}|order|${count}|${a}`)-hash(`${seed}|order|${count}|${b}`)).map(id=>HOSTS[id]);
}

export function canReach(targetId){
  const s=getState(),current=HOSTS[s.terminal.hostId],target=HOSTS[targetId];
  if(!current||!target)return false;
  const isolatedUniverse=s.intrusion?.activeSandbox?.universe||((universeOf(current)!=="campaign")?universeOf(current):null);
  if(isolatedUniverse&&universeOf(target)!==isolatedUniverse)return false;
  return targetId==="home" ? s.terminal.hostId==="home" : effectiveRoutes(current,s).includes(targetId);
}

export function connect(target){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  const wanted=Object.values(HOSTS).find(h=>h.id.toLowerCase()===String(target).toLowerCase()||h.hostname.toLowerCase()===String(target).toLowerCase()||h.address===String(target));
  if(!wanted)throw new Error("Host not found");
  if(wanted.id===current.id)throw new Error("connect: target resolves to current host");
  if(!available(wanted,s))throw new Error("Host is not currently available in the simulated network");
  if(!canReach(wanted.id))throw new Error("No route to host");
  if(wanted.connectable===false)throw new Error("Connection refused. Remote shell service unavailable.");
  const advanced=accessModel(wanted)==="advanced";
  const accessSession=advanced?getEstablishedSession(wanted.id):null;
  if(advanced&&!accessSession)throw new Error(`ACCESS DENIED\nNo authenticated BLACKBOX session is available for ${wanted.hostname}.\nEnumerate exposed services, recover valid access, or establish a simulated foothold first.`);
  s.terminal.hostId=wanted.id;
  s.terminal.lastScanResults=[];
  s.terminal.accessSessionId=accessSession?.id||null;
  s.terminal.user=accessSession?.user||wanted.access?.mode||"guest";
  s.terminal.cwd=wanted.homeDir||"/";
  emit("host:connected",{hostId:wanted.id,fromHostId:current.id,universe:universeOf(wanted)});
  return wanted;
}

export function disconnect(){
  const s=getState();
  s.terminal.hostId="home";
  s.terminal.lastScanResults=[];
  s.terminal.accessSessionId=null;
  s.terminal.user=s.player.alias||"user";
  s.terminal.cwd=HOSTS.home.homeDir||"/home";
  emit("host:connected",{hostId:"home",universe:"campaign"});
}

export function resolveTarget(target){
  return Object.values(HOSTS).find(h=>h.id.toLowerCase()===String(target).toLowerCase()||h.hostname.toLowerCase()===String(target).toLowerCase()||h.address===String(target));
}

import { HOSTS } from "../data/hosts.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

export function isIdentified(id){
  const s=getState(),h=HOSTS[id];
  if(!h)return false;
  if(h.identity==="known"||id==="home")return true;
  if((s.player.identifiedHosts||[]).includes(id))return true;
  const knowledge={
    archives01:()=>s.world.readForumPosts.includes("f1")||s.world.flags.includes("mission_first_started"),
    mirror02:()=>s.world.readSocialPosts.includes("s5")||s.world.flags.includes("mirror_lead_accepted"),
    meridian01:()=>s.world.readForumPosts.includes("f4")||s.world.flags.includes("mission_recovery_started"),
    helixedge:()=>s.world.flags.includes("mission_route_started"),
    helixlog:()=>s.world.flags.includes("mission_ghost_started")||s.world.flags.includes("mission_route_started"),
    axiomrelay:()=>s.world.readForumPosts.includes("f6")||s.world.flags.includes("mission_deaddrop_started")
  };
  return knowledge[id]?.()||false;
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

export function scan(){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  return (current.routes||[]).map(id=>HOSTS[id]).filter(Boolean);
}

export function canReach(targetId){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  return targetId==="home" ? s.terminal.hostId==="home" : (current.routes||[]).includes(targetId);
}

export function connect(target){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  const wanted=Object.values(HOSTS).find(h=>h.id.toLowerCase()===String(target).toLowerCase()||h.hostname.toLowerCase()===String(target).toLowerCase()||h.address===String(target));
  if(!wanted)throw new Error("Host not found");
  if(wanted.id===current.id)throw new Error("connect: target resolves to current host");
  if(!canReach(wanted.id))throw new Error("No route to host");
  if(wanted.connectable===false)throw new Error("Connection refused. Remote shell service unavailable.");
  s.terminal.hostId=wanted.id;
  s.terminal.user=wanted.access?.mode||"guest";
  s.terminal.cwd=wanted.homeDir||"/";
  emit("host:connected",{hostId:wanted.id,fromHostId:current.id});
  return wanted;
}

export function disconnect(){
  const s=getState();
  s.terminal.hostId="home";
  s.terminal.user=s.player.alias||"user";
  s.terminal.cwd=HOSTS.home.homeDir||"/home";
  emit("host:connected",{hostId:"home"});
}

export function resolveTarget(target){
  return Object.values(HOSTS).find(h=>h.id.toLowerCase()===String(target).toLowerCase()||h.hostname.toLowerCase()===String(target).toLowerCase()||h.address===String(target));
}

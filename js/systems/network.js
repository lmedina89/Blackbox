import { HOSTS } from "../data/hosts.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

function unlocked(id){
  const s=getState();
  if(id==="home")return true;
  const conditions={
    archives01:()=>s.player.discoveredHosts.includes("archives01")||s.world.readForumPosts.includes("f1")||s.world.flags.includes("mission_first_started"),
    mirror02:()=>s.player.discoveredHosts.includes("mirror02")||s.world.readSocialPosts.includes("s5"),
    meridian01:()=>s.player.discoveredHosts.includes("meridian01")||s.world.readForumPosts.includes("f4"),
    helixedge:()=>s.player.discoveredHosts.includes("helixedge")||s.world.flags.includes("mission_route_started"),
    helixlog:()=>s.terminal.hostId==="helixedge"||s.player.discoveredHosts.includes("helixlog"),
    axiomrelay:()=>s.player.discoveredHosts.includes("axiomrelay")||s.world.readForumPosts.includes("f6")
  };
  return conditions[id]?.()||false;
}

export function scan(){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  const ids=current.routes||[];
  return ids.map(id=>HOSTS[id]).filter(Boolean).filter(h=>unlocked(h.id));
}

export function canReach(targetId){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  return targetId==="home" ? s.terminal.hostId==="home" : (current.routes||[]).includes(targetId)&&unlocked(targetId);
}

export function connect(target){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  const wanted=Object.values(HOSTS).find(h=>h.id.toLowerCase()===String(target).toLowerCase()||h.hostname.toLowerCase()===String(target).toLowerCase()||h.address===String(target));
  if(!wanted)throw new Error("Host not found");
  if(wanted.id===current.id)throw new Error("connect: target resolves to current host");
  if(!canReach(wanted.id))throw new Error("No route to host");
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

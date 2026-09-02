import { HOSTS } from "../data/hosts.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

function routeVisible(hostId){
  const s=getState();
  if(hostId==="home")return true;
  if(hostId==="archives01")return s.player.discoveredHosts.includes("archives01")||
    s.world.readForumPosts.includes("f1")||s.world.flags.includes("mission_first_started");
  if(hostId==="mirror02")return s.player.discoveredHosts.includes("mirror02")||
    s.world.readSocialPosts.includes("s5");
  return false;
}

export function scan(){
  return Object.values(HOSTS).filter(h=>routeVisible(h.id));
}

export function connect(target){
  const wanted=Object.values(HOSTS).find(h=>
    h.id.toLowerCase()===String(target).toLowerCase()||
    h.hostname.toLowerCase()===String(target).toLowerCase()||
    h.address===String(target)
  );
  if(!wanted)throw new Error("Host not found");
  if(!routeVisible(wanted.id))throw new Error("No route to host");

  const s=getState();
  if(wanted.id==="home")return wanted;
  s.terminal.hostId=wanted.id;
  s.terminal.user=wanted.access?.mode==="guest"?"guest":"user";
  s.terminal.cwd=wanted.homeDir||"/";
  emit("host:connected",{hostId:wanted.id});
  return wanted;
}

export function disconnect(){
  const s=getState();
  s.terminal.hostId="home";
  s.terminal.user="user";
  s.terminal.cwd=HOSTS.home.homeDir||"/home";
  emit("host:connected",{hostId:"home"});
}

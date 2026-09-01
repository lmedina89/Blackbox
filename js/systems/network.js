import { HOSTS } from "../data/hosts.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

export function scan(){
  const s=getState();
  const visible=[HOSTS.home];
  if(s.world.flags.includes("mission_first_started") || s.world.readForumPosts.includes("f1")) visible.push(HOSTS.archives01);
  return visible;
}

export function connect(target){
  const wanted=Object.values(HOSTS).find(h=>h.id===target || h.hostname.toLowerCase()===target.toLowerCase() || h.address===target);
  if(!wanted) throw new Error("Host not found");
  if(wanted.id==="home") return wanted;
  const s=getState();
  if(!s.world.flags.includes("mission_first_started") && !s.world.readForumPosts.includes("f1")) throw new Error("No route to host");
  s.terminal.hostId=wanted.id;
  s.terminal.user=wanted.access?.mode==="guest"?"guest":"user";
  s.terminal.cwd="/";
  emit("host:connected",{hostId:wanted.id});
  return wanted;
}

export function disconnect(){
  const s=getState();
  s.terminal.hostId="home";
  s.terminal.user="user";
  s.terminal.cwd="/home";
  emit("host:connected",{hostId:"home"});
}

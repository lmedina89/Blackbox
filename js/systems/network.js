import { HOSTS } from "../data/hosts.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

export function rememberHost(hostId){
  const s=getState();s.player.discoveredHosts??=[];
  if(HOSTS[hostId]&&!s.player.discoveredHosts.includes(hostId))s.player.discoveredHosts.push(hostId);
}
export function scan(){
  const s=getState();
  return [HOSTS.home,...(s.player.discoveredHosts||[]).map(id=>HOSTS[id]).filter(Boolean)];
}
export function resolveTarget(target){
  const s=getState(),raw=String(target??"").trim();
  if(/^\d+$/.test(raw)){
    const hostId=(s.player.discoveredHosts||[])[Number(raw)];
    if(hostId&&HOSTS[hostId])return HOSTS[hostId];
  }
  const lower=raw.toLowerCase();
  return Object.values(HOSTS).find(h=>h.id.toLowerCase()===lower||h.hostname.toLowerCase()===lower||h.address===raw)||null;
}
export function connect(target){
  const wanted=resolveTarget(target);if(!wanted)throw new Error("Host not found");
  if(wanted.id==="home")return wanted;
  const s=getState();
  if(!(s.player.discoveredHosts||[]).includes(wanted.id))throw new Error("No route to host. Discover it first.");
  s.terminal.hostId=wanted.id;s.terminal.user=wanted.access?.mode==="guest"?"guest":"user";s.terminal.cwd="/";
  emit("host:connected",{hostId:wanted.id});return wanted;
}
export function disconnect(){
  const s=getState();s.terminal.hostId="home";s.terminal.user="user";s.terminal.cwd="/home";emit("host:connected",{hostId:"home"});
}

import { CLUES } from "../data/clues.js";
import { getState } from "../core/state.js";
import { on, emit } from "../core/events.js";
import { identifyHost } from "./network.js";
import { autoSaveMissionTarget } from "./targets.js";
import { HOSTS } from "../data/hosts.js";

function HOST_KNOWN(hostId,state){
  return HOSTS[hostId]?.identity==="known"||(state.player.identifiedHosts||[]).includes(hostId);
}

function discover(clue){
  const s=getState();
  if(s.player.discoveredClues.includes(clue.id))return false;
  if(clue.kind==="world"&&clue.hostId){
    const duplicate=s.player.discoveredClues.map(id=>CLUES.find(c=>c.id===id)).find(c=>c?.kind==="world"&&c.hostId===clue.hostId);
    if(duplicate){
      identifyHost(clue.hostId);
      return false;
    }
  }
  s.player.discoveredClues.push(clue.id);
  if(clue.hostId){
    discoverHost(clue.hostId);
    identifyHost(clue.hostId);
    autoSaveMissionTarget(clue.hostId);
  }
  emit("clue:discovered",{clue});
  return true;
}

export function initClues(){
  const events=[...new Set(CLUES.map(c=>c.discoverOn?.event).filter(Boolean))];
  for(const eventName of events){
    on(eventName,payload=>{
      const target=payload.postId ?? payload.newsId ?? payload.messageId ?? payload.emailId ?? payload.choiceId ?? payload.threatId ?? payload.dnsName ??
        (payload.hostId&&payload.path&&payload.query?`${payload.hostId}:${payload.path}:${payload.query}`:payload.hostId&&payload.path?`${payload.hostId}:${payload.path}`:payload.hostId);
      for(const clue of CLUES){
        if(clue.discoverOn?.event===eventName && clue.discoverOn.target===target)discover(clue);
      }
    });
  }
}

export function discoverHost(hostId){
  const s=getState();
  s.player.seenHosts ??=[];
  if(!s.player.seenHosts.includes(hostId))s.player.seenHosts.push(hostId);
  // discoveredHosts is legacy compatibility state. New discovery lives in seenHosts.
  autoSaveMissionTarget(hostId);
}

export function getKnownClues(){
  const s=getState();
  return s.player.discoveredClues.map(id=>CLUES.find(c=>c.id===id)).filter(Boolean);
}

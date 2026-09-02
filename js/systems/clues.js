import { CLUES } from "../data/clues.js";
import { getState } from "../core/state.js";
import { on, emit } from "../core/events.js";

function discover(clue){
  const s=getState();
  if(s.player.discoveredClues.includes(clue.id))return false;
  s.player.discoveredClues.push(clue.id);
  if(clue.hostId && !s.player.discoveredHosts.includes(clue.hostId)){
    s.player.discoveredHosts.push(clue.hostId);
  }
  emit("clue:discovered",{clue});
  return true;
}

export function initClues(){
  const events=[...new Set(CLUES.map(c=>c.discoverOn?.event).filter(Boolean))];
  for(const eventName of events){
    on(eventName,payload=>{
      const target=payload.postId ?? payload.emailId ?? payload.choiceId ??
        (payload.hostId&&payload.path?`${payload.hostId}:${payload.path}`:payload.hostId);
      for(const clue of CLUES){
        if(clue.discoverOn?.event===eventName && clue.discoverOn.target===target)discover(clue);
      }
    });
  }
}

export function discoverHost(hostId){
  const s=getState();
  if(!s.player.discoveredHosts.includes(hostId))s.player.discoveredHosts.push(hostId);
}

export function getKnownClues(){
  const s=getState();
  return s.player.discoveredClues.map(id=>CLUES.find(c=>c.id===id)).filter(Boolean);
}

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

function eventTarget(payload){
  const query=payload.canonicalQuery??payload.query;
  return payload.postId ?? payload.newsId ?? payload.messageId ?? payload.emailId ?? payload.choiceId ?? payload.threatId ?? payload.dnsName ??
    (payload.hostId&&payload.path&&query?`${payload.hostId}:${payload.path}:${query}`:payload.hostId&&payload.path?`${payload.hostId}:${payload.path}`:payload.hostId);
}

function payloadSupports(clue,payload){
  const requiredHost=clue.discoverOn?.requiresHostId;
  if(requiredHost&&!(payload.hostIds||[]).includes(requiredHost))return false;
  return true;
}

export function initClues(){
  const events=[...new Set(CLUES.map(c=>c.discoverOn?.event).filter(Boolean))];
  for(const eventName of events){
    on(eventName,payload=>{
      const target=eventTarget(payload);
      for(const clue of CLUES){
        if(clue.discoverOn?.event!==eventName||clue.discoverOn.target!==target)continue;
        if(!payloadSupports(clue,payload))continue;
        discover(clue);
      }
    });
  }
}

// Legacy migrations can intentionally suppress historical unread badges. If a
// clue-bearing message was marked read before the clue system existed, opening
// that visible thread still teaches the information the player can now see.
export function reconcilePresentedMessageClues(messageId){
  let changed=false;
  for(const clue of CLUES){
    if(clue.discoverOn?.event==="message:read"&&clue.discoverOn.target===messageId){
      changed=discover(clue)||changed;
    }
  }
  return changed;
}

export function discoverHost(hostId){
  const s=getState();
  s.player.seenHosts ??=[];
  if(!s.player.seenHosts.includes(hostId))s.player.seenHosts.push(hostId);
  autoSaveMissionTarget(hostId);
}

export function getKnownClues(){
  const s=getState();
  return s.player.discoveredClues.map(id=>CLUES.find(c=>c.id===id)).filter(Boolean);
}

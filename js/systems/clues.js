import { CLUES } from "../data/clues.js";
import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

export function discoverClue(clueId,source="unknown"){
  const clue=CLUES[clueId];
  if(!clue)return null;
  const s=getState();
  s.player.discoveredClues ??= [];
  s.player.discoveredHosts ??= [];
  const isNew=!s.player.discoveredClues.includes(clueId);
  if(isNew)s.player.discoveredClues.push(clueId);
  if(clue.hostId && !s.player.discoveredHosts.includes(clue.hostId))s.player.discoveredHosts.push(clue.hostId);
  if(isNew)emit("clue:discovered",{clue,source});
  return clue;
}

export function discoveredClues(){
  const s=getState();
  return (s.player.discoveredClues||[]).map(id=>CLUES[id]).filter(Boolean);
}

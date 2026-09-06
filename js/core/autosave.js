import { on } from "./events.js";
import { saveGame } from "./save.js";

export const AUTOSAVE_EVENTS=[
  "mission:started","mission:completed","mission:progress",
  "hardware:purchased","software:purchased","clue:discovered",
  "dialogue:choice","proficiency:changed","file:downloaded",
  "target:saved","target:removed","clock:tick","timeline:event",
  "dns:lookup","threat:read","lab:completed","email:read",
  "forum:read","social:read","news:read","message:read","thread:read",
  "host:connected","command:committed","notes:changed","browser:navigated",
  "timeline:scheduled","content:delivered","content:cancelled","content:expired","content:replaced",
  "conversation:advanced","helpdesk:changed","training:attempted","behavior:decision","ui:terminal-input-mode","ui:nexus-input-mode","nexus:system-changed",
  "nightwire:changed","range:started","range:reset","range:aborted","range:completed"
];

let initialized=false;

export function initAutosave(){
  if(initialized)return;
  initialized=true;
  for(const eventName of AUTOSAVE_EVENTS)on(eventName,()=>saveGame());
}

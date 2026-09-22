import { getState } from "../core/state.js";
import { on } from "../core/events.js";
import { SERVICE_DESK_TICKET_MAP } from "../data/serviceDesk.js";
import { WORLD_REGISTRY_VERSION, getWorldEntity, resolveWorldEntity } from "../data/worldRegistry.js";

const MAX_RECENT=64;
const MAX_SOURCES=8;
let initialized=false;

function absoluteNow(){
  const s=getState();
  return Math.max(0,((s.world.day||1)-1)*1440+(s.world.minute||0));
}

function ensureState(){
  const s=getState();
  if(!s.world.consistency||typeof s.world.consistency!=="object"||Array.isArray(s.world.consistency))s.world.consistency={};
  const c=s.world.consistency;
  c.registryVersion=WORLD_REGISTRY_VERSION;
  if(!c.seen||typeof c.seen!=="object"||Array.isArray(c.seen))c.seen={};
  if(!Array.isArray(c.recent))c.recent=[];
  c.recent=c.recent.filter(item=>item&&typeof item==="object").slice(-MAX_RECENT);
  return c;
}

function stamp(){
  const s=getState();
  return {day:s.world.day,minute:s.world.minute,absolute:absoluteNow()};
}

export function observeWorldEntity(entityRef,source="world"){
  const entity=getWorldEntity(entityRef)||resolveWorldEntity(entityRef);
  if(!entity)return null;
  const c=ensureState(),now=stamp();
  const prior=c.seen[entity.id]&&typeof c.seen[entity.id]==="object"?c.seen[entity.id]:null;
  const sources=[...new Set([...(Array.isArray(prior?.sources)?prior.sources:[]),String(source||"world")])].slice(-MAX_SOURCES);
  c.seen[entity.id]={
    firstSeenAt:prior?.firstSeenAt??now.absolute,
    lastSeenAt:now.absolute,
    sources
  };
  if(!prior){
    c.recent.push({entityId:entity.id,source:String(source||"world"),...now});
    if(c.recent.length>MAX_RECENT)c.recent.splice(0,c.recent.length-MAX_RECENT);
  }
  return entity;
}

export function worldConsistencySnapshot(){
  const c=ensureState();
  return {
    registryVersion:c.registryVersion,
    seen:{...c.seen},
    recent:c.recent.map(item=>({...item}))
  };
}

function observeSupportTicket(ticketId,source){
  const ticket=SERVICE_DESK_TICKET_MAP[ticketId];
  if(!ticket)return;
  const machine=observeWorldEntity(`support-machine:${ticket.machineId}`,source);
  if(machine?.assignedPersonId)observeWorldEntity(machine.assignedPersonId,source);
}

export function initWorldConsistency(){
  ensureState();
  observeWorldEntity("host:home","nexus:session");
  if(initialized)return worldConsistencySnapshot();
  initialized=true;

  on("host:connected",({hostId})=>observeWorldEntity(`host:${hostId}`,"blackbox:connect"));
  on("target:saved",({target})=>observeWorldEntity(`host:${target?.hostId}`,"blackbox:target"));
  on("helpdesk:changed",({ticketId,type})=>observeSupportTicket(ticketId,`helpdesk:${type||"activity"}`));
  on("message:read",({threadId})=>observeWorldEntity(`person:${threadId}`,"nexus:messenger"));

  return worldConsistencySnapshot();
}

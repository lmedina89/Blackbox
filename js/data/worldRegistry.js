import { HOSTS } from "./hosts.js";
import { NPCS } from "./npcs.js";
import { REMOTE_MACHINE_TEMPLATES, SERVICE_DESK_TICKETS } from "./serviceDesk.js";

// A4.10.4.0 — canonical, read-only identity layer.
// Gameplay systems keep ownership of mutable state. This registry only answers
// "what is this thing called?" and "which references point to the same thing?"
export const WORLD_REGISTRY_VERSION=1;

const normalizeRef=value=>String(value??"").trim().toLowerCase();
const uniq=values=>[...new Set(values.filter(value=>typeof value==="string"&&value.trim()).map(value=>value.trim()))];

function hostEntity(host){
  return {
    id:`host:${host.id}`,
    kind:"host",
    sourceId:host.id,
    displayName:host.hostname||host.id,
    owner:host.owner||null,
    address:host.address||null,
    os:host.os||null,
    refs:uniq([host.id,host.hostname,host.address,...(host.interfaces||[]).map(item=>item?.address)])
  };
}

function npcEntity(npc){
  return {
    id:`person:${npc.id}`,
    kind:"person",
    sourceId:npc.id,
    displayName:npc.name||npc.id,
    handle:npc.handle||null,
    relationship:npc.relationship||null,
    refs:uniq([npc.id,npc.name,npc.handle])
  };
}

function supportPersonEntity(machine){
  const user=machine.user||{};
  return {
    id:`person:nexus:${user.username}`,
    kind:"employee",
    sourceId:user.username,
    displayName:user.name||user.username,
    username:user.username||null,
    department:user.department||null,
    assignedMachineId:machine.id,
    refs:uniq([user.username,user.name,`NEXUS\\${user.username}`])
  };
}

function supportMachineEntity(machine){
  const user=machine.user||{};
  return {
    id:`support-machine:${machine.id}`,
    kind:"support-machine",
    sourceId:machine.id,
    displayName:machine.hostname||machine.id,
    hostname:machine.hostname||machine.id,
    os:machine.os||null,
    department:user.department||null,
    assignedPersonId:user.username?`person:nexus:${user.username}`:null,
    address:machine.network?.leaseIp||machine.network?.ip||null,
    refs:uniq([machine.id,machine.hostname,machine.network?.leaseIp,machine.network?.ip])
  };
}

const entityList=[
  ...Object.values(HOSTS).map(hostEntity),
  ...Object.values(NPCS).map(npcEntity),
  ...Object.values(REMOTE_MACHINE_TEMPLATES).map(supportPersonEntity),
  ...Object.values(REMOTE_MACHINE_TEMPLATES).map(supportMachineEntity)
];

export const WORLD_ENTITIES=Object.freeze(Object.fromEntries(entityList.map(entity=>[entity.id,Object.freeze(entity)])));

const refIndex=new Map();
for(const entity of entityList){
  for(const ref of entity.refs||[]){
    const key=normalizeRef(ref);
    if(!key)continue;
    const matches=refIndex.get(key)||[];
    if(!matches.includes(entity.id))matches.push(entity.id);
    refIndex.set(key,matches);
  }
}

export function getWorldEntity(id){
  return WORLD_ENTITIES[id]||null;
}

export function resolveWorldEntities(ref){
  const direct=getWorldEntity(String(ref||""));
  if(direct)return [direct];
  return (refIndex.get(normalizeRef(ref))||[]).map(id=>WORLD_ENTITIES[id]).filter(Boolean);
}

export function resolveWorldEntity(ref,{kind=null}={}){
  const matches=resolveWorldEntities(ref);
  if(!kind)return matches.length===1?matches[0]:null;
  const filtered=matches.filter(entity=>entity.kind===kind);
  return filtered.length===1?filtered[0]:null;
}

export function worldRegistryDiagnostics(){
  const issues=[];
  const machineIds=new Set(Object.keys(REMOTE_MACHINE_TEMPLATES));
  for(const ticket of SERVICE_DESK_TICKETS){
    if(!machineIds.has(ticket.machineId))issues.push({code:"orphan-ticket-machine",ticketId:ticket.id,machineId:ticket.machineId});
  }
  for(const [id,machine] of Object.entries(REMOTE_MACHINE_TEMPLATES)){
    if(machine.id!==id)issues.push({code:"machine-id-mismatch",id,templateId:machine.id});
    if(machine.hostname!==id)issues.push({code:"machine-hostname-mismatch",id,hostname:machine.hostname});
    if(!machine.user?.username)issues.push({code:"machine-missing-user",id});
  }
  const addressOwners=new Map();
  for(const host of Object.values(HOSTS)){
    if(!host.address)continue;
    const ids=addressOwners.get(host.address)||[];ids.push(host.id);addressOwners.set(host.address,ids);
  }
  for(const [address,ids] of addressOwners){
    if(ids.length>1)issues.push({code:"duplicate-campaign-address",address,hostIds:ids});
  }
  return {version:WORLD_REGISTRY_VERSION,entityCount:entityList.length,issues};
}

export const HOME_PC_CANONICAL=Object.freeze({
  hostId:"home",
  hostname:HOSTS.home.hostname,
  address:HOSTS.home.address,
  gateway:HOSTS.home.interfaces?.[0]?.gateway||"192.168.1.1"
});

import { getState } from "../core/state.js";
import { emit } from "../core/events.js";
import { advanceElapsedTime } from "./timeline.js";
import { REMOTE_MACHINE_TEMPLATES, SERVICE_DESK_TICKETS, SERVICE_DESK_TICKET_MAP } from "../data/serviceDesk.js";

const clone=value=>JSON.parse(JSON.stringify(value));
const validService=value=>value==="running"||value==="stopped";
const validDevice=value=>value==="enabled"||value==="disabled";
const absoluteNow=()=>{const s=getState();return (s.world.day-1)*1440+s.world.minute;};
const stamp=()=>{const s=getState();return {day:s.world.day,minute:s.world.minute,absolute:absoluteNow()};};
const toolLabels={desktop:"Remote desktop",computer:"My Computer",devices:"Device Manager",network:"Network Connections",services:"Services",events:"Event Viewer",firewall:"Firewall",access:"Users & Groups",command:"Command Prompt"};

function ensureHelpDeskShape(){
  const s=getState();
  if(!s.helpDesk||typeof s.helpDesk!=="object"||Array.isArray(s.helpDesk))s.helpDesk={};
  const hd=s.helpDesk;
  hd.availableTickets=Array.isArray(hd.availableTickets)?[...new Set(hd.availableTickets.filter(x=>typeof x==="string"))]:[];
  hd.activeTickets=Array.isArray(hd.activeTickets)?[...new Set(hd.activeTickets.filter(x=>typeof x==="string"))]:[];
  hd.completedTickets=Array.isArray(hd.completedTickets)?[...new Set(hd.completedTickets.filter(x=>typeof x==="string"))]:[];
  hd.ticketProgress=hd.ticketProgress&&typeof hd.ticketProgress==="object"&&!Array.isArray(hd.ticketProgress)?hd.ticketProgress:{};
  hd.machines=hd.machines&&typeof hd.machines==="object"&&!Array.isArray(hd.machines)?hd.machines:{};
  hd.remoteSession=hd.remoteSession&&typeof hd.remoteSession==="object"&&!Array.isArray(hd.remoteSession)?hd.remoteSession:null;
  hd.job=hd.job&&typeof hd.job==="object"&&!Array.isArray(hd.job)?hd.job:{};
  hd.job.level=Math.max(1,Math.trunc(Number(hd.job.level)||1));
  hd.job.resolved=Math.max(0,Math.trunc(Number(hd.job.resolved)||0));
  hd.job.escalated=Math.max(0,Math.trunc(Number(hd.job.escalated)||0));
  hd.job.score=Math.max(0,Math.trunc(Number(hd.job.score)||0));
  return hd;
}

function mergeMachine(saved,template){
  const raw=saved&&typeof saved==="object"&&!Array.isArray(saved)?saved:{};
  const out=clone(template);
  out.user={...out.user,...(raw.user&&typeof raw.user==="object"?raw.user:{})};
  out.network={...out.network,...(raw.network&&typeof raw.network==="object"?raw.network:{})};
  out.network.adapterEnabled=typeof out.network.adapterEnabled==="boolean"?out.network.adapterEnabled:template.network.adapterEnabled;
  out.network.dhcp=typeof out.network.dhcp==="boolean"?out.network.dhcp:template.network.dhcp;
  out.network.gatewayEditable=typeof out.network.gatewayEditable==="boolean"?out.network.gatewayEditable:!!template.network.gatewayEditable;
  out.network.dns=Array.isArray(out.network.dns)?out.network.dns.filter(x=>typeof x==="string").slice(0,4):[...template.network.dns];
  for(const key of ["ip","subnet","gateway","correctGateway","leaseIp"])if(typeof out.network[key]!=="string")out.network[key]=template.network[key]||"";
  out.network.leaseRenewals=Math.max(0,Math.trunc(Number(out.network.leaseRenewals)||0));
  out.firewall={...out.firewall,...(raw.firewall&&typeof raw.firewall==="object"?raw.firewall:{})};
  out.firewall.rules={...template.firewall.rules,...(raw.firewall?.rules&&typeof raw.firewall.rules==="object"?raw.firewall.rules:{})};
  out.services={...template.services,...(raw.services&&typeof raw.services==="object"?raw.services:{})};
  for(const key of Object.keys(template.services))if(!validService(out.services[key]))out.services[key]=template.services[key];
  out.devices={...template.devices,...(raw.devices&&typeof raw.devices==="object"?raw.devices:{})};
  for(const key of Object.keys(template.devices))if(!validDevice(out.devices[key]))out.devices[key]=template.devices[key];
  out.hardware={...template.hardware,...(raw.hardware&&typeof raw.hardware==="object"?raw.hardware:{})};
  if(template.applications){
    out.applications={...template.applications,...(raw.applications&&typeof raw.applications==="object"?raw.applications:{})};
  }
  if(template.storage){
    out.storage={...template.storage,...(raw.storage&&typeof raw.storage==="object"?raw.storage:{})};
    out.storage.capacityMb=Math.max(1,Math.trunc(Number(out.storage.capacityMb)||template.storage.capacityMb||1));
    out.storage.baseUsedMb=Math.max(0,Math.trunc(Number(out.storage.baseUsedMb)||template.storage.baseUsedMb||0));
    out.storage.minimumFreeMb=Math.max(0,Math.trunc(Number(out.storage.minimumFreeMb)||template.storage.minimumFreeMb||0));
    out.storage.cleanup={};
    for(const [id,item] of Object.entries(template.storage.cleanup||{})){
      const savedItem=raw.storage?.cleanup?.[id]&&typeof raw.storage.cleanup[id]==="object"?raw.storage.cleanup[id]:{};
      out.storage.cleanup[id]={...item,...savedItem};
      out.storage.cleanup[id].remainingMb=Math.max(0,Math.trunc(Number(out.storage.cleanup[id].remainingMb)||0));
      out.storage.cleanup[id].cleanupAllowed=!!item.cleanupAllowed;
    }
  }
  const departmentGroup={Finance:"FIN-STAFF",Operations:"OPS-STAFF","Human Resources":"HR-STAFF",Engineering:"ENG-STAFF",Logistics:"LOG-STAFF"}[out.user.department];
  const accessTemplate=template.access||{groups:["DOMAIN-USERS",...(departmentGroup?[departmentGroup]:[])],editableGroups:[],shares:{}};
  out.access={...accessTemplate,...(raw.access&&typeof raw.access==="object"?raw.access:{})};
  out.access.groups=Array.isArray(raw.access?.groups)?[...new Set(raw.access.groups.filter(x=>typeof x==="string"))]:[...(accessTemplate.groups||[])];
  out.access.editableGroups=[...(accessTemplate.editableGroups||[])];
  out.access.shares=clone(accessTemplate.shares||{});
  out.eventLog=Array.isArray(raw.eventLog)?raw.eventLog.filter(x=>x&&typeof x==="object").slice(-100):clone(template.eventLog);
  return out;
}

function normalizeAction(action){
  if(!action||typeof action!=="object"||Array.isArray(action))return null;
  action.type=typeof action.type==="string"?action.type:"activity";
  action.kind=typeof action.kind==="string"?action.kind:"action";
  action.details=typeof action.details==="string"?action.details:"";
  action.label=typeof action.label==="string"?action.label:"";
  action.outcome=typeof action.outcome==="string"?action.outcome:"";
  action.meta=action.meta&&typeof action.meta==="object"&&!Array.isArray(action.meta)?action.meta:null;
  return action;
}

export function initServiceDesk(){
  const hd=ensureHelpDeskShape();
  for(const [id,template] of Object.entries(REMOTE_MACHINE_TEMPLATES))hd.machines[id]=mergeMachine(hd.machines[id],template);
  const known=new Set([...hd.availableTickets,...hd.activeTickets,...hd.completedTickets]);
  if(!known.size)hd.availableTickets=[SERVICE_DESK_TICKETS[0].id];
  else if(!hd.availableTickets.length&&!hd.activeTickets.length&&hd.completedTickets.length<SERVICE_DESK_TICKETS.length){
    const next=SERVICE_DESK_TICKETS.find(ticket=>!hd.completedTickets.includes(ticket.id));
    if(next)hd.availableTickets.push(next.id);
  }
  if(hd.remoteSession){
    const {ticketId,machineId}=hd.remoteSession;
    if(!SERVICE_DESK_TICKET_MAP[ticketId]||!hd.machines[machineId]||!hd.activeTickets.includes(ticketId))hd.remoteSession=null;
  }
  for(const ticket of SERVICE_DESK_TICKETS){
    const p=hd.ticketProgress[ticket.id];
    if(p&&typeof p==="object"&&!Array.isArray(p)){
      p.actions=Array.isArray(p.actions)?p.actions.map(normalizeAction).filter(Boolean).slice(-200):[];
      p.observedTools=Array.isArray(p.observedTools)?[...new Set(p.observedTools.filter(x=>typeof x==="string"))]:[];
      p.commands=Array.isArray(p.commands)?[...new Set(p.commands.filter(x=>typeof x==="string"))]:[];
      p.notes=typeof p.notes==="string"?p.notes.slice(0,4000):"";
      p.status=typeof p.status==="string"?p.status:"Assigned";
      p.verification=p.verification&&typeof p.verification==="object"&&!Array.isArray(p.verification)?p.verification:{passed:false,at:null,checks:[]};
      p.verification.passed=!!p.verification.passed;
      p.verification.at=Number.isFinite(Number(p.verification.at))?Math.max(0,Math.trunc(Number(p.verification.at))):null;
      p.verification.checks=Array.isArray(p.verification.checks)?p.verification.checks.filter(x=>typeof x==="string").slice(0,20):[];
      p.caseSummary=p.caseSummary&&typeof p.caseSummary==="object"&&!Array.isArray(p.caseSummary)?p.caseSummary:null;
      // A4.10.0.1: completed legacy tickets adopt the authored troubleshooting schema
      // without inventing evidence the player never gathered. Historical actions remain authoritative.
      if(ticket.troubleshooting&&p.status==="Resolved"){
        const observed=(ticket.troubleshooting.evidence||[]).filter(item=>p.actions.some(action=>(item.matches||[]).some(match=>actionMatches(action,match)))).map(item=>item.label);
        const changes=p.actions.filter(action=>action.kind==="change").map(action=>action.label||activityLabel(action.type,action.details));
        const changeActions=p.actions.filter(action=>action.kind==="change"),expected=new Set(ticket.expectedActions||[]),unnecessary=changeActions.filter(action=>!expected.has(action.type)).length;
        const process={evidenceObserved:observed.length,changes:changeActions.length,unnecessaryChanges:unnecessary,verified:!!p.verification?.passed};
        if(!p.caseSummary)p.caseSummary={rootCause:ticket.troubleshooting.rootCause?.label||"Resolved reported fault",evidence:observed,changes,verification:[...(p.verification?.checks||[])],process,explicitVerification:!!p.verification?.passed,closedAt:p.resolvedAt??null};
        else{
          if(!p.caseSummary.rootCause||p.caseSummary.rootCause==="Resolved reported fault")p.caseSummary.rootCause=ticket.troubleshooting.rootCause?.label||p.caseSummary.rootCause;
          if((!Array.isArray(p.caseSummary.evidence)||!p.caseSummary.evidence.length)&&observed.length)p.caseSummary.evidence=observed;
          if((!Array.isArray(p.caseSummary.changes)||!p.caseSummary.changes.length)&&changes.length)p.caseSummary.changes=changes;
          if(!p.caseSummary.process||typeof p.caseSummary.process!=="object")p.caseSummary.process=process;
        }
      }
    }
  }
  return hd;
}

function ticket(id){return SERVICE_DESK_TICKET_MAP[id]||null;}
function progress(id){const hd=initServiceDesk();return hd.ticketProgress[id]||null;}
function machineForTicket(id){const def=ticket(id),hd=initServiceDesk();return def?hd.machines[def.machineId]||null:null;}
function currentSessionFor(id){const hd=getState().helpDesk;return hd?.remoteSession?.ticketId===id?hd.remoteSession:null;}
function event(machine,{level="Information",source="Remote Support",eventId=1000,message}){
  machine.eventLog.push({id:`remote-${Date.now()}-${machine.eventLog.length}`,level,source,eventId,message:String(message||"")});
  if(machine.eventLog.length>100)machine.eventLog.splice(0,machine.eventLog.length-100);
}

function activityLabel(type,details=""){
  if(type==="ticket:accepted")return "Ticket accepted";
  if(type==="remote:connect")return `Remote Support connected${details?` · ${details}`:""}`;
  if(type==="remote:disconnect")return "Remote Support disconnected";
  if(type.startsWith("observe:"))return `Inspected ${toolLabels[type.slice(8)]||type.slice(8)}`;
  if(type.startsWith("command:"))return `Ran ${type.slice(8)}`;
  if(type.startsWith("device:")){const [,device,state]=type.split(":");return `${device==="networkAdapter"?"Network adapter":device} ${state}`;}
  if(type.startsWith("service:")){const [,service,state]=type.split(":");return `${service} service ${state}`;}
  if(type.startsWith("network:gateway:"))return `Default gateway changed to ${type.slice("network:gateway:".length)}`;
  if(type.startsWith("storage:cleanup:"))return `Cleaned ${type.slice("storage:cleanup:".length)}`;
  if(type.startsWith("group:add:"))return `Added group ${type.slice("group:add:".length)}`;
  if(type.startsWith("group:remove:"))return `Removed group ${type.slice("group:remove:".length)}`;
  if(type==="dhcp:renew")return "DHCP lease renewed";
  if(type==="network:repair")return "Network Repair completed";
  if(type==="network:repair-failed")return "Network Repair could not complete";
  if(type==="ticket:verify")return "Ticket verification run";
  if(type==="notes")return "Work note saved";
  return type.replaceAll(":"," · ");
}

function noteAction(ticketId,type,{kind="action",minutes=0,details="",label="",outcome="",meta=null}={}){
  const p=progress(ticketId);if(!p)return false;
  const action={...stamp(),type,kind,details:String(details||""),label:String(label||activityLabel(type,details)),outcome:String(outcome||""),meta:meta&&typeof meta==="object"&&!Array.isArray(meta)?clone(meta):null};
  p.actions.push(action);if(p.actions.length>200)p.actions.shift();
  if(kind==="change")p.verification={passed:false,at:null,checks:[]};
  if(minutes>0)advanceElapsedTime(minutes,{reason:`helpdesk:${ticketId}:${type}`});
  emit("helpdesk:changed",{ticketId,type,kind});return true;
}

function isIpv4(ip){
  if(typeof ip!=="string"||!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip))return false;
  return ip.split(".").every(part=>Number(part)>=0&&Number(part)<=255);
}
function ipInt(ip){if(!isIpv4(ip))return null;return ip.split(".").reduce((n,part)=>((n<<8)|(Number(part)&255))>>>0,0)>>>0;}
function sameSubnet(a,b,mask){const ai=ipInt(a),bi=ipInt(b),mi=ipInt(mask);return ai!=null&&bi!=null&&mi!=null&&((ai&mi)>>>0)===((bi&mi)>>>0);}
function validIp(ip){return isIpv4(ip)&&/^10\.20\./.test(ip);}
function storageFreeMb(machine){
  if(!machine?.storage)return null;
  const cleanupUsed=Object.values(machine.storage.cleanup||{}).reduce((sum,item)=>sum+Math.max(0,Number(item?.remainingMb)||0),0);
  return Math.max(0,Math.trunc((Number(machine.storage.capacityMb)||0)-(Number(machine.storage.baseUsedMb)||0)-cleanupUsed));
}
function shareAccessible(machine,shareId){
  const share=machine?.access?.shares?.[shareId];if(!share)return false;
  const groups=new Set(machine.access?.groups||[]);return (share.allowedGroups||[]).some(group=>groups.has(group));
}
function gatewayUsable(machine){return !!machine.network.gateway&&machine.network.gateway===machine.network.correctGateway&&sameSubnet(machine.network.ip,machine.network.gateway,machine.network.subnet);}
function canReach(machine,target){
  if(!machine.network.adapterEnabled||!isIpv4(machine.network.ip))return false;
  if(target==="127.0.0.1")return true;
  if(!isIpv4(target))return false;
  if(machine.network.ip.startsWith("169.254."))return sameSubnet(machine.network.ip,target,machine.network.subnet);
  if(sameSubnet(machine.network.ip,target,machine.network.subnet))return true;
  return gatewayUsable(machine);
}

export function serviceDeskSnapshot(){
  const hd=initServiceDesk();
  return {
    availableTickets:[...hd.availableTickets],activeTickets:[...hd.activeTickets],completedTickets:[...hd.completedTickets],
    ticketProgress:clone(hd.ticketProgress),remoteSession:hd.remoteSession?{...hd.remoteSession}:null,job:{...hd.job},
    tickets:SERVICE_DESK_TICKETS.map(def=>({...def,user:{...hd.machines[def.machineId].user},machine:{id:def.machineId,hostname:hd.machines[def.machineId].hostname,os:hd.machines[def.machineId].os}}))
  };
}

export function acceptTicket(ticketId){
  const hd=initServiceDesk(),def=ticket(ticketId);if(!def)return {ok:false,message:"Unknown Service Desk ticket."};
  if(hd.completedTickets.includes(ticketId))return {ok:false,message:"Ticket is already closed."};
  if(!hd.availableTickets.includes(ticketId)&&!hd.activeTickets.includes(ticketId))return {ok:false,message:"Ticket is not currently assigned to your queue."};
  if(!hd.activeTickets.includes(ticketId)){
    hd.availableTickets=hd.availableTickets.filter(id=>id!==ticketId);hd.activeTickets.push(ticketId);
    hd.ticketProgress[ticketId]={status:"In Progress",acceptedAt:absoluteNow(),actions:[],observedTools:[],commands:[],notes:"",score:null,resolvedAt:null,verification:{passed:false,at:null,checks:[]},caseSummary:null};
    noteAction(ticketId,"ticket:accepted",{kind:"workflow"});
  }
  return {ok:true,message:`${ticketId} is now In Progress.`,ticket:def};
}

export function connectRemote(ticketId){
  const hd=initServiceDesk(),def=ticket(ticketId);if(!def)return {ok:false,message:"Unknown ticket."};
  if(!hd.activeTickets.includes(ticketId))return {ok:false,message:"Accept the ticket before starting Remote Assistance."};
  hd.remoteSession={ticketId,machineId:def.machineId,connectedAt:absoluteNow(),connected:true};
  noteAction(ticketId,"remote:connect",{kind:"workflow",minutes:1,details:def.machineId});
  return {ok:true,message:`Remote Assistance connected to ${def.machineId}.`,machine:remoteMachineSnapshot(def.machineId)};
}

export function disconnectRemote(){
  const hd=initServiceDesk(),session=hd.remoteSession;if(!session)return {ok:true,message:"No remote session is active."};
  noteAction(session.ticketId,"remote:disconnect",{kind:"workflow"});hd.remoteSession=null;emit("helpdesk:changed",{ticketId:session.ticketId,type:"remote:disconnect"});
  return {ok:true,message:`Disconnected from ${session.machineId}.`};
}

export function remoteMachineSnapshot(machineId){
  const hd=initServiceDesk(),machine=hd.machines[machineId];if(!machine)return null;
  return clone(machine);
}

export function observeRemoteTool(ticketId,tool){
  if(!currentSessionFor(ticketId))return false;
  const p=progress(ticketId);if(!p)return false;
  if(!p.observedTools.includes(tool)){p.observedTools.push(tool);noteAction(ticketId,`observe:${tool}`,{kind:"diagnostic",minutes:1});}
  return true;
}

export function setTicketNotes(ticketId,notes){
  const p=progress(ticketId);if(!p)return {ok:false,message:"Accept the ticket before adding work notes."};
  p.notes=String(notes||"").slice(0,4000);emit("helpdesk:changed",{ticketId,type:"notes"});return {ok:true,message:"Work note saved."};
}

export function setRemoteDevice(ticketId,device,enabled){
  const def=ticket(ticketId),machine=machineForTicket(ticketId);if(!def||!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  if(!(device in machine.devices))return {ok:false,message:"Unknown remote device."};
  machine.devices[device]=enabled?"enabled":"disabled";
  if(device==="networkAdapter"){
    machine.network.adapterEnabled=!!enabled;
    if(!enabled)machine.network.ip="0.0.0.0";
    else if(machine.services.dhcpClient==="running"&&machine.network.dhcp){machine.network.ip=machine.network.leaseIp;machine.network.subnet="255.255.255.0";if(!machine.network.gateway)machine.network.gateway=machine.network.correctGateway;if(!machine.network.dns.length)machine.network.dns=["10.20.0.10"];}
  }
  event(machine,{level:enabled?"Information":"Warning",source:"PlugPlayManager",eventId:enabled?4001:4002,message:`${machine.hardware.network} ${enabled?"enabled":"disabled"} in Device Manager.`});
  noteAction(ticketId,`device:${device}:${enabled?"enabled":"disabled"}`,{kind:"change",minutes:2});
  return {ok:true,message:`Remote ${device} ${enabled?"enabled":"disabled"}.`};
}

export function setRemoteService(ticketId,service,status){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  if(!(service in machine.services)||!validService(status))return {ok:false,message:"Unknown service or state."};
  machine.services[service]=status;
  event(machine,{level:status==="running"?"Information":"Warning",source:"Service Control Manager",eventId:status==="running"?7036:7035,message:`${service} service entered the ${status} state.`});
  noteAction(ticketId,`service:${service}:${status}`,{kind:"change",minutes:2});
  return {ok:true,message:`${service} is now ${status}.`};
}

export function setRemoteGateway(ticketId,gateway){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  if(!machine.network.gatewayEditable)return {ok:false,message:"This workstation receives gateway settings from managed network configuration."};
  const value=String(gateway||"").trim();if(!isIpv4(value))return {ok:false,message:"Enter a valid IPv4 default gateway."};
  if(value===machine.network.gateway)return {ok:true,message:`Default gateway is already ${value}.`};
  const before=machine.network.gateway;machine.network.gateway=value;
  event(machine,{source:"Tcpip",eventId:4202,message:`Default gateway changed from ${before||"(none)"} to ${value} through Remote Assistance.`});
  noteAction(ticketId,`network:gateway:${value}`,{kind:"change",minutes:2,details:`${before||"(none)"} → ${value}`,meta:{before,after:value}});
  return {ok:true,message:`Default gateway updated to ${value}.`};
}

export function setRemoteFirewallEnabled(ticketId,enabled){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  machine.firewall.enabled=!!enabled;event(machine,{level:enabled?"Information":"Warning",source:"Firewall",eventId:enabled?3001:3002,message:`NEXUS Firewall ${enabled?"enabled":"disabled"} by Remote Assistance.`});
  noteAction(ticketId,`firewall:${enabled?"enabled":"disabled"}`,{kind:"change",minutes:2});return {ok:true,message:`Remote firewall ${enabled?"enabled":"disabled"}.`};
}

export function setRemoteFirewallRule(ticketId,rule,enabled){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId)||!(rule in machine.firewall.rules))return {ok:false,message:"Unknown remote firewall rule."};
  machine.firewall.rules[rule]=!!enabled;event(machine,{source:"Firewall",eventId:3010,message:`Firewall exception ${rule} ${enabled?"enabled":"disabled"}.`});
  noteAction(ticketId,`firewall-rule:${rule}:${enabled?"enabled":"disabled"}`,{kind:"change",minutes:2});return {ok:true,message:`Remote firewall exception ${enabled?"allowed":"blocked"}.`};
}

export function cleanupRemoteStorage(ticketId,target){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  const item=machine.storage?.cleanup?.[target];if(!item||!item.cleanupAllowed)return {ok:false,message:"That storage category is not an approved cleanup target."};
  const amount=Math.max(0,Math.trunc(Number(item.remainingMb)||0));
  if(!amount)return {ok:true,message:`${item.label} is already empty.`};
  item.remainingMb=0;
  event(machine,{source:"Disk Cleanup",eventId:2101,message:`Removed ${amount} MB from ${item.label}.`});
  noteAction(ticketId,`storage:cleanup:${target}`,{kind:"change",minutes:3,details:`${item.label} · ${amount} MB removed`,label:`Cleaned ${item.label}`,meta:{target,removedMb:amount}});
  return {ok:true,message:`Disk Cleanup removed ${amount} MB from ${item.label}. ${storageFreeMb(machine)} MB free.`};
}

export function setRemoteGroupMembership(ticketId,group,enabled){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  if(!machine.access||!machine.access.editableGroups?.includes(group))return {ok:false,message:"That group is not available for delegated support changes."};
  const groups=new Set(machine.access.groups||[]),had=groups.has(group);
  if(enabled)groups.add(group);else groups.delete(group);
  machine.access.groups=[...groups];
  if(had===!!enabled)return {ok:true,message:`NEXUS\\${machine.user.username} is already ${enabled?"a member":"not a member"} of ${group}.`};
  event(machine,{source:"Security",eventId:enabled?636:637,message:`NEXUS\\${machine.user.username} ${enabled?"added to":"removed from"} ${group}.`});
  noteAction(ticketId,`group:${enabled?"add":"remove"}:${group}`,{kind:"change",minutes:2,details:`NEXUS\\${machine.user.username}`,label:`${enabled?"Added":"Removed"} ${group}`});
  return {ok:true,message:`${enabled?"Added":"Removed"} NEXUS\\${machine.user.username} ${enabled?"to":"from"} ${group}.`};
}

export function renewRemoteDhcp(ticketId){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  if(!machine.network.dhcp)return {ok:false,message:"DHCP renewal is unavailable: this workstation uses a manual TCP/IP configuration."};
  if(!machine.network.adapterEnabled)return {ok:false,message:"DHCP renewal failed: network adapter is disabled."};
  if(machine.services.dhcpClient!=="running")return {ok:false,message:"DHCP renewal failed: DHCP Client service is stopped."};
  machine.network.ip=machine.network.leaseIp;machine.network.subnet="255.255.255.0";machine.network.gateway=machine.network.correctGateway||machine.network.gateway||"10.20.0.1";
  machine.network.dns=["10.20.0.10"];machine.network.leaseRenewals+=1;
  event(machine,{source:"Dhcp",eventId:1001,message:`DHCP lease renewed for ${machine.network.ip}.`});noteAction(ticketId,"dhcp:renew",{kind:"change",minutes:2});
  return {ok:true,message:`DHCP lease renewed: ${machine.network.ip}.`};
}

export function repairRemoteNetwork(ticketId){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  // The Windows-style Repair action is intentionally not a magic ticket solver.
  // It cannot enable a disabled device, start a stopped dependency, or rewrite a manual static gateway.
  if(!machine.network.adapterEnabled){noteAction(ticketId,"network:repair-failed",{kind:"diagnostic",minutes:2});return {ok:false,message:"Repair could not start: Local Area Connection is disabled in Device Manager."};}
  if(!machine.network.dhcp){noteAction(ticketId,"network:repair-failed",{kind:"diagnostic",minutes:2});return {ok:false,message:"Repair found a manual TCP/IP configuration. Review the configured address, subnet and gateway directly."};}
  if(machine.services.dhcpClient!=="running"){noteAction(ticketId,"network:repair-failed",{kind:"diagnostic",minutes:2});return {ok:false,message:"Repair could not renew TCP/IP configuration because DHCP Client is stopped."};}
  machine.network.ip=machine.network.leaseIp;machine.network.subnet="255.255.255.0";machine.network.gateway=machine.network.correctGateway||machine.network.gateway;machine.network.dns=["10.20.0.10"];machine.network.leaseRenewals+=1;
  event(machine,{source:"Network Diagnostics",eventId:2001,message:"Network Repair renewed TCP/IP configuration and refreshed local network caches."});
  noteAction(ticketId,"network:repair",{kind:"change",minutes:3});
  return {ok:true,message:machine.services.dnsClient==="running"?"Network Repair renewed TCP/IP configuration.":"Network Repair renewed TCP/IP configuration, but local name resolution still needs attention."};
}

function commandRoot(raw){return String(raw||"").trim().toLowerCase().split(/\s+/)[0]||"";}
function commandRecorded(ticketId,raw,minutes=1,{outcome="",details=""}={}){
  const p=progress(ticketId),root=commandRoot(raw);if(p&&root&&!p.commands.includes(root))p.commands.push(root);
  noteAction(ticketId,`command:${String(raw||"").trim().toLowerCase()}`,{kind:"diagnostic",minutes,outcome,details});
}
function ipconfig(machine,all=false){
  const media=machine.network.adapterEnabled;
  const lines=["Windows NEXUS IP Configuration","",`${machine.hardware.network}:`];
  if(!media){lines.push("   Media State . . . . . . . . . : Media disconnected");return lines.join("\n");}
  if(all)lines.push(`   Host Name . . . . . . . . . . : ${machine.hostname}`,`   DHCP Enabled. . . . . . . . . : ${machine.network.dhcp?"Yes":"No"}`);
  lines.push(`   IP Address. . . . . . . . . . : ${machine.network.ip}`,`   Subnet Mask . . . . . . . . . : ${machine.network.subnet}`,`   Default Gateway . . . . . . . : ${machine.network.gateway||""}`);
  if(all)lines.push(`   DNS Servers . . . . . . . . . : ${machine.network.dns.join(", ")||""}`);
  return lines.join("\n");
}
function dirOutput(machine,target){
  const raw=String(target||"").trim(),normalized=raw.replaceAll("/","\\").toLowerCase().replace(/\\+$/g,"");
  if(!raw||normalized==="c:"||normalized==="c:\\"){
    const free=storageFreeMb(machine);
    if(free==null)return ` Volume in drive C is SYSTEM\n Directory of C:\\\n\n   18 File(s)      124,928 bytes\n    9 Dir(s)   8,388,608,000 bytes free`;
    return ` Volume in drive C is SYSTEM\n Directory of C:\\\n\n   22 File(s)      238,592 bytes\n   11 Dir(s)   ${free.toLocaleString()} MB free`;
  }
  const shareEntry=Object.entries(machine.access?.shares||{}).find(([,share])=>String(share.path||"").toLowerCase().replaceAll("/","\\").replace(/\\+$/g,"")===normalized);
  if(shareEntry){
    const [shareId,share]=shareEntry;
    if(!shareAccessible(machine,shareId))return `Access is denied.\n\n${share.path}`;
    return ` Directory of ${share.path}\n\n09/18/2026  02:14 PM    <DIR>          CURRENT\n09/17/2026  04:32 PM    <DIR>          ARCHIVE\n09/19/2026  09:05 AM           284,672 project-index.pdf\n               1 File(s)        284,672 bytes`;
  }
  return `The system cannot find the path specified.\n\n${raw}`;
}
function pingOutput(machine,target){
  const clean=target.toLowerCase();if(!machine.network.adapterEnabled)return "PING: transmit failed. General failure.";
  let resolved=target;
  if(/[a-z]/i.test(target)){
    if(machine.services.dnsClient!=="running"||!machine.network.dns.length)return `Ping request could not find host ${target}. Please check the name and try again.`;
    if(clean==="intranet.nexus.local")resolved="10.20.0.20";else return `Ping request could not find host ${target}.`;
  }
  if(resolved==="127.0.0.1")return "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128\nReply from 127.0.0.1: bytes=32 time<1ms TTL=128\n\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)";
  if(canReach(machine,resolved))return `Pinging ${resolved} with 32 bytes of data:\nReply from ${resolved}: bytes=32 time=2ms TTL=64\nReply from ${resolved}: bytes=32 time=2ms TTL=64\n\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)`;
  if(machine.network.ip.startsWith("169.254."))return `Pinging ${resolved} with 32 bytes of data:\nDestination host unreachable.\nDestination host unreachable.\n\nPackets: Sent = 2, Received = 0, Lost = 2 (100% loss)`;
  return `Pinging ${resolved} with 32 bytes of data:\nDestination host unreachable.\nDestination host unreachable.\n\nPackets: Sent = 2, Received = 0, Lost = 2 (100% loss)`;
}

export function runRemoteCommand(ticketId,raw){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,output:"No matching Remote Assistance session."};
  const text=String(raw||"").trim();if(!text)return {ok:false,output:""};
  const [command,...args]=text.split(/\s+/),name=command.toLowerCase();
  if(name==="cls"){commandRecorded(ticketId,text,1,{outcome:"clear"});return {ok:true,output:"",clear:true};}
  if(name==="help"){commandRecorded(ticketId,text,1,{outcome:"ok"});return {ok:true,output:"Commands: hostname, whoami, ipconfig, ipconfig /all, ipconfig /renew, ping <host|IP>, nslookup <name>, dir <path>, cls"};}
  if(name==="hostname"){commandRecorded(ticketId,text,1,{outcome:"ok"});return {ok:true,output:machine.hostname};}
  if(name==="whoami"){commandRecorded(ticketId,text,1,{outcome:"ok"});return {ok:true,output:`nexus\\${machine.user.username}`};}
  if(name==="ipconfig"){
    if(args[0]?.toLowerCase()==="/renew"){const result=renewRemoteDhcp(ticketId);return {ok:result.ok,output:result.message};}
    commandRecorded(ticketId,text,1,{outcome:"observed"});return {ok:true,output:ipconfig(machine,args[0]?.toLowerCase()==="/all")};
  }
  if(name==="ping"){
    if(!args[0])return {ok:false,output:"Usage: ping <hostname|IP>"};
    const output=pingOutput(machine,args[0]);const ok=/0% loss/.test(output);commandRecorded(ticketId,text,1,{outcome:ok?"reachable":"failed",details:args[0]});return {ok:true,output};
  }
  if(name==="dir"){
    const target=args.join(" ")||"c:\\",output=dirOutput(machine,target),denied=/access is denied/i.test(output),missing=/cannot find/i.test(output);
    commandRecorded(ticketId,text,1,{outcome:denied?"denied":missing?"missing":"observed",details:target});return {ok:!missing,output};
  }
  if(name==="nslookup"){
    if(!args[0])return {ok:false,output:"Usage: nslookup <hostname>"};
    if(!machine.network.adapterEnabled){commandRecorded(ticketId,text,1,{outcome:"failed"});return {ok:false,output:"DNS request timed out. Network adapter is disabled."};}
    if(!machine.network.dns.length){commandRecorded(ticketId,text,1,{outcome:"failed"});return {ok:false,output:"*** No DNS server is configured on this adapter."};}
    if(!canReach(machine,machine.network.dns[0])){commandRecorded(ticketId,text,1,{outcome:"failed"});return {ok:false,output:`DNS request timed out. Server ${machine.network.dns[0]} is unreachable.`};}
    commandRecorded(ticketId,text,1,{outcome:"queried"});
    // Like real nslookup, this diagnostic queries the configured DNS server directly;
    // it can still prove server-side DNS is healthy when the local DNS Client service is stopped.
    if(args[0].toLowerCase()==="intranet.nexus.local")return {ok:true,output:`Server:  ${machine.network.dns[0]}\nAddress: ${machine.network.dns[0]}\n\nName:    intranet.nexus.local\nAddress: 10.20.0.20`};
    return {ok:false,output:`*** ${machine.network.dns[0]} can't find ${args[0]}: Non-existent domain`};
  }
  commandRecorded(ticketId,text,1,{outcome:"unknown"});return {ok:false,output:`'${command}' is not recognized as an internal or external command. Type HELP for supported diagnostics.`};
}

function getPath(object,path){return String(path||"").split(".").filter(Boolean).reduce((value,key)=>value&&typeof value==="object"?value[key]:undefined,object);}
function evaluateCondition(machine,condition){
  const value=condition.path?getPath(machine,condition.path):undefined;
  if(condition.op==="equals")return value===condition.value;
  if(condition.op==="equals-path")return value===getPath(machine,condition.otherPath);
  if(condition.op==="corporate-ip")return validIp(value);
  if(condition.op==="truthy")return !!value;
  if(condition.op==="nonempty")return Array.isArray(value)?value.length>0:!!String(value||"");
  if(condition.op==="greater-than")return Number(value)>Number(condition.value);
  if(condition.op==="reachable")return canReach(machine,condition.target);
  if(condition.op==="dns-server-reachable")return machine.network.dns.length>0&&canReach(machine,machine.network.dns[0]);
  if(condition.op==="storage-free-at-least")return storageFreeMb(machine)!=null&&storageFreeMb(machine)>=Number(condition.value);
  if(condition.op==="group-present")return (machine.access?.groups||[]).includes(condition.value);
  if(condition.op==="group-absent")return !(machine.access?.groups||[]).includes(condition.value);
  if(condition.op==="share-access")return shareAccessible(machine,condition.shareId);
  return false;
}
function actionMatches(action,match){
  if(match.type&&action.type===match.type)return true;
  if(match.typePrefix&&action.type.startsWith(match.typePrefix))return true;
  if(match.kind&&action.kind===match.kind)return true;
  return false;
}
function evidenceStatus(ticketId){
  const def=ticket(ticketId),p=progress(ticketId),items=def?.troubleshooting?.evidence||[];
  if(!p)return [];
  return items.map(item=>({...item,observed:p.actions.some(action=>(item.matches||[]).some(match=>actionMatches(action,match)))}));
}
function verification(ticketId){
  const def=ticket(ticketId),machine=machineForTicket(ticketId);if(!machine||!def)return {ok:false,checks:[]};
  const authored=def.troubleshooting?.verification;
  if(Array.isArray(authored)&&authored.length){
    const results=authored.map(condition=>({label:condition.label,ok:evaluateCondition(machine,condition)}));
    return {ok:results.every(result=>result.ok),checks:results.map(result=>`${result.ok?"PASS":"FAIL"}: ${result.label}`),results};
  }
  return {ok:false,checks:[]};
}

export function verifyTicket(ticketId){
  const p=progress(ticketId);if(!p)return {ok:false,checks:[],message:"Accept the ticket before running verification."};
  const result=verification(ticketId);
  noteAction(ticketId,"ticket:verify",{kind:"verification",minutes:1,outcome:result.ok?"passed":"failed",label:result.ok?"Verification passed":"Verification failed"});
  p.verification={passed:result.ok,at:absoluteNow(),checks:[...result.checks]};
  return {...result,message:result.ok?"Verification passed. The reported fault is no longer present.":"Verification failed. The reported issue still appears unresolved."};
}

function scoreTicket(ticketId){
  const def=ticket(ticketId),p=progress(ticketId);if(!def||!p)return 0;
  if(!def.troubleshooting){
    let score=70;
    if(def.relevantTools.some(tool=>p.observedTools.includes(tool)))score+=10;
    if(def.relevantCommands.some(command=>p.commands.includes(command)))score+=10;
    const expected=new Set(def.expectedActions),changes=p.actions.filter(a=>a.kind==="change").map(a=>a.type),unrelated=changes.filter(type=>!expected.has(type));
    if(!unrelated.length)score+=10;else score-=Math.min(20,unrelated.length*5);
    return Math.max(0,Math.min(100,score));
  }
  let score=60;
  if(def.relevantTools.some(tool=>p.observedTools.includes(tool)))score+=10;
  if(def.relevantCommands.some(command=>p.commands.includes(command)))score+=10;
  const expected=new Set(def.expectedActions),changes=p.actions.filter(a=>a.kind==="change").map(a=>a.type),unrelated=changes.filter(type=>!expected.has(type));
  if(!unrelated.length)score+=10;else score-=Math.min(25,unrelated.length*5);
  const evidence=evidenceStatus(ticketId),observed=evidence.filter(item=>item.observed).length,minimum=Math.max(0,Math.trunc(Number(def.troubleshooting.minimumEvidence)||0));
  if(observed>=minimum)score+=5;
  if(p.verification?.passed)score+=5;
  return Math.max(0,Math.min(100,score));
}
function unlockNext(def,hd){
  if(!def?.nextTicketId)return;
  const id=def.nextTicketId;if(!hd.availableTickets.includes(id)&&!hd.activeTickets.includes(id)&&!hd.completedTickets.includes(id))hd.availableTickets.push(id);
}
function buildCaseSummary(ticketId,liveVerification){
  const def=ticket(ticketId),p=progress(ticketId);if(!def||!p)return null;
  const evidence=evidenceStatus(ticketId).filter(item=>item.observed).map(item=>item.label);
  const changeActions=p.actions.filter(action=>action.kind==="change"),changes=changeActions.map(action=>action.label||activityLabel(action.type,action.details));
  const expected=new Set(def.expectedActions||[]),unnecessaryChanges=changeActions.filter(action=>!expected.has(action.type)).length;
  return {
    rootCause:def.troubleshooting?.rootCause?.label||"Resolved reported fault",
    evidence,
    changes,
    verification:[...(liveVerification?.checks||[])],
    process:{evidenceObserved:evidence.length,changes:changeActions.length,unnecessaryChanges,verified:!!p.verification?.passed},
    explicitVerification:!!p.verification?.passed,
    closedAt:absoluteNow()
  };
}

export function resolveTicket(ticketId){
  const hd=initServiceDesk(),def=ticket(ticketId),p=progress(ticketId);if(!def||!p||!hd.activeTickets.includes(ticketId))return {ok:false,message:"Ticket is not In Progress."};
  const check=verification(ticketId);if(!check.ok)return {ok:false,message:"Resolution rejected: verification still detects the reported fault.",checks:check.checks};
  const score=scoreTicket(ticketId);p.status="Resolved";p.score=score;p.resolvedAt=absoluteNow();p.caseSummary=buildCaseSummary(ticketId,check);
  hd.activeTickets=hd.activeTickets.filter(id=>id!==ticketId);if(!hd.completedTickets.includes(ticketId))hd.completedTickets.push(ticketId);hd.job.resolved+=1;hd.job.score+=score;unlockNext(def,hd);
  if(hd.remoteSession?.ticketId===ticketId)hd.remoteSession=null;
  emit("helpdesk:changed",{ticketId,type:"resolved",score,caseSummary:clone(p.caseSummary)});
  return {ok:true,message:`${ticketId} resolved. Ticket review: ${score}/100.`,score,checks:check.checks,caseSummary:clone(p.caseSummary)};
}

export function escalateTicket(ticketId){
  const hd=initServiceDesk(),def=ticket(ticketId),p=progress(ticketId);if(!def||!p||!hd.activeTickets.includes(ticketId))return {ok:false,message:"Ticket is not In Progress."};
  if(!p.notes.trim())return {ok:false,message:"Add a work note describing your findings before escalating."};
  p.status="Escalated";p.score=30;p.resolvedAt=absoluteNow();hd.activeTickets=hd.activeTickets.filter(id=>id!==ticketId);if(!hd.completedTickets.includes(ticketId))hd.completedTickets.push(ticketId);hd.job.escalated+=1;hd.job.score+=30;unlockNext(def,hd);
  if(hd.remoteSession?.ticketId===ticketId)hd.remoteSession=null;emit("helpdesk:changed",{ticketId,type:"escalated",score:30});
  return {ok:true,message:`${ticketId} escalated with documentation.`,score:30};
}

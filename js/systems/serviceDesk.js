import { getState } from "../core/state.js";
import { emit } from "../core/events.js";
import { advanceElapsedTime } from "./timeline.js";
import { REMOTE_MACHINE_TEMPLATES, SERVICE_DESK_TICKETS, SERVICE_DESK_TICKET_MAP } from "../data/serviceDesk.js";

const clone=value=>JSON.parse(JSON.stringify(value));
const validService=value=>value==="running"||value==="stopped";
const validDevice=value=>value==="enabled"||value==="disabled";
const absoluteNow=()=>{const s=getState();return (s.world.day-1)*1440+s.world.minute;};
const stamp=()=>{const s=getState();return {day:s.world.day,minute:s.world.minute,absolute:absoluteNow()};};

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
  out.network.dns=Array.isArray(out.network.dns)?out.network.dns.filter(x=>typeof x==="string").slice(0,4):[...template.network.dns];
  for(const key of ["ip","subnet","gateway","leaseIp"])if(typeof out.network[key]!=="string")out.network[key]=template.network[key];
  out.network.leaseRenewals=Math.max(0,Math.trunc(Number(out.network.leaseRenewals)||0));
  out.firewall={...out.firewall,...(raw.firewall&&typeof raw.firewall==="object"?raw.firewall:{})};
  out.firewall.rules={...template.firewall.rules,...(raw.firewall?.rules&&typeof raw.firewall.rules==="object"?raw.firewall.rules:{})};
  out.services={...template.services,...(raw.services&&typeof raw.services==="object"?raw.services:{})};
  for(const key of Object.keys(template.services))if(!validService(out.services[key]))out.services[key]=template.services[key];
  out.devices={...template.devices,...(raw.devices&&typeof raw.devices==="object"?raw.devices:{})};
  for(const key of Object.keys(template.devices))if(!validDevice(out.devices[key]))out.devices[key]=template.devices[key];
  out.hardware={...template.hardware,...(raw.hardware&&typeof raw.hardware==="object"?raw.hardware:{})};
  out.eventLog=Array.isArray(raw.eventLog)?raw.eventLog.filter(x=>x&&typeof x==="object").slice(-100):clone(template.eventLog);
  return out;
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
      p.actions=Array.isArray(p.actions)?p.actions.filter(x=>x&&typeof x==="object").slice(-200):[];
      p.observedTools=Array.isArray(p.observedTools)?[...new Set(p.observedTools.filter(x=>typeof x==="string"))]:[];
      p.commands=Array.isArray(p.commands)?[...new Set(p.commands.filter(x=>typeof x==="string"))]:[];
      p.notes=typeof p.notes==="string"?p.notes.slice(0,4000):"";
      p.status=typeof p.status==="string"?p.status:"Assigned";
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
function noteAction(ticketId,type,{kind="action",minutes=0,details=""}={}){
  const p=progress(ticketId);if(!p)return false;
  const action={...stamp(),type,kind,details:String(details||"")};p.actions.push(action);if(p.actions.length>200)p.actions.shift();
  if(minutes>0)advanceElapsedTime(minutes,{reason:`helpdesk:${ticketId}:${type}`});
  emit("helpdesk:changed",{ticketId,type,kind});return true;
}
function validIp(ip){return typeof ip==="string"&&/^10\.20\./.test(ip);}

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
    hd.ticketProgress[ticketId]={status:"In Progress",acceptedAt:absoluteNow(),actions:[],observedTools:[],commands:[],notes:"",score:null,resolvedAt:null};
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
    else if(machine.services.dhcpClient==="running"&&machine.network.dhcp){machine.network.ip=machine.network.leaseIp;machine.network.subnet="255.255.255.0";if(!machine.network.gateway)machine.network.gateway=def.machineId==="HR-LT-03"?"10.20.30.1":machine.network.gateway;if(!machine.network.dns.length)machine.network.dns=["10.20.0.10"];}
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

export function renewRemoteDhcp(ticketId){
  const def=ticket(ticketId),machine=machineForTicket(ticketId);if(!def||!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  if(!machine.network.adapterEnabled)return {ok:false,message:"DHCP renewal failed: network adapter is disabled."};
  if(machine.services.dhcpClient!=="running")return {ok:false,message:"DHCP renewal failed: DHCP Client service is stopped."};
  machine.network.ip=machine.network.leaseIp;machine.network.subnet="255.255.255.0";
  if(def.machineId==="HR-LT-03")machine.network.gateway="10.20.30.1";
  if(!machine.network.gateway)machine.network.gateway="10.20.0.1";
  machine.network.dns=["10.20.0.10"];machine.network.leaseRenewals+=1;
  event(machine,{source:"Dhcp",eventId:1001,message:`DHCP lease renewed for ${machine.network.ip}.`});noteAction(ticketId,"dhcp:renew",{kind:"change",minutes:2});
  return {ok:true,message:`DHCP lease renewed: ${machine.network.ip}.`};
}

export function repairRemoteNetwork(ticketId){
  const def=ticket(ticketId),machine=machineForTicket(ticketId);if(!def||!machine||!currentSessionFor(ticketId))return {ok:false,message:"No matching Remote Assistance session."};
  // The Windows-style Repair action is intentionally not a magic ticket solver.
  // It cannot enable a disabled device or start a stopped DHCP/DNS service.
  if(!machine.network.adapterEnabled){noteAction(ticketId,"network:repair-failed",{kind:"diagnostic",minutes:2});return {ok:false,message:"Repair could not start: Local Area Connection is disabled in Device Manager."};}
  if(machine.services.dhcpClient!=="running"){noteAction(ticketId,"network:repair-failed",{kind:"diagnostic",minutes:2});return {ok:false,message:"Repair could not renew TCP/IP configuration because DHCP Client is stopped."};}
  machine.network.ip=machine.network.leaseIp;machine.network.subnet="255.255.255.0";
  if(def.machineId==="FIN-WS-07")machine.network.gateway="10.20.10.1";
  if(def.machineId==="OPS-WS-12")machine.network.gateway="10.20.20.1";
  if(def.machineId==="HR-LT-03")machine.network.gateway="10.20.30.1";
  machine.network.dns=["10.20.0.10"];machine.network.leaseRenewals+=1;
  event(machine,{source:"Network Diagnostics",eventId:2001,message:"Network Repair renewed TCP/IP configuration and refreshed local network caches."});
  noteAction(ticketId,"network:repair",{kind:"change",minutes:3});
  return {ok:true,message:machine.services.dnsClient==="running"?"Network Repair renewed TCP/IP configuration.":"Network Repair renewed TCP/IP configuration, but local name resolution still needs attention."};
}

function commandRoot(raw){return String(raw||"").trim().toLowerCase().split(/\s+/)[0]||"";}
function commandRecorded(ticketId,raw,minutes=1){
  const p=progress(ticketId),root=commandRoot(raw);if(p&&root&&!p.commands.includes(root))p.commands.push(root);
  noteAction(ticketId,`command:${String(raw||"").trim()}`,{kind:"diagnostic",minutes});
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
function pingOutput(machine,target){
  const clean=target.toLowerCase();if(!machine.network.adapterEnabled)return "PING: transmit failed. General failure.";
  let resolved=target;
  if(/[a-z]/i.test(target)){
    if(machine.services.dnsClient!=="running"||!machine.network.dns.length)return `Ping request could not find host ${target}. Please check the name and try again.`;
    if(clean==="intranet.nexus.local")resolved="10.20.0.20";else return `Ping request could not find host ${target}.`;
  }
  if(clean==="127.0.0.1"||resolved==="127.0.0.1")return "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128\nReply from 127.0.0.1: bytes=32 time<1ms TTL=128\n\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)";
  if(machine.network.ip.startsWith("169.254."))return `Pinging ${resolved} with 32 bytes of data:\nDestination host unreachable.\nDestination host unreachable.\n\nPackets: Sent = 2, Received = 0, Lost = 2 (100% loss)`;
  if(resolved===machine.network.gateway||resolved==="10.20.0.20"||resolved==="10.20.0.10")return `Pinging ${resolved} with 32 bytes of data:\nReply from ${resolved}: bytes=32 time=2ms TTL=64\nReply from ${resolved}: bytes=32 time=2ms TTL=64\n\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)`;
  return `Pinging ${resolved} with 32 bytes of data:\nRequest timed out.\nRequest timed out.\n\nPackets: Sent = 2, Received = 0, Lost = 2 (100% loss)`;
}

export function runRemoteCommand(ticketId,raw){
  const machine=machineForTicket(ticketId);if(!machine||!currentSessionFor(ticketId))return {ok:false,output:"No matching Remote Assistance session."};
  const text=String(raw||"").trim();if(!text)return {ok:false,output:""};
  const [command,...args]=text.split(/\s+/),name=command.toLowerCase();
  if(name==="cls"){commandRecorded(ticketId,text,1);return {ok:true,output:"",clear:true};}
  if(name==="help"){commandRecorded(ticketId,text,1);return {ok:true,output:"Commands: hostname, whoami, ipconfig, ipconfig /all, ipconfig /renew, ping <host|IP>, nslookup <name>, cls"};}
  if(name==="hostname"){commandRecorded(ticketId,text,1);return {ok:true,output:machine.hostname};}
  if(name==="whoami"){commandRecorded(ticketId,text,1);return {ok:true,output:`nexus\\${machine.user.username}`};}
  if(name==="ipconfig"){
    if(args[0]?.toLowerCase()==="/renew"){commandRecorded(ticketId,text,0);const result=renewRemoteDhcp(ticketId);return {ok:result.ok,output:result.message};}
    commandRecorded(ticketId,text,1);return {ok:true,output:ipconfig(machine,args[0]?.toLowerCase()==="/all")};
  }
  if(name==="ping"){
    if(!args[0])return {ok:false,output:"Usage: ping <hostname|IP>"};commandRecorded(ticketId,text,1);return {ok:true,output:pingOutput(machine,args[0])};
  }
  if(name==="nslookup"){
    if(!args[0])return {ok:false,output:"Usage: nslookup <hostname>"};commandRecorded(ticketId,text,1);
    if(!machine.network.adapterEnabled)return {ok:false,output:"DNS request timed out. Network adapter is disabled."};
    if(!machine.network.dns.length)return {ok:false,output:"*** No DNS server is configured on this adapter."};
    // Like real nslookup, this diagnostic queries the configured DNS server directly;
    // it can still prove server-side DNS is healthy when the local DNS Client service is stopped.
    if(args[0].toLowerCase()==="intranet.nexus.local")return {ok:true,output:`Server:  ${machine.network.dns[0]}\nAddress: ${machine.network.dns[0]}\n\nName:    intranet.nexus.local\nAddress: 10.20.0.20`};
    return {ok:false,output:`*** ${machine.network.dns[0]} can't find ${args[0]}: Non-existent domain`};
  }
  commandRecorded(ticketId,text,1);return {ok:false,output:`'${command}' is not recognized as an internal or external command. Type HELP for supported diagnostics.`};
}

function verification(ticketId){
  const machine=machineForTicket(ticketId);if(!machine)return {ok:false,checks:[]};
  if(ticketId==="INC-0001")return {ok:machine.network.adapterEnabled&&machine.devices.networkAdapter==="enabled"&&validIp(machine.network.ip),checks:[`Adapter: ${machine.devices.networkAdapter}`,`IP: ${machine.network.ip}`]};
  if(ticketId==="INC-0002")return {ok:machine.network.adapterEnabled&&validIp(machine.network.ip)&&machine.services.dnsClient==="running"&&machine.network.dns.length>0,checks:[`Link/IP: ${machine.network.ip}`,`DNS Client: ${machine.services.dnsClient}`,`DNS server: ${machine.network.dns[0]||"none"}`]};
  if(ticketId==="INC-0003")return {ok:machine.network.adapterEnabled&&machine.services.dhcpClient==="running"&&validIp(machine.network.ip)&&!!machine.network.gateway&&machine.network.dns.length>0,checks:[`DHCP Client: ${machine.services.dhcpClient}`,`IP: ${machine.network.ip}`,`Gateway: ${machine.network.gateway||"none"}`,`DNS: ${machine.network.dns[0]||"none"}`]};
  return {ok:false,checks:[]};
}

export function verifyTicket(ticketId){
  const result=verification(ticketId);noteAction(ticketId,"ticket:verify",{kind:"verification",minutes:1});return {...result,message:result.ok?"Verification passed. The reported fault is no longer present.":"Verification failed. The reported issue still appears unresolved."};
}

function scoreTicket(ticketId){
  const def=ticket(ticketId),p=progress(ticketId);if(!def||!p)return 0;
  let score=70;
  if(def.relevantTools.some(tool=>p.observedTools.includes(tool)))score+=10;
  if(def.relevantCommands.some(command=>p.commands.includes(command)))score+=10;
  const expected=new Set(def.expectedActions);
  const changes=p.actions.filter(a=>a.kind==="change").map(a=>a.type);
  const unrelated=changes.filter(type=>!expected.has(type));
  if(!unrelated.length)score+=10;else score-=Math.min(20,unrelated.length*5);
  return Math.max(0,Math.min(100,score));
}
function unlockNext(def,hd){
  if(!def?.nextTicketId)return;
  const id=def.nextTicketId;if(!hd.availableTickets.includes(id)&&!hd.activeTickets.includes(id)&&!hd.completedTickets.includes(id))hd.availableTickets.push(id);
}

export function resolveTicket(ticketId){
  const hd=initServiceDesk(),def=ticket(ticketId),p=progress(ticketId);if(!def||!p||!hd.activeTickets.includes(ticketId))return {ok:false,message:"Ticket is not In Progress."};
  const check=verification(ticketId);if(!check.ok)return {ok:false,message:"Resolution rejected: verification still detects the reported fault.",checks:check.checks};
  const score=scoreTicket(ticketId);p.status="Resolved";p.score=score;p.resolvedAt=absoluteNow();
  hd.activeTickets=hd.activeTickets.filter(id=>id!==ticketId);if(!hd.completedTickets.includes(ticketId))hd.completedTickets.push(ticketId);hd.job.resolved+=1;hd.job.score+=score;unlockNext(def,hd);
  if(hd.remoteSession?.ticketId===ticketId)hd.remoteSession=null;
  emit("helpdesk:changed",{ticketId,type:"resolved",score});
  return {ok:true,message:`${ticketId} resolved. Ticket review: ${score}/100.`,score,checks:check.checks};
}

export function escalateTicket(ticketId){
  const hd=initServiceDesk(),def=ticket(ticketId),p=progress(ticketId);if(!def||!p||!hd.activeTickets.includes(ticketId))return {ok:false,message:"Ticket is not In Progress."};
  if(!p.notes.trim())return {ok:false,message:"Add a work note describing your findings before escalating."};
  p.status="Escalated";p.score=30;p.resolvedAt=absoluteNow();hd.activeTickets=hd.activeTickets.filter(id=>id!==ticketId);if(!hd.completedTickets.includes(ticketId))hd.completedTickets.push(ticketId);hd.job.escalated+=1;hd.job.score+=30;unlockNext(def,hd);
  if(hd.remoteSession?.ticketId===ticketId)hd.remoteSession=null;emit("helpdesk:changed",{ticketId,type:"escalated",score:30});
  return {ok:true,message:`${ticketId} escalated with documentation.`,score:30};
}

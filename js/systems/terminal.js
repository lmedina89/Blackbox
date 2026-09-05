import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { CLUES } from "../data/clues.js";
import { listDir, normalizePath, getNode, readFile } from "./filesystem.js";
import { scan, connect, disconnect, resolveTarget, canReach, displayName } from "./network.js";
import { discoverHost } from "./clues.js";
import { emit } from "../core/events.js";
import { missionView } from "./missions.js";
import { learn, proficiencyLabel } from "./progression.js";
import { saveTarget, removeTarget, getSavedTargets, missionTitle, activeMissionForHost } from "./targets.js";
import { advanceWorld } from "./timeline.js";
import { lookupDns, formatDnsResult } from "./dns.js";
import { MISSIONS } from "../data/missions.js";

const commands=new Map(),aliases=new Map();
const MEANINGFUL_COMMANDS=new Set(["scan","connect","ip","services","netstat","ping","nslookup","traceroute","cat","head","tail","grep","find","download"]);
const line=t=>({lines:[{text:t}]});

export function registerCommand(def){
  commands.set(def.name.toLowerCase(),def);
  for(const a of def.aliases||[])aliases.set(a.toLowerCase(),def.name.toLowerCase());
}
function localUser(s){return (s.player.alias||"user").toLowerCase().replace(/\s+/g,"_");}
export function getPrompt(){
  const s=getState(),h=HOSTS[s.terminal.hostId],home=h.homeDir||"/home";
  if(s.terminal.hostId==="home")s.terminal.user=localUser(s);
  const tail=s.terminal.cwd===home?"~":s.terminal.cwd;
  return `${s.terminal.user}@${h.hostname.toLowerCase()}:${tail}$`;
}
function preprocess(raw){
  const trimmed=raw.trim();
  if(/^cd\.\.$/i.test(trimmed))return "cd ..";
  if(/^cd\/$/i.test(trimmed))return "cd /";
  return trimmed;
}
function emitCommand(name,args,actionKey){emit("command:used",{name,args,hostId:getState().terminal.hostId,actionKey});}
function scanRecord(h,index){
  const s=getState(),detail=s.player.installedHardware.includes("nic_fast");
  const name=displayName(h.id);
  const serviceCount=h.services.filter(x=>x.port).length;
  const serviceSummary=`${serviceCount} service${serviceCount===1?"":"s"}`;
  const serviceDetail=h.services.filter(x=>x.port).map(x=>`${x.port}/tcp ${x.name}`).join(" · ");
  const mission=activeMissionForHost(h.id);
  const saved=(s.player.savedTargets||[]).some(x=>x.hostId===h.id);
  const tag=mission&&saved?" · mission target saved":"";
  return `[${index}] ${h.address}\n    ${name} · ${serviceSummary}${tag}${detail&&serviceDetail?`\n    ${serviceDetail}`:""}`;
}
function scanTarget(state,value){
  if(/^\d+$/.test(String(value))){
    const id=state.terminal.lastScanResults?.[Number(value)];
    if(id)return HOSTS[id];
  }
  const h=resolveTarget(value);
  if(!h)return null;
  if(h.id===state.terminal.hostId)return h;
  const known=(state.player.seenHosts||[]).includes(h.id)||(state.player.identifiedHosts||[]).includes(h.id);
  return known?h:null;
}
function savedTarget(state,value){
  if(!/^\d+$/.test(String(value)))return null;
  const entry=(state.player.savedTargets||[])[Number(value)];
  return entry?HOSTS[entry.hostId]:null;
}
function fileText(state,arg){
  const path=normalizePath(state.terminal.cwd,arg,state.terminal.hostId);
  return {path,body:readFile(state.terminal.hostId,path)};
}

function canonicalToken(value){return String(value||"").trim().toLowerCase().replace(/\.$/,"");}
function resolvedHostId(state,value){
  return (scanTarget(state,value)||savedTarget(state,value)||resolveTarget(value))?.id||canonicalToken(value);
}
function connectTargetId(state,args){
  const mode=canonicalToken(args[0]);
  if(mode==="scan")return scanTarget(state,args[1])?.id||canonicalToken(args[1]);
  if(mode==="target")return savedTarget(state,args[1])?.id||canonicalToken(args[1]);
  if(/^\d+$/.test(String(args[0]||""))){
    const scanHit=scanTarget(state,args[0]),savedHit=savedTarget(state,args[0]);
    return (scanHit||savedHit)?.id||canonicalToken(args[0]);
  }
  return scanTarget(state,args[0])?.id||canonicalToken(args[0]);
}

export function semanticActionKey(name,args,state=getState()){
  const hostId=state.terminal.hostId;
  if(name==="connect")return `cmd:connect:${connectTargetId(state,args)}`;
  if(name==="nslookup"){
    const dnsName=canonicalToken(args[0]),type=String(args[1]||"ANY").trim().toUpperCase();
    return `cmd:nslookup:${hostId}:${dnsName}:${type}`;
  }
  if(name==="services")return `cmd:services:${hostId}:${args[0]?resolvedHostId(state,args[0]):hostId}`;
  if(name==="ping"||name==="traceroute")return `cmd:${name}:${hostId}:${resolvedHostId(state,args[0])}`;
  if(["cat","head","tail","download"].includes(name)){
    return `cmd:${name}:${hostId}:${normalizePath(state.terminal.cwd,args[0],hostId)}`;
  }
  if(name==="grep")return `cmd:grep:${hostId}:${normalizePath(state.terminal.cwd,args[1],hostId)}`;
  if(name==="find"){
    const base=args.length>1?normalizePath(state.terminal.cwd,args[0],hostId):state.terminal.cwd;
    return `cmd:find:${hostId}:${base}`;
  }
  return `cmd:${name}:${hostId}`;
}

export async function executeCommand(raw){
  const s=getState(),text=preprocess(raw);
  if(!text)return {lines:[]};
  s.terminal.history.push(text);
  if(s.terminal.history.length>100)s.terminal.history.shift();
  s.terminal.historyIndex=s.terminal.history.length;
  const [rawHead,...args]=text.split(/\s+/),head=rawHead.toLowerCase(),name=aliases.get(head)||head,cmd=commands.get(name);
  if(!cmd)return {lines:[{text:`${rawHead}: command not found`,type:"error"}]};
  try{
    const actionKey=MEANINGFUL_COMMANDS.has(name)?semanticActionKey(name,args,s):null;
    const result=await cmd.execute({state:s,args})||{lines:[]};
    emitCommand(name,args,actionKey);
    const advancedWorld=actionKey?advanceWorld(actionKey,{minutes:name==="scan"?4:3,once:true}):false;
    emit("command:committed",{name,args,hostId:s.terminal.hostId,actionKey,advancedWorld});
    return result;
  }
  catch(err){return {lines:[{text:err.message||"Command failed",type:"error"}]};}
}

registerCommand({name:"help",aliases:["?"],execute(){return line([
"BLACKBOX COMMAND INDEX","",
"SYSTEM",
"  help              command index",
"  clear             clear terminal",
"  whoami            current user",
"  hostname          current host",
"  uname [-a]        system information",
"  ps                process table",
"  services [host]   inspect listening services",
"  netstat           network connections",
"  history           command history",
"  skills            learned proficiencies","",
"FILES",
"  pwd               print working directory",
"  ls [path]         list directory",
"  cd <path>         change directory",
"  cat <file>        read file",
"  head <file>       first lines of file",
"  tail <file>       last lines of file",
"  grep <text> <file> filter matching lines",
"  find [path] <name> locate files",
"  download <file>   record evidence on HOME-PC","",
"NETWORK",
"  ip                inspect network interfaces",
"  ping <host>       test current-host reachability",
"  nslookup <name> [type] simulated DNS lookup",
"  scan              discover hosts reachable FROM this machine",
"  targets           saved target list",
"  target add <host|#> save scan result/host",
"  target remove <#>   remove saved target",
"  target info <#>     inspect known target data",
"  connect scan <#>   connect to recent scan result",
"  connect target <#> connect to saved target",
"  connect <host|ip>  connect by known name/address",
"  traceroute <host> show simulated route","",
"GAME",
"  missions          active objectives",
"  clues             discovered information",
"  purge identity    archive & reset",
"  exit              close remote/local session"
].join("\n"));}});

registerCommand({name:"clear",execute(){return {clear:true,lines:[]};}});
registerCommand({name:"pwd",execute({state}){learn("pwd","systems");return line(state.terminal.cwd);}});
registerCommand({name:"whoami",execute({state}){return line(state.terminal.hostId==="home"?localUser(state):state.terminal.user);}});
registerCommand({name:"hostname",execute({state}){return line(HOSTS[state.terminal.hostId].hostname);}});
registerCommand({name:"uname",execute({state,args}){const h=HOSTS[state.terminal.hostId];learn("uname","systems");return line(args.includes("-a")?`${h.os} ${h.hostname} simnet x86_64 BLACKBOX`:h.os);}});
registerCommand({name:"history",execute({state}){return line(state.terminal.history.map((x,i)=>`${i+1}  ${x}`).join("\n"));}});
registerCommand({name:"ps",execute({state}){const h=HOSTS[state.terminal.hostId];learn("ps","systems");return line([" PID USER       CPU  MEM  COMMAND",...h.processes.map(x=>`${String(x.pid).padStart(4)} ${x.user.padEnd(10)} ${x.cpu.padStart(4)} ${x.mem.padStart(4)}  ${x.name}`)].join("\n"));}});
registerCommand({name:"services",execute({state,args}){
  let h=HOSTS[state.terminal.hostId],remote=false;
  if(args[0]){
    h=scanTarget(state,args[0])||savedTarget(state,args[0]);
    if(!h)throw new Error("services: unknown host, saved target, or scan result");
    if(h.id!==state.terminal.hostId&&!canReach(h.id))throw new Error("services: host is not reachable from current machine");
    remote=h.id!==state.terminal.hostId;
  }
  learn(`services:${h.id}`,"systems");
  const rows=h.services.filter(x=>x.port);
  if(remote&&!state.player.installedHardware.includes("nic_fast")){
    return line(`SERVICES ${h.address}\n${rows.length} network service${rows.length===1?"":"s"} detected.\nFastLink 100 required for remote port/service detail.`);
  }
  return line([`SERVICES ${displayName(h.id)} (${h.address})`,"PORT     SERVICE        STATE",...rows.map(x=>`${String(x.port).padEnd(8)} ${x.name.padEnd(14)} ${x.state}`)].join("\n"));
}});
registerCommand({name:"netstat",execute({state}){const h=HOSTS[state.terminal.hostId];learn(`netstat:${state.terminal.hostId}`,"network");return line(["Proto Local Address          Remote Address         State",...h.connections.map(x=>`${x.proto.padEnd(5)} ${x.local.padEnd(22)} ${x.remote.padEnd(22)} ${x.state}`)].join("\n"));}});
registerCommand({name:"skills",execute({state}){const p=state.player.proficiencies;return line(["PROFICIENCIES","",...Object.entries(p).map(([k,v])=>`${k.toUpperCase().padEnd(10)} ${proficiencyLabel(v).padEnd(10)} (${v})`)].join("\n"));}});

registerCommand({name:"ls",execute({state,args}){const path=normalizePath(state.terminal.cwd,args[0]||".",state.terminal.hostId),rows=listDir(state.terminal.hostId,path);learn("ls","systems");return line(rows.map(x=>x.type==="dir"?`${x.name}/`:x.name).join("  "));}});
registerCommand({name:"cd",execute({state,args}){const path=normalizePath(state.terminal.cwd,args[0]||"~",state.terminal.hostId),node=getNode(state.terminal.hostId,path);if(!node)throw new Error("cd: no such directory");if(node.type!=="dir")throw new Error("cd: not a directory");state.terminal.cwd=path;learn("cd","systems");return {lines:[]};}});
registerCommand({name:"cat",execute({state,args}){if(!args[0])throw new Error("cat: missing file operand");const {path,body}=fileText(state,args[0]);emit("file:read",{hostId:state.terminal.hostId,path});learn("cat","systems");return line(body);}});
registerCommand({name:"head",execute({state,args}){if(!args[0])throw new Error("head: missing file operand");const {path,body}=fileText(state,args[0]);emit("file:read",{hostId:state.terminal.hostId,path});learn(`head:${state.terminal.hostId}`,"analysis");return line(body.split("\n").slice(0,5).join("\n"));}});
registerCommand({name:"tail",execute({state,args}){if(!args[0])throw new Error("tail: missing file operand");const {path,body}=fileText(state,args[0]);emit("file:read",{hostId:state.terminal.hostId,path});learn(`tail:${state.terminal.hostId}`,"analysis");return line(body.split("\n").slice(-5).join("\n"));}});
registerCommand({name:"grep",execute({state,args}){if(args.length<2)throw new Error("usage: grep <text> <file>");const needle=args[0],canonicalQuery=needle.toLowerCase(),{path,body}=fileText(state,args[1]),matches=body.split("\n").filter(x=>x.toLowerCase().includes(canonicalQuery));emit("file:searched",{hostId:state.terminal.hostId,path,query:canonicalQuery,canonicalQuery,rawQuery:needle});learn(`grep:${state.terminal.hostId}`,"analysis",2);const result=matches.length?matches.join("\n"):"grep: no matches";return line((state.player.installedSoftware||[]).includes("logscope")?`${result}\n\nLogScope: ${matches.length} matching line${matches.length===1?"":"s"}; query recorded for correlation.`:result);}});
function walk(node,path,out,needle){if(node.type==="file"){if(path.toLowerCase().includes(needle.toLowerCase()))out.push(path);return;}for(const [name,child] of Object.entries(node.children||{}))walk(child,`${path==="/"?"/":path+"/"}${name}`,out,needle);}
registerCommand({name:"find",execute({state,args}){if(!args.length)throw new Error("usage: find [path] <name>");const needle=args.at(-1),base=args.length>1?normalizePath(state.terminal.cwd,args[0],state.terminal.hostId):state.terminal.cwd,node=getNode(state.terminal.hostId,base);if(!node)throw new Error("find: path not found");const out=[];walk(node,base,out,needle);learn(`find:${state.terminal.hostId}`,"analysis");return line(out.length?out.join("\n"):"find: no matches");}});
function requiredEvidenceIds(){
  return new Set(MISSIONS.flatMap(m=>m.objectives||[]).filter(o=>o.type==="file_downloaded").map(o=>o.target));
}
const REQUIRED_EVIDENCE=requiredEvidenceIds();
registerCommand({name:"download",execute({state,args}){
  if(state.terminal.hostId==="home")throw new Error("download: already on HOME-PC");
  if(!args[0])throw new Error("download: missing file operand");
  const {path}=fileText(state,args[0]),id=`${state.terminal.hostId}:${path}`;
  state.player.downloads??=[];
  const alreadyStored=state.player.downloads.includes(id);
  if(!alreadyStored){
    const capacity=state.player.installedHardware.includes("hdd_20gb")?8:2;
    const optionalCount=state.player.downloads.filter(item=>!REQUIRED_EVIDENCE.has(item)).length;
    if(!REQUIRED_EVIDENCE.has(id)&&optionalCount>=capacity)throw new Error(`download: optional evidence storage full (${capacity} files)`);
    state.player.downloads.push(id);
  }
  emit("file:downloaded",{hostId:state.terminal.hostId,path,alreadyStored});
  learn("download","systems");
  return line(alreadyStored
    ? `Evidence already recorded: ${path}\nExisting HOME-PC evidence reference reused.`
    : `Transfer verified: ${path}\nEvidence reference recorded in HOME-PC evidence register.`);
}});

registerCommand({name:"ip",execute({state}){const h=HOSTS[state.terminal.hostId];learn(`ip:${state.terminal.hostId}`,"network",2);return line(["INTERFACES",...h.interfaces.map(i=>`${i.name.padEnd(6)} ${i.address}/${i.cidr}${i.gateway?`  gateway ${i.gateway}`:""}`)].join("\n"));}});
registerCommand({name:"nslookup",execute({state,args}){
  if(!args[0])throw new Error("usage: nslookup <fictional-name> [A|CNAME|MX]");
  const result=lookupDns(args[0],args[1]||"ANY");
  learn(`nslookup:${result.name}`,"network",2);
  return line(formatDnsResult(result,{detailed:(state.player.installedSoftware||[]).includes("resolver_pro")}));
}});
registerCommand({name:"scan",execute({state}){
  const rows=scan();
  state.terminal.lastScanResults=rows.map(h=>h.id);
  for(const h of rows)discoverHost(h.id);
  learn(`scan:${state.terminal.hostId}`,"network",2);
  const host=HOSTS[state.terminal.hostId];
  return line([
    "BLACKBOX ACTIVE DISCOVERY",
    `Scanning routes from ${host.hostname}...`,
    "",
    ...(rows.length?rows.map((h,i)=>scanRecord(h,i)):["No additional reachable hosts from this interface."]),
    "",
    'Numbers above are temporary scan results.',
    'Use "connect scan <#>" now, or "target add scan <#>" to save one.',
    "Scan complete."
  ].join("\n"));
}});

registerCommand({name:"targets",aliases:["hosts"],execute({state}){
  const entries=getSavedTargets();
  if(!entries.length)return line('No saved targets. Use "target add <host|scan #>" or discover an active mission target.');
  return line(["SAVED TARGETS","",...entries.map((entry,i)=>{
    const h=HOSTS[entry.hostId],mission=missionTitle(entry.missionId);
    const source=entry.source==="mission"?(mission?`${mission} · mission`:"mission"):"manual";
    return `[${i}] ${displayName(h.id)}\n    ${h.address} · ${source}`;
  }),"",'Use "connect target <#>" to open a saved host.'].join("\n"));
}});

registerCommand({name:"target",execute({state,args}){
  const action=String(args[0]||"").toLowerCase();
  let value=args[1];
  if(action==="add"){
    if(value===undefined)throw new Error("usage: target add <host|ip> | target add scan <#>");
    if(String(value).toLowerCase()==="scan")value=args[2];
    if(value===undefined)throw new Error("usage: target add scan <#>");
    const h=scanTarget(state,value);
    if(!h)throw new Error("target: unknown host or scan result");
    if(h.id==="home")throw new Error("target: HOME-PC cannot be saved as a target");
    const result=saveTarget(h.id,{source:"manual"});
    return line(result.added?`Target saved: ${displayName(h.id)} (${h.address})`:`Target already saved: ${displayName(h.id)} (${h.address})`);
  }
  if(action==="remove"){
    if(value===undefined||!/^\d+$/.test(value))throw new Error("usage: target remove <#>");
    const removed=removeTarget(Number(value));
    if(!removed)throw new Error("target: saved target number not found");
    const h=HOSTS[removed.hostId];
    return line(`Target removed: ${displayName(h.id)} (${h.address})`);
  }
  if(action==="info"){
    if(value===undefined||!/^\d+$/.test(value))throw new Error("usage: target info <#>");
    const entry=(state.player.savedTargets||[])[Number(value)];
    if(!entry)throw new Error("target: saved target number not found");
    const h=HOSTS[entry.hostId],mission=missionTitle(entry.missionId);
    const seen=(state.player.seenHosts||[]).includes(h.id);
    const status=h.id===state.terminal.hostId?"current host":canReach(h.id)?"reachable":seen?"seen · not reachable from current host":"known · not yet scanned";
    const source=entry.source==="mission"?(mission?`${mission} mission`:"mission"):"manual";
    const serviceKnowledge=state.player.installedHardware.includes("nic_fast")||state.terminal.hostId===h.id
      ? `${h.services.filter(x=>x.port).length} known`
      : "basic count only";
    return line(["TARGET RECORD","",`Host:       ${displayName(h.id)}`,`Address:    ${h.address}`,`Status:     ${status}`,`Services:   ${serviceKnowledge}`,`Source:     ${source}`,`Associated: ${mission||"none"}`].join("\n"));
  }
  throw new Error("usage: target add <host|#> | target remove <#> | target info <#>");
}});

registerCommand({name:"ping",execute({state,args}){
  if(!args[0])throw new Error("ping: specify host");
  const h=scanTarget(state,args[0])||savedTarget(state,args[0]);
  if(!h)throw new Error("ping: unknown host");
  if(h.id===state.terminal.hostId)return line(`PING ${displayName(h.id)} (${h.address})\nreply from ${h.address}: time<1ms (local interface)`);
  learn(`ping:${h.id}`,"network");
  return canReach(h.id)?line(`PING ${displayName(h.id)} (${h.address})\nreply from ${h.address}: time=18ms\nreply from ${h.address}: time=17ms`):line(`PING ${displayName(h.id)} (${h.address})\nDestination unreachable from ${HOSTS[state.terminal.hostId].hostname}.`);
}});

registerCommand({name:"traceroute",aliases:["tracepath"],execute({state,args}){
  if(!args[0])throw new Error("traceroute: specify host");
  if(state.terminal.hostId==="axiomrelay"&&args[0]==="198.51.100.27"){
    learn("traceroute:axiom-peer","network",2);
    return line("traceroute to 198.51.100.27\n1  10.60.9.1  3 ms\n2  203.0.113.9  21 ms\n3  198.51.100.27  34 ms");
  }
  const h=scanTarget(state,args[0])||savedTarget(state,args[0]);
  if(!h)throw new Error("traceroute: unknown host");
  learn(`traceroute:${state.terminal.hostId}:${h.id}`,"network",2);
  if(h.id===state.terminal.hostId)return line(`traceroute to ${displayName(h.id)}\n1  ${h.address}  <1 ms`);
  if(!canReach(h.id))return line(`traceroute to ${displayName(h.id)}\n1  * * *\nroute unavailable from current host`);
  const cur=HOSTS[state.terminal.hostId];
  return line(`traceroute to ${displayName(h.id)} (${h.address})\n1  ${cur.interfaces[0].gateway||cur.address}  4 ms\n2  ${h.address}  18 ms`);
}});

registerCommand({name:"connect",execute({state,args}){
  if(!args[0])throw new Error("connect: use a hostname/IP, scan <#>, or target <#>");
  let target=args[0],h=null;
  const mode=String(args[0]).toLowerCase();
  if(mode==="scan"||mode==="target"){
    if(args[1]===undefined||!/^\d+$/.test(args[1]))throw new Error(`usage: connect ${mode} <#>`);
    h=mode==="scan"?scanTarget(state,args[1]):savedTarget(state,args[1]);
    if(!h)throw new Error(`connect: ${mode} number not found`);
    target=h.id;
  }else if(/^\d+$/.test(target)){
    const scanHit=scanTarget(state,target),savedHit=savedTarget(state,target);
    if(scanHit&&savedHit&&scanHit.id!==savedHit.id)throw new Error(`connect: number ${target} is ambiguous; use "connect scan ${target}" or "connect target ${target}"`);
    h=scanHit||savedHit;
    if(!h)throw new Error('connect: number not found; run "scan" or review "targets"');
    target=h.id;
  }else{
    h=scanTarget(state,target);
    if(!h)throw new Error("connect: host is not known to BLACKBOX");
    target=h.id;
  }
  const from=HOSTS[state.terminal.hostId].hostname;
  const connected=connect(target);
  discoverHost(connected.id);
  learn(`connect:${connected.id}`,"network");
  return line(`Resolving ${connected.hostname}...\nRoute found from ${from}.\nNegotiating session...\nIdentity: ${state.terminal.user}\nHandshake accepted.\nConnected to ${connected.hostname} (${connected.address}).`);
}});

registerCommand({name:"missions",aliases:["jobs"],execute(){const a=missionView();if(!a.length)return line("No active jobs.");return line(a.map(m=>`${m.title}\n${m.objectives.map(o=>`${m.progress[o.id]?"[x]":"[ ]"} ${o.label}`).join("\n")}`).join("\n\n"));}});
registerCommand({name:"clues",execute({state}){
  const known=state.player.discoveredClues.map(id=>CLUES.find(c=>c.id===id)).filter(Boolean);
  if(!known.length)return line("No case clues or world intel recorded.");
  const cases=known.filter(c=>c.kind!=="world"),world=known.filter(c=>c.kind==="world");
  const out=["DISCOVERED INFORMATION",""];
  if(cases.length)out.push("CASE CLUES",...cases.map((c,i)=>`${String(i+1).padStart(2,"0")}  ${c.title}`),"");
  if(world.length)out.push("WORLD INTEL",...world.map((c,i)=>`${String(i+1).padStart(2,"0")}  ${c.title}`),"", "World intel is optional. It does not create a mission or objective.");
  return line(out.join("\n"));
}});
registerCommand({name:"purge",execute({state,args}){if(String(args[0]||"").toLowerCase()!=="identity")throw new Error("usage: purge identity");if(state.terminal.hostId!=="home")throw new Error("purge: disconnect from the remote host first");state.terminal.pendingAction="purge_identity";return line(["BLACKBOX IDENTITY PURGE","",`Current alias: ${state.player.alias}`,`Current day: ${state.world.day}`,"","WARNING: This will terminate the active identity.","The life will be archived. No archived save will be deleted.","","Type: CONFIRM PURGE",'Or type "cancel" to abort.'].join("\n"));}});
registerCommand({name:"confirm",execute({state,args}){if(String(args[0]||"").toLowerCase()!=="purge"||state.terminal.pendingAction!=="purge_identity")throw new Error("confirm: no identity purge is pending");state.terminal.pendingAction=null;return {purgeIdentity:true,lines:[{text:"PURGE AUTHORIZATION ACCEPTED",type:"dim"}]};}});
registerCommand({name:"cancel",execute({state}){if(!state.terminal.pendingAction)return line("Nothing pending.");state.terminal.pendingAction=null;return line("Pending action cancelled.");}});
registerCommand({name:"exit",execute({state}){if(state.terminal.hostId!=="home"){disconnect();return line("Connection closed by remote host.\nReturned to local BLACKBOX shell.");}state.terminal.lastScanResults=[];state.terminal.sessionOpen=false;state.terminal.suspended=false;emit("terminal:exit");return line("Closing BLACKBOX session...");}});

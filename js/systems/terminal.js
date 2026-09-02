import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { listDir, normalizePath, getNode, readFile } from "./filesystem.js";
import { scan, connect, disconnect, resolveTarget, canReach } from "./network.js";
import { discoverHost } from "./clues.js";
import { emit } from "../core/events.js";
import { missionView } from "./missions.js";
import { learn, proficiencyLabel } from "./progression.js";

const commands=new Map(),aliases=new Map();
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
function emitCommand(name,args){emit("command:used",{name,args,hostId:getState().terminal.hostId});}
function hostLines(h){
  const s=getState(),detail=s.player.installedHardware.includes("nic_fast");
  const services=detail?h.services.filter(x=>x.port).map(x=>`${x.name}:${x.port}`).join(", "):`${h.services.filter(x=>x.port).length} service(s)`;
  return `${h.address.padEnd(15)} ${h.hostname.padEnd(14)} ${services}`;
}
function rememberedNumber(state,id){return (state.player.discoveredHosts||[]).indexOf(id);}
function fileText(state,arg){
  const path=normalizePath(state.terminal.cwd,arg,state.terminal.hostId);
  return {path,body:readFile(state.terminal.hostId,path)};
}

export async function executeCommand(raw){
  const s=getState(),text=preprocess(raw);
  if(!text)return {lines:[]};
  s.terminal.history.push(text);
  if(s.terminal.history.length>100)s.terminal.history.shift();
  s.terminal.historyIndex=s.terminal.history.length;
  const [rawHead,...args]=text.split(/\s+/),head=rawHead.toLowerCase(),name=aliases.get(head)||head,cmd=commands.get(name);
  if(!cmd)return {lines:[{text:`${rawHead}: command not found`,type:"error"}]};
  try{const result=await cmd.execute({state:s,args})||{lines:[]};emitCommand(name,args);return result;}
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
"  services          listening services",
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
"  download <file>   copy evidence to HOME-PC","",
"NETWORK",
"  ip                inspect network interfaces",
"  ping <host>       test current-host reachability",
"  scan              discover hosts reachable FROM this machine",
"  targets           remembered hosts",
"  connect <host|#>  open simulated remote shell",
"  traceroute <host> show simulated route","",
"GAME",
"  missions          active objectives",
"  clues             discovered information",
"  purge identity    archive and terminate current identity",
"  exit              close remote/local session"
].join("\n"));}});

registerCommand({name:"clear",execute(){return {clear:true,lines:[]};}});
registerCommand({name:"pwd",execute({state}){learn("pwd","systems");return line(state.terminal.cwd);}});
registerCommand({name:"whoami",execute({state}){return line(state.terminal.hostId==="home"?localUser(state):state.terminal.user);}});
registerCommand({name:"hostname",execute({state}){return line(HOSTS[state.terminal.hostId].hostname);}});
registerCommand({name:"uname",execute({state,args}){const h=HOSTS[state.terminal.hostId];learn("uname","systems");return line(args.includes("-a")?`${h.os} ${h.hostname} simnet x86_64 BLACKBOX`:h.os);}});
registerCommand({name:"history",execute({state}){return line(state.terminal.history.map((x,i)=>`${i+1}  ${x}`).join("\n"));}});
registerCommand({name:"ps",execute({state}){const h=HOSTS[state.terminal.hostId];learn("ps","systems");return line([" PID USER       CPU  MEM  COMMAND",...h.processes.map(x=>`${String(x.pid).padStart(4)} ${x.user.padEnd(10)} ${x.cpu.padStart(4)} ${x.mem.padStart(4)}  ${x.name}`)].join("\n"));}});
registerCommand({name:"services",execute({state}){const h=HOSTS[state.terminal.hostId];learn("services","systems");return line(["SERVICE        PORT   STATE",...h.services.map(x=>`${x.name.padEnd(14)} ${String(x.port).padEnd(6)} ${x.state}`)].join("\n"));}});
registerCommand({name:"netstat",execute({state}){const h=HOSTS[state.terminal.hostId];learn("netstat","network");return line(["Proto Local Address          Remote Address         State",...h.connections.map(x=>`${x.proto.padEnd(5)} ${x.local.padEnd(22)} ${x.remote.padEnd(22)} ${x.state}`)].join("\n"));}});
registerCommand({name:"skills",execute({state}){const p=state.player.proficiencies;return line(["PROFICIENCIES","",...Object.entries(p).map(([k,v])=>`${k.toUpperCase().padEnd(10)} ${proficiencyLabel(v).padEnd(10)} (${v})`)].join("\n"));}});

registerCommand({name:"ls",execute({state,args}){const path=normalizePath(state.terminal.cwd,args[0]||".",state.terminal.hostId),rows=listDir(state.terminal.hostId,path);learn("ls","systems");return line(rows.map(x=>x.type==="dir"?`${x.name}/`:x.name).join("  "));}});
registerCommand({name:"cd",execute({state,args}){const path=normalizePath(state.terminal.cwd,args[0]||"~",state.terminal.hostId),node=getNode(state.terminal.hostId,path);if(!node)throw new Error("cd: no such directory");if(node.type!=="dir")throw new Error("cd: not a directory");state.terminal.cwd=path;learn("cd","systems");return {lines:[]};}});
registerCommand({name:"cat",execute({state,args}){if(!args[0])throw new Error("cat: missing file operand");const {path,body}=fileText(state,args[0]);emit("file:read",{hostId:state.terminal.hostId,path});learn("cat","systems");return line(body);}});
registerCommand({name:"head",execute({state,args}){if(!args[0])throw new Error("head: missing file operand");const {path,body}=fileText(state,args[0]);emit("file:read",{hostId:state.terminal.hostId,path});learn("head","analysis");return line(body.split("\n").slice(0,5).join("\n"));}});
registerCommand({name:"tail",execute({state,args}){if(!args[0])throw new Error("tail: missing file operand");const {path,body}=fileText(state,args[0]);emit("file:read",{hostId:state.terminal.hostId,path});learn("tail","analysis");return line(body.split("\n").slice(-5).join("\n"));}});
registerCommand({name:"grep",execute({state,args}){if(args.length<2)throw new Error("usage: grep <text> <file>");const needle=args[0],{path,body}=fileText(state,args[1]),matches=body.split("\n").filter(x=>x.toLowerCase().includes(needle.toLowerCase()));emit("file:searched",{hostId:state.terminal.hostId,path,query:needle});learn("grep","analysis",2);return line(matches.length?matches.join("\n"):"grep: no matches");}});
function walk(node,path,out,needle){if(node.type==="file"){if(path.toLowerCase().includes(needle.toLowerCase()))out.push(path);return;}for(const [name,child] of Object.entries(node.children||{}))walk(child,`${path==="/"?"/":path+"/"}${name}`,out,needle);}
registerCommand({name:"find",execute({state,args}){if(!args.length)throw new Error("usage: find [path] <name>");const needle=args.at(-1),base=args.length>1?normalizePath(state.terminal.cwd,args[0],state.terminal.hostId):state.terminal.cwd,node=getNode(state.terminal.hostId,base);if(!node)throw new Error("find: path not found");const out=[];walk(node,base,out,needle);learn("find","analysis");return line(out.length?out.join("\n"):"find: no matches");}});
registerCommand({name:"download",execute({state,args}){if(state.terminal.hostId==="home")throw new Error("download: already on HOME-PC");if(!args[0])throw new Error("download: missing file operand");const {path}=fileText(state,args[0]);const capacity=state.player.installedHardware.includes("hdd_20gb")?8:2;if(state.player.downloads.length>=capacity)throw new Error(`download: local evidence storage full (${capacity} files)`);const id=`${state.terminal.hostId}:${path}`;if(!state.player.downloads.includes(id))state.player.downloads.push(id);emit("file:downloaded",{hostId:state.terminal.hostId,path});learn("download","systems");return line(`Transferred ${path} -> HOME-PC:/home/downloads/\nEvidence stored locally.`);}});

registerCommand({name:"ip",execute({state}){const h=HOSTS[state.terminal.hostId];learn("ip","network",2);return line(["INTERFACES",...h.interfaces.map(i=>`${i.name.padEnd(6)} ${i.address}/${i.cidr}${i.gateway?`  gateway ${i.gateway}`:""}`)].join("\n"));}});
registerCommand({name:"scan",execute({state}){const rows=scan();for(const h of rows)discoverHost(h.id);learn(`scan:${state.terminal.hostId}`,"network",2);const host=HOSTS[state.terminal.hostId];return line(["BLACKBOX ACTIVE DISCOVERY",`Scanning routes from ${host.hostname}...`,"",...(rows.length?rows.map(h=>{const n=rememberedNumber(state,h.id);return `[${n}] ${hostLines(h)}`;}):["No additional reachable hosts from this interface."]),"",'Use "targets" or "connect <number>" to reuse a discovered host.',"Scan complete."].join("\n"));}});
registerCommand({name:"targets",aliases:["hosts"],execute({state}){const rows=(state.player.discoveredHosts||[]).map(id=>HOSTS[id]).filter(Boolean);if(!rows.length)return line('No remembered hosts. Investigate NEXUS/OS or run "scan".');return line(["REMEMBERED TARGETS","",...rows.map((h,i)=>`[${i}] ${h.hostname.padEnd(14)} ${h.address}`)].join("\n"));}});
registerCommand({name:"ping",execute({state,args}){if(!args[0])throw new Error("ping: specify host");const h=resolveTarget(args[0]);if(!h)throw new Error("ping: unknown host");if(h.id===state.terminal.hostId)return line(`PING ${h.hostname} (${h.address})\nreply from ${h.address}: time<1ms (local interface)`);learn("ping","network");return canReach(h.id)?line(`PING ${h.hostname} (${h.address})\nreply from ${h.address}: time=18ms\nreply from ${h.address}: time=17ms`):line(`PING ${h.hostname} (${h.address})\nDestination unreachable from ${HOSTS[state.terminal.hostId].hostname}.`);}});
registerCommand({name:"traceroute",aliases:["tracepath"],execute({state,args}){if(!args[0])throw new Error("traceroute: specify host");if(state.terminal.hostId==="axiomrelay"&&args[0]==="198.51.100.27"){learn("traceroute","network",2);return line("traceroute to 198.51.100.27\n1  10.60.9.1  3 ms\n2  203.0.113.9  21 ms\n3  198.51.100.27  34 ms");}const h=resolveTarget(args[0]);if(!h)throw new Error("traceroute: unknown host");learn("traceroute","network",2);if(h.id===state.terminal.hostId)return line(`traceroute to ${h.hostname}\n1  ${h.address}  <1 ms`);if(!canReach(h.id))return line(`traceroute to ${h.hostname}\n1  * * *\nroute unavailable from current host`);const cur=HOSTS[state.terminal.hostId];return line(`traceroute to ${h.hostname} (${h.address})\n1  ${cur.interfaces[0].gateway||cur.address}  4 ms\n2  ${h.address}  18 ms`);}});
registerCommand({name:"connect",execute({state,args}){if(!args[0])throw new Error("connect: specify hostname, address, or target number");let target=args[0];if(/^\d+$/.test(target)){const id=state.player.discoveredHosts?.[Number(target)];if(!id)throw new Error("connect: unknown target number");target=id;}const from=HOSTS[state.terminal.hostId].hostname;const h=connect(target);discoverHost(h.id);learn(`connect:${h.id}`,"network");return line(`Resolving ${args[0]}...\nRoute found from ${from}.\nNegotiating session...\nIdentity: ${state.terminal.user}\nHandshake accepted.\nConnected to ${h.hostname} (${h.address}).`);}});

registerCommand({name:"missions",aliases:["jobs"],execute(){const a=missionView();if(!a.length)return line("No active jobs.");return line(a.map(m=>`${m.title}\n${m.objectives.map(o=>`${m.progress[o.id]?"[x]":"[ ]"} ${o.label}`).join("\n")}`).join("\n\n"));}});
registerCommand({name:"clues",execute({state}){if(!state.player.discoveredClues.length)return line("No clues recorded.");return line(["DISCOVERED CLUES","",...state.player.discoveredClues.map((id,i)=>`${String(i+1).padStart(2,"0")}  ${id.replaceAll("_"," ")}`)].join("\n"));}});
registerCommand({name:"purge",execute({state,args}){if(String(args[0]||"").toLowerCase()!=="identity")throw new Error("usage: purge identity");if(state.terminal.hostId!=="home")throw new Error("purge: disconnect from the remote host first");state.terminal.pendingAction="purge_identity";return line(["BLACKBOX IDENTITY PURGE","",`Current alias: ${state.player.alias}`,`Current day: ${state.world.day}`,"","WARNING: This will terminate the active identity.","The life will be archived. No archived save will be deleted.","","Type: CONFIRM PURGE",'Or type "cancel" to abort.'].join("\n"));}});
registerCommand({name:"confirm",execute({state,args}){if(String(args[0]||"").toLowerCase()!=="purge"||state.terminal.pendingAction!=="purge_identity")throw new Error("confirm: no identity purge is pending");state.terminal.pendingAction=null;return {purgeIdentity:true,lines:[{text:"PURGE AUTHORIZATION ACCEPTED",type:"dim"}]};}});
registerCommand({name:"cancel",execute({state}){if(!state.terminal.pendingAction)return line("Nothing pending.");state.terminal.pendingAction=null;return line("Pending action cancelled.");}});
registerCommand({name:"exit",execute({state}){if(state.terminal.hostId!=="home"){disconnect();return line("Connection closed by remote host.\nReturned to local BLACKBOX shell.");}state.terminal.sessionOpen=false;state.terminal.suspended=false;emit("terminal:exit");return line("Closing BLACKBOX session...");}});

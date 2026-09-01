import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { listDir, normalizePath, getNode, readFile } from "./filesystem.js";
import { scan, connect, disconnect } from "./network.js";
import { emit } from "../core/events.js";
import { missionView } from "./missions.js";

const commands=new Map(),aliases=new Map();
export function registerCommand(def){commands.set(def.name,def);for(const a of def.aliases||[])aliases.set(a,def.name);}
export function getPrompt(){const s=getState(),h=HOSTS[s.terminal.hostId],tail=s.terminal.cwd==="/home"?"~":s.terminal.cwd;return `${s.terminal.user}@${h.hostname.toLowerCase()}:${tail}$`;}
export async function executeCommand(raw){
  const s=getState(),text=raw.trim(); if(!text)return {lines:[]};
  s.terminal.history.push(text); if(s.terminal.history.length>100)s.terminal.history.shift(); s.terminal.historyIndex=s.terminal.history.length;
  const [head,...args]=text.split(/\s+/),name=aliases.get(head)||head,cmd=commands.get(name);
  if(!cmd)return {lines:[{text:`${head}: command not found`,type:"error"}]};
  try{return await cmd.execute({state:s,args})||{lines:[]};}catch(err){return {lines:[{text:err.message||"Command failed",type:"error"}]};}
}
const text=t=>({lines:[{text:t}]});
registerCommand({name:"help",execute(){return text([
"BLACKBOX COMMAND INDEX","","SYSTEM","  help              command index","  clear             clear terminal","  whoami            current user","  hostname          current host","  uname [-a]        system information","  ps                 process table","  netstat            network connections","  history            command history","","FILES","  pwd                print working directory","  ls [path]          list directory","  cd <path>          change directory","  cat <file>         read file","","NETWORK","  scan               discover reachable hosts","  connect <host>     open simulated remote shell","","GAME","  missions           active objectives","  exit               close remote/local session"
].join("\n"));}});
registerCommand({name:"clear",execute(){return {clear:true,lines:[]};}});
registerCommand({name:"pwd",execute({state}){return text(state.terminal.cwd);}});
registerCommand({name:"whoami",execute({state}){return text(state.terminal.user);}});
registerCommand({name:"hostname",execute({state}){return text(HOSTS[state.terminal.hostId].hostname);}});
registerCommand({name:"uname",execute({state,args}){const h=HOSTS[state.terminal.hostId];return text(args.includes("-a")?`${h.os} ${h.hostname} simnet x86_64 BLACKBOX`:h.os);}});
registerCommand({name:"history",execute({state}){return text(state.terminal.history.map((x,i)=>`${i+1}  ${x}`).join("\n"));}});
registerCommand({name:"ps",execute({state}){const h=HOSTS[state.terminal.hostId];return text([" PID USER       CPU  MEM  COMMAND",...h.processes.map(x=>`${String(x.pid).padStart(4)} ${x.user.padEnd(10)} ${x.cpu.padStart(4)} ${x.mem.padStart(4)}  ${x.name}`)].join("\n"));}});
registerCommand({name:"netstat",execute({state}){const h=HOSTS[state.terminal.hostId];return text(["Proto Local Address          Remote Address         State",...h.connections.map(x=>`${x.proto.padEnd(5)} ${x.local.padEnd(22)} ${x.remote.padEnd(22)} ${x.state}`)].join("\n"));}});
registerCommand({name:"ls",execute({state,args}){const path=normalizePath(state.terminal.cwd,args[0]||"."),rows=listDir(state.terminal.hostId,path);return text(rows.map(x=>x.type==="dir"?`${x.name}/`:x.name).join("  "));}});
registerCommand({name:"cd",execute({state,args}){const path=normalizePath(state.terminal.cwd,args[0]||"/home"),node=getNode(state.terminal.hostId,path);if(!node)throw new Error("cd: no such directory");if(node.type!=="dir")throw new Error("cd: not a directory");state.terminal.cwd=path;return {lines:[]};}});
registerCommand({name:"cat",execute({state,args}){if(!args[0])throw new Error("cat: missing file operand");const path=normalizePath(state.terminal.cwd,args[0]),body=readFile(state.terminal.hostId,path);emit("file:read",{hostId:state.terminal.hostId,path});return text(body);}});
registerCommand({name:"scan",execute(){const rows=scan();return text(["BLACKBOX ACTIVE DISCOVERY","Scanning simulated routes...","",...rows.map(h=>`${h.address.padEnd(15)} ${h.hostname.padEnd(14)} ${h.services.map(s=>`${s.name}:${s.port}`).join(", ")}`),"","Scan complete."].join("\n"));}});
registerCommand({name:"connect",execute({args}){if(!args[0])throw new Error("connect: specify hostname or address");const h=connect(args[0]);return text(`Resolving ${args[0]}...\nRoute found.\nNegotiating session...\nIdentity: guest\nHandshake accepted.\nConnected to ${h.hostname} (${h.address}).`);}});
registerCommand({name:"missions",aliases:["jobs"],execute(){const a=missionView();if(!a.length)return text("No active jobs.");return text(a.map(m=>`${m.title}\n${m.objectives.map(o=>`${m.progress[o.id]?"[x]":"[ ]"} ${o.label}`).join("\n")}`).join("\n\n"));}});
registerCommand({name:"exit",execute({state}){if(state.terminal.hostId!=="home"){disconnect();return text("Connection closed by remote host.\nReturned to local BLACKBOX shell.");}emit("terminal:exit");return text("Closing BLACKBOX session...");}});

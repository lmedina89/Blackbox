import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { listDir, normalizePath, getNode, readFile } from "./filesystem.js";
import { scan, connect, disconnect } from "./network.js";
import { emit } from "../core/events.js";
import { missionView } from "./missions.js";

const commands=new Map();
const aliases=new Map();

export function registerCommand(def){
  commands.set(def.name,def);
  for(const a of def.aliases||[]) aliases.set(a,def.name);
}

export function getPrompt(){
  const s=getState(),host=HOSTS[s.terminal.hostId];
  const tail=s.terminal.cwd==="/home"?"~":s.terminal.cwd;
  return `${s.terminal.user}@${host.hostname.toLowerCase()}:${tail}$`;
}

export async function executeCommand(raw){
  const s=getState();
  const text=raw.trim();
  if(!text) return {lines:[]};
  s.terminal.history.push(text);
  if(s.terminal.history.length>100) s.terminal.history.shift();
  s.terminal.historyIndex=s.terminal.history.length;

  const [head,...args]=text.split(/\s+/);
  const name=aliases.get(head)||head;
  const command=commands.get(name);
  if(!command) return {lines:[{text:`${head}: command not found`,type:"error"}]};
  try{
    const result=await command.execute({state:s,args});
    return result||{lines:[]};
  }catch(err){
    return {lines:[{text:err.message||"Command failed",type:"error"}]};
  }
}

registerCommand({
  name:"help",
  execute(){
    return {lines:[{text:[
      "BLACKBOX COMMAND INDEX",
      "help               show commands",
      "clear              clear terminal",
      "pwd                print working directory",
      "ls [path]          list directory",
      "cd <path>          change directory",
      "cat <file>         read file",
      "whoami             current user",
      "hostname           current host",
      "scan               discover reachable hosts",
      "connect <host>     open simulated remote session",
      "missions           active objectives",
      "history            command history",
      "exit               return to desktop"
    ].join("\n")}]};
  }
});

registerCommand({name:"clear",execute(){return {clear:true,lines:[]};}});
registerCommand({name:"pwd",execute({state}){return {lines:[{text:state.terminal.cwd}]};}});
registerCommand({name:"whoami",execute({state}){return {lines:[{text:state.terminal.user}]};}});
registerCommand({name:"hostname",execute({state}){return {lines:[{text:HOSTS[state.terminal.hostId].hostname}]};}});
registerCommand({name:"history",execute({state}){return {lines:[{text:state.terminal.history.map((x,i)=>`${i+1}  ${x}`).join("\n")}]};}});

registerCommand({
  name:"ls",
  execute({state,args}){
    const path=normalizePath(state.terminal.cwd,args[0]||".");
    const rows=listDir(state.terminal.hostId,path);
    return {lines:[{text:rows.map(x=>x.type==="dir"?`${x.name}/`:x.name).join("  ")}]};
  }
});

registerCommand({
  name:"cd",
  execute({state,args}){
    const path=normalizePath(state.terminal.cwd,args[0]||"/home");
    const node=getNode(state.terminal.hostId,path);
    if(!node) throw new Error("cd: no such directory");
    if(node.type!=="dir") throw new Error("cd: not a directory");
    state.terminal.cwd=path;
    return {lines:[]};
  }
});

registerCommand({
  name:"cat",
  execute({state,args}){
    if(!args[0]) throw new Error("cat: missing file operand");
    const path=normalizePath(state.terminal.cwd,args[0]);
    const text=readFile(state.terminal.hostId,path);
    emit("file:read",{hostId:state.terminal.hostId,path});
    return {lines:[{text}]};
  }
});

registerCommand({
  name:"scan",
  execute(){
    const rows=scan();
    return {lines:[{text:["SCANNING ROUTES...","",...rows.map(h=>`${h.address.padEnd(15)} ${h.hostname.padEnd(14)} ${h.services.map(s=>`${s.name}:${s.port}`).join(", ")}`)].join("\n")}]};
  }
});

registerCommand({
  name:"connect",
  execute({args}){
    if(!args[0]) throw new Error("connect: specify hostname or address");
    const h=connect(args[0]);
    return {lines:[{text:`Resolving ${args[0]}...\nRoute found.\nHandshake accepted.\nConnected to ${h.hostname} (${h.address}).`}]};
  }
});

registerCommand({
  name:"missions",
  execute(){
    const active=missionView();
    if(!active.length) return {lines:[{text:"No active jobs."}]};
    const text=active.map(m=>{
      const lines=m.objectives.map(o=>`${m.progress[o.id]?"[x]":"[ ]"} ${o.label}`);
      return `${m.title}\n${lines.join("\n")}`;
    }).join("\n\n");
    return {lines:[{text}]};
  }
});

registerCommand({
  name:"exit",
  execute({state}){
    if(state.terminal.hostId!=="home"){
      disconnect();
      return {lines:[{text:"Remote session closed. Returned to local shell."}]};
    }
    emit("terminal:exit");
    return {lines:[{text:"Closing BLACKBOX session..."}]};
  }
});

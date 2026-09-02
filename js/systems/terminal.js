import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { listDir, normalizePath, getNode, readFile } from "./filesystem.js";
import { scan, connect, disconnect } from "./network.js";
import { discoverHost } from "./clues.js";
import { emit } from "../core/events.js";
import { missionView } from "./missions.js";

const commands=new Map(),aliases=new Map();

export function registerCommand(def){
  commands.set(def.name.toLowerCase(),def);
  for(const a of def.aliases||[])aliases.set(a.toLowerCase(),def.name.toLowerCase());
}

export function getPrompt(){
  const s=getState(),h=HOSTS[s.terminal.hostId],home=h.homeDir||"/home";
  let tail=s.terminal.cwd===home?"~":s.terminal.cwd;
  return `${s.terminal.user}@${h.hostname.toLowerCase()}:${tail}$`;
}

function preprocess(raw){
  const trimmed=raw.trim();
  if(/^cd\.\.$/i.test(trimmed))return "cd ..";
  if(/^cd\/$/i.test(trimmed))return "cd /";
  return trimmed;
}

export async function executeCommand(raw){
  const s=getState(),text=preprocess(raw);
  if(!text)return {lines:[]};

  s.terminal.history.push(text);
  if(s.terminal.history.length>100)s.terminal.history.shift();
  s.terminal.historyIndex=s.terminal.history.length;

  const [rawHead,...args]=text.split(/\s+/);
  const head=rawHead.toLowerCase();
  const name=aliases.get(head)||head;
  const cmd=commands.get(name);
  if(!cmd)return {lines:[{text:`${rawHead}: command not found`,type:"error"}]};

  try{return await cmd.execute({state:s,args})||{lines:[]};}
  catch(err){return {lines:[{text:err.message||"Command failed",type:"error"}]};}
}

const text=t=>({lines:[{text:t}]});

registerCommand({name:"help",aliases:["?"],execute(){return text([
"BLACKBOX COMMAND INDEX","",
"SYSTEM",
"  help              command index",
"  clear             clear terminal",
"  whoami            current user",
"  hostname          current host",
"  uname [-a]        system information",
"  ps                process table",
"  netstat           network connections",
"  history           command history","",
"FILES",
"  pwd               print working directory",
"  ls [path]         list directory",
"  cd <path>         change directory",
"  cat <file>        read file","",
"NETWORK",
"  scan              discover reachable hosts",
"  targets           remembered hosts",
"  connect <host>    connect by name, IP, or target number","",
"GAME",
"  missions          active objectives",
"  clues             discovered information",
"  purge identity    archive and terminate current identity",
"  confirm purge     confirm a pending identity purge",
"  cancel            cancel a pending destructive action",
"  exit              close remote/local session"
].join("\n"));}});

registerCommand({name:"clear",execute(){return {clear:true,lines:[]};}});
registerCommand({name:"pwd",execute({state}){return text(state.terminal.cwd);}});
registerCommand({name:"whoami",execute({state}){return text(state.terminal.user);}});
registerCommand({name:"hostname",execute({state}){return text(HOSTS[state.terminal.hostId].hostname);}});
registerCommand({name:"uname",execute({state,args}){const h=HOSTS[state.terminal.hostId];return text(args.includes("-a")?`${h.os} ${h.hostname} simnet x86_64 BLACKBOX`:h.os);}});
registerCommand({name:"history",execute({state}){return text(state.terminal.history.map((x,i)=>`${i+1}  ${x}`).join("\n"));}});
registerCommand({name:"ps",execute({state}){const h=HOSTS[state.terminal.hostId];return text([" PID USER       CPU  MEM  COMMAND",...h.processes.map(x=>`${String(x.pid).padStart(4)} ${x.user.padEnd(10)} ${x.cpu.padStart(4)} ${x.mem.padStart(4)}  ${x.name}`)].join("\n"));}});
registerCommand({name:"netstat",execute({state}){const h=HOSTS[state.terminal.hostId];return text(["Proto Local Address          Remote Address         State",...h.connections.map(x=>`${x.proto.padEnd(5)} ${x.local.padEnd(22)} ${x.remote.padEnd(22)} ${x.state}`)].join("\n"));}});

registerCommand({name:"ls",execute({state,args}){
  const path=normalizePath(state.terminal.cwd,args[0]||".",state.terminal.hostId);
  const rows=listDir(state.terminal.hostId,path);
  return text(rows.map(x=>x.type==="dir"?`${x.name}/`:x.name).join("  "));
}});

registerCommand({name:"cd",execute({state,args}){
  const path=normalizePath(state.terminal.cwd,args[0]||"~",state.terminal.hostId);
  const node=getNode(state.terminal.hostId,path);
  if(!node)throw new Error("cd: no such directory");
  if(node.type!=="dir")throw new Error("cd: not a directory");
  state.terminal.cwd=path;
  return {lines:[]};
}});

registerCommand({name:"cat",execute({state,args}){
  if(!args[0])throw new Error("cat: missing file operand");
  const path=normalizePath(state.terminal.cwd,args[0],state.terminal.hostId);
  const body=readFile(state.terminal.hostId,path);
  emit("file:read",{hostId:state.terminal.hostId,path});
  return text(body);
}});

registerCommand({name:"scan",execute({state}){
  const rows=scan();
  for(const h of rows)if(h.id!=="home")discoverHost(h.id);
  const remembered=(state.player.discoveredHosts||[]).map(id=>HOSTS[id]).filter(Boolean);
  const numberFor=id=>remembered.findIndex(h=>h.id===id);
  return text([
    "BLACKBOX ACTIVE DISCOVERY",
    "Scanning simulated routes...","",
    ...rows.map(h=>{
      const number=h.id==="home"?"  ":`[${numberFor(h.id)}]`;
      return `${number.padEnd(4)} ${h.address.padEnd(15)} ${h.hostname.padEnd(14)} ${h.services.map(s=>`${s.name}:${s.port}`).join(", ")}`;
    }),
    "",
    remembered.length?'Use "targets" or "connect <number>" to reuse a discovered host.':"",
    "Scan complete."
  ].filter((x,i,a)=>!(x===""&&a[i-1]==="")).join("\n"));
}});

registerCommand({name:"targets",aliases:["hosts"],execute({state}){
  const rows=(state.player.discoveredHosts||[]).map(id=>HOSTS[id]).filter(Boolean);
  if(!rows.length)return text('No remembered hosts. Investigate the desktop or run "scan".');
  return text(["REMEMBERED TARGETS","",...rows.map((h,i)=>`[${i}] ${h.hostname.padEnd(14)} ${h.address}`),"",'Connect with: connect 0'].join("\n"));
}});

registerCommand({name:"connect",execute({state,args}){
  if(!args[0])throw new Error("connect: specify hostname, address, or target number");
  let target=args[0];
  if(/^\d+$/.test(target)){
    const id=state.player.discoveredHosts?.[Number(target)];
    if(!id)throw new Error("connect: unknown target number");
    target=id;
  }
  const h=connect(target);
  discoverHost(h.id);
  return text(`Resolving ${args[0]}...\nRoute found.\nNegotiating session...\nIdentity: ${state.terminal.user}\nHandshake accepted.\nConnected to ${h.hostname} (${h.address}).`);
}});

registerCommand({name:"missions",aliases:["jobs"],execute(){
  const a=missionView();
  if(!a.length)return text("No active jobs.");
  return text(a.map(m=>`${m.title}\n${m.objectives.map(o=>`${m.progress[o.id]?"[x]":"[ ]"} ${o.label}`).join("\n")}`).join("\n\n"));
}});

registerCommand({name:"clues",execute({state}){
  if(!state.player.discoveredClues.length)return text("No clues recorded.");
  return text(["DISCOVERED CLUES","",...state.player.discoveredClues.map((id,i)=>`${String(i+1).padStart(2,"0")}  ${id.replaceAll("_"," ")}`)].join("\n"));
}});


registerCommand({name:"purge",execute({state,args}){
  if(String(args[0]||"").toLowerCase()!=="identity")throw new Error('usage: purge identity');
  if(state.terminal.hostId!=="home")throw new Error("purge: disconnect from the remote host first");
  state.terminal.pendingAction="purge_identity";
  return text([
    "BLACKBOX IDENTITY PURGE","",
    `Current alias: ${state.player.alias}`,
    `Current day: ${state.world.day}`,"",
    "WARNING: This will terminate the active identity.",
    "The life will be archived. No archived save will be deleted.","",
    "Type: CONFIRM PURGE",
    'Or type "cancel" to abort.'
  ].join("\n"));
}});

registerCommand({name:"confirm",execute({state,args}){
  if(String(args[0]||"").toLowerCase()!=="purge"||state.terminal.pendingAction!=="purge_identity")throw new Error("confirm: no identity purge is pending");
  state.terminal.pendingAction=null;
  return {purgeIdentity:true,lines:[{text:"PURGE AUTHORIZATION ACCEPTED",type:"dim"}]};
}});

registerCommand({name:"cancel",execute({state}){
  if(!state.terminal.pendingAction)return text("Nothing pending.");
  const action=state.terminal.pendingAction;
  state.terminal.pendingAction=null;
  return text(action==="purge_identity"?"Identity purge cancelled.":"Pending action cancelled.");
}});

registerCommand({name:"exit",execute({state}){
  if(state.terminal.hostId!=="home"){
    disconnect();
    return text("Connection closed by remote host.\nReturned to local BLACKBOX shell.");
  }
  state.terminal.sessionOpen=false;
  state.terminal.suspended=false;
  emit("terminal:exit");
  return text("Closing BLACKBOX session...");
}});

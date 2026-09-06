import { getState } from "../core/state.js";
import { on, emit } from "../core/events.js";
import { HOSTS } from "../data/hosts.js";
import { RANGE_LABS, NIGHTWIRE_NODE_POSTS, NIGHTWIRE_NODE_MESSAGES, rangeLab, nightwirePost } from "../data/nightwire.js";
import { setActiveSandbox } from "./intrusion.js";

let initialized=false;
const absoluteNow=(state=getState())=>((state.world.day||1)-1)*1440+(state.world.minute||0);
const labHostIds=lab=>(lab?.targetIds||[]).filter(id=>HOSTS[id]);

function ensure(){
  const s=getState();
  s.nightwire??={readPosts:[],readMessages:[],range:{activeLabId:null,completed:[],runs:{},results:{}}};
  s.nightwire.readPosts??=[];s.nightwire.readMessages??=[];
  s.nightwire.range??={activeLabId:null,completed:[],runs:{},results:{}};
  s.nightwire.range.completed??=[];s.nightwire.range.runs??={};s.nightwire.range.results??={};
  if(s.nightwire.range.activeLabId===undefined)s.nightwire.range.activeLabId=null;
  const sandbox=s.intrusion?.activeSandbox;
  if(sandbox?.universe==="range"&&rangeLab(sandbox.id))s.nightwire.range.activeLabId=sandbox.id;
  if(s.nightwire.range.activeLabId&&!rangeLab(s.nightwire.range.activeLabId))s.nightwire.range.activeLabId=null;
  if(s.nightwire.range.activeLabId&&!s.intrusion?.activeSandbox){
    const lab=rangeLab(s.nightwire.range.activeLabId);
    if(lab)s.intrusion.activeSandbox={universe:"range",id:lab.id,targetIds:[...lab.targetIds],startedAt:s.nightwire.range.runs?.[lab.id]?.startedAt??absoluteNow(s)};
  }
  return s.nightwire;
}

export function nightwireUnlocked(state=getState()){
  return (state.world.completedMissions||[]).includes("mission_cascade")||(state.world.flags||[]).includes("mission_cascade_complete");
}

export function activeRangeLab(){
  const id=ensure().range.activeLabId||getState().intrusion?.activeSandbox?.id;
  return id?rangeLab(id):null;
}

export function rangeLabUnlocked(lab,state=getState()){
  if(!lab)return false;
  if(!lab.unlockAfter)return true;
  return (state.nightwire?.range?.completed||[]).includes(lab.unlockAfter);
}

function runState(labId){
  const nw=ensure();
  nw.range.runs[labId]??={attempt:0,startedAt:null,hintsUsed:0,completedThisRun:false,completedAt:null};
  return nw.range.runs[labId];
}

function clearLabIntrusion(lab){
  const s=getState(),ids=new Set(labHostIds(lab)),intrusion=s.intrusion;
  for(const key of Object.keys(intrusion.sessions||{}))if(ids.has(intrusion.sessions[key]?.hostId))delete intrusion.sessions[key];
  for(const key of Object.keys(intrusion.serviceIntel||{}))if(ids.has(String(key).split(":").at(-1)))delete intrusion.serviceIntel[key];
  for(const key of Object.keys(intrusion.noise||{}))if(ids.has(String(key).split(":").at(-1)))delete intrusion.noise[key];
  intrusion.credentials=(intrusion.credentials||[]).filter(c=>{
    const hosts=c.scope?.hosts||[];
    return !hosts.some(id=>ids.has(id));
  });
  intrusion.artifacts=(intrusion.artifacts||[]).filter(a=>!ids.has(a.hostId));
  intrusion.attempts=(intrusion.attempts||[]).filter(a=>!ids.has(a.hostId));
  s.player.seenHosts=(s.player.seenHosts||[]).filter(id=>!ids.has(id));
  s.player.discoveredHosts=(s.player.discoveredHosts||[]).filter(id=>!ids.has(id));
  s.player.identifiedHosts=(s.player.identifiedHosts||[]).filter(id=>!ids.has(id));
  s.player.savedTargets=(s.player.savedTargets||[]).filter(t=>!ids.has(t.hostId));
  s.terminal.lastScanResults=[];
}

export function startRangeLab(ref){
  const s=getState(),nw=ensure(),lab=rangeLab(ref);
  if(!nightwireUnlocked(s))throw new Error("NightWire private node is not available yet.");
  if(!lab)throw new Error("Range lab not found.");
  if(!rangeLabUnlocked(lab,s))throw new Error(`Range ${lab.code} is locked. Complete the previous lab first.`);
  if(s.terminal.hostId!=="home")throw new Error("Return to HOME-PC before starting a Range image.");
  if(nw.range.activeLabId)throw new Error(`Range ${rangeLab(nw.range.activeLabId)?.code||nw.range.activeLabId} is already active. Finish, abort, or reset it first.`);
  clearLabIntrusion(lab);
  const run=runState(lab.id);
  run.attempt=(run.attempt||0)+1;run.startedAt=absoluteNow(s);run.hintsUsed=0;run.completedThisRun=false;run.completedAt=null;
  nw.range.activeLabId=lab.id;
  setActiveSandbox({universe:"range",id:lab.id,targetIds:[...lab.targetIds],startedAt:run.startedAt});
  s.terminal.serviceSession=null;
  emit("range:started",{labId:lab.id,attempt:run.attempt});
  return lab;
}

export function abortRangeLab(){
  const s=getState(),nw=ensure(),lab=activeRangeLab();
  if(!lab)return null;
  if(s.terminal.hostId!=="home")throw new Error("Disconnect from the Range host before aborting the lab.");
  nw.range.activeLabId=null;setActiveSandbox(null);clearLabIntrusion(lab);s.terminal.lastScanResults=[];
  emit("range:aborted",{labId:lab.id});
  return lab;
}

export function resetRangeLab(){
  const s=getState(),nw=ensure(),lab=activeRangeLab();
  if(!lab)throw new Error("No Range lab is active.");
  if(s.terminal.hostId!=="home")throw new Error("Disconnect from the Range host before resetting the image.");
  clearLabIntrusion(lab);
  const run=runState(lab.id);run.attempt=(run.attempt||0)+1;run.startedAt=absoluteNow(s);run.hintsUsed=0;run.completedThisRun=false;run.completedAt=null;
  setActiveSandbox({universe:"range",id:lab.id,targetIds:[...lab.targetIds],startedAt:run.startedAt});
  emit("range:reset",{labId:lab.id,attempt:run.attempt});
  return lab;
}

function labNoise(lab){
  const s=getState(),ids=new Set(labHostIds(lab));
  return Object.entries(s.intrusion?.noise||{}).filter(([key])=>ids.has(key.split(":").at(-1))).reduce((sum,[,value])=>sum+(Number(value?.value)||0),0);
}
function failedAuth(lab,startedAt){
  const ids=new Set(labHostIds(lab));
  return (getState().intrusion?.attempts||[]).filter(a=>a.kind==="authentication"&&ids.has(a.hostId)&&(a.at??0)>=startedAt&&a.result!=="accepted").length;
}

function completeLab(lab){
  const s=getState(),nw=ensure(),run=runState(lab.id);
  if(run.completedThisRun)return false;
  run.completedThisRun=true;run.completedAt=absoluteNow(s);
  if(!nw.range.completed.includes(lab.id))nw.range.completed.push(lab.id);
  const result={labId:lab.id,attempt:run.attempt,completedAt:run.completedAt,noise:labNoise(lab),failedAuth:failedAuth(lab,run.startedAt||0),hintsUsed:run.hintsUsed||0};
  nw.range.results[lab.id]=result;
  emit("range:completed",result);
  emit("lab:completed",{labId:`nightwire:${lab.id}`,universe:"range"});
  return true;
}

function maybeCompleteFromFile({hostId,path,universe}){
  if(universe!=="range")return;
  const lab=activeRangeLab();if(!lab||lab.completion?.type!=="file")return;
  if(lab.completion.hostId===hostId&&lab.completion.path===path)completeLab(lab);
}
function maybeCompleteFromArtifact({artifactId,universe}){
  if(universe!=="range")return;
  const lab=activeRangeLab();if(!lab||lab.completion?.type!=="artifact")return;
  if(lab.completion.artifactId===artifactId)completeLab(lab);
}

export function initNightwire(){
  if(initialized)return;initialized=true;
  ensure();
  on("file:read",maybeCompleteFromFile);
  on("artifact:inspected",maybeCompleteFromArtifact);
  on("mission:completed",({mission})=>{if(mission?.id==="mission_cascade")emit("nightwire:unlocked",{service:"nightwire"});});
}

export function openNightwire(section=null){
  const s=getState();ensure();
  if(s.terminal.hostId!=="home")throw new Error("nightwire: return to HOME-PC before opening the private node");
  if(!nightwireUnlocked(s))throw new Error("nightwire: private relay unavailable. The public NightWire mirror remains accessible in NEXUS Explorer.");
  const active=activeRangeLab();
  s.terminal.serviceSession={type:"nightwire",section:section||((active)?"range":"home")};
  emit("nightwire:changed",{action:"open"});
  return renderNightwireSection(s.terminal.serviceSession.section);
}

export function closeNightwire(){getState().terminal.serviceSession=null;emit("nightwire:changed",{action:"close"});return "NightWire relay closed.\nReturned to BLACKBOX shell.";}
export function nightwirePrompt(){
  const session=getState().terminal.serviceSession;
  if(session?.type!=="nightwire")return null;
  return session.section&&session.section!=="home"?`nightwire/${session.section}>`:"nightwire>";
}

function nodeHeader(title){return [`NIGHTWIRE NODE // ${title}`,"----------------------------------------"];}
function renderHome(){
  const lab=activeRangeLab();
  return [...nodeHeader("PRIVATE RELAY"),
    "Connection: ENCRYPTED // SIMULATED",
    ...(lab?[`Range:      ${lab.code} ${lab.title} [ACTIVE]`]:[]),"",
    "[1] GENERAL BOARD",
    "[2] FIELD REPORTS",
    "[3] JOBS",
    "[4] THE RANGE",
    "[5] PRIVATE MESSAGES",
    "[6] DISCONNECT","",
    "Type a number or command. 'help' shows node controls."
  ].join("\n");
}
function renderBoard(board){
  const posts=NIGHTWIRE_NODE_POSTS.filter(p=>p.board===board);
  return [...nodeHeader(board==="field"?"FIELD REPORTS":"GENERAL BOARD"),"",...posts.map(p=>`#${p.number}  ${p.author}\n${p.title}`),"",'Use "read <#>" or "back".'].join("\n");
}
function renderJobs(){return [...nodeHeader("JOBS"),"","No private contracts queued.","The old nine routes remain legacy training work. Advanced contracts begin in Act II.","",'Type "back".'].join("\n");}
function labStatusLabel(lab,nw){
  if((nw.range.completed||[]).includes(lab.id))return "COMPLETE";
  if(!rangeLabUnlocked(lab,getState()))return "LOCKED";
  if(nw.range.activeLabId===lab.id)return "ACTIVE";
  return "READY";
}
function renderRange(){
  const nw=ensure(),active=activeRangeLab();
  const rows=RANGE_LABS.map(lab=>`${lab.code}  ${lab.title.padEnd(24)} ${lab.difficulty.padEnd(12)} ${labStatusLabel(lab,nw)}`);
  const lines=[...nodeHeader("THE RANGE"),"","ID  LAB                      DIFFICULTY   STATUS",...rows,"",
    active?`ACTIVE: ${active.code} ${active.title}`:"No Range image active.",
    active?'Commands: status · hint · resume · reset · finish · abort · back':'Commands: start <id> · status <id> · back'];
  return lines.join("\n");
}
function renderMessages(){
  const nw=ensure();
  return [...nodeHeader("PRIVATE MESSAGES"),"",...NIGHTWIRE_NODE_MESSAGES.map((m,i)=>`[${i}] ${nw.readMessages.includes(m.id)?" ":"*"} FROM ${m.from} // ${m.subject}`),"",'Use "read <#>" or "back".'].join("\n");
}
function renderLabStatus(lab){
  const nw=ensure(),run=nw.range.runs?.[lab.id]||{},result=nw.range.results?.[lab.id];
  return [...nodeHeader(`RANGE ${lab.code} // ${lab.title.toUpperCase()}`),
    `Difficulty: ${lab.difficulty}`,
    `Status:     ${labStatusLabel(lab,nw)}`,
    `Objective:  ${lab.objective}`,"",
    ...lab.brief.map(x=>`- ${x}`),
    ...(run.attempt?["",`Current attempt: ${run.attempt}${run.completedThisRun?" // COMPLETE":""}`,`Hints used:     ${run.hintsUsed||0}`,`Noise:          ${labNoise(lab)}`]:[]),
    ...(result?["",`Best/latest completion: attempt ${result.attempt} · noise ${result.noise} · failed auth ${result.failedAuth} · hints ${result.hintsUsed}`]:[])
  ].join("\n");
}
export function renderNightwireSection(section){
  if(section==="general")return renderBoard("general");
  if(section==="field")return renderBoard("field");
  if(section==="jobs")return renderJobs();
  if(section==="range")return renderRange();
  if(section==="messages")return renderMessages();
  return renderHome();
}

function setSection(section){getState().terminal.serviceSession.section=section;return renderNightwireSection(section);}
function readBoardPost(ref){
  const post=nightwirePost(ref);if(!post)throw new Error("NightWire post not found.");
  const nw=ensure();if(!nw.readPosts.includes(post.id))nw.readPosts.push(post.id);
  emit("nightwire:changed",{action:"read-post",postId:post.id});
  return [...nodeHeader(`#${post.number} // ${post.author}`),post.title,"",post.body,"",'Type "back" to return.'].join("\n");
}
function readMessage(ref){
  const index=Number(ref),message=Number.isInteger(index)?NIGHTWIRE_NODE_MESSAGES[index]:NIGHTWIRE_NODE_MESSAGES.find(m=>m.id===ref);
  if(!message)throw new Error("NightWire message not found.");
  const nw=ensure();if(!nw.readMessages.includes(message.id))nw.readMessages.push(message.id);
  emit("nightwire:changed",{action:"read-message",messageId:message.id});
  return [...nodeHeader(`MESSAGE // ${message.from}`),`Subject: ${message.subject}`,"",message.body,"",'Type "back" to return.'].join("\n");
}
function nextHint(lab){
  const run=runState(lab.id),index=Math.min(run.hintsUsed||0,lab.hints.length-1);
  if(!lab.hints.length)return "No hints available for this image.";
  if((run.hintsUsed||0)<lab.hints.length)run.hintsUsed++;
  emit("nightwire:changed",{action:"hint",labId:lab.id,hintsUsed:run.hintsUsed});
  return `HINT ${index+1}/${lab.hints.length}\n${lab.hints[index]}`;
}

export function handleNightwireInput(raw){
  const s=getState(),session=s.terminal.serviceSession;
  if(session?.type!=="nightwire")return null;
  const text=String(raw||"").trim(),[head,...args]=text.split(/\s+/),cmd=String(head||"").toLowerCase();
  const section=session.section||"home";
  if(!cmd)return {lines:[]};
  if(["quit","exit","disconnect","6"].includes(cmd))return {lines:[{text:closeNightwire()}]};
  if(cmd==="help"||cmd==="?")return {lines:[{text:[...nodeHeader("HELP"),"home / 0      node menu","general / 1   general board","field / 2     field reports","jobs / 3      jobs","range / 4     Range control","messages / 5  private messages","read <#>      read a post/message","back          previous menu","quit / 6      disconnect node","","Range: start <id> · status [id] · hint · resume · reset · finish · abort"].join("\n")} ]};
  if(cmd==="home"||cmd==="0")return {lines:[{text:setSection("home")}]};
  if(cmd==="back")return {lines:[{text:setSection(section==="home"?"home":"home")}]};
  if(cmd==="general"||cmd==="1")return {lines:[{text:setSection("general")}]};
  if(cmd==="field"||cmd==="2")return {lines:[{text:setSection("field")}]};
  if(cmd==="jobs"||cmd==="3")return {lines:[{text:setSection("jobs")}]};
  if(cmd==="range"||cmd==="4")return {lines:[{text:setSection("range")}]};
  if(cmd==="messages"||cmd==="5")return {lines:[{text:setSection("messages")}]};
  if(cmd==="read"){
    if(!args[0])throw new Error("usage: read <post-number|message-number>");
    return {lines:[{text:section==="messages"?readMessage(args[0]):readBoardPost(args[0])}]};
  }
  if(section==="range"){
    if(cmd==="start"){
      if(!args[0])throw new Error("usage: start <range-id>");
      const lab=startRangeLab(args[0]);
      return {lines:[{text:[...nodeHeader(`RANGE ${lab.code} MOUNTED`),...lab.brief,"",`OBJECTIVE: ${lab.objective}`,"","Isolated segment attached to HOME-PC.","Use scan to begin.","NightWire relay closed."].join("\n")}]};
    }
    if(cmd==="status"){
      const lab=args[0]?rangeLab(args[0]):activeRangeLab();
      if(!lab)throw new Error("usage: status <range-id> (or start a Range lab first)");
      return {lines:[{text:renderLabStatus(lab)}]};
    }
    if(cmd==="hint"){
      const lab=activeRangeLab();if(!lab)throw new Error("No Range lab is active.");
      return {lines:[{text:nextHint(lab)}]};
    }
    if(cmd==="resume"){
      const lab=activeRangeLab();if(!lab)throw new Error("No Range lab is active.");
      s.terminal.serviceSession=null;
      return {lines:[{text:`Range ${lab.code} remains mounted.\nReturned to BLACKBOX shell.\nUse scan to continue.`}]};
    }
    if(cmd==="reset"){
      const lab=resetRangeLab();s.terminal.serviceSession=null;
      return {lines:[{text:`Range ${lab.code} image reset.\nReturned to BLACKBOX shell.\nUse scan to begin again.`}]};
    }
    if(cmd==="abort"){
      const lab=abortRangeLab();s.terminal.serviceSession=null;
      return {lines:[{text:`Range ${lab.code} aborted and detached.\nReturned to BLACKBOX shell.`}]};
    }
    if(cmd==="finish"){
      const lab=activeRangeLab();if(!lab)throw new Error("No Range lab is active.");
      const run=runState(lab.id);if(!run.completedThisRun)throw new Error("Range objective is not complete yet.");
      if(s.terminal.hostId!=="home")throw new Error("Disconnect from the Range host before finishing the lab.");
      ensure().range.activeLabId=null;setActiveSandbox(null);clearLabIntrusion(lab);s.terminal.serviceSession=null;s.terminal.lastScanResults=[];emit("nightwire:changed",{action:"finish",labId:lab.id});
      return {lines:[{text:`RANGE ${lab.code} COMPLETE\n${lab.title}\nNoise: ${labNoise(lab)}\nHints used: ${run.hintsUsed||0}\n\nRange segment detached. Returned to BLACKBOX shell.`}]};
    }
  }
  throw new Error(`nightwire: unknown node command "${cmd}"; type help`);
}

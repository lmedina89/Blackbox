import { executeCommand, getPrompt } from "../systems/terminal.js";
import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { on } from "../core/events.js";
import { playSound } from "../systems/audio.js";

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function initTerminalUI({onExit,onSuspend,onPurge}){
  const output=document.querySelector("#terminal-output");
  const form=document.querySelector("#terminal-form");
  const input=document.querySelector("#terminal-input");
  const prompt=document.querySelector("#terminal-prompt");
  const label=document.querySelector("#bb-session-label");
  const link=document.querySelector("#bb-link");
  const trace=document.querySelector("#bb-trace");
  const desktopButton=document.querySelector("#bb-desktop-button");
  const remoteModal=document.querySelector("#bb-remote-modal");
  const remoteCancel=document.querySelector("#bb-remote-cancel");
  const remoteReturn=document.querySelector("#bb-remote-return");
  const bbNotifications=document.querySelector("#bb-notifications");
  const latestButton=document.querySelector("#terminal-latest");
  let running=false;
  let autoFollow=true;
  const queuedNotices=[];

  function isVisible(){return !document.querySelector("#blackbox").classList.contains("hidden");}

  function nearLatest(){
    return output.scrollHeight-output.scrollTop-output.clientHeight<52;
  }

  function updateLatestButton(){
    latestButton.classList.toggle("hidden",autoFollow||nearLatest());
  }

  function scrollLatest(force=false){
    if(force)autoFollow=true;
    if(!autoFollow){updateLatestButton();return;}
    requestAnimationFrame(()=>{output.scrollTop=output.scrollHeight;updateLatestButton();});
  }

  function semanticLineClass(text,type=""){
    if(type)return "";
    const t=String(text||"").trim();
    if(!t)return "";
    if(/ANOMAL|UNCLASSIFIED SIGNAL|UNKNOWN SIGNATURE/i.test(t))return "semantic-anomaly";
    if(/^(WARNING|CAUTION)|Destination unreachable|route unavailable/i.test(t))return "semantic-warning";
    if(/^(BLACKBOX ACTIVE DISCOVERY|INTERFACES|SERVICES(?:\s|$)|SAVED TARGETS|TARGET RECORD|DISCOVERED INFORMATION|WORLD INTEL|CASE CLUES|PING\s|traceroute to)/i.test(t))return "semantic-section";
    if(/^(Scanning routes|Resolving |Negotiating session|Identity:)/i.test(t))return "semantic-info";
    if(/^(reply from|Route found|Handshake accepted|Connected to|Scan complete|Target saved|Transfer verified|Evidence reference recorded|Existing HOME-PC evidence reference reused|Connection closed|Returned to local BLACKBOX shell)/i.test(t))return "semantic-success";
    return "";
  }

  function renderSemanticText(el,text){
    const source=String(text||"");
    const pattern=/(\b(?:\d{1,3}\.){3}\d{1,3}\b|\b[A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+\b|\b\d+\/tcp\b|\bUNKNOWN\b|"[^"\n]*")/g;
    let last=0;
    for(const match of source.matchAll(pattern)){
      if(match.index>last)el.append(document.createTextNode(source.slice(last,match.index)));
      const value=match[0],span=document.createElement("span");
      span.className="terminal-token "+(value==="UNKNOWN"?"unknown":/^\d+\/tcp$/.test(value)?"port":/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)?"ip":value.startsWith('"')?"quoted":"host");
      span.textContent=value;el.append(span);last=match.index+value.length;
    }
    if(last<source.length)el.append(document.createTextNode(source.slice(last)));
  }

  function appendLine(text,type=""){
    const el=document.createElement("div");
    const semantic=semanticLineClass(text,type);
    el.className=`terminal-line${type?` ${type}`:""}${semantic?` ${semantic}`:""}`;
    renderSemanticText(el,text);
    output.appendChild(el);
  }

  function print(text,type=""){
    const parts=String(text??"").split("\n");
    for(const part of parts)appendLine(part,type);
    scrollLatest();
  }

  function printCommand(promptText,raw){
    const el=document.createElement("div");el.className="terminal-line command";
    const p=document.createElement("span"),c=document.createElement("span");
    p.className="terminal-command-prompt";p.textContent=promptText+" ";
    c.className="terminal-command-text";c.textContent=raw;
    el.append(p,c);output.appendChild(el);scrollLatest();
  }

  function notice(title,body,next="",tone="success"){
    const box=document.createElement("div");
    box.className=`terminal-notice ${tone}`;
    const heading=document.createElement("b"),message=document.createElement("span");
    heading.textContent=title;message.textContent=body;box.append(heading,message);
    if(next){const small=document.createElement("small");small.textContent=next;box.appendChild(small);}
    output.appendChild(box);scrollLatest();
  }

  function skillToast({label,value,amount=1,beforeLevel,afterLevel,milestone=false}){
    if(!isVisible())return;
    const box=document.createElement("div");
    box.className=`bb-toast${milestone?" milestone":""}`;
    box.innerHTML=milestone
      ? `<b>${label.toUpperCase()} PROFICIENCY</b><span>${beforeLevel} → ${afterLevel}</span><small>Experience ${value}</small>`
      : `<b>${label.toUpperCase()} +${amount}</b><span>${afterLevel}</span>`;
    bbNotifications.appendChild(box);
    setTimeout(()=>box.classList.add("bb-toast-out"),milestone?4200:2200);
    setTimeout(()=>box.remove(),milestone?4700:2700);
  }

  function deliverOrQueue(item){
    if(!isVisible())return;
    if(running)queuedNotices.push(item);else notice(item.title,item.body,item.next,item.tone);
  }

  function flushNotices(){
    while(queuedNotices.length){
      const item=queuedNotices.shift();
      notice(item.title,item.body,item.next,item.tone);
    }
  }

  function refreshPrompt(){
    const s=getState(),host=HOSTS[s.terminal.hostId];
    prompt.textContent=getPrompt();
    label.textContent=`${s.terminal.user.toUpperCase()} @ ${host.hostname}`;
    link.textContent=s.terminal.hostId==="home"?"LOCAL":"REMOTE";
    trace.textContent=`${s.terminal.trace||0}%`;
  }

  async function performPurge(){
    form.classList.add("terminal-locked");
    input.disabled=true;
    for(const [line,delay] of [
      ["Scrubbing session state...",350],
      ["Revoking identity keys...",430],
      ["Archiving local records...",480],
      ["Closing BLACKBOX...",500],
      ["",180],
      ["IDENTITY PURGED",650]
    ]){
      await sleep(delay);
      print(line,line==="IDENTITY PURGED"?"purged":"dim");
    }
    await sleep(500);
    const purged=onPurge();
    if(purged===false){
      print("PURGE FAILED: identity archive could not be saved. Original identity remains active.","error");
      form.classList.remove("terminal-locked");input.disabled=false;
      refreshPrompt();
      try{input.focus({preventScroll:true});}catch{input.focus();}
    }
  }

  async function run(raw){
    running=true;
    autoFollow=true;updateLatestButton();
    printCommand(getPrompt(),raw);
    playSound("terminal_enter");
    const result=await executeCommand(raw);
    if((result.lines||[]).some(line=>line.type==="error"))playSound("terminal_error");
    if(result.clear)output.innerHTML="";
    for(const line of result.lines||[])print(line.text,line.type||"");
    refreshPrompt();
    running=false;
    flushNotices();
    if(result.purgeIdentity)await performPurge();
  }

  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const raw=input.value;
    input.value="";
    await run(raw);
  });

  input.addEventListener("keydown",e=>{
    const s=getState(),h=s.terminal.history;
    if(e.key==="ArrowUp"){
      e.preventDefault();
      if(!h.length)return;
      s.terminal.historyIndex=Math.max(0,s.terminal.historyIndex-1);
      input.value=h[s.terminal.historyIndex]||"";
    }else if(e.key==="ArrowDown"){
      e.preventDefault();
      s.terminal.historyIndex=Math.min(h.length,s.terminal.historyIndex+1);
      input.value=h[s.terminal.historyIndex]||"";
    }
  });

  desktopButton.addEventListener("click",()=>{
    const s=getState();
    input.blur();
    if(s.terminal.hostId!=="home"){
      remoteModal.classList.remove("hidden");
      return;
    }
    s.terminal.sessionOpen=true;
    s.terminal.suspended=true;
    onSuspend();
  });

  remoteCancel.addEventListener("click",()=>{
    remoteModal.classList.add("hidden");
    try{input.focus({preventScroll:true});}catch{input.focus();}
  });

  remoteReturn.addEventListener("click",async()=>{
    remoteModal.classList.add("hidden");
    await run("exit");
    const s=getState();
    s.terminal.sessionOpen=true;
    s.terminal.suspended=true;
    onSuspend();
  });

  on("terminal:exit",()=>onExit());
  on("save:status",({ok,error})=>{
    let warning=bbNotifications.querySelector("[data-save-warning]");
    if(ok){warning?.remove();return;}
    if(!warning){warning=document.createElement("div");warning.className="bb-toast save-warning";warning.dataset.saveWarning="1";bbNotifications.appendChild(warning);}
    warning.innerHTML="";
    const title=document.createElement("b"),body=document.createElement("span");
    title.textContent="SAVE WARNING";body.textContent=`Progress is not persisting. Last good save preserved. ${error||"Browser storage unavailable."}`;
    warning.append(title,body);
  });
  on("host:connected",refreshPrompt);
  on("mission:progress",({mission,objective})=>{
    const progress=getState().missions.progress[mission.id]||{};
    const next=mission.objectives.find(o=>!progress[o.id]);
    deliverOrQueue({
      title:"[ OBJECTIVE COMPLETE ]",
      body:objective.label,
      next:next?`NEXT: ${next.label}`:"Information added to Case Notes.",
      tone:"success"
    });
  });
  on("proficiency:changed",payload=>skillToast(payload));
  on("mission:completed",({mission})=>deliverOrQueue({
    title:"[ JOB COMPLETE ]",
    body:mission.title,
    next:`${mission.rewards?.credits||0} credits transferred. Return to NEXUS/OS when ready.`,
    tone:"success"
  }));
  on("clue:discovered",({clue})=>{
    if(!isVisible())return;
    deliverOrQueue({
      title:clue.kind==="world"?"[ WORLD INTEL LEARNED ]":"[ CLUE RECORDED ]",
      body:clue.title,
      next:clue.kind==="world"?'Stored in My Computer → World Intel and BLACKBOX "clues".':"Information added to Case Notes.",
      tone:clue.kind==="world"?"intel":"success"
    });
  });

  output.addEventListener("scroll",()=>{
    autoFollow=nearLatest();
    updateLatestButton();
  },{passive:true});
  latestButton.addEventListener("click",()=>{scrollLatest(true);try{input.focus({preventScroll:true});}catch{input.focus();}});

  return {
    showSession({resume=false}={}){
      const s=getState();
      autoFollow=true;updateLatestButton();
      remoteModal.classList.add("hidden");
      form.classList.remove("terminal-locked");
      input.disabled=false;
      if(resume && output.childElementCount){
        s.terminal.sessionOpen=true;
        s.terminal.suspended=false;
        print("");
        print(`-- SESSION RESUMED // ${HOSTS[s.terminal.hostId].hostname} --`,"dim");
      }else{
        s.terminal.sessionCount=(s.terminal.sessionCount||0)+1;
        s.terminal.sessionOpen=true;
        s.terminal.suspended=false;
        output.innerHTML="";
        print("┌──────────────────────────────────────────┐","banner");
        print("│       B L A C K B O X   S E C U R E      │","banner");
        print("│          INTERACTIVE SHELL 0.4.0-A3           │","banner");
        print("└──────────────────────────────────────────┘","banner");
        print("");
        print(`SESSION ${String(s.terminal.sessionCount).padStart(4,"0")} // LOCAL ENVIRONMENT`);
        print("SIMNET transport online   filesystem mounted   history ready","dim");
        print('Type "help" for the command index.',"dim");
        if(s.missions.active.length)print('Type "missions" to review active objectives.',"dim");
      }
      print("");
      refreshPrompt();
      setTimeout(()=>{
        try{input.focus({preventScroll:true});}catch{input.focus();}
      },0);
    }
  };
}

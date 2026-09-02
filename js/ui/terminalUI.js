import { executeCommand, getPrompt } from "../systems/terminal.js";
import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { on } from "../core/events.js";

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
  let running=false;
  const queuedNotices=[];

  function isVisible(){return !document.querySelector("#blackbox").classList.contains("hidden");}

  function print(text,type=""){
    const el=document.createElement("div");
    el.className=`terminal-line ${type}`;
    el.textContent=text;
    output.appendChild(el);
    output.scrollTop=output.scrollHeight;
  }

  function notice(title,body,next=""){
    const box=document.createElement("div");
    box.className="terminal-notice";
    box.innerHTML=`<b>${title}</b><span>${body}</span>${next?`<small>${next}</small>`:""}`;
    output.appendChild(box);
    output.scrollTop=output.scrollHeight;
  }

  function deliverOrQueue(item){
    if(!isVisible())return;
    if(running)queuedNotices.push(item);else notice(item.title,item.body,item.next);
  }

  function flushNotices(){
    while(queuedNotices.length){
      const item=queuedNotices.shift();
      notice(item.title,item.body,item.next);
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
    onPurge();
  }

  async function run(raw){
    running=true;
    print(`${getPrompt()} ${raw}`,"command");
    const result=await executeCommand(raw);
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
  on("host:connected",refreshPrompt);
  on("mission:progress",({mission,objective})=>{
    const progress=getState().missions.progress[mission.id]||{};
    const next=mission.objectives.find(o=>!progress[o.id]);
    deliverOrQueue({
      title:"[ OBJECTIVE COMPLETE ]",
      body:objective.label,
      next:next?`NEXT: ${next.label}`:"Information added to Case Notes."
    });
  });
  on("proficiency:changed",({label,value})=>deliverOrQueue({
    title:"[ PROFICIENCY ]",
    body:`${label} understanding increased.`,
    next:`Experience: ${value}. Use "skills" to review.`
  }));
  on("mission:completed",({mission})=>deliverOrQueue({
    title:"[ JOB COMPLETE ]",
    body:mission.title,
    next:`${mission.rewards?.credits||0} credits transferred. Return to NEXUS/OS when ready.`
  }));

  return {
    showSession({resume=false}={}){
      const s=getState();
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
        print("│         INTERACTIVE SHELL 0.2.1          │","banner");
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

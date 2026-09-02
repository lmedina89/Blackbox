import { executeCommand, getPrompt } from "../systems/terminal.js";
import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { on } from "../core/events.js";

const wait=ms=>new Promise(r=>setTimeout(r,ms));
export function initTerminalUI({onExit}){
  const output=document.querySelector("#terminal-output"),form=document.querySelector("#terminal-form"),input=document.querySelector("#terminal-input"),prompt=document.querySelector("#terminal-prompt"),label=document.querySelector("#bb-session-label"),link=document.querySelector("#bb-link"),trace=document.querySelector("#bb-trace"),desktopButton=document.querySelector("#bb-desktop-button");
  function print(text,type="",command=""){
    const el=document.createElement("div");el.className=`terminal-line ${type}`;
    if(type==="action"&&command){const b=document.createElement("button");b.type="button";b.className="terminal-action";b.textContent=text;b.addEventListener("click",()=>{input.value=command;try{input.focus({preventScroll:true});}catch{input.focus();}});el.appendChild(b);}else el.textContent=text;
    output.appendChild(el);output.scrollTop=output.scrollHeight;
  }
  function refreshPrompt(){const s=getState(),host=HOSTS[s.terminal.hostId];prompt.textContent=getPrompt();label.textContent=`${s.terminal.user.toUpperCase()} @ ${host.hostname}`;link.textContent=s.terminal.hostId==="home"?"LOCAL":"REMOTE";trace.textContent=`${s.terminal.trace||0}%`;}
  async function run(raw){print(`${getPrompt()} ${raw}`,"command");const result=await executeCommand(raw);if(result.clear)output.innerHTML="";for(const line of result.lines||[])print(line.text,line.type||"",line.command||"");refreshPrompt();}
  form.addEventListener("submit",async e=>{e.preventDefault();const raw=input.value;input.value="";await run(raw);});
  input.addEventListener("keydown",e=>{const s=getState(),h=s.terminal.history;if(e.key==="ArrowUp"){e.preventDefault();if(!h.length)return;s.terminal.historyIndex=Math.max(0,s.terminal.historyIndex-1);input.value=h[s.terminal.historyIndex]||"";}else if(e.key==="ArrowDown"){e.preventDefault();s.terminal.historyIndex=Math.min(h.length,s.terminal.historyIndex+1);input.value=h[s.terminal.historyIndex]||"";}});
  desktopButton?.addEventListener("click",async()=>{if(getState().terminal.hostId!=="home"){await run("exit");await wait(120);}print("Returning to NEXUS/OS desktop...","dim");onExit();});
  on("terminal:exit",()=>onExit());on("host:connected",refreshPrompt);
  return {showWelcome(){const s=getState();s.terminal.sessionCount=(s.terminal.sessionCount||0)+1;output.innerHTML="";print("┌────────────────────────────────────┐");print("│      B L A C K B O X  S E C U R E │");print("│        INTERACTIVE SHELL 0.1.2     │");print("└────────────────────────────────────┘");print("");print(`SESSION ${String(s.terminal.sessionCount).padStart(4,"0")} // LOCAL ENVIRONMENT`);print("SIMNET transport online   filesystem mounted   history ready","dim");if((s.player.discoveredHosts||[]).length)print('Known hosts available. Type "targets" or "scan".',"dim");else print('Type "help" for the command index.',"dim");print("");refreshPrompt();setTimeout(()=>{try{input.focus({preventScroll:true});}catch{input.focus();}},0);}};
}

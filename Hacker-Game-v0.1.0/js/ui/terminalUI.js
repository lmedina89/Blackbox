import { executeCommand, getPrompt } from "../systems/terminal.js";
import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { on } from "../core/events.js";

export function initTerminalUI({onExit}){
  const output=document.querySelector("#terminal-output");
  const form=document.querySelector("#terminal-form");
  const input=document.querySelector("#terminal-input");
  const prompt=document.querySelector("#terminal-prompt");
  const label=document.querySelector("#bb-session-label");
  const link=document.querySelector("#bb-link");

  function print(text,type=""){
    const el=document.createElement("div");
    el.className=`terminal-line ${type}`;
    el.textContent=text;
    output.appendChild(el);
    output.scrollTop=output.scrollHeight;
  }

  function refreshPrompt(){
    prompt.textContent=getPrompt();
    const host=HOSTS[getState().terminal.hostId];
    label.textContent=`${getState().terminal.user.toUpperCase()} @ ${host.hostname}`;
    link.textContent=getState().terminal.hostId==="home"?"LOCAL":"REMOTE";
  }

  async function run(raw){
    print(`${getPrompt()} ${raw}`,"command");
    const result=await executeCommand(raw);
    if(result.clear) output.innerHTML="";
    for(const line of result.lines||[]) print(line.text,line.type||"");
    refreshPrompt();
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

  on("terminal:exit",()=>onExit());
  on("host:connected",refreshPrompt);

  return {
    showWelcome(){
      output.innerHTML="";
      print("BLACKBOX SECURE ENVIRONMENT");
      print("Simulated systems only. Local shell initialized.","dim");
      print('Type "help" for command index.','dim');
      print("");
      refreshPrompt();
      setTimeout(()=>input.focus(),0);
    }
  };
}

import { executeCommand, getPrompt } from "../systems/terminal.js";
import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { on, emit } from "../core/events.js";
import { playSound } from "../systems/audio.js";

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const BLACKBOX_KEYBOARD_ROWS=["qwertyuiop","asdfghjkl","zxcvbnm"];


export function initTerminalUI({onExit,onSuspend,onPurge}){
  const output=document.querySelector("#terminal-output");
  const shell=document.querySelector(".terminal-shell");
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
  const inputControls=document.querySelector("#terminal-input-controls");
  const customKeyboard=document.querySelector("#terminal-custom-keyboard");
  const inputModeButton=document.querySelector("#terminal-input-mode");
  const keysCollapseButton=document.querySelector("#terminal-keys-collapse");
  let running=false;
  let autoFollow=true;
  let currentInputMode="system";
  let keysCollapsed=false;
  let keyboardPage="alpha";
  let shifted=false;
  const queuedNotices=[];

  function isVisible(){return !document.querySelector("#blackbox").classList.contains("hidden");}
  function coarsePointer(){return !!globalThis.matchMedia?.("(pointer: coarse)")?.matches;}
  function landscapeTouch(){return !!globalThis.matchMedia?.("(orientation: landscape) and (max-height: 520px) and (pointer: coarse)")?.matches;}
  function preferredInputMode(){
    if(!coarsePointer())return "system";
    const pref=getState().ui?.terminalInputMode||"auto";
    return pref==="system"?"system":"blackbox";
  }

  function updateLatestOffset(){
    if(!coarsePointer()){latestButton.style.removeProperty("bottom");latestButton.style.removeProperty("right");return;}
    requestAnimationFrame(()=>{
      const openCustom=currentInputMode==="blackbox"&&!keysCollapsed&&customKeyboard?.classList.contains("is-active");
      if(landscapeTouch()&&openCustom){
        latestButton.style.bottom=`${Math.max(40,(form.offsetHeight||0)+8)}px`;
        latestButton.style.right=`${Math.max(12,(customKeyboard.offsetWidth||0)+12)}px`;
        return;
      }
      const controls=inputControls?.offsetHeight||0;
      const keys=openCustom?(customKeyboard.offsetHeight||0):0;
      latestButton.style.bottom=`${Math.max(54,(form.offsetHeight||0)+controls+keys+8)}px`;
      latestButton.style.removeProperty("right");
    });
  }

  function focusCommandInput(){
    if(currentInputMode!=="system")return;
    try{input.focus({preventScroll:true});}catch{input.focus();}
  }

  function setKeyboardDisabled(disabled){
    for(const button of customKeyboard?.querySelectorAll("button")||[])button.disabled=!!disabled;
    if(inputModeButton)inputModeButton.disabled=!!disabled;
    if(keysCollapseButton)keysCollapseButton.disabled=!!disabled;
  }

  function insertInput(text){
    input.value+=String(text||"");
  }

  function backspaceInput(){
    input.value=Array.from(input.value).slice(0,-1).join("");
  }

  function historyStep(direction){
    const s=getState(),h=s.terminal.history;
    if(!h.length)return;
    if(direction<0)s.terminal.historyIndex=Math.max(0,s.terminal.historyIndex-1);
    else s.terminal.historyIndex=Math.min(h.length,s.terminal.historyIndex+1);
    input.value=h[s.terminal.historyIndex]||"";
  }

  function submitInput(){
    if(typeof form.requestSubmit==="function")form.requestSubmit();
    else form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));
  }

  function keySpec(label,{value=label,action="",wide=false,aria=label}={}){
    return {label,value,action,wide,aria};
  }

  function renderCustomKeyboard(){
    if(!customKeyboard)return;
    const letters=shifted?BLACKBOX_KEYBOARD_ROWS[0].toUpperCase():BLACKBOX_KEYBOARD_ROWS[0];
    const middle=shifted?BLACKBOX_KEYBOARD_ROWS[1].toUpperCase():BLACKBOX_KEYBOARD_ROWS[1];
    const lower=shifted?BLACKBOX_KEYBOARD_ROWS[2].toUpperCase():BLACKBOX_KEYBOARD_ROWS[2];
    const alphaRows=[
      Array.from(letters).map(ch=>keySpec(ch)),
      Array.from(middle).map(ch=>keySpec(ch)),
      [keySpec("⇧",{action:"shift",aria:"Shift"}),...Array.from(lower).map(ch=>keySpec(ch)),keySpec("/"),keySpec("."),keySpec("-")]
    ];
    const numberRows=[
      Array.from("1234567890").map(ch=>keySpec(ch)),
      ["!","@","#","$","%","^","&","*","(",")"].map(ch=>keySpec(ch)),
      ["[","]","{","}","\\","|","?","+","=",":",";"].map(ch=>keySpec(ch))
    ];
    const rows=keyboardPage==="numeric"?numberRows:alphaRows;
    rows.push([
      keySpec(keyboardPage==="numeric"?"ABC":"123",{action:"page",aria:keyboardPage==="numeric"?"Letters":"Numbers and symbols"}),
      keySpec("_"),keySpec("~"),keySpec(".."),
      keySpec("SPACE",{value:" ",wide:true,aria:"Space"}),
      keySpec("↑",{action:"history-up",aria:"Previous command"}),
      keySpec("↓",{action:"history-down",aria:"Next command"}),
      keySpec("⌫",{action:"backspace",aria:"Backspace"}),
      keySpec("ENTER",{action:"enter",wide:true,aria:"Enter command"})
    ]);
    customKeyboard.replaceChildren();
    const shell=document.createElement("div");shell.className="terminal-keyboard-case";
    const brand=document.createElement("div");brand.className="terminal-keyboard-brand";brand.innerHTML="<span>BLACKBOX SECURE INPUT DEVICE</span><span>BBX-90</span>";shell.appendChild(brand);
    rows.forEach((specs,rowIndex)=>{
      const row=document.createElement("div");
      row.className=`terminal-key-row terminal-key-row-${rowIndex+1}`;
      specs.forEach(spec=>{
        const button=document.createElement("button");
        button.type="button";button.className=`terminal-key${spec.wide?" terminal-key-wide":""}`;
        button.textContent=spec.label;button.setAttribute("aria-label",spec.aria);
        if(spec.action)button.dataset.action=spec.action;else button.dataset.value=spec.value;
        row.appendChild(button);
      });
      shell.appendChild(row);
    });
    customKeyboard.appendChild(shell);
  }

  function setInputMode(mode,{persist=false,focus=false}={}){
    const next=coarsePointer()&&mode!=="system"?"blackbox":"system";
    currentInputMode=next;
    const custom=next==="blackbox";
    input.readOnly=custom;
    input.setAttribute("inputmode",custom?"none":"text");
    input.classList.toggle("terminal-input-custom",custom);
    form.classList.toggle("terminal-form-custom",custom);
    customKeyboard?.classList.toggle("is-active",custom&&!keysCollapsed);
    inputControls?.classList.toggle("is-custom",custom);
    shell?.classList.toggle("terminal-shell-custom",custom);
    shell?.classList.toggle("terminal-shell-keys-open",custom&&!keysCollapsed);
    if(inputModeButton)inputModeButton.textContent=custom?"SYSTEM KEYBOARD":"BLACKBOX KEYS";
    if(keysCollapseButton){
      keysCollapseButton.classList.toggle("hidden",!custom);
      keysCollapseButton.textContent=keysCollapsed?"SHOW KEYS":"HIDE KEYS";
      keysCollapseButton.setAttribute("aria-expanded",String(!keysCollapsed));
    }
    if(custom)input.blur();else if(focus)focusCommandInput();
    if(persist){
      getState().ui.terminalInputMode=next;
      emit("ui:terminal-input-mode",{mode:next});
    }
    updateLatestOffset();
  }

  renderCustomKeyboard();

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
    setKeyboardDisabled(true);
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
      setKeyboardDisabled(false);
      refreshPrompt();
      focusCommandInput();
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

  input.addEventListener("pointerdown",e=>{
    if(currentInputMode!=="blackbox")return;
    e.preventDefault();
    input.blur();
  });
  input.addEventListener("focus",()=>{
    if(currentInputMode==="blackbox")input.blur();
  });
  input.addEventListener("keydown",e=>{
    if(e.key==="ArrowUp"){e.preventDefault();historyStep(-1);}
    else if(e.key==="ArrowDown"){e.preventDefault();historyStep(1);}
  });

  customKeyboard?.addEventListener("click",e=>{
    const button=e.target.closest("button");
    if(!button||button.disabled)return;
    const action=button.dataset.action;
    if(!action){insertInput(button.dataset.value||"");return;}
    if(action==="backspace")backspaceInput();
    else if(action==="history-up")historyStep(-1);
    else if(action==="history-down")historyStep(1);
    else if(action==="enter")submitInput();
    else if(action==="page"){keyboardPage=keyboardPage==="numeric"?"alpha":"numeric";shifted=false;renderCustomKeyboard();}
    else if(action==="shift"){shifted=!shifted;renderCustomKeyboard();}
  });

  inputModeButton?.addEventListener("click",()=>{
    if(currentInputMode==="blackbox")setInputMode("system",{persist:true,focus:true});
    else setInputMode("blackbox",{persist:true});
  });

  keysCollapseButton?.addEventListener("click",()=>{
    if(currentInputMode!=="blackbox")return;
    keysCollapsed=!keysCollapsed;
    customKeyboard?.classList.toggle("is-active",!keysCollapsed);
    shell?.classList.toggle("terminal-shell-keys-open",!keysCollapsed);
    keysCollapseButton.textContent=keysCollapsed?"SHOW KEYS":"HIDE KEYS";
    keysCollapseButton.setAttribute("aria-expanded",String(!keysCollapsed));
    updateLatestOffset();
  });

  document.addEventListener("keydown",e=>{
    if(!isVisible()||currentInputMode!=="blackbox"||running||!remoteModal.classList.contains("hidden"))return;
    const target=e.target,tag=target?.tagName;
    if(tag==="BUTTON"||tag==="INPUT"||tag==="TEXTAREA"||target?.isContentEditable)return;
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.key==="Enter"){e.preventDefault();submitInput();}
    else if(e.key==="Backspace"){e.preventDefault();backspaceInput();}
    else if(e.key==="ArrowUp"){e.preventDefault();historyStep(-1);}
    else if(e.key==="ArrowDown"){e.preventDefault();historyStep(1);}
    else if(e.key.length===1){e.preventDefault();insertInput(e.key);}
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
    focusCommandInput();
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
  latestButton.addEventListener("click",()=>{scrollLatest(true);focusCommandInput();});
  window.addEventListener("resize",updateLatestOffset,{passive:true});
  globalThis.visualViewport?.addEventListener?.("resize",updateLatestOffset,{passive:true});

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
        print("│      INTERACTIVE SHELL 0.4.0-A4.6.1        │","banner");
        print("└──────────────────────────────────────────┘","banner");
        print("");
        print(`SESSION ${String(s.terminal.sessionCount).padStart(4,"0")} // LOCAL ENVIRONMENT`);
        print("SIMNET transport online   filesystem mounted   history ready","dim");
        print('Type "help" for the command index.',"dim");
        if(s.missions.active.length)print('Type "missions" to review active objectives.',"dim");
      }
      print("");
      refreshPrompt();
      setInputMode(preferredInputMode());
      setKeyboardDisabled(false);
      setTimeout(()=>{focusCommandInput();updateLatestOffset();},0);
    }
  };
}

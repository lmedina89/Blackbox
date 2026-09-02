import { getState, setFlag, resetState } from "./core/state.js";
import { saveGame, loadGame, hasSave } from "./core/save.js";
import { startClock } from "./core/clock.js";
import { initMissions } from "./systems/missions.js";
import { initDesktopUI } from "./ui/desktop.js";
import { initTerminalUI } from "./ui/terminalUI.js";
import { enterBlackboxTransition, exitBlackboxTransition } from "./ui/transitions.js";
import { on } from "./core/events.js";

const boot=document.querySelector("#boot-screen");
const desktop=document.querySelector("#desktop");
const transition=document.querySelector("#blackbox-transition");
const blackbox=document.querySelector("#blackbox");
const lines=document.querySelector("#transition-lines");
const skipButton=document.querySelector("#skip-transition");

let desktopUI,terminalUI;

function initializeGameUI(){
  desktopUI=initDesktopUI({enterBlackbox});
  terminalUI=initTerminalUI({onExit:exitBlackbox});
  document.querySelector("#start-alias").textContent=getState().player.alias;
  desktop.classList.remove("hidden");
  boot.classList.add("hidden");
  // iOS Safari occasionally paints the icon labels before the glyphs on first reveal.
  // Force a layout/repaint on the next frame without changing the visual scale.
  requestAnimationFrame(()=>{
    desktop.classList.add("desktop-ready");
    void desktop.offsetWidth;
  });
  startClock();

  on("mission:started",()=>saveGame());
  on("mission:completed",()=>saveGame());
  on("hardware:purchased",()=>saveGame());
}

async function enterBlackbox(){
  saveGame();
  await enterBlackboxTransition({desktop,transition,blackbox,lines,skipButton});
  terminalUI.showWelcome();
}

async function exitBlackbox(){
  saveGame();
  const terminalInput=document.querySelector("#terminal-input");
  terminalInput?.blur();
  await exitBlackboxTransition({desktop,blackbox});
  desktopUI.refresh();
  // Recover cleanly from iOS Safari's text-input zoom/scroll state.
  requestAnimationFrame(()=>{
    window.scrollTo({top:0,left:0,behavior:"auto"});
    document.documentElement.scrollLeft=0;
    document.body.scrollLeft=0;
  });
}

initMissions();

document.querySelector("#alias-form").addEventListener("submit",e=>{
  e.preventDefault();
  const alias=document.querySelector("#alias-input").value.trim();
  if(!alias) return;
  resetState();
  getState().player.alias=alias;
  setFlag("alias_created");
  saveGame();
  initializeGameUI();
  setTimeout(()=>desktopUI.toast("You have new mail. Check NEXUS Mail."),600);
});

if(hasSave() && loadGame() && getState().player.alias){
  initializeGameUI();
}else{
  boot.classList.remove("hidden");
}

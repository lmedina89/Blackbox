import { getState, setFlag } from "./core/state.js";
import { saveGame, loadProfile, getProfileSummary, beginNewIdentity, restoreArchivedIdentity, archiveCurrentIdentity, hasActiveIdentity } from "./core/save.js";
import { startClock } from "./core/clock.js";
import { initMissions } from "./systems/missions.js";
import { initClues } from "./systems/clues.js";
import { initDesktopUI } from "./ui/desktop.js";
import { initTerminalUI } from "./ui/terminalUI.js";
import { enterBlackboxTransition, exitBlackboxTransition } from "./ui/transitions.js";
import { initAudio, playSound } from "./systems/audio.js";
import { initTimeline } from "./systems/timeline.js";
import { initCommunications } from "./systems/communications.js";
import { initServiceDesk } from "./systems/serviceDesk.js";
import { initAutosave } from "./core/autosave.js";
import { escapeHtml } from "./ui/safeText.js";

const boot=document.querySelector("#boot-screen");
const desktop=document.querySelector("#desktop");
const transition=document.querySelector("#blackbox-transition");
const blackbox=document.querySelector("#blackbox");
const lines=document.querySelector("#transition-lines");
const skipButton=document.querySelector("#skip-transition");
const bootHome=document.querySelector("#boot-home");
const newPanel=document.querySelector("#new-identity-panel");
const archivesPanel=document.querySelector("#archives-panel");
const continueButton=document.querySelector("#continue-button");
const newIdentityButton=document.querySelector("#new-identity-button");
const archivesButton=document.querySelector("#archives-button");
const activeSummary=document.querySelector("#active-identity-summary");
const bootStatus=document.querySelector("#boot-status");
const newWarning=document.querySelector("#new-identity-warning");
const archivesList=document.querySelector("#archives-list");

let desktopUI,terminalUI;
const loadResult=loadProfile();

function showPanel(which){
  bootHome.classList.toggle("hidden",which!=="home");
  newPanel.classList.toggle("hidden",which!=="new");
  archivesPanel.classList.toggle("hidden",which!=="archives");
}

function renderBoot(){
  const summary=getProfileSummary();
  boot.classList.remove("hidden");
  desktop.classList.add("hidden");
  blackbox.classList.add("hidden");
  transition.classList.add("hidden");
  showPanel("home");

  if(summary.active){
    activeSummary.classList.remove("hidden");
    activeSummary.innerHTML=`<b>ACTIVE IDENTITY</b><strong>${escapeHtml(summary.active.alias)}</strong><span>Day ${summary.active.day} · ${summary.active.credits} cr · Rep ${summary.active.reputation}</span>`;
    continueButton.classList.remove("hidden");
    newWarning.textContent="Creating a new identity will archive the current active identity first.";
  }else{
    activeSummary.classList.add("hidden");
    continueButton.classList.add("hidden");
    newWarning.textContent="A new identity starts with a clean world state.";
  }

  if(summary.archives.length){
    archivesButton.classList.remove("hidden");
    archivesButton.textContent=`Archived Identities (${summary.archives.length})`;
  }else{
    archivesButton.classList.add("hidden");
  }

  if(loadResult.error)bootStatus.textContent=loadResult.message||"Stored profile data could not be loaded safely. Recoverable data has been preserved.";
  else if(loadResult.legacyMigrated)bootStatus.textContent="Existing v0.1.2 identity imported into the new profile system.";
  else bootStatus.textContent=summary.active?"Select Continue to resume your active identity.":"No active identity. Create one to begin.";
}

function renderArchives(){
  const summary=getProfileSummary();
  archivesList.innerHTML="";
  if(!summary.archives.length){
    archivesList.innerHTML='<p class="muted">No archived identities.</p>';
    return;
  }
  for(const entry of summary.archives){
    const row=document.createElement("div");
    row.className="archive-row";
    const date=new Date(entry.archivedAt).toLocaleDateString();
    row.innerHTML=`<div><b>${escapeHtml(entry.alias)}</b><span>Day ${entry.day} · ${entry.credits} cr · Rep ${entry.reputation}</span><small>Archived ${date} · ${escapeHtml(entry.reason.replaceAll("_"," "))}</small></div><button type="button">Restore</button>`;
    row.querySelector("button").addEventListener("click",()=>{
      if(restoreArchivedIdentity(entry.archiveId))initializeGameUI();
    });
    archivesList.appendChild(row);
  }
}

function initializeGameUI(){
  initServiceDesk();
  desktopUI=initDesktopUI({enterBlackbox});
  terminalUI=initTerminalUI({onExit:closeBlackbox,onSuspend:suspendBlackbox,onPurge:purgeIdentity});
  document.querySelector("#start-alias").textContent=getState().player.alias;
  desktop.classList.remove("hidden");
  boot.classList.add("hidden");

  requestAnimationFrame(()=>{
    desktop.classList.add("desktop-ready");
    void desktop.offsetWidth;
  });

  startClock();
}

async function enterBlackbox(){
  playSound("blackbox_boot");
  saveGame();
  const resume=!!getState().terminal.sessionOpen;
  await enterBlackboxTransition({desktop,transition,blackbox,lines,skipButton,resume});
  terminalUI.showSession({resume});
}

async function returnToDesktop(){
  playSound("blackbox_exit");
  const terminalInput=document.querySelector("#terminal-input");
  terminalInput?.blur();
  await exitBlackboxTransition({desktop,blackbox});
  desktopUI.refresh();
  requestAnimationFrame(()=>{
    window.scrollTo({top:0,left:0,behavior:"auto"});
    document.documentElement.scrollLeft=0;
    document.body.scrollLeft=0;
  });
}

async function suspendBlackbox(){
  getState().terminal.sessionOpen=true;
  getState().terminal.suspended=true;
  saveGame();
  await returnToDesktop();
}

async function closeBlackbox(){
  saveGame();
  await returnToDesktop();
}

function purgeIdentity(){
  const archived=archiveCurrentIdentity("purged");
  if(!archived)return false;
  window.location.reload();
  return true;
}

initAudio();
initClues();
initMissions();
initAutosave();
initCommunications();
initTimeline();

window.addEventListener("pagehide",()=>{
  if(hasActiveIdentity())saveGame();
});

continueButton.addEventListener("click",()=>initializeGameUI());
newIdentityButton.addEventListener("click",()=>showPanel("new"));
document.querySelector("#new-identity-back").addEventListener("click",()=>showPanel("home"));
archivesButton.addEventListener("click",()=>{renderArchives();showPanel("archives");});
document.querySelector("#archives-back").addEventListener("click",()=>showPanel("home"));

document.querySelector("#alias-form").addEventListener("submit",e=>{
  e.preventDefault();
  const alias=document.querySelector("#alias-input").value.trim();
  if(!alias)return;
  beginNewIdentity(alias,{archiveActive:true});
  setFlag("alias_created");
  saveGame();
  initializeGameUI();
  setTimeout(()=>desktopUI.toast("You have new mail. Check NEXUS Mail."),600);
});

renderBoot();

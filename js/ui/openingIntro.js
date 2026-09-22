import { playSound, toggleAudio, isAudioEnabled } from "../systems/audio.js";

export const INTRO_VERSION=1;

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function shouldPlayOpeningIntro(state){
  if(!state||state.meta?.qaMode)return false;
  return Number(state.ui?.introVersionSeen||0)<INTRO_VERSION;
}

function delayFor(ms,reduced){return reduced?Math.min(70,Math.max(18,Math.round(ms*.16))):ms;}

const BOOT_SCRIPT=[
  {text:"NEXUS RECOVERY ENVIRONMENT",kind:"heading",sound:"intro_ambience",wait:700},
  {text:"INITIALIZING...",kind:"muted",sound:"boot_tick",wait:620},
  {text:"",wait:180},
  {text:"LOCAL STORAGE ........ OK",kind:"ok",sound:"boot_tick",wait:460},
  {text:"NETWORK STACK ........ OK",kind:"ok",sound:"boot_tick",wait:460},
  {text:"IDENTITY SERVICE ..... DEGRADED",kind:"warn",sound:"boot_warn",wait:720},
  {text:"SESSION INDEX ........ FOUND",kind:"ok",sound:"boot_tick",wait:540},
  {text:"",wait:220},
  {text:"USER PROFILE ......... UNVERIFIED",kind:"warn",sound:"boot_warn",wait:760},
  {text:"SESSION RESTORE ...... PARTIAL",kind:"warn",sound:"boot_warn",wait:760},
  {text:"NETWORK ACCESS ....... LIMITED",kind:"muted",sound:"boot_tick",wait:660},
  {text:"",wait:260},
  {text:"SECONDARY INTERFACE DETECTED",kind:"muted",sound:"intro_ambience",wait:620},
  {text:"BLACKBOX",kind:"blackbox",sound:"blackbox_boot",wait:880},
  {text:"STATUS ............... AVAILABLE",kind:"blackbox",sound:"boot_tick",wait:620},
  {text:"ORIGIN CHECK ......... NO RESPONSE",kind:"muted",sound:"boot_warn",wait:760},
  {text:"",wait:250},
  {text:"DO NOT DISCONNECT.",kind:"final",sound:"boot_tick",wait:820}
];

function appendLine(container,entry){
  const line=document.createElement("div");
  line.className=`opening-intro-line ${entry.kind||""}`.trim();
  line.textContent=entry.text||"\u00a0";
  container.appendChild(line);
  container.scrollTop=container.scrollHeight;
}

export async function playOpeningIntro({root=document,alias="operator",replay=false}={}){
  const overlay=root.querySelector("#opening-intro");
  if(!overlay)return {completed:false,skipped:false,reason:"missing-intro-root"};
  const lines=overlay.querySelector("#opening-intro-lines");
  const briefing=overlay.querySelector("#opening-intro-briefing");
  const briefingAlias=overlay.querySelector("#opening-intro-alias");
  const continueButton=overlay.querySelector("#opening-intro-continue");
  const skipButton=overlay.querySelector("#opening-intro-skip");
  const audioButton=overlay.querySelector("#opening-intro-audio");
  const phase=overlay.querySelector("#opening-intro-phase");
  const reduce=!!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const controller=new AbortController();
  let skipped=false,continued=false;

  const refreshAudio=()=>{
    const enabled=isAudioEnabled();
    audioButton.textContent=enabled?"SOUND ON":"SOUND OFF";
    audioButton.setAttribute("aria-pressed",String(enabled));
    audioButton.title=enabled?"Mute startup sounds":"Enable startup sounds";
  };

  lines.replaceChildren();
  briefing.classList.add("hidden");
  continueButton.classList.add("hidden");
  briefingAlias.textContent=String(alias||"operator").slice(0,32);
  phase.textContent=replay?"RECOVERY CONSOLE // STARTUP RECORD":"RECOVERY CONSOLE";
  refreshAudio();
  overlay.classList.remove("hidden","opening-intro-leaving");
  overlay.setAttribute("aria-hidden","false");

  skipButton.addEventListener("click",()=>{skipped=true;},{signal:controller.signal});
  audioButton.addEventListener("click",()=>{toggleAudio();refreshAudio();},{signal:controller.signal});
  continueButton.addEventListener("click",()=>{continued=true;},{signal:controller.signal});

  for(const entry of BOOT_SCRIPT){
    if(skipped)break;
    appendLine(lines,entry);
    if(entry.sound)playSound(entry.sound);
    await sleep(delayFor(entry.wait||400,reduce));
  }

  if(!skipped){
    phase.textContent="NEXUS OPERATIONS // SESSION BRIEF";
    briefing.classList.remove("hidden");
    continueButton.classList.remove("hidden");
    playSound("message");
    while(!continued&&!skipped)await sleep(40);
  }

  if(!skipped)playSound("nexus_ready");
  overlay.classList.add("opening-intro-leaving");
  await sleep(reduce?40:360);
  overlay.classList.add("hidden");
  overlay.classList.remove("opening-intro-leaving");
  overlay.setAttribute("aria-hidden","true");
  controller.abort();
  return {completed:!skipped,skipped,replay};
}

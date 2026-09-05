import { on } from "../core/events.js";

const STORAGE_KEY="blackbox.audio.enabled";
let context=null;
let master=null;
let initialized=false;
let recoveryPromise=null;
let pendingSound=null;

function readPreference(){
  try{return globalThis.localStorage?.getItem(STORAGE_KEY)!=="0";}
  catch(err){console.warn("[audio] preference read unavailable",err);return true;}
}
function writePreference(value){
  try{globalThis.localStorage?.setItem(STORAGE_KEY,value?"1":"0");return true;}
  catch(err){console.warn("[audio] preference write unavailable",err);return false;}
}
let enabled=readPreference();

function AudioContextClass(){return window.AudioContext||window.webkitAudioContext;}
function createContext(){
  const Ctx=AudioContextClass();
  if(!Ctx||!enabled)return null;
  context=new Ctx();
  master=context.createGain();
  master.gain.value=0.30;
  master.connect(context.destination);
  return context;
}
function ensureContext(){
  if(!enabled)return null;
  if(context?.state==="closed"){context=null;master=null;}
  return context||createContext();
}

export async function recoverAudioContext(){
  const ctx=ensureContext();
  if(!ctx)return false;
  if(ctx.state==="running")return true;
  if(ctx.state==="closed")return !!ensureContext()&&context.state==="running";
  if(typeof ctx.resume!=="function")return false;
  try{await ctx.resume();}catch(err){console.warn("[audio] resume failed",err);}
  if(context?.state==="closed"){ensureContext();}
  return context?.state==="running";
}

function tone({freq=440,endFreq=freq,duration=.06,delay=0,type="square",gain=.16}={}){
  const ctx=ensureContext();if(!ctx||ctx.state!=="running"||!master)return;
  const start=ctx.currentTime+delay;
  const osc=ctx.createOscillator(),amp=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),start+duration);
  amp.gain.setValueAtTime(0.0001,start);
  amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),start+.006);
  amp.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(amp);amp.connect(master);
  osc.start(start);osc.stop(start+duration+.01);
}

function noise({duration=.08,delay=0,gain=.05,highpass=900}={}){
  const ctx=ensureContext();if(!ctx||ctx.state!=="running"||!master)return;
  const length=Math.max(1,Math.floor(ctx.sampleRate*duration));
  const buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
  src.buffer=buffer;filter.type="highpass";filter.frequency.value=highpass;amp.gain.value=gain;
  src.connect(filter);filter.connect(amp);amp.connect(master);
  const start=ctx.currentTime+delay;src.start(start);
}

const SOUNDS={
  ui_open(){
    tone({freq:420,endFreq:640,duration:.12,type:"square",gain:.24});
    tone({freq:720,endFreq:960,duration:.14,delay:.075,type:"sine",gain:.24});
    noise({duration:.075,gain:.035,highpass:1700});
  },
  ui_close(){
    tone({freq:760,endFreq:460,duration:.13,type:"square",gain:.24});
    tone({freq:390,endFreq:230,duration:.15,delay:.08,type:"sine",gain:.23});
    noise({duration:.07,gain:.03,highpass:1500});
  },
  terminal_enter(){tone({freq:900,endFreq:700,duration:.05,type:"square",gain:.13});},
  terminal_error(){tone({freq:190,endFreq:105,duration:.16,type:"sawtooth",gain:.15});},
  connect(){tone({freq:360,endFreq:540,duration:.09,type:"square",gain:.14});tone({freq:620,endFreq:820,duration:.10,delay:.095,type:"sine",gain:.15});},
  disconnect(){tone({freq:680,endFreq:280,duration:.15,type:"square",gain:.14});},
  message(){tone({freq:740,endFreq:740,duration:.075,type:"sine",gain:.15});tone({freq:980,endFreq:980,duration:.09,delay:.09,type:"sine",gain:.14});},
  alert(){tone({freq:420,endFreq:420,duration:.08,type:"square",gain:.14});tone({freq:540,endFreq:540,duration:.09,delay:.10,type:"square",gain:.13});},
  success(){tone({freq:520,endFreq:650,duration:.09,type:"sine",gain:.14});tone({freq:790,endFreq:930,duration:.12,delay:.10,type:"sine",gain:.15});},
  job_complete(){tone({freq:392,duration:.10,type:"sine",gain:.14});tone({freq:523,duration:.11,delay:.11,type:"sine",gain:.14});tone({freq:784,duration:.17,delay:.23,type:"sine",gain:.15});},
  blackbox_boot(){noise({duration:.11,gain:.035,highpass:1200});tone({freq:95,endFreq:150,duration:.22,type:"sawtooth",gain:.055});tone({freq:760,endFreq:920,duration:.08,delay:.18,type:"square",gain:.07});},
  blackbox_exit(){noise({duration:.08,gain:.025,highpass:1500});tone({freq:420,endFreq:90,duration:.18,type:"sawtooth",gain:.06});},
  download(){tone({freq:300,endFreq:560,duration:.12,type:"square",gain:.13});noise({duration:.15,delay:.06,gain:.045,highpass:1800});}
};

function playNow(name){
  const fn=SOUNDS[name];
  if(!enabled||!fn||context?.state!=="running")return false;
  try{fn();return true;}catch(err){console.warn("[audio]",err);return false;}
}
function requestRecovery(name=null){
  if(name)pendingSound={name,at:Date.now()};
  if(recoveryPromise)return recoveryPromise;
  recoveryPromise=recoverAudioContext().then(ok=>{
    if(ok&&pendingSound&&Date.now()-pendingSound.at<1500){const next=pendingSound.name;pendingSound=null;playNow(next);}
    else if(pendingSound&&Date.now()-pendingSound.at>=1500)pendingSound=null;
    return ok;
  }).finally(()=>{recoveryPromise=null;});
  return recoveryPromise;
}

export function playSound(name){
  if(!enabled||!SOUNDS[name])return false;
  const ctx=ensureContext();
  if(!ctx)return false;
  if(ctx.state==="running")return playNow(name);
  requestRecovery(name);
  return true;
}

export function isAudioEnabled(){return enabled;}

export function setAudioEnabled(value){
  enabled=!!value;
  writePreference(enabled);
  if(!enabled){pendingSound=null;return enabled;}
  ensureContext();
  playSound("ui_open");
  return enabled;
}

export function toggleAudio(){return setAudioEnabled(!enabled);}

export function initAudio(){
  if(initialized)return;initialized=true;
  const recoverFromGesture=()=>{if(enabled)requestRecovery();};
  document.addEventListener("pointerdown",recoverFromGesture,{capture:true});
  document.addEventListener("keydown",recoverFromGesture,{capture:true});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&enabled&&context)requestRecovery();});
  window.addEventListener("pageshow",()=>{if(enabled&&context)requestRecovery();});

  on("host:connected",({hostId})=>playSound(hostId==="home"?"disconnect":"connect"));
  on("mission:started",()=>playSound("message"));
  on("mission:progress",()=>playSound("success"));
  on("mission:completed",()=>playSound("job_complete"));
  on("clue:discovered",()=>playSound("alert"));
  on("hardware:purchased",()=>playSound("success"));
  on("dialogue:choice",()=>playSound("terminal_enter"));
  on("file:downloaded",()=>playSound("download"));
}

export async function audioSelfTest(){
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)return {supported:false,peak:0,rms:0};
  const sampleRate=44100,duration=.12,ctx=new Offline(1,Math.ceil(sampleRate*duration),sampleRate);
  const osc=ctx.createOscillator(),amp=ctx.createGain();
  osc.type="square";osc.frequency.setValueAtTime(520,0);osc.frequency.exponentialRampToValueAtTime(700,duration);
  amp.gain.setValueAtTime(.0001,0);amp.gain.exponentialRampToValueAtTime(.08,.006);amp.gain.exponentialRampToValueAtTime(.0001,duration);
  osc.connect(amp);amp.connect(ctx.destination);osc.start(0);osc.stop(duration);
  const rendered=await ctx.startRendering(),data=rendered.getChannelData(0);
  let peak=0,sum=0;for(const value of data){const a=Math.abs(value);if(a>peak)peak=a;sum+=value*value;}
  return {supported:true,peak,rms:Math.sqrt(sum/data.length)};
}

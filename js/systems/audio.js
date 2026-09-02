import { on } from "../core/events.js";

const STORAGE_KEY="blackbox.audio.enabled";
let context=null;
let master=null;
let enabled=localStorage.getItem(STORAGE_KEY)!=="0";
let initialized=false;

function AudioContextClass(){return window.AudioContext||window.webkitAudioContext;}

function ensureContext(){
  const Ctx=AudioContextClass();
  if(!Ctx||!enabled)return null;
  if(!context){
    context=new Ctx();
    master=context.createGain();
    master.gain.value=0.16;
    master.connect(context.destination);
  }
  if(context.state==="suspended")context.resume().catch(()=>{});
  return context;
}

function tone({freq=440,endFreq=freq,duration=.06,delay=0,type="square",gain=.16}={}){
  const ctx=ensureContext();if(!ctx||!master)return;
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
  const ctx=ensureContext();if(!ctx||!master)return;
  const length=Math.max(1,Math.floor(ctx.sampleRate*duration));
  const buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
  src.buffer=buffer;filter.type="highpass";filter.frequency.value=highpass;amp.gain.value=gain;
  src.connect(filter);filter.connect(amp);amp.connect(master);
  const start=ctx.currentTime+delay;src.start(start);
}

const SOUNDS={
  ui_open(){tone({freq:520,endFreq:700,duration:.045,type:"sine",gain:.09});},
  ui_close(){tone({freq:620,endFreq:390,duration:.05,type:"sine",gain:.08});},
  terminal_enter(){tone({freq:880,endFreq:760,duration:.025,type:"square",gain:.055});},
  terminal_error(){tone({freq:180,endFreq:120,duration:.11,type:"sawtooth",gain:.10});},
  connect(){tone({freq:360,endFreq:520,duration:.07,type:"square",gain:.09});tone({freq:610,endFreq:760,duration:.08,delay:.075,type:"sine",gain:.10});},
  disconnect(){tone({freq:650,endFreq:300,duration:.12,type:"square",gain:.08});},
  message(){tone({freq:740,endFreq:740,duration:.055,type:"sine",gain:.10});tone({freq:980,endFreq:980,duration:.07,delay:.07,type:"sine",gain:.09});},
  alert(){tone({freq:420,endFreq:420,duration:.06,type:"square",gain:.09});tone({freq:520,endFreq:520,duration:.07,delay:.08,type:"square",gain:.08});},
  success(){tone({freq:520,endFreq:620,duration:.07,type:"sine",gain:.09});tone({freq:780,endFreq:900,duration:.10,delay:.075,type:"sine",gain:.10});},
  job_complete(){tone({freq:392,duration:.08,type:"sine",gain:.10});tone({freq:523,duration:.09,delay:.09,type:"sine",gain:.10});tone({freq:784,duration:.14,delay:.19,type:"sine",gain:.11});},
  blackbox_boot(){noise({duration:.11,gain:.035,highpass:1200});tone({freq:95,endFreq:150,duration:.22,type:"sawtooth",gain:.055});tone({freq:760,endFreq:920,duration:.08,delay:.18,type:"square",gain:.07});},
  blackbox_exit(){noise({duration:.08,gain:.025,highpass:1500});tone({freq:420,endFreq:90,duration:.18,type:"sawtooth",gain:.06});},
  download(){tone({freq:300,endFreq:520,duration:.09,type:"square",gain:.06});noise({duration:.12,delay:.05,gain:.025,highpass:1800});}
};

export function playSound(name){
  if(!enabled)return false;
  try{SOUNDS[name]?.();return !!SOUNDS[name];}catch(err){console.warn("[audio]",err);return false;}
}

export function isAudioEnabled(){return enabled;}

export function setAudioEnabled(value){
  enabled=!!value;localStorage.setItem(STORAGE_KEY,enabled?"1":"0");
  if(enabled){ensureContext();playSound("ui_open");}
  return enabled;
}

export function toggleAudio(){return setAudioEnabled(!enabled);}

export function initAudio(){
  if(initialized)return;initialized=true;
  const unlock=()=>{if(enabled)ensureContext();};
  document.addEventListener("pointerdown",unlock,{once:true,capture:true});
  document.addEventListener("keydown",unlock,{once:true,capture:true});

  on("host:connected",({hostId})=>playSound(hostId==="home"?"disconnect":"connect"));
  on("mission:started",()=>playSound("message"));
  on("mission:progress",()=>playSound("success"));
  on("mission:completed",()=>playSound("job_complete"));
  on("clue:discovered",()=>playSound("alert"));
  on("hardware:purchased",()=>playSound("success"));
  on("dialogue:choice",()=>playSound("terminal_enter"));
  on("file:downloaded",()=>playSound("download"));
}

// QA hook: renders a short tone off-screen and verifies the generated waveform has energy.
// It does not play through the speakers and is never called during normal gameplay.
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

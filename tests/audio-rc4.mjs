import assert from "node:assert/strict";

const listeners={document:new Map(),window:new Map()};
const originalWarn=console.warn;console.warn=()=>{};
globalThis.localStorage={getItem(){throw new Error("preference storage blocked");},setItem(){throw new Error("preference storage blocked");}};
globalThis.document={
  visibilityState:"visible",
  addEventListener(name,fn){listeners.document.set(name,fn);}
};
globalThis.window={addEventListener(name,fn){listeners.window.set(name,fn);}};

const instances=[];
class FakeParam{setValueAtTime(){} exponentialRampToValueAtTime(){} }
class FakeNode{connect(){} }
class FakeGain extends FakeNode{constructor(){super();this.gain=new FakeParam();this.gain.value=0;}}
class FakeOsc extends FakeNode{constructor(){super();this.frequency=new FakeParam();this.type="";}start(){}stop(){}}
class FakeBuffer{getChannelData(){return new Float32Array(8);}}
class FakeSource extends FakeNode{start(){}}
class FakeFilter extends FakeNode{constructor(){super();this.frequency={value:0};this.type="";}}
class FakeAudioContext{
  constructor(){this.state=instances.length?"suspended":"interrupted";this.currentTime=0;this.sampleRate=44100;this.destination={};this.resumeCalls=0;instances.push(this);}
  createGain(){return new FakeGain();}createOscillator(){return new FakeOsc();}createBuffer(){return new FakeBuffer();}createBufferSource(){return new FakeSource();}createBiquadFilter(){return new FakeFilter();}
  async resume(){this.resumeCalls++;this.state="running";}
}
globalThis.window.AudioContext=FakeAudioContext;

const audio=await import(`../js/systems/audio.js?rc4=${Date.now()}`);
assert.equal(audio.isAudioEnabled(),true,"blocked preference storage should not block audio startup");
assert.equal(audio.playSound("ui_open"),true);
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(instances[0].resumeCalls,1,"interrupted context was not resumed");
assert.equal(instances[0].state,"running");

instances[0].state="closed";
assert.equal(audio.playSound("success"),true);
await new Promise(resolve=>setTimeout(resolve,0));
assert(instances.length>=2,"closed context was not recreated");
assert.equal(instances.at(-1).state,"running");
assert(instances.at(-1).resumeCalls>=1,"replacement suspended context was not resumed");

audio.initAudio();
assert(listeners.document.has("pointerdown"));
assert(listeners.document.has("click"));
assert(listeners.document.has("touchend"));
assert(listeners.document.has("visibilitychange"));
assert(listeners.window.has("pageshow"));

console.warn=originalWarn;
console.log("BLACKBOX v0.3.0 RC5 audio lifecycle tests passed");

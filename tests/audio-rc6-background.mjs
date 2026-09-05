import assert from "node:assert/strict";

const listeners={document:new Map(),window:new Map()};
globalThis.localStorage={getItem(){return "1";},setItem(){}};
globalThis.document={
  visibilityState:"visible",
  addEventListener(name,fn){listeners.document.set(name,fn);}
};
globalThis.window={addEventListener(name,fn){listeners.window.set(name,fn);}};

const instances=[];
let oscStarts=0;
class FakeParam{setValueAtTime(){} exponentialRampToValueAtTime(){}}
class FakeNode{connect(){}}
class FakeGain extends FakeNode{constructor(){super();this.gain=new FakeParam();this.gain.value=0;}}
class FakeOsc extends FakeNode{constructor(){super();this.frequency=new FakeParam();this.type="";}start(){oscStarts++;}stop(){}}
class FakeBuffer{getChannelData(){return new Float32Array(8);}}
class FakeSource extends FakeNode{start(){}}
class FakeFilter extends FakeNode{constructor(){super();this.frequency={value:0};this.type="";}}
class FakeAudioContext{
  constructor(){
    this.state=instances.length===0?"running":"suspended";
    this.currentTime=0;this.sampleRate=44100;this.destination={};this.resumeCalls=0;this.closeCalls=0;
    instances.push(this);
  }
  createGain(){return new FakeGain();}
  createOscillator(){return new FakeOsc();}
  createBuffer(){return new FakeBuffer();}
  createBufferSource(){return new FakeSource();}
  createBiquadFilter(){return new FakeFilter();}
  async resume(){this.resumeCalls++;this.state="running";}
  async close(){this.closeCalls++;this.state="closed";}
}
globalThis.window.AudioContext=FakeAudioContext;

const audio=await import(`../js/systems/audio.js?rc6background=${Date.now()}`);
audio.initAudio();

// Establish a healthy, audible context first.
assert.equal(audio.playSound("ui_open"),true);
assert.equal(instances.length,1);
assert.equal(instances[0].state,"running");
assert.equal(oscStarts>0,true,"initial running context did not produce a sound");

// Model iOS backgrounding. The stale context deliberately still reports running.
document.visibilityState="hidden";
listeners.document.get("visibilitychange")();
assert.equal(instances[0].state,"running","test requires a stale context that still reports running");

document.visibilityState="visible";
listeners.document.get("visibilitychange")();
assert.equal(instances.length,1,"visible callback recreated audio outside a trusted gesture");

// The first real gesture after return must discard the stale-running graph and rebuild.
listeners.document.get("pointerdown")();
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(instances.length,2,"trusted gesture did not recreate the stale backgrounded context");
assert.equal(instances[0].closeCalls,1,"old backgrounded context was not retired");
assert.equal(instances[1].resumeCalls>=1,true,"replacement context was not resumed");
assert.equal(instances[1].state,"running");

const before=oscStarts;
assert.equal(audio.playSound("success"),true);
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(oscStarts>before,true,"sound did not play after background recovery");

// pagehide/BFCache-style lifecycle also marks the graph stale.
listeners.window.get("pagehide")();
listeners.document.get("click")();
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(instances.length,3,"pagehide stale context was not recreated by the next trusted click");

console.log("BLACKBOX v0.3.0 RC6 long-background Safari audio recovery regression passed");

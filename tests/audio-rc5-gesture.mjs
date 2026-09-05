import assert from "node:assert/strict";

const listeners={document:new Map(),window:new Map()};
globalThis.localStorage={getItem(){return "1";},setItem(){}};
globalThis.document={
  visibilityState:"visible",
  addEventListener(name,fn){listeners.document.set(name,fn);}
};
globalThis.window={addEventListener(name,fn){listeners.window.set(name,fn);}};

let oscStarts=0;
class FakeParam{setValueAtTime(){} exponentialRampToValueAtTime(){}}
class FakeNode{connect(){}}
class FakeGain extends FakeNode{constructor(){super();this.gain=new FakeParam();this.gain.value=0;}}
class FakeOsc extends FakeNode{constructor(){super();this.frequency=new FakeParam();this.type="";}start(){oscStarts++;}stop(){}}
class FakeBuffer{getChannelData(){return new Float32Array(8);}}
class FakeSource extends FakeNode{start(){}}
class FakeFilter extends FakeNode{constructor(){super();this.frequency={value:0};this.type="";}}
class FakeAudioContext{
  constructor(){this.state="interrupted";this.currentTime=0;this.sampleRate=44100;this.destination={};this.resumeCalls=0;}
  createGain(){return new FakeGain();}
  createOscillator(){return new FakeOsc();}
  createBuffer(){return new FakeBuffer();}
  createBufferSource(){return new FakeSource();}
  createBiquadFilter(){return new FakeFilter();}
  async resume(){this.resumeCalls++;if(this.resumeCalls>=2)this.state="running";}
}
globalThis.window.AudioContext=FakeAudioContext;

const audio=await import(`../js/systems/audio.js?rc5gesture=${Date.now()}`);
audio.initAudio();

// First trusted gesture phase fails to unlock, modeling the iPhone failure.
listeners.document.get("pointerdown")();
// The actual action that wants sound must be allowed to retry immediately.
assert.equal(audio.playSound("ui_open"),true);
await new Promise(resolve=>setTimeout(resolve,0));

assert.equal(oscStarts>0,true,"sound did not recover after the first gesture-phase resume failed");
console.log("BLACKBOX v0.3.0 RC5 Safari gesture retry regression passed");

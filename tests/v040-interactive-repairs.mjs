import assert from "node:assert/strict";
import fs from "node:fs";
import { resetState, setFlag } from "../js/core/state.js";
import { initTimeline } from "../js/systems/timeline.js";
import { makeChoice } from "../js/systems/communications.js";
import { THREADS } from "../js/data/messages.js";
import { SOCIAL_POSTS } from "../js/data/social.js";
import { contentAvailable } from "../js/systems/contentAvailability.js";
import { chronologyAvailable } from "../js/systems/contentChronology.js";

// Reproduce the exact early Old Mirror timing path after the future-content repair.
{
  const s=resetState();
  s.world.day=1;s.world.minute=19*60+3;
  setFlag("alias_created");setFlag("mission_first_complete");
  s.world.caseHistory.push({id:"mission:mission_first",kind:"mission",day:1,minute:18*60+56,title:"Easy Money"});
  const maya=THREADS.find(t=>t.id==="maya");
  const offer=maya.messages.find(m=>m.id==="m5");
  assert.equal(contentAvailable(offer),true);
  assert.equal(chronologyAvailable(offer,{kind:"message",state:s}),true,"Maya's Old Mirror offer must be due at 19:03");

  initTimeline();
  const result=makeChoice("mirror_send");
  assert.equal(result.ok,true);
  assert.equal(s.world.minute,19*60+6,"existing dialogue action must advance the world three minutes");
  const samPost=SOCIAL_POSTS.find(p=>p.id==="s5");
  assert.equal(contentAvailable(samPost),true);
  assert.equal(chronologyAvailable(samPost,{kind:"social",state:s}),true,"Sam's 19:05 mission post must be available after the existing reply action");
}

// Runtime/version-label consistency from the Work audit finding.
{
  const desktop=fs.readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
  const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(desktop,/0\.4\.0-A4\.5 installed/);
  assert.doesNotMatch(desktop,/0\.4\.0-A4 installed/);
  assert.match(index,/BLACKBOX\/0\.4\.0-A4\.5/);
}

console.log("BLACKBOX v0.4.0 Alpha 4.5 interactive-audit repair compatibility guards passed");

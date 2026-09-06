import assert from "node:assert/strict";
import { resetState, setFlag } from "../js/core/state.js";
import { THREADS } from "../js/data/messages.js";
import { SOCIAL_POSTS } from "../js/data/social.js";
import { contentAvailable } from "../js/systems/contentAvailability.js";
import { chronologyAvailable, contentTimeLabel, sortChronologically } from "../js/systems/contentChronology.js";

function at(s,h,m){s.world.day=1;s.world.minute=h*60+m;}

// Reproduce the physical-device A3 finding: ThreatDesk at 18:46 + ambient Maya at 18:55.
// Rendering must use effective timestamps, not source-array position.
{
  const s=resetState();at(s,19,13);setFlag("alias_created");setFlag("threatdesk_online");
  s.world.caseHistory.push({id:"event:threatdesk_online",day:1,minute:18*60+46});
  s.world.timeline.delivered.push("ambient_maya_food_01");
  s.world.timeline.deliveryTimes.ambient_maya_food_01={day:1,minute:18*60+55,absolute:18*60+55};
  const thread=THREADS.find(t=>t.id==="maya");
  const visible=sortChronologically(thread.messages.filter(message=>contentAvailable(message)&&chronologyAvailable(message,{kind:"message",state:s})),s,{direction:"asc"});
  const ids=visible.map(message=>message.id);
  assert(ids.indexOf("m10")<ids.indexOf("m13"),"18:46 ThreatDesk line must render before 18:55 ambient line");
  assert.equal(contentTimeLabel(visible.find(m=>m.id==="m10"),s),"18:46");
  assert.equal(contentTimeLabel(visible.find(m=>m.id==="m13"),s),"18:55");
  const times=visible.map(m=>contentTimeLabel(m,s));
  assert.deepEqual(times,["18:38","18:39","18:39","18:46","18:55"]);
}

// A3 device finding: FriendSpace must not show authored future posts simply because their flags are true.
{
  const s=resetState();at(s,19,5);setFlag("alias_created");setFlag("threatdesk_online");setFlag("cedar_lead_available");
  s.world.caseHistory.push({id:"event:threatdesk_online",day:1,minute:18*60+46});
  s.world.caseHistory.push({id:"event:cedar_lead",day:1,minute:19*60+2});
  const cedar=SOCIAL_POSTS.find(x=>x.id==="s11"),threat=SOCIAL_POSTS.find(x=>x.id==="s12"),orchid=SOCIAL_POSTS.find(x=>x.id==="s10");
  assert.equal(chronologyAvailable(orchid,{kind:"social",state:s}),true,"18:55 post should be visible by 19:05");
  assert.equal(chronologyAvailable(cedar,{kind:"social",state:s}),true,"Cedar post generated at 19:02 must be visible by 19:05");
  assert.equal(contentTimeLabel(cedar,s),"19:02","Cedar post must inherit the cedar_lead event timestamp");
  assert.equal(chronologyAvailable(threat,{kind:"social",state:s}),false,"20:08 ThreatDesk post must not appear at 19:05");
  at(s,20,9);
  assert.equal(chronologyAvailable(cedar,{kind:"social",state:s}),true);
  assert.equal(chronologyAvailable(threat,{kind:"social",state:s}),true);
}

// Mission-critical FriendSpace obeys chronology too. Maya's reply action advances three minutes,
// so Sam's authored 19:05 post is naturally due by the time the player can inspect FriendSpace.
{
  const s=resetState();at(s,19,3);setFlag("mirror_lead_accepted");
  const mirror=SOCIAL_POSTS.find(x=>x.id==="s5");
  assert.equal(contentAvailable(mirror),true);
  assert.equal(chronologyAvailable(mirror,{kind:"social",state:s}),false,"Sam's 19:05 post must not appear at 19:03");
  at(s,19,6);
  assert.equal(chronologyAvailable(mirror,{kind:"social",state:s}),true,"Sam's Old Mirror post should be due after the existing 3-minute reply action");
}

// Work interactive audit regression: mission-completion reactions must not appear future-dated.
{
  const s=resetState();at(s,18,56);setFlag("alias_created");setFlag("mission_first_complete");
  s.world.caseHistory.push({id:"mission:mission_first",kind:"mission",day:1,minute:18*60+56,title:"Easy Money"});
  const thread=THREADS.find(t=>t.id==="maya");
  const due=thread.messages.filter(message=>contentAvailable(message)&&chronologyAvailable(message,{kind:"message",state:s}));
  assert.equal(due.some(message=>message.id==="m4"),false,"19:01 Easy Money reaction must be hidden at 18:56");
  assert.equal(due.some(message=>message.id==="m5"),false,"19:03 Old Mirror lead must be hidden at 18:56");
  at(s,19,1);
  assert.equal(chronologyAvailable(thread.messages.find(m=>m.id==="m4"),{kind:"message",state:s}),true);
  assert.equal(chronologyAvailable(thread.messages.find(m=>m.id==="m5"),{kind:"message",state:s}),false);
  at(s,19,3);
  assert.equal(chronologyAvailable(thread.messages.find(m=>m.id==="m5"),{kind:"message",state:s}),true);
}

// FriendSpace is rendered newest-first once items are actually due.
{
  const s=resetState();at(s,22,0);setFlag("alias_created");setFlag("threatdesk_online");setFlag("cedar_lead_available");
  s.world.caseHistory.push({id:"event:threatdesk_online",day:1,minute:18*60+46});
  s.world.caseHistory.push({id:"event:cedar_lead",day:1,minute:19*60+2});
  const due=SOCIAL_POSTS.filter(item=>contentAvailable(item)&&chronologyAvailable(item,{kind:"social",state:s}));
  const ordered=sortChronologically(due,s,{direction:"desc"});
  const labels=ordered.map(item=>contentTimeLabel(item,s));
  for(let i=1;i<labels.length;i++){
    const parse=v=>{const t=v.split(" ").at(-1);const [h,m]=t.split(":").map(Number);return h*60+m;};
    assert(parse(labels[i-1])>=parse(labels[i]),`FriendSpace not newest-first: ${labels.join(", ")}`);
  }
}

console.log("BLACKBOX v0.4.0 Alpha 4.2 chronology tests passed");

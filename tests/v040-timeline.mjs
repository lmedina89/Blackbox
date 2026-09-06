import assert from "node:assert/strict";
import { resetState, replaceState, setFlag } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { processScheduledContent } from "../js/systems/scheduler.js";

function setWorld(s,day,minute,actionTick=s.world.actionTick||0){
  s.world.day=day;s.world.minute=minute;s.world.actionTick=actionTick;
}
function abs(s){return (s.world.day-1)*1440+s.world.minute;}
function moveToAbsolute(s,value){s.world.day=Math.floor(value/1440)+1;s.world.minute=value%1440;}

// afterMinutes: schedule once, survive reload, never reroll, then deliver exactly once.
{
  const s=resetState();setWorld(s,2,600);setFlag("ready");
  const defs=[{id:"delay",when:{flagsAll:["ready"]},timing:{mode:"afterMinutes",minMinutes:10,maxMinutes:20}}];
  processScheduledContent(defs);
  const scheduledAt=s.world.timeline.scheduled.delay.at;
  assert(scheduledAt>=abs(s)+10&&scheduledAt<=abs(s)+20);
  const restored=migrateSave(structuredClone(s));
  replaceState(restored);
  processScheduledContent(defs);
  assert.equal(restored.world.timeline.scheduled.delay.at,scheduledAt,"reload rerolled delivery time");
  moveToAbsolute(restored,scheduledAt-1);processScheduledContent(defs);
  assert(!restored.world.timeline.delivered.includes("delay"));
  moveToAbsolute(restored,scheduledAt);processScheduledContent(defs);
  assert(restored.world.timeline.delivered.includes("delay"));
  assert.equal(restored.world.timeline.deliveryTimes.delay.absolute,scheduledAt);
  processScheduledContent(defs);
  assert.equal(restored.world.timeline.delivered.filter(x=>x==="delay").length,1);
}

// timeWindow: delivery is placed inside the requested future clock window.
{
  const s=resetState();setWorld(s,1,16*60);
  const defs=[{id:"evening",timing:{mode:"timeWindow",startMinute:18*60,endMinute:22*60,minLeadMinutes:5}}];
  processScheduledContent(defs);
  const at=s.world.timeline.scheduled.evening.at,minute=at%1440;
  assert(minute>=18*60&&minute<=22*60);
  assert(at>abs(s));
  moveToAbsolute(s,at);processScheduledContent(defs);
  assert(s.world.timeline.delivered.includes("evening"));
}

// afterEvent: later content anchors to the persisted delivery time of earlier content.
{
  const s=resetState();setWorld(s,3,300);
  const defs=[
    {id:"anchor",timing:{mode:"afterMinutes",minutes:0}},
    {id:"follow",when:{contentDelivered:["anchor"]},timing:{mode:"afterEvent",eventId:"anchor",minutes:45}}
  ];
  processScheduledContent(defs);
  assert(s.world.timeline.delivered.includes("anchor"));
  assert.equal(s.world.timeline.scheduled.follow.at,s.world.timeline.deliveryTimes.anchor.absolute+45);
  moveToAbsolute(s,s.world.timeline.scheduled.follow.at);processScheduledContent(defs);
  assert(s.world.timeline.delivered.includes("follow"));
}

// afterActions: new scheduler can use action cadence without altering the legacy world-event path.
{
  const s=resetState();setWorld(s,1,500,4);
  const defs=[{id:"actions",timing:{mode:"afterActions",actions:3}}];
  processScheduledContent(defs);
  assert.equal(s.world.timeline.scheduled.actions.dueActionTick,7);
  s.world.actionTick=6;processScheduledContent(defs);assert(!s.world.timeline.delivered.includes("actions"));
  s.world.actionTick=7;processScheduledContent(defs);assert(s.world.timeline.delivered.includes("actions"));
}

// Cancellation and replacement: obsolete content never delivers, replacement can take its place.
{
  const s=resetState();setWorld(s,1,700);
  const defs=[
    {id:"old",timing:{mode:"afterMinutes",minutes:60},cancelWhen:{flagsAll:["resolved"]},replaceWith:"new"},
    {id:"new",replacementOnly:true,timing:{mode:"afterMinutes",minutes:0}}
  ];
  processScheduledContent(defs);
  assert(s.world.timeline.scheduled.old);
  assert(!s.world.timeline.scheduled.new);
  assert(!s.world.timeline.delivered.includes("new"));
  setFlag("resolved");
  processScheduledContent(defs);
  assert(s.world.timeline.cancelled.includes("old"));
  assert(!s.world.timeline.delivered.includes("old"));
  assert(s.world.timeline.delivered.includes("new"));
}

// Expiration: content can become stale before its scheduled delivery.
{
  const s=resetState();setWorld(s,1,800);
  const defs=[{id:"stale",timing:{mode:"afterMinutes",minutes:30},expiresAfterMinutes:10}];
  processScheduledContent(defs);
  moveToAbsolute(s,abs(s)+10);processScheduledContent(defs);
  assert(s.world.timeline.expired.includes("stale"));
  assert(!s.world.timeline.delivered.includes("stale"));
}

// Chronological catch-up: overdue items deliver by scheduled time, not input order.
{
  const s=resetState();setWorld(s,1,900);
  const defs=[
    {id:"later",timing:{mode:"afterMinutes",minutes:20}},
    {id:"earlier",timing:{mode:"afterMinutes",minutes:10}}
  ];
  processScheduledContent(defs);
  const earlierAt=s.world.timeline.scheduled.earlier.at;
  const laterAt=s.world.timeline.scheduled.later.at;
  moveToAbsolute(s,abs(s)+25);processScheduledContent(defs);
  assert.deepEqual(s.world.timeline.delivered,["earlier","later"]);
  assert.equal(s.world.timeline.deliveryTimes.earlier.absolute,earlierAt,"catch-up lost original earlier timestamp");
  assert.equal(s.world.timeline.deliveryTimes.later.absolute,laterAt,"catch-up lost original later timestamp");
}

// Overnight windows such as 22:00–02:00 are supported for believable character routines.
{
  const s=resetState();setWorld(s,1,21*60+50);
  const defs=[{id:"night",timing:{mode:"timeWindow",startMinute:22*60,endMinute:2*60,minLeadMinutes:5}}];
  processScheduledContent(defs);
  const at=s.world.timeline.scheduled.night.at,minute=at%1440;
  assert(at>=abs(s)+5);
  assert(minute>=22*60||minute<=2*60);
}

// Read prerequisites distinguish delivery from reading.
{
  const s=resetState();setWorld(s,1,1000);
  const defs=[{id:"after_read",when:{readAll:[{type:"message",id:"m1"}]},timing:{mode:"afterMinutes",minutes:0}}];
  processScheduledContent(defs);assert(!s.world.timeline.delivered.includes("after_read"));
  s.world.readMessages.push("m1");processScheduledContent(defs);assert(s.world.timeline.delivered.includes("after_read"));
}

// Malformed scheduler state is normalized instead of blocking a runnable save.
{
  const s=resetState();
  s.world.timeline.scheduled={bad:"not-an-object",good:{mode:"afterMinutes",eligibleAt:100,at:120},odd:{mode:"nonsense",eligibleAt:-5,at:"130"}};
  s.world.timeline.deliveryTimes={oldNumeric:1500,badTime:"oops"};
  const restored=migrateSave(structuredClone(s));
  assert(!("bad" in restored.world.timeline.scheduled));
  assert.equal(restored.world.timeline.scheduled.good.at,120);
  assert.equal(restored.world.timeline.scheduled.odd.mode,"afterMinutes");
  assert.equal(restored.world.timeline.scheduled.odd.eligibleAt,0);
  assert.equal(restored.world.timeline.scheduled.odd.at,130);
  assert.equal(restored.world.timeline.deliveryTimes.oldNumeric.absolute,1500);
  assert(!("badTime" in restored.world.timeline.deliveryTimes));
}

console.log("BLACKBOX v0.4.0 Alpha 2 scheduler tests passed");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resetState, setFlag } from "../js/core/state.js";
import { processScheduledContent } from "../js/systems/scheduler.js";
import { SCHEDULED_CONTENT } from "../js/data/scheduledContent.js";
import { THREADS } from "../js/data/messages.js";
import { NEWS } from "../js/data/news.js";
import { SOCIAL_POSTS } from "../js/data/social.js";
import { contentAvailable, contentDelivery } from "../js/systems/contentAvailability.js";

function allItems(){
  return [
    ...THREADS.flatMap(thread=>thread.messages.map(item=>({item,kind:"message",threadId:thread.id}))),
    ...NEWS.map(item=>({item,kind:"news"})),
    ...SOCIAL_POSTS.map(item=>({item,kind:"social"}))
  ];
}
function moveToAbsolute(s,value){s.world.day=Math.floor(value/1440)+1;s.world.minute=value%1440;}

assert.equal(SCHEDULED_CONTENT.length,5,"A3 should keep the live migration deliberately small");

// Every live scheduler definition maps to exactly one content item and none of those items carries a clue/choice.
for(const def of SCHEDULED_CONTENT){
  const matches=allItems().filter(entry=>entry.item.scheduleId===def.id);
  assert.equal(matches.length,1,`${def.id} must map to exactly one item`);
  const {item,kind,threadId}=matches[0];
  assert.equal(kind,def.kind,`${def.id} kind mismatch`);
  if(def.threadId)assert.equal(threadId,def.threadId);
  assert.equal(item.id,def.itemId);
  assert(!item.clueId,`${def.id} must not carry World Intel/clue progression`);
  assert(!item.choice,`${def.id} must not contain a mission/dialogue choice`);
}

// Fresh identities schedule ambient content but do not expose it until the persisted due time.
{
  const s=resetState();
  setFlag("alias_created");
  processScheduledContent(SCHEDULED_CONTENT);
  const maya=THREADS.find(t=>t.id==="maya").messages.find(m=>m.id==="m13");
  assert(s.world.timeline.scheduled["ambient_maya_food_01"]);
  assert.equal(contentAvailable(maya),false);
  const due=s.world.timeline.scheduled["ambient_maya_food_01"].at;
  assert(due%1440<=18*60+58,"Maya ambient line must stay before the legacy 19:01 mission-reaction slot");
  moveToAbsolute(s,due);
  processScheduledContent(SCHEDULED_CONTENT);
  assert.equal(contentAvailable(maya),true);
  assert.equal(contentDelivery(maya).absolute,due);
  assert(!s.world.readMessages.includes("m13"),"delivery must not auto-read the message");
  assert.equal(s.missions.active.length,0,"ambient delivery must not start a mission");
  assert.equal(s.player.discoveredClues.length,0,"ambient delivery must not discover a clue");
  assert.equal(s.player.credits,0);
  assert.equal(s.player.reputation,0);
}

// Maya's early ambient line is cancelled if Easy Money finishes before it arrives, preserving thread order.
{
  const s=resetState();setFlag("alias_created");processScheduledContent(SCHEDULED_CONTENT);
  assert(s.world.timeline.scheduled["ambient_maya_food_01"]);
  setFlag("mission_first_complete");processScheduledContent(SCHEDULED_CONTENT);
  assert(s.world.timeline.cancelled.includes("ambient_maya_food_01"));
  assert(!s.world.timeline.delivered.includes("ambient_maya_food_01"));
}

// Sam/Chris lines are similarly suppressed when their later legacy lead has already overtaken the safe gap.
{
  const s=resetState();setFlag("alias_created");processScheduledContent(SCHEDULED_CONTENT);
  setFlag("quartz_thread_available");setFlag("cedar_lead_available");processScheduledContent(SCHEDULED_CONTENT);
  assert(s.world.timeline.cancelled.includes("ambient_sam_drives_01"));
  assert(s.world.timeline.cancelled.includes("ambient_chris_laptop_01"));
}

// Independent world content is genuinely time-based, not mission-completion triggered.
{
  const s=resetState();setFlag("alias_created");processScheduledContent(SCHEDULED_CONTENT);
  const news=NEWS.find(x=>x.id==="news13"),post=SOCIAL_POSTS.find(x=>x.id==="s14");
  assert(s.world.timeline.scheduled[news.scheduleId]);
  assert(s.world.timeline.scheduled[post.scheduleId]);
  assert.equal(contentAvailable(news),false);assert.equal(contentAvailable(post),false);
}

// Desktop is wired to persisted scheduler timestamps and delivery-driven rerendering.
const desktop=readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
assert.match(desktop,/contentDelivery/);
assert.match(desktop,/on\("content:delivered"/);
assert.match(desktop,/deliveryLabel/);

console.log("BLACKBOX v0.4.0 Alpha 3 ambient-content tests passed");

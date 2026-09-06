import assert from "node:assert/strict";
import { resetState, setFlag } from "../js/core/state.js";
import { SOCIAL_POSTS } from "../js/data/social.js";
import { NEWS } from "../js/data/news.js";
import { THREATS } from "../js/data/threats.js";
import { contentAbsoluteTime, contentTimeLabel } from "../js/systems/contentChronology.js";

function addEvent(state,id,h,m,day=1){
  state.world.caseHistory.push({id:`event:${id}`,kind:"world",day,minute:h*60+m,title:id});
  return (day-1)*1440+h*60+m;
}

const s=resetState();
s.world.day=1;s.world.minute=22*60;

const expected=new Map();
expected.set("cedar_lead",addEvent(s,"cedar_lead",19,1));
expected.set("threatdesk_online",addEvent(s,"threatdesk_online",18,46));
expected.set("juno_advisory",addEvent(s,"juno_advisory",19,12));
expected.set("wider_net_invite",addEvent(s,"wider_net_invite",21,3));
expected.set("lumen_public_response",addEvent(s,"lumen_public_response",21,44));
expected.set("iris_contract",addEvent(s,"iris_contract",22,7));
expected.set("iris_public_response",addEvent(s,"iris_public_response",23,51));
expected.set("harbor_contract",addEvent(s,"harbor_contract",0,13,2));
expected.set("harbor_public_response",addEvent(s,"harbor_public_response",1,44,2));

for(const flag of [
  "cedar_lead_available","threatdesk_online","juno_advisory_available",
  "lumen_contract_available","lumen_world_updated","iris_contract_available",
  "iris_world_updated","harbor_contract_available","harbor_world_updated"
])setFlag(flag);

const generated=[
  SOCIAL_POSTS.find(x=>x.id==="s11"),
  NEWS.find(x=>x.id==="news9"),
  NEWS.find(x=>x.id==="news10"),
  NEWS.find(x=>x.id==="news12"),
  THREATS.find(x=>x.id==="td_scan"),
  THREATS.find(x=>x.id==="td_lumen"),
  THREATS.find(x=>x.id==="td_iris"),
  THREATS.find(x=>x.id==="td_harbor"),
  THREATS.find(x=>x.id==="td_juno"),
  THREATS.find(x=>x.id==="td_harbor_close")
];

for(const item of generated){
  assert(item, "missing generated content fixture");
  assert(item.timeFromEvent, `${item.id} must declare its generating event`);
  assert.equal(contentAbsoluteTime(item,s),expected.get(item.timeFromEvent),`${item.id} did not inherit ${item.timeFromEvent}`);
}

const cedar=SOCIAL_POSTS.find(x=>x.id==="s11");
assert.equal(contentTimeLabel(cedar,s),"19:01");
const juno=THREATS.find(x=>x.id==="td_juno");
assert.equal(contentTimeLabel(juno,s),"19:12");
const harborNews=NEWS.find(x=>x.id==="news12");
assert.equal(contentTimeLabel(harborNews,s,{includeDay:true}),"Day 2 · 01:44");

// A reaction merely unlocked by an event remains authored later rather than being pulled to the event instant.
const mayaReaction=SOCIAL_POSTS.find(x=>x.id==="s12");
assert.equal(mayaReaction.timeFromEvent,undefined);
assert.equal(contentTimeLabel(mayaReaction,s),"20:08");

const desktopSource=await import("node:fs").then(fs=>fs.readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8"));
assert.match(desktopSource,/contentTimeLabel\(n,s,\{includeDay:true\}\)/,"MetroWire must render canonical content timestamps");
assert.match(desktopSource,/r\.timeFromEvent\?` · \$\{contentTimeLabel\(r,s,\{includeDay:false\}\)\}`/,"ThreatDesk event-generated reports must render canonical event time");

console.log("BLACKBOX v0.4.0 Alpha 4.2 cross-app timestamp consistency tests passed");

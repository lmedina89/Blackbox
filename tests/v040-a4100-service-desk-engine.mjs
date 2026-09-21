import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resetState, getState, replaceState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { SERVICE_DESK_TICKET_MAP, REMOTE_MACHINE_TEMPLATES } from "../js/data/serviceDesk.js";
import { SERVICE_DESK_LEARNING_MAP } from "../js/data/learning.js";
import {
  initServiceDesk, serviceDeskSnapshot, acceptTicket, connectRemote, remoteMachineSnapshot,
  observeRemoteTool, setRemoteDevice, setRemoteService, renewRemoteDhcp, repairRemoteNetwork,
  runRemoteCommand, setRemoteGateway, verifyTicket, resolveTicket
} from "../js/systems/serviceDesk.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);
assert.equal(Object.keys(REMOTE_MACHINE_TEMPLATES).length,7);
assert.equal(serviceDeskSnapshot().tickets.length,7);
assert(SERVICE_DESK_TICKET_MAP["INC-0001"].troubleshooting,"INC-0001 should prove the generalized troubleshooting schema on an existing ticket");
assert(SERVICE_DESK_TICKET_MAP["INC-0004"].troubleshooting,"Wrong-gateway ticket should use the generalized troubleshooting schema");
assert(SERVICE_DESK_LEARNING_MAP["INC-0004"].includes("network.gateway"));

function closeFirstThree(){
  initServiceDesk();
  assert(acceptTicket("INC-0001").ok);assert(connectRemote("INC-0001").ok);observeRemoteTool("INC-0001","devices");
  assert.match(runRemoteCommand("INC-0001","ipconfig").output,/Media disconnected/i);
  assert(setRemoteDevice("INC-0001","networkAdapter",true).ok);assert(resolveTicket("INC-0001").ok);

  assert(acceptTicket("INC-0002").ok);assert(connectRemote("INC-0002").ok);assert(setRemoteService("INC-0002","dnsClient","running").ok);assert(resolveTicket("INC-0002").ok);

  assert(acceptTicket("INC-0003").ok);assert(connectRemote("INC-0003").ok);assert(setRemoteService("INC-0003","dhcpClient","running").ok);assert(renewRemoteDhcp("INC-0003").ok);assert(resolveTicket("INC-0003").ok);
}

// Existing structured ticket keeps prior behavior while recording richer activity and a case summary.
{
  resetState();initServiceDesk();assert(acceptTicket("INC-0001").ok);assert(connectRemote("INC-0001").ok);
  observeRemoteTool("INC-0001","devices");runRemoteCommand("INC-0001","ipconfig");assert(setRemoteDevice("INC-0001","networkAdapter",true).ok);
  const verification=verifyTicket("INC-0001");assert(verification.ok);assert(verification.checks.every(x=>x.startsWith("PASS:")));
  const resolved=resolveTicket("INC-0001");assert(resolved.ok);assert.equal(resolved.caseSummary.rootCause,"Network adapter disabled in Device Manager");
  const progress=getState().helpDesk.ticketProgress["INC-0001"];
  assert(progress.actions.some(a=>a.type==="observe:devices"&&/Device Manager/i.test(a.label)));
  assert(progress.actions.some(a=>a.type==="command:ipconfig"&&/Ran ipconfig/i.test(a.label)));
  assert(progress.actions.some(a=>a.kind==="verification"&&/Verification passed/i.test(a.label)));
  assert(progress.caseSummary.evidence.length>=1);
  assert.equal(progress.caseSummary.explicitVerification,true);
}

// INC-0004 distinguishes local-subnet success from remote routing failure and cannot be solved by automatic Repair.
{
  resetState();closeFirstThree();
  let snap=serviceDeskSnapshot();assert(snap.availableTickets.includes("INC-0004"),"INC-0004 should unlock after the first three incidents");
  assert(acceptTicket("INC-0004").ok);assert(connectRemote("INC-0004").ok);observeRemoteTool("INC-0004","network");
  const before=remoteMachineSnapshot("ENG-WS-21");
  assert.equal(before.network.ip,"10.20.40.88");assert.equal(before.network.gateway,"10.20.41.1");assert.equal(before.network.correctGateway,"10.20.40.1");
  assert.match(runRemoteCommand("INC-0004","ipconfig /all").output,/Default Gateway[^\n]*10\.20\.41\.1/);
  assert.match(runRemoteCommand("INC-0004","ping 10.20.40.20").output,/0% loss/,'same-subnet destination should remain reachable');
  assert.match(runRemoteCommand("INC-0004","ping 10.20.0.20").output,/100% loss/,'remote destination should fail through the wrong gateway');
  const repair=repairRemoteNetwork("INC-0004");assert.equal(repair.ok,false);assert.match(repair.message,/manual TCP\/IP/i);assert.equal(remoteMachineSnapshot("ENG-WS-21").network.gateway,"10.20.41.1");
  assert.equal(setRemoteGateway("INC-0004","999.10.1.1").ok,false);assert.equal(remoteMachineSnapshot("ENG-WS-21").network.gateway,"10.20.41.1");
  assert(setRemoteGateway("INC-0004","10.20.40.1").ok);
  assert.match(runRemoteCommand("INC-0004","ping 10.20.0.20").output,/0% loss/,'remote route should recover only after the bounded gateway correction');
  const verified=verifyTicket("INC-0004");assert(verified.ok);assert.equal(verified.checks.length,3);
  const closed=resolveTicket("INC-0004");assert(closed.ok);assert.equal(closed.score,100);assert.match(closed.caseSummary.rootCause,/Default gateway/i);
  assert(closed.caseSummary.evidence.some(x=>/TCP\/IP configuration/i.test(x)));
  assert(closed.caseSummary.evidence.some(x=>/Local-subnet reachability/i.test(x)));
  assert(closed.caseSummary.evidence.some(x=>/Remote-network reachability/i.test(x)));
  assert(closed.caseSummary.changes.some(x=>/10\.20\.40\.1/.test(x)));
  assert.equal(closed.caseSummary.explicitVerification,true);

  const migrated=migrateSave(structuredClone(getState()));replaceState(migrated);initServiceDesk();
  const restored=getState().helpDesk.ticketProgress["INC-0004"];
  assert.equal(restored.status,"Resolved");assert.equal(restored.caseSummary.rootCause,closed.caseSummary.rootCause);assert(restored.actions.some(a=>a.type==="network:gateway:10.20.40.1"));
}

// Static UI guard: A4.10.0 reuses Service Desk/Remote Assistance and only adds bounded gateway editing + richer Activity/Case Review.
{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const css=fs.readFileSync(path.join(root,"css/apps.css"),"utf8");
  assert.match(desktop,/setRemoteGateway/);
  assert.match(desktop,/remote-gateway-form/);
  assert.match(desktop,/Case Review/);
  assert.match(desktop,/a\.label\|\|a\.type/);
  assert.match(css,/\.sd-case-review/);
  assert.match(css,/\.remote-gateway-form/);
}

console.log("BLACKBOX v0.4.0 A4.10.0 Service Desk engine expansion tests passed");

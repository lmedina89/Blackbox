import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resetState, getState, replaceState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { SERVICE_DESK_TICKETS, SERVICE_DESK_TICKET_MAP, REMOTE_MACHINE_TEMPLATES } from "../js/data/serviceDesk.js";
import { SERVICE_DESK_LEARNING_MAP } from "../js/data/learning.js";
import {
  initServiceDesk, serviceDeskSnapshot, acceptTicket, connectRemote, remoteMachineSnapshot,
  observeRemoteTool, setRemoteDevice, setRemoteService, setRemoteGateway, renewRemoteDhcp,
  cleanupRemoteStorage, setRemoteGroupMembership, setRemoteScheduledTask, runRemoteCommand,
  verifyTicket, resolveTicket
} from "../js/systems/serviceDesk.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);
assert.equal(Object.keys(REMOTE_MACHINE_TEMPLATES).length,8);
assert.equal(SERVICE_DESK_TICKETS.length,8);
assert.equal(SERVICE_DESK_TICKET_MAP["INC-0007"].nextTicketId,"INC-0008");
assert.equal(SERVICE_DESK_TICKET_MAP["INC-0008"].priority,"High");
assert.equal(SERVICE_DESK_TICKET_MAP["INC-0008"].troubleshooting.requireEvidence,true);
assert(SERVICE_DESK_LEARNING_MAP["INC-0008"].includes("security.authentication"));
assert(SERVICE_DESK_LEARNING_MAP["INC-0008"].includes("analysis.evidence_correlation"));

function closeFirstSeven(){
  initServiceDesk();
  assert(acceptTicket("INC-0001").ok);assert(connectRemote("INC-0001").ok);assert(setRemoteDevice("INC-0001","networkAdapter",true).ok);assert(resolveTicket("INC-0001").ok);
  assert(acceptTicket("INC-0002").ok);assert(connectRemote("INC-0002").ok);assert(setRemoteService("INC-0002","dnsClient","running").ok);assert(resolveTicket("INC-0002").ok);
  assert(acceptTicket("INC-0003").ok);assert(connectRemote("INC-0003").ok);assert(setRemoteService("INC-0003","dhcpClient","running").ok);assert(renewRemoteDhcp("INC-0003").ok);assert(resolveTicket("INC-0003").ok);
  assert(acceptTicket("INC-0004").ok);assert(connectRemote("INC-0004").ok);assert(setRemoteGateway("INC-0004","10.20.40.1").ok);assert(resolveTicket("INC-0004").ok);
  assert(acceptTicket("INC-0005").ok);assert(connectRemote("INC-0005").ok);assert(setRemoteService("INC-0005","inventoryAgent","running").ok);assert(resolveTicket("INC-0005").ok);
  assert(acceptTicket("INC-0006").ok);assert(connectRemote("INC-0006").ok);assert(cleanupRemoteStorage("INC-0006","tempExports").ok);assert(resolveTicket("INC-0006").ok);
  assert(acceptTicket("INC-0007").ok);assert(connectRemote("INC-0007").ok);assert(setRemoteGroupMembership("INC-0007","ENG-PROJECT-R",true).ok);assert(resolveTicket("INC-0007").ok);
}

// New INC-0008 should become available to identities that already completed the prior seven-ticket chain.
{
  resetState();closeFirstSeven();
  const snap=serviceDeskSnapshot();
  assert(snap.availableTickets.includes("INC-0008"));
  assert.equal(snap.completedTickets.length,7);
}

// Investigation path: correlate Security events with a local batch task, then disable only the obsolete task.
{
  resetState();closeFirstSeven();
  assert(acceptTicket("INC-0008").ok);assert(connectRemote("INC-0008").ok);
  const initial=remoteMachineSnapshot("OPS-WS-24");
  assert.equal(initial.scheduledTasks.legacyFileSync.enabled,true);
  assert.equal(initial.scheduledTasks.legacyFileSync.credentialState,"stale");
  assert.equal(initial.scheduledTasks.nexusUpdateCheck.enabled,true);
  assert(initial.eventLog.some(event=>event.eventId===529&&/Logon type: Batch/.test(event.message)));
  // Guessing the corrective change before gathering evidence can satisfy fault-state checks but cannot close the investigation.
  assert(setRemoteScheduledTask("INC-0008","legacyFileSync",false).ok);
  assert(verifyTicket("INC-0008").ok);
  const premature=resolveTicket("INC-0008");
  assert.equal(premature.ok,false);
  assert.match(premature.message,/correlate at least 2 relevant evidence sources/i);

  observeRemoteTool("INC-0008","events");
  assert.match(runRemoteCommand("INC-0008","schtasks /query").output,/Legacy File Sync/);
  assert.match(runRemoteCommand("INC-0008","schtasks /query").output,/Disabled/);
  assert.match(runRemoteCommand("INC-0008","whoami").output,/nexus\\jmiles/i);
  const closed=resolveTicket("INC-0008");
  assert(closed.ok);
  assert.match(closed.caseSummary.rootCause,/obsolete scheduled task/i);
  assert(closed.caseSummary.evidence.some(x=>/Failed authentication events/i.test(x)));
  assert(closed.caseSummary.evidence.some(x=>/Scheduled task identities/i.test(x)));
  assert.equal(closed.caseSummary.process.unnecessaryChanges,0);
  assert.equal(serviceDeskSnapshot().availableTickets.length,0);
}

// Unrelated task changes remain visible as unnecessary troubleshooting changes and do not fix the root cause.
{
  resetState();closeFirstSeven();
  assert(acceptTicket("INC-0008").ok);assert(connectRemote("INC-0008").ok);
  observeRemoteTool("INC-0008","events");observeRemoteTool("INC-0008","tasks");
  assert(setRemoteScheduledTask("INC-0008","nexusUpdateCheck",false).ok);
  assert.equal(verifyTicket("INC-0008").ok,false,"disabling an unrelated healthy task must not stop the stale credential source");
  assert(setRemoteScheduledTask("INC-0008","legacyFileSync",false).ok);
  assert(verifyTicket("INC-0008").ok);
  const closed=resolveTicket("INC-0008");assert(closed.ok);
  assert.equal(closed.caseSummary.process.unnecessaryChanges,1);
}

// Existing saves with seven closed cases should adopt the new eighth assignment without a save/schema bump.
{
  resetState();closeFirstSeven();
  const saved=structuredClone(getState());
  saved.helpDesk.availableTickets=[];
  const migrated=migrateSave(saved);replaceState(migrated);initServiceDesk();
  assert(getState().helpDesk.availableTickets.includes("INC-0008"));
  assert.equal(remoteMachineSnapshot("OPS-WS-24").scheduledTasks.legacyFileSync.enabled,true);
}

// Static UI guards: Task Scheduler is a standard Start/System Tools surface, not a ticket-only desktop icon.
{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const system=fs.readFileSync(path.join(root,"js/systems/serviceDesk.js"),"utf8");
  assert.match(desktop,/remoteStartTools=.*\["tasks","🗓️","Scheduled Tasks"\]/s);
  assert.match(desktop,/data-remote-task/);
  const remoteIconLine=desktop.split("\n").find(line=>line.includes("const remoteIcons="))||"";
  assert.doesNotMatch(remoteIconLine,/Scheduled Tasks/);
  assert.match(system,/schtasks \/query/);
  assert.match(system,/no-enabled-stale-user-task/);
  assert.match(system,/requireEvidence/);
}

console.log("BLACKBOX v0.4.0 A4.10.2 suspicious-authentication investigation tests passed");

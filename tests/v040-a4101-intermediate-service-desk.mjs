import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resetState, getState, replaceState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { SERVICE_DESK_TICKETS, SERVICE_DESK_TICKET_MAP, REMOTE_MACHINE_TEMPLATES } from "../js/data/serviceDesk.js";
import { SERVICE_DESK_LEARNING_MAP, CONCEPT_MAP } from "../js/data/learning.js";
import {
  initServiceDesk, serviceDeskSnapshot, acceptTicket, connectRemote, remoteMachineSnapshot,
  observeRemoteTool, setRemoteDevice, setRemoteService, setRemoteGateway, renewRemoteDhcp,
  cleanupRemoteStorage, setRemoteGroupMembership, runRemoteCommand, verifyTicket, resolveTicket
} from "../js/systems/serviceDesk.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);
assert(Object.keys(REMOTE_MACHINE_TEMPLATES).length>=7);
assert(SERVICE_DESK_TICKETS.length>=7);
assert(SERVICE_DESK_TICKETS.every(ticket=>ticket.troubleshooting),"all Service Desk tickets should use the structured troubleshooting engine");
assert(CONCEPT_MAP["systems.storage"]);
assert(CONCEPT_MAP["security.group_membership"]);
assert(SERVICE_DESK_LEARNING_MAP["INC-0005"].includes("systems.services"));
assert(SERVICE_DESK_LEARNING_MAP["INC-0006"].includes("systems.storage"));
assert(SERVICE_DESK_LEARNING_MAP["INC-0007"].includes("security.least_privilege"));

function closeFirstFour(){
  initServiceDesk();
  assert(acceptTicket("INC-0001").ok);assert(connectRemote("INC-0001").ok);assert(setRemoteDevice("INC-0001","networkAdapter",true).ok);assert(resolveTicket("INC-0001").ok);
  assert(acceptTicket("INC-0002").ok);assert(connectRemote("INC-0002").ok);assert(setRemoteService("INC-0002","dnsClient","running").ok);assert(resolveTicket("INC-0002").ok);
  assert(acceptTicket("INC-0003").ok);assert(connectRemote("INC-0003").ok);assert(setRemoteService("INC-0003","dhcpClient","running").ok);assert(renewRemoteDhcp("INC-0003").ok);assert(resolveTicket("INC-0003").ok);
  assert(acceptTicket("INC-0004").ok);assert(connectRemote("INC-0004").ok);assert(setRemoteGateway("INC-0004","10.20.40.1").ok);assert(resolveTicket("INC-0004").ok);
}

// INC-0005: basic network path remains healthy while the local application dependency is stopped.
{
  resetState();closeFirstFour();
  assert(serviceDeskSnapshot().availableTickets.includes("INC-0005"));
  assert(acceptTicket("INC-0005").ok);assert(connectRemote("INC-0005").ok);
  observeRemoteTool("INC-0005","services");observeRemoteTool("INC-0005","events");
  assert.match(runRemoteCommand("INC-0005","ping 10.20.0.30").output,/0% loss/);
  assert.equal(verifyTicket("INC-0005").ok,false,"healthy network reachability must not hide the stopped application service");
  assert.equal(remoteMachineSnapshot("LOG-WS-05").services.inventoryAgent,"stopped");
  assert(setRemoteService("INC-0005","inventoryAgent","running").ok);
  const verified=verifyTicket("INC-0005");assert(verified.ok);assert.equal(verified.checks.length,2);
  const closed=resolveTicket("INC-0005");assert(closed.ok);assert.match(closed.caseSummary.rootCause,/Inventory Agent service is stopped/i);
  assert(closed.caseSummary.evidence.some(x=>/endpoint reachability/i.test(x)));
  assert(closed.caseSummary.evidence.some(x=>/Application service state/i.test(x)));
  assert.equal(closed.caseSummary.process.unnecessaryChanges,0);
  assert(serviceDeskSnapshot().availableTickets.includes("INC-0006"));
}

// INC-0006: freeing unrelated small categories is insufficient; the large temporary export cache is the bounded fix.
{
  resetState();closeFirstFour();
  assert(acceptTicket("INC-0005").ok);assert(connectRemote("INC-0005").ok);assert(setRemoteService("INC-0005","inventoryAgent","running").ok);assert(resolveTicket("INC-0005").ok);
  assert(acceptTicket("INC-0006").ok);assert(connectRemote("INC-0006").ok);
  observeRemoteTool("INC-0006","computer");observeRemoteTool("INC-0006","events");
  assert.match(runRemoteCommand("INC-0006","dir c:\\").output,/128 MB free/i);
  assert.equal(verifyTicket("INC-0006").ok,false);
  assert(cleanupRemoteStorage("INC-0006","appLogs").ok);
  assert(cleanupRemoteStorage("INC-0006","crashDumps").ok);
  assert.equal(verifyTicket("INC-0006").ok,false,"small unrelated cleanups should not satisfy the 2 GB free-space requirement");
  assert(cleanupRemoteStorage("INC-0006","tempExports").ok);
  assert.match(runRemoteCommand("INC-0006","dir c:\\").output,/4,728 MB free/i);
  const verified=verifyTicket("INC-0006");assert(verified.ok);
  const closed=resolveTicket("INC-0006");assert(closed.ok);assert.match(closed.caseSummary.rootCause,/Temporary report exports/i);
  assert.equal(closed.caseSummary.process.changes,3);
  assert.equal(closed.caseSummary.process.unnecessaryChanges,2,"extra cleanup work should be visible in process telemetry rather than silently treated as optimal");
  assert(serviceDeskSnapshot().availableTickets.includes("INC-0007"));
}

// INC-0007: broad administrator membership can make the share readable but must fail least-privilege verification.
{
  resetState();closeFirstFour();
  assert(acceptTicket("INC-0005").ok);assert(connectRemote("INC-0005").ok);assert(setRemoteService("INC-0005","inventoryAgent","running").ok);assert(resolveTicket("INC-0005").ok);
  assert(acceptTicket("INC-0006").ok);assert(connectRemote("INC-0006").ok);assert(cleanupRemoteStorage("INC-0006","tempExports").ok);assert(resolveTicket("INC-0006").ok);
  assert(acceptTicket("INC-0007").ok);assert(connectRemote("INC-0007").ok);
  observeRemoteTool("INC-0007","access");observeRemoteTool("INC-0007","events");
  const denied=runRemoteCommand("INC-0007","dir \\\\FILES-02\\ENG-PROJECTS");assert.match(denied.output,/Access is denied/i);
  assert(setRemoteGroupMembership("INC-0007","DOMAIN-ADMINS",true).ok);
  assert.match(runRemoteCommand("INC-0007","dir \\\\FILES-02\\ENG-PROJECTS").output,/project-index\.pdf/i,"broad admin membership may create effective access");
  assert.equal(verifyTicket("INC-0007").ok,false,"broad administrator access must not satisfy the authored least-privilege resolution");
  assert(setRemoteGroupMembership("INC-0007","DOMAIN-ADMINS",false).ok);
  assert(setRemoteGroupMembership("INC-0007","ENG-PROJECT-R",true).ok);
  const verified=verifyTicket("INC-0007");assert(verified.ok);assert.equal(verified.checks.length,4);
  const closed=resolveTicket("INC-0007");assert(closed.ok);assert.match(closed.caseSummary.rootCause,/read-only Engineering project group/i);
  assert(closed.caseSummary.evidence.some(x=>/group memberships/i.test(x)));
  assert.equal(closed.caseSummary.process.unnecessaryChanges,2,"temporary admin add/remove should remain visible in the case process history");
  assert(!serviceDeskSnapshot().availableTickets.includes("INC-0007"));

  const migrated=migrateSave(structuredClone(getState()));replaceState(migrated);initServiceDesk();
  assert(getState().helpDesk.completedTickets.includes("INC-0007"));
  assert(remoteMachineSnapshot("ENG-WS-27").access.groups.includes("ENG-PROJECT-R"));
  assert(!remoteMachineSnapshot("ENG-WS-27").access.groups.includes("DOMAIN-ADMINS"));
}

// Static guards: new ticket controls stay inside Remote Assistance and reuse existing Activity/Case Review plumbing.
{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const css=fs.readFileSync(path.join(root,"css/apps.css"),"utf8");
  const system=fs.readFileSync(path.join(root,"js/systems/serviceDesk.js"),"utf8");
  assert.match(desktop,/data-remote-cleanup/);
  assert.match(desktop,/Users & Groups/);
  assert.match(desktop,/data-remote-group/);
  assert.match(desktop,/Process/);
  assert.match(css,/\.remote-storage/);
  assert.match(css,/\.access-group-row/);
  assert.match(system,/storage-free-at-least/);
  assert.match(system,/share-access/);
}

console.log("BLACKBOX v0.4.0 A4.10.1 intermediate Service Desk ticket-pack tests passed");

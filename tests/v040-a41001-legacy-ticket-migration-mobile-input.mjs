import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resetState, getState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { SERVICE_DESK_TICKETS, SERVICE_DESK_TICKET_MAP } from "../js/data/serviceDesk.js";
import {
  initServiceDesk, acceptTicket, connectRemote, observeRemoteTool, setRemoteDevice,
  setRemoteService, renewRemoteDhcp, runRemoteCommand, verifyTicket, resolveTicket
} from "../js/systems/serviceDesk.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);
assert(SERVICE_DESK_TICKETS.length>=7);
assert(SERVICE_DESK_TICKETS.every(ticket=>ticket.troubleshooting),"every existing Service Desk ticket should use the structured troubleshooting schema");

function resolveNic(){
  assert(acceptTicket("INC-0001").ok);assert(connectRemote("INC-0001").ok);
  observeRemoteTool("INC-0001","devices");runRemoteCommand("INC-0001","ipconfig");
  assert(setRemoteDevice("INC-0001","networkAdapter",true).ok);assert(resolveTicket("INC-0001").ok);
}

// DNS legacy ticket now uses authored evidence/root-cause/verification data instead of a ticket-id branch.
{
  resetState();initServiceDesk();resolveNic();
  assert(acceptTicket("INC-0002").ok);assert(connectRemote("INC-0002").ok);
  observeRemoteTool("INC-0002","services");observeRemoteTool("INC-0002","events");
  assert.match(runRemoteCommand("INC-0002","ping 10.20.0.20").output,/0% loss/);
  assert.match(runRemoteCommand("INC-0002","ping intranet.nexus.local").output,/could not find host/i);
  assert.match(runRemoteCommand("INC-0002","nslookup intranet.nexus.local").output,/10\.20\.0\.20/);
  assert.equal(verifyTicket("INC-0002").ok,false,"DNS ticket must fail verification while DNS Client is stopped");
  assert(setRemoteService("INC-0002","dnsClient","running").ok);
  const verified=verifyTicket("INC-0002");assert(verified.ok);assert.equal(verified.checks.length,4);assert(verified.checks.every(x=>x.startsWith("PASS:")));
  const closed=resolveTicket("INC-0002");assert(closed.ok);
  assert.match(closed.caseSummary.rootCause,/DNS Client service is stopped/i);
  assert(closed.caseSummary.evidence.some(x=>/Direct IP reachability/i.test(x)));
  assert(closed.caseSummary.evidence.some(x=>/Name-based reachability/i.test(x)));
  assert(closed.caseSummary.evidence.some(x=>/Service state/i.test(x)));
}

// DHCP/APIPA legacy ticket now uses the same authored model and requires a real renewed lease.
{
  resetState();initServiceDesk();resolveNic();
  assert(acceptTicket("INC-0002").ok);assert(connectRemote("INC-0002").ok);assert(setRemoteService("INC-0002","dnsClient","running").ok);assert(resolveTicket("INC-0002").ok);
  assert(acceptTicket("INC-0003").ok);assert(connectRemote("INC-0003").ok);
  observeRemoteTool("INC-0003","network");observeRemoteTool("INC-0003","services");observeRemoteTool("INC-0003","events");
  assert.match(runRemoteCommand("INC-0003","ipconfig /all").output,/169\.254\.44\.17/);
  assert.equal(verifyTicket("INC-0003").ok,false);
  assert(setRemoteService("INC-0003","dhcpClient","running").ok);
  assert.equal(verifyTicket("INC-0003").ok,false,"starting DHCP Client alone must not satisfy the lease-renewal condition");
  assert(renewRemoteDhcp("INC-0003").ok);
  const verified=verifyTicket("INC-0003");assert(verified.ok);assert.equal(verified.checks.length,7);assert(verified.checks.every(x=>x.startsWith("PASS:")));
  const closed=resolveTicket("INC-0003");assert(closed.ok);
  assert.match(closed.caseSummary.rootCause,/DHCP Client service is stopped/i);
  assert(closed.caseSummary.evidence.some(x=>/APIPA\/TCP-IP/i.test(x)));
  assert(closed.caseSummary.evidence.some(x=>/DHCP Client service state/i.test(x)));
  assert(closed.caseSummary.changes.some(x=>/DHCP lease renewed/i.test(x)));
}

// Existing A4.10.0 saves with generic case summaries are enriched in place, without inventing evidence.
{
  const s=resetState();
  s.helpDesk={
    availableTickets:[],activeTickets:[],completedTickets:["INC-0001","INC-0002","INC-0003"],remoteSession:null,
    job:{level:1,resolved:3,escalated:0,score:250},machines:{},
    ticketProgress:{
      "INC-0002":{status:"Resolved",actions:[{type:"service:dnsClient:running",kind:"change",label:"dnsClient service running",minute:700}],observedTools:[],commands:[],notes:"",verification:{passed:false,at:null,checks:["DNS Client: running"]},caseSummary:{rootCause:"Resolved reported fault",evidence:[],changes:["dnsClient service running"],verification:["DNS Client: running"],explicitVerification:false,closedAt:700},resolvedAt:700},
      "INC-0003":{status:"Resolved",actions:[{type:"observe:network",kind:"diagnostic",label:"Inspected Network Connections",minute:710},{type:"service:dhcpClient:running",kind:"change",label:"dhcpClient service running",minute:711},{type:"dhcp:renew",kind:"change",label:"DHCP lease renewed",minute:712}],observedTools:["network"],commands:[],notes:"",verification:{passed:false,at:null,checks:[]},caseSummary:{rootCause:"Resolved reported fault",evidence:[],changes:["dhcpClient service running","DHCP lease renewed"],verification:[],explicitVerification:false,closedAt:712},resolvedAt:712}
    }
  };
  initServiceDesk();
  assert.match(getState().helpDesk.ticketProgress["INC-0002"].caseSummary.rootCause,/DNS Client service is stopped/i);
  assert.deepEqual(getState().helpDesk.ticketProgress["INC-0002"].caseSummary.evidence,[],"do not fabricate evidence for an old save that did not record it");
  assert.match(getState().helpDesk.ticketProgress["INC-0003"].caseSummary.rootCause,/DHCP Client service is stopped/i);
  assert(getState().helpDesk.ticketProgress["INC-0003"].caseSummary.evidence.some(x=>/APIPA\/TCP-IP/i.test(x)),"historical observed actions should backfill authored evidence labels");
}

// Static guards for the iOS focus-zoom fix and removal of ticket-specific verification branches.
{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
  const css=fs.readFileSync(path.join(root,"css/mobile.css"),"utf8");
  const system=fs.readFileSync(path.join(root,"js/systems/serviceDesk.js"),"utf8");
  const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.match(css,/\.remote-command-form input,\.remote-gateway-form input,\.sd-notes\{font-size:16px\}/);
  assert.doesNotMatch(system,/ticketId==="INC-0002"/);
  assert.doesNotMatch(system,/ticketId==="INC-0003"/);
  assert.match(index,/A4\.10\.[0-9.]+ QA/);
}

console.log("BLACKBOX v0.4.0 A4.10.0.1 legacy-ticket migration + mobile-input tests passed");

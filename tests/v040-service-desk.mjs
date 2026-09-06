import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resetState, getState, replaceState, setFlag, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { advanceElapsedTime } from "../js/systems/timeline.js";
import { initServiceDesk, serviceDeskSnapshot, acceptTicket, connectRemote, disconnectRemote, remoteMachineSnapshot, observeRemoteTool, setRemoteDevice, setRemoteService, renewRemoteDhcp, repairRemoteNetwork, runRemoteCommand, verifyTicket, resolveTicket } from "../js/systems/serviceDesk.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);

// Foundation seeds only the first structured training incident and three isolated remote machines.
{
  const s=resetState();
  s.player.alias="helpdeskqa";
  s.player.credits=444;
  s.world.completedMissions=["mission_first"];
  s.missions.active=["mission_mirror"];
  s.missions.progress={mission_mirror:{find_mirror:false}};
  s.communications.choicesMade=["mirror_send"];
  s.communications.choiceTimes={mirror_send:1147};
  s.terminal.hostId="home";
  s.world.actionTick=7;s.world.networkEpoch=1;
  setFlag("mission_first_complete");
  const protectedSnapshot={credits:s.player.credits,completed:[...s.world.completedMissions],active:[...s.missions.active],progress:structuredClone(s.missions.progress),choices:[...s.communications.choicesMade],choiceTimes:{...s.communications.choiceTimes},hostId:s.terminal.hostId,actionTick:s.world.actionTick,networkEpoch:s.world.networkEpoch};

  initServiceDesk();
  let hd=serviceDeskSnapshot();
  assert.deepEqual(hd.availableTickets,["INC-0001"]);
  assert.equal(Object.keys(s.helpDesk.machines).length,3);
  assert.equal(hd.remoteSession,null);

  assert(acceptTicket("INC-0001").ok);
  const minuteBefore=s.world.minute;
  assert(connectRemote("INC-0001").ok);
  assert.equal(s.world.minute,minuteBefore+1,"remote connection should advance elapsed clock time");
  assert.equal(s.world.actionTick,7,"Help Desk must not advance BLACKBOX actionTick");
  assert.equal(s.world.networkEpoch,1,"Help Desk must not rotate BLACKBOX network epochs");

  const before=remoteMachineSnapshot("FIN-WS-07");
  assert.equal(before.devices.networkAdapter,"disabled");
  assert.match(before.remoteTransport,/out-of-band/i,"offline NIC ticket must explain how the remote support channel remains reachable");
  const cmd=runRemoteCommand("INC-0001","ipconfig");
  assert.match(cmd.output,/Media disconnected/);
  assert.equal(repairRemoteNetwork("INC-0001").ok,false,"Network Repair must not magically enable a Code-22 adapter");
  observeRemoteTool("INC-0001","devices");
  assert(setRemoteDevice("INC-0001","networkAdapter",true).ok);
  const after=remoteMachineSnapshot("FIN-WS-07");
  assert.equal(after.devices.networkAdapter,"enabled");
  assert.equal(after.network.ip,"10.20.10.57");
  assert(verifyTicket("INC-0001").ok);
  const closed=resolveTicket("INC-0001");
  assert(closed.ok);assert(closed.score>=90);
  hd=serviceDeskSnapshot();
  assert(hd.completedTickets.includes("INC-0001"));
  assert(hd.availableTickets.includes("INC-0002"));

  // Campaign, communications and BLACKBOX terminal context remain untouched except shared wall-clock time.
  assert.equal(s.player.credits,protectedSnapshot.credits);
  assert.deepEqual(s.world.completedMissions,protectedSnapshot.completed);
  assert.deepEqual(s.missions.active,protectedSnapshot.active);
  assert.deepEqual(s.missions.progress,protectedSnapshot.progress);
  assert.deepEqual(s.communications.choicesMade,protectedSnapshot.choices);
  assert.deepEqual(s.communications.choiceTimes,protectedSnapshot.choiceTimes);
  assert.equal(s.terminal.hostId,protectedSnapshot.hostId);
  assert.equal(s.world.actionTick,protectedSnapshot.actionTick);
  assert.equal(s.world.networkEpoch,protectedSnapshot.networkEpoch);
}

// DNS ticket distinguishes IP reachability, local name-resolution failure, and direct nslookup behavior.
{
  resetState();initServiceDesk();acceptTicket("INC-0001");connectRemote("INC-0001");setRemoteDevice("INC-0001","networkAdapter",true);resolveTicket("INC-0001");
  assert(acceptTicket("INC-0002").ok);assert(connectRemote("INC-0002").ok);
  assert.match(runRemoteCommand("INC-0002","ping 10.20.0.20").output,/0% loss/);
  assert.match(runRemoteCommand("INC-0002","ping intranet.nexus.local").output,/could not find host/i);
  assert.match(runRemoteCommand("INC-0002","nslookup intranet.nexus.local").output,/10\.20\.0\.20/,"nslookup should query configured DNS directly even while local DNS Client is stopped");
  assert.equal(repairRemoteNetwork("INC-0002").ok,true);
  assert.equal(remoteMachineSnapshot("OPS-WS-12").services.dnsClient,"stopped","Repair must not silently start DNS Client");
  assert.equal(resolveTicket("INC-0002").ok,false,"Repair alone must not bypass the DNS lesson");
  assert(setRemoteService("INC-0002","dnsClient","running").ok);
  assert.match(runRemoteCommand("INC-0002","ping intranet.nexus.local").output,/0% loss/);
  assert(resolveTicket("INC-0002").ok);
}

// APIPA ticket requires restoring DHCP Client and renewing into the corporate range.
{
  resetState();initServiceDesk();acceptTicket("INC-0001");connectRemote("INC-0001");setRemoteDevice("INC-0001","networkAdapter",true);resolveTicket("INC-0001");acceptTicket("INC-0002");connectRemote("INC-0002");setRemoteService("INC-0002","dnsClient","running");resolveTicket("INC-0002");
  assert(acceptTicket("INC-0003").ok);assert(connectRemote("INC-0003").ok);
  assert.match(runRemoteCommand("INC-0003","ipconfig /all").output,/169\.254\.44\.17/);
  assert.equal(renewRemoteDhcp("INC-0003").ok,false);
  assert.equal(repairRemoteNetwork("INC-0003").ok,false,"Repair must fail while DHCP Client is stopped");
  assert(setRemoteService("INC-0003","dhcpClient","running").ok);
  assert(renewRemoteDhcp("INC-0003").ok);
  const machine=remoteMachineSnapshot("HR-LT-03");
  assert.equal(machine.network.ip,"10.20.30.44");
  assert.equal(machine.network.gateway,"10.20.30.1");
  assert.deepEqual(machine.network.dns,["10.20.0.10"]);
  assert(resolveTicket("INC-0003").ok);
  assert.equal(serviceDeskSnapshot().job.resolved,3);
  assert.equal(disconnectRemote().ok,true);
}



// Elapsed Help Desk time can deliver due communications without consuming BLACKBOX action ticks.
{
  const s=resetState();s.world.minute=18*60+42;s.world.actionTick=9;s.world.networkEpoch=1;setFlag("alias_created");
  advanceElapsedTime(1,{reason:"helpdesk-test"});
  const scheduled=s.world.timeline.scheduled.ambient_maya_food_01;
  assert(scheduled&&Number.isFinite(scheduled.at));
  const now=(s.world.day-1)*1440+s.world.minute;
  advanceElapsedTime(Math.max(1,scheduled.at-now),{reason:"helpdesk-test"});
  assert(s.world.timeline.delivered.includes("ambient_maya_food_01"),"time-based Messenger content should still become due during ticket work");
  assert.equal(s.world.actionTick,9);
  assert.equal(s.world.networkEpoch,1);
}

// Active remote session and repaired machine state survive normalization/save round trips.
{
  const s=resetState();initServiceDesk();acceptTicket("INC-0001");connectRemote("INC-0001");setRemoteDevice("INC-0001","networkAdapter",true);
  const migrated=migrateSave(structuredClone(s));
  replaceState(migrated);initServiceDesk();
  assert.equal(getState().helpDesk.remoteSession.ticketId,"INC-0001");
  assert.equal(getState().helpDesk.remoteSession.machineId,"FIN-WS-07");
  assert.equal(remoteMachineSnapshot("FIN-WS-07").devices.networkAdapter,"enabled");
  assert.equal(remoteMachineSnapshot("FIN-WS-07").network.ip,"10.20.10.57");
}

// A4.5.1 save migration adds Service Desk persistence without changing old campaign state.
{
  const old=resetState();old.meta.saveVersion=12;old.player.alias="legacy-helpdesk";old.player.credits=901;old.world.completedMissions=["mission_first","mission_mirror"];old.missions.active=["mission_recovery"];
  old.helpDesk={availableTickets:[],activeTickets:[],completedTickets:[],ticketProgress:{}};
  const migrated=migrateSave(structuredClone(old));
  assert.equal(migrated.meta.saveVersion,15);
  assert.equal(migrated.player.credits,901);
  assert.deepEqual(migrated.world.completedMissions,["mission_first","mission_mirror"]);
  assert.deepEqual(migrated.missions.active,["mission_recovery"]);
  assert.deepEqual(migrated.helpDesk.machines,{});
  assert.equal(migrated.helpDesk.remoteSession,null);
  assert.deepEqual(migrated.helpDesk.job,{level:1,resolved:0,escalated:0,score:0});
}

// Static guard: dedicated Service Desk and distinct Remote Assistance workspace exist; BLACKBOX is not reused as the remote shell.
{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const apps=fs.readFileSync(path.join(root,"js/data/apps.js"),"utf8");
  const css=fs.readFileSync(path.join(root,"css/apps.css"),"utf8");
  const timeline=fs.readFileSync(path.join(root,"js/systems/timeline.js"),"utf8");
  assert.match(apps,/id:"servicedesk"/);
  assert.match(desktop,/NEXUS SERVICE DESK/);
  assert.match(desktop,/NEXUS REMOTE ASSISTANCE/);
  assert.match(desktop,/CAN SEE YOUR ACTIONS/);
  assert.match(desktop,/REMOTE SUPPORT/);
  assert.match(desktop,/Device Manager/);
  assert.match(desktop,/Command Prompt/);
  assert.match(css,/\.remote-screen/);
  assert.match(css,/\.remote-tool-window/);
  assert.match(timeline,/advanceElapsedTime/);
  assert.match(timeline,/do not increment actionTick\/networkEpoch/);
}

console.log("BLACKBOX v0.4.0 Alpha 4.6 Service Desk foundation tests passed");

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resetState, getState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { DESKTOP_APPS } from "../js/data/apps.js";
import { initServiceDesk, acceptTicket, connectRemote, remoteMachineSnapshot, setRemoteGroupMembership } from "../js/systems/serviceDesk.js";
import { runNexusCommand } from "../js/systems/nexusCommand.js";

assert.equal(SAVE_VERSION,15);
assert.equal(WORLD_SCHEMA,10);

// Local NEXUS/OS gets a real Start-menu Command Prompt without creating a new desktop shortcut.
{
  resetState();
  const cmd=DESKTOP_APPS.find(app=>app.id==="cmd");
  assert(cmd,"Command Prompt should be registered as a NEXUS app");
  assert.equal(cmd.desktop,false);
  assert.equal(cmd.startGroup,"System Tools");
  assert.equal(runNexusCommand("hostname").output,"HOME-PC");
  assert.match(runNexusCommand("whoami").output,/^NEXUS\\/);
  assert.match(runNexusCommand("ipconfig \/all").output,/192\.168\.1\.24/);
  assert.match(runNexusCommand("help").output,/BLACKBOX commands.*not NEXUS\/OS commands/i);
  assert.equal(runNexusCommand("scan").ok,false,"BLACKBOX-only commands must remain unavailable in ordinary NEXUS CMD");
  assert.match(runNexusCommand("nslookup archives.northstar.test").output,/10\.14\.8\.22/);
}

// Users & Groups exists as a standard read-only support surface even when a ticket does not need it.
{
  resetState();initServiceDesk();
  for(const machineId of ["FIN-WS-07","OPS-WS-12","HR-LT-03","ENG-WS-21","LOG-WS-05","FIN-WS-19","ENG-WS-27"]){
    const machine=remoteMachineSnapshot(machineId);
    assert(machine.access,`${machineId} should have a normalized identity/access view`);
    assert(machine.access.groups.includes("DOMAIN-USERS"),`${machineId} should expose its ordinary domain membership`);
  }
  assert(acceptTicket("INC-0001").ok);assert(connectRemote("INC-0001").ok);
  assert.equal(setRemoteGroupMembership("INC-0001","ENG-PROJECT-R",true).ok,false,"ordinary tickets should not gain delegated group-change rights just because Users & Groups is visible");
}

// Static UI guards: Users & Groups is no longer a ticket-specific desktop icon and is reachable through remote Start/System Tools.
{
  const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
  const desktop=fs.readFileSync(path.join(root,"js/ui/desktop.js"),"utf8");
  const desktopCss=fs.readFileSync(path.join(root,"css/desktop.css"),"utf8");
  const appCss=fs.readFileSync(path.join(root,"css/apps.css"),"utf8");
  assert.match(desktop,/start-group-label/);
  assert.match(desktop,/cmd:renderNexusCommand/);
  assert.match(desktop,/remoteStartTools=.*\["access","👥","Users & Groups"\]/s);
  assert.doesNotMatch(desktop,/remoteIcons\.splice\([^\n]*Users & Groups/);
  assert.match(desktop,/data-remote-start/);
  assert.match(desktop,/Standard support tools are installed independently of the active ticket/);
  assert.match(desktopCss,/\.start-group-label/);
  assert.match(appCss,/\.remote-start-menu/);
  assert.match(appCss,/\.access-empty/);
}

console.log("BLACKBOX v0.4.0 A4.10.1.1 NEXUS desktop & remote tool consistency tests passed");

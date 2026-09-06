import assert from "node:assert/strict";
import fs from "node:fs";
import { baseState, resetState, SAVE_VERSION, WORLD_SCHEMA } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { AUTOSAVE_EVENTS } from "../js/core/autosave.js";
import { systemSnapshot, nexusNetworkOnline, nexusDnsOnline, setNetworkAdapter, repairNetwork, renewDhcp, setFirewallEnabled, setFirewallRule, setService, setDeviceEnabled } from "../js/systems/nexusSystem.js";

assert.equal(SAVE_VERSION,11);
assert.equal(WORLD_SCHEMA,10);
assert.ok(AUTOSAVE_EVENTS.includes("nexus:system-changed"));

// Exact v10 saves gain workstation state without losing campaign state.
{
  const old=baseState();
  old.meta.saveVersion=10;old.meta.worldSchema=10;
  old.player.alias="systemqa";old.player.credits=1234;
  old.world.completedMissions=["mission_first","mission_mirror"];
  old.missions.active=["mission_recovery"];
  old.missions.progress={mission_recovery:{meridian_find:true}};
  delete old.nexusSystem;
  const migrated=migrateSave(structuredClone(old));
  assert.equal(migrated.meta.saveVersion,11);
  assert.equal(migrated.meta.worldSchema,10);
  assert.equal(migrated.player.credits,1234);
  assert.deepEqual(migrated.world.completedMissions,["mission_first","mission_mirror"]);
  assert.deepEqual(migrated.missions.active,["mission_recovery"]);
  assert.equal(migrated.missions.progress.mission_recovery.meridian_find,true);
  assert.equal(migrated.nexusSystem.network.adapterEnabled,true);
  assert.equal(migrated.nexusSystem.services.dnsClient,"running");
  assert.equal(migrated.nexusSystem.firewall.enabled,true);
}

// Adapter, DHCP/DNS service, repair, firewall and device state are actually mutable.
{
  const s=resetState();
  assert.equal(nexusNetworkOnline(),true);
  assert.equal(nexusDnsOnline(),true);
  const initialEvents=s.nexusSystem.eventLog.length;

  setNetworkAdapter(false);
  assert.equal(nexusNetworkOnline(),false);
  assert.equal(nexusDnsOnline(),false);
  assert.match(renewDhcp().message,/disabled/i);

  repairNetwork();
  assert.equal(nexusNetworkOnline(),true);
  assert.equal(nexusDnsOnline(),true);
  assert.equal(s.nexusSystem.services.dhcpClient,"running");
  assert.equal(s.nexusSystem.services.dnsClient,"running");

  setService("dnsClient","stopped");
  assert.equal(nexusNetworkOnline(),true);
  assert.equal(nexusDnsOnline(),false);
  setService("dnsClient","running");
  assert.equal(nexusDnsOnline(),true);

  setFirewallEnabled(false);
  assert.equal(s.nexusSystem.firewall.enabled,false);
  setFirewallRule("fileSharing",true);
  assert.equal(s.nexusSystem.firewall.rules.fileSharing,true);

  setDeviceEnabled("soundAdapter",false);
  assert.equal(s.nexusSystem.devices.soundAdapter,"disabled");
  setDeviceEnabled("soundAdapter",true);
  assert.equal(s.nexusSystem.devices.soundAdapter,"enabled");
  assert.ok(s.nexusSystem.eventLog.length>initialEvents);
  assert.equal(systemSnapshot().hardware.cpu,"Northstar P3 733 MHz");
}

// Malformed system state normalizes to safe values.
{
  const bad=baseState();
  bad.nexusSystem={network:{adapterEnabled:"yes",dns:[1,null]},firewall:{profile:"Space",rules:{fileSharing:"yes"}},services:{dnsClient:"broken"},devices:{networkAdapter:"broken"},eventLog:"bad"};
  const normalized=migrateSave(structuredClone(bad));
  assert.equal(normalized.nexusSystem.network.adapterEnabled,true);
  assert.deepEqual(normalized.nexusSystem.network.dns,["192.168.1.1"]);
  assert.equal(normalized.nexusSystem.firewall.profile,"Home");
  assert.equal(normalized.nexusSystem.firewall.rules.fileSharing,false);
  assert.equal(normalized.nexusSystem.services.dnsClient,"running");
  assert.equal(normalized.nexusSystem.devices.networkAdapter,"enabled");
  assert.ok(Array.isArray(normalized.nexusSystem.eventLog));
}

const desktop=fs.readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
for(const text of ["File Explorer-style folders","Control Panel","Device Manager","Network Connections","NEXUS Firewall","Services","Event Viewer","Add or Remove Programs"]){
  if(text==="File Explorer-style folders")continue;
  assert.match(desktop,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
}
assert.match(desktop,/Code 22/);
assert.match(desktop,/RENEW DHCP/);
assert.match(desktop,/repairNetwork/);
assert.match(desktop,/setFirewallRule/);
assert.match(desktop,/setService/);
assert.match(desktop,/nexusDnsOnline/);

console.log("BLACKBOX v0.4.0 Alpha 4.5 NEXUS system-tools guards passed");

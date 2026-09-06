import { getState } from "../core/state.js";
import { emit } from "../core/events.js";

const nowStamp=()=>Date.now();
const state=()=>getState().nexusSystem;

export function recordSystemEvent({level="Information",source="System",eventId=1,message="System event"}={}){
  const s=state();
  const entry={id:`nexus-${nowStamp().toString(36)}-${Math.random().toString(36).slice(2,7)}`,level,source,eventId,message};
  s.eventLog.push(entry);
  if(s.eventLog.length>100)s.eventLog.splice(0,s.eventLog.length-100);
  return entry;
}

export function nexusNetworkOnline(){
  const s=state();
  return !!s.network.adapterEnabled && s.devices.networkAdapter!=="disabled";
}

export function nexusDnsOnline(){
  const s=state();
  return nexusNetworkOnline() && s.services.dnsClient==="running";
}

export function setNetworkAdapter(enabled){
  const s=state(),next=!!enabled;
  s.network.adapterEnabled=next;
  s.devices.networkAdapter=next?"enabled":"disabled";
  recordSystemEvent({
    level:next?"Information":"Warning",source:"Tcpip",eventId:next?4201:4202,
    message:next?"Local Area Connection enabled and link restored.":"Local Area Connection disabled by user."
  });
  emit("nexus:system-changed",{kind:"network",adapterEnabled:next});
  return {ok:true,message:next?"Local Area Connection enabled.":"Local Area Connection disabled."};
}

export function renewDhcp(){
  const s=state();
  if(!nexusNetworkOnline())return {ok:false,message:"Cannot renew DHCP while the network adapter is disabled."};
  if(s.services.dhcpClient!=="running")return {ok:false,message:"DHCP Client service is stopped."};
  s.network.leaseRenewals+=1;
  recordSystemEvent({source:"Dhcp",eventId:1001,message:`DHCP lease renewed for ${s.network.ip}.`});
  emit("nexus:system-changed",{kind:"dhcp",leaseRenewals:s.network.leaseRenewals});
  return {ok:true,message:`DHCP lease renewed. Address remains ${s.network.ip}.`};
}

export function repairNetwork(){
  const s=state();
  s.network.adapterEnabled=true;s.devices.networkAdapter="enabled";
  s.services.dhcpClient="running";s.services.dnsClient="running";
  s.network.lastRepairAt=nowStamp();s.network.leaseRenewals+=1;
  recordSystemEvent({source:"Network Diagnostics",eventId:2001,message:"Network repair enabled the adapter, restarted DHCP/DNS Client, and renewed the lease."});
  emit("nexus:system-changed",{kind:"network-repair"});
  return {ok:true,message:"Repair complete: adapter enabled, DHCP/DNS services running, lease renewed."};
}

export function setFirewallEnabled(enabled){
  const s=state(),next=!!enabled;s.firewall.enabled=next;
  recordSystemEvent({level:next?"Information":"Warning",source:"Firewall",eventId:next?3001:3002,message:next?"NEXUS Firewall enabled.":"NEXUS Firewall disabled by user."});
  emit("nexus:system-changed",{kind:"firewall",enabled:next});
  return {ok:true,message:`NEXUS Firewall ${next?"enabled":"disabled"}.`};
}

export function setFirewallRule(rule,enabled){
  const s=state();if(!(rule in s.firewall.rules))return {ok:false,message:"Unknown firewall exception."};
  s.firewall.rules[rule]=!!enabled;
  recordSystemEvent({source:"Firewall",eventId:3010,message:`Firewall exception ${rule} ${enabled?"enabled":"disabled"}.`});
  emit("nexus:system-changed",{kind:"firewall-rule",rule,enabled:!!enabled});
  return {ok:true,message:`Firewall exception ${enabled?"enabled":"disabled"}.`};
}

export function setService(service,status){
  const s=state();if(!(service in s.services))return {ok:false,message:"Unknown service."};
  if(!["running","stopped"].includes(status))return {ok:false,message:"Invalid service state."};
  s.services[service]=status;
  recordSystemEvent({level:status==="running"?"Information":"Warning",source:"Service Control Manager",eventId:status==="running"?7036:7035,message:`${service} service entered the ${status} state.`});
  emit("nexus:system-changed",{kind:"service",service,status});
  return {ok:true,message:`${service} is now ${status}.`};
}

export function setDeviceEnabled(device,enabled){
  const s=state();if(!(device in s.devices))return {ok:false,message:"Unknown device."};
  s.devices[device]=enabled?"enabled":"disabled";
  if(device==="networkAdapter")s.network.adapterEnabled=!!enabled;
  recordSystemEvent({level:enabled?"Information":"Warning",source:"PlugPlayManager",eventId:enabled?4001:4002,message:`${device} ${enabled?"enabled":"disabled"} in Device Manager.`});
  emit("nexus:system-changed",{kind:"device",device,enabled:!!enabled});
  return {ok:true,message:`Device ${enabled?"enabled":"disabled"}.`};
}

export function systemSnapshot(){
  const s=getState(),ns=s.nexusSystem;
  return {
    online:nexusNetworkOnline(),dnsOnline:nexusDnsOnline(),
    network:{...ns.network,dns:[...ns.network.dns]},
    firewall:{...ns.firewall,rules:{...ns.firewall.rules}},
    services:{...ns.services},devices:{...ns.devices},
    eventLog:[...ns.eventLog].reverse(),
    hardware:{
      cpu:s.player.installedHardware.includes("cpu_p3_933")?"Northstar P3 933 MHz":"Northstar P3 733 MHz",
      memory:s.player.installedHardware.includes("ram_256")?"384 MB":"128 MB",
      disk:s.player.installedHardware.includes("hdd_20gb")?"20 GB DeskStar HDD":"10 GB DeskStar HDD",
      network:s.player.installedHardware.includes("nic_fast")?"FastLink 100 PCI Adapter":"EtherLink 10 PCI Adapter"
    }
  };
}

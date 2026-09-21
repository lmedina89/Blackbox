import { getState } from "../core/state.js";
import { DNS_RECORDS } from "../data/dns.js";
import { HOSTS } from "../data/hosts.js";
import { nexusNetworkOnline, nexusDnsOnline, renewDhcp, systemSnapshot } from "./nexusSystem.js";

const HOSTNAME="HOME-PC";
const isIpv4=value=>{const parts=String(value||"").trim().split(".");return parts.length===4&&parts.every(part=>/^\d+$/.test(part)&&Number(part)>=0&&Number(part)<=255);};
const cleanName=value=>String(value||"").trim().toLowerCase().replace(/\.$/,"");

function recordVisible(record){
  const flags=new Set(getState().world.flags||[]);
  if((record.visibleWhen||[]).some(flag=>!flags.has(flag)))return false;
  if((record.hiddenWhen||[]).some(flag=>flags.has(flag)))return false;
  // Local NEXUS/OS does not inherit a BLACKBOX pivot's private resolver view.
  if(record.availableFrom?.length&&!record.availableFrom.includes("home"))return false;
  return (record.universe||"campaign")==="campaign";
}

function availableRecords(){return DNS_RECORDS.filter(recordVisible);}

function resolveLocalName(raw){
  const name=cleanName(raw);if(!name)return null;
  const records=availableRecords();let current=name;const seen=new Set();
  for(let depth=0;depth<8&&!seen.has(current);depth++){
    seen.add(current);
    const a=records.find(record=>record.name===current&&record.type==="A");
    if(a)return {query:name,canonicalName:current,address:a.value,record:a};
    const alias=records.find(record=>record.name===current&&record.type==="CNAME");
    if(!alias)return null;
    current=cleanName(alias.value);
  }
  return null;
}

function localDnsLookup(raw){
  const name=cleanName(raw);if(!name)return {ok:false,output:"Usage: nslookup <hostname>"};
  if(!nexusNetworkOnline())return {ok:false,output:"*** Request timed out. Local Area Connection is disabled."};
  if(!nexusDnsOnline())return {ok:false,output:"*** Can't find server name for address: DNS Client service is not running."};
  const records=availableRecords(),direct=records.filter(record=>record.name===name);
  if(!direct.length)return {ok:false,output:`*** ${name}: Non-existent domain in the simulated NEXUS resolver.`};
  const lines=[`Server:  home-gw`,`Address: ${systemSnapshot().network.dns[0]||systemSnapshot().network.gateway}`,""];
  const cname=direct.find(record=>record.type==="CNAME");
  if(cname){lines.push(`Name:    ${cname.name}`,`Aliases: ${cname.value}`);const target=records.find(record=>record.name===cleanName(cname.value)&&record.type==="A");if(target)lines.push(`Address: ${target.value}`);return {ok:true,output:lines.join("\n")};}
  for(const record of direct){
    if(record.type==="A")lines.push(`Name:    ${record.name}`,`Address: ${record.value}`);
    else if(record.type==="MX")lines.push(`Name:    ${record.name}`,`Mail exchanger: ${record.value}`);
  }
  return {ok:true,output:lines.join("\n")};
}

function pingTarget(raw){
  const target=String(raw||"").trim();if(!target)return {ok:false,output:"Usage: ping <host|IP>"};
  if(!nexusNetworkOnline())return {ok:false,output:"PING: transmit failed. Local Area Connection is disabled."};
  let address=target,label=target;
  if(!isIpv4(target)){
    if(!nexusDnsOnline())return {ok:false,output:`Ping request could not find host ${target}. Check the name and try again.`};
    const resolved=resolveLocalName(target);if(!resolved)return {ok:false,output:`Ping request could not find host ${target}. Check the name and try again.`};
    address=resolved.address;label=resolved.query;
  }
  const snap=systemSnapshot();
  const identified=new Set(getState().player.identifiedHosts||[]);
  const knownAddresses=new Set(HOSTS.filter(host=>identified.has(host.id)||host.id==="home"||host.id==="homegw").map(host=>host.address));
  const resolverAddresses=new Set(availableRecords().filter(record=>record.type==="A").map(record=>record.value));
  const reachable=address===snap.network.gateway||snap.network.dns.includes(address)||knownAddresses.has(address)||resolverAddresses.has(address);
  if(!reachable)return {ok:false,output:`Pinging ${label} [${address}] with 32 bytes of data:\nDestination host unreachable.\n\nPackets: Sent = 4, Received = 0, Lost = 4 (100% loss)`};
  return {ok:true,output:`Pinging ${label} [${address}] with 32 bytes of data:\nReply from ${address}: bytes=32 time<10ms TTL=64\nReply from ${address}: bytes=32 time<10ms TTL=64\nReply from ${address}: bytes=32 time<10ms TTL=64\nReply from ${address}: bytes=32 time<10ms TTL=64\n\nPackets: Sent = 4, Received = 4, Lost = 0 (0% loss)`};
}

function ipconfig(all=false){
  const snap=systemSnapshot(),media=snap.network.adapterEnabled;
  const lines=["Windows NEXUS IP Configuration",""];
  if(all)lines.push(`   Host Name . . . . . . . . . . : ${HOSTNAME}`,`   DHCP Enabled. . . . . . . . . : ${snap.network.dhcp?"Yes":"No"}`,"");
  lines.push(`${snap.hardware.network}:`);
  if(!media){lines.push("   Media State . . . . . . . . . : Media disconnected");return lines.join("\n");}
  lines.push(`   IP Address. . . . . . . . . . : ${snap.network.ip}`,`   Subnet Mask . . . . . . . . . : ${snap.network.subnet}`,`   Default Gateway . . . . . . . : ${snap.network.gateway}`);
  if(all)lines.push(`   DNS Servers . . . . . . . . . : ${snap.network.dns.join(", ")}`);
  return lines.join("\n");
}

export function runNexusCommand(raw){
  const text=String(raw||"").trim();if(!text)return {ok:true,output:""};
  const [name,...args]=text.split(/\s+/),cmd=name.toLowerCase();
  if(cmd==="cls"||cmd==="clear")return {ok:true,clear:true,output:""};
  if(cmd==="help")return {ok:true,output:["NEXUS/OS Command Prompt","","HELP                 Show this command list","HOSTNAME             Show this computer name","WHOAMI               Show the current NEXUS account","VER                  Show NEXUS/OS version","IPCONFIG [/ALL]      Show TCP/IP configuration","IPCONFIG /RENEW      Renew the DHCP lease","PING <host|IP>       Test basic reachability","NSLOOKUP <name>      Query the local simulated resolver","DIR [path]           List local folders","CLS                  Clear this window","","BLACKBOX commands such as scan, enum, probe and auth are not NEXUS/OS commands."].join("\n")};
  if(cmd==="hostname")return {ok:true,output:HOSTNAME};
  if(cmd==="whoami")return {ok:true,output:`NEXUS\\${getState().player.alias}`};
  if(cmd==="ver")return {ok:true,output:"NEXUS/OS Personal Workstation 4.0 [Build 41011]"};
  if(cmd==="ipconfig"){
    if(args[0]?.toLowerCase()==="/renew"){const result=renewDhcp();return {ok:result.ok,output:result.message};}
    if(args.length&&args[0]?.toLowerCase()!=="/all")return {ok:false,output:"Usage: ipconfig [/all|/renew]"};
    return {ok:true,output:ipconfig(args[0]?.toLowerCase()==="/all")};
  }
  if(cmd==="ping")return pingTarget(args.join(" "));
  if(cmd==="nslookup")return localDnsLookup(args.join(" "));
  if(cmd==="dir"){
    const target=String(args.join(" ")||"C:\\").trim().replaceAll("/","\\").toLowerCase();
    if(target==="c:"||target==="c:\\")return {ok:true,output:" Volume in drive C is SYSTEM\n Directory of C:\\\n\n<DIR>          My Documents\n<DIR>          Program Files\n<DIR>          Downloads\n<DIR>          BLACKBOX Data\n               0 File(s)"};
    if(target.includes("my documents"))return {ok:true,output:" Directory of C:\\My Documents\n\n<DIR>          Training\n             1 notes.txt"};
    return {ok:false,output:"File Not Found"};
  }
  return {ok:false,output:`'${name}' is not recognized as an internal or external NEXUS command. Type HELP.`};
}

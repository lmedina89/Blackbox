import { DNS_RECORDS } from "../data/dns.js";
import { identifyHost } from "./network.js";
import { emit } from "../core/events.js";
import { getState, setFlag } from "../core/state.js";
import { universeOf } from "./intrusion.js";

function recordAvailable(record,state){
  const sandboxUniverse=state.intrusion?.activeSandbox?.universe||((universeOf(state.terminal.hostId)!=="campaign")?universeOf(state.terminal.hostId):null);
  if(sandboxUniverse&&(record.universe||"campaign")!==sandboxUniverse)return false;
  const flags=new Set(state.world.flags||[]);
  if((record.visibleWhen||[]).some(flag=>!flags.has(flag)))return false;
  if((record.hiddenWhen||[]).some(flag=>flags.has(flag)))return false;
  if(record.availableFrom?.length && !record.availableFrom.includes(state.terminal.hostId))return false;
  return true;
}


export function resolveDnsTarget(rawName,{requireIdentified=true}={}){
  const state=getState();
  const name=String(rawName||"").trim().toLowerCase().replace(/\.$/,"");
  if(!name)return null;
  const availableRecords=DNS_RECORDS.filter(record=>recordAvailable(record,state));
  let current=name;
  const seen=new Set();
  for(let depth=0;depth<8&&!seen.has(current);depth++){
    seen.add(current);
    const address=availableRecords.find(record=>record.name===current&&record.type==="A"&&record.hostId);
    if(address){
      const hostId=address.hostId;
      if(requireIdentified&&!(state.player.identifiedHosts||[]).includes(hostId))return null;
      return {name,canonicalName:current,hostId,address:address.value};
    }
    const alias=availableRecords.find(record=>record.name===current&&record.type==="CNAME");
    if(!alias)return null;
    current=String(alias.value||"").trim().toLowerCase().replace(/\.$/,"");
  }
  return null;
}

export function lookupDns(rawName,rawType="ANY",{emitEvent=true}={}){
  const state=getState();
  const name=String(rawName||"").trim().toLowerCase().replace(/\.$/,"");
  const type=String(rawType||"ANY").toUpperCase();
  if(!name)throw new Error("nslookup: specify a fictional hostname");
  if(!["ANY","A","CNAME","MX"].includes(type))throw new Error("nslookup: supported types are A, CNAME, and MX");
  const availableRecords=DNS_RECORDS.filter(record=>recordAvailable(record,state));
  let records=availableRecords.filter(x=>x.name===name&&(type==="ANY"||x.type===type));
  if(type==="ANY"){
    const cname=records.find(x=>x.type==="CNAME");
    if(cname)records=[...records,...availableRecords.filter(x=>x.name===cname.value&&x.type==="A")];
  }
  if(!records.length)throw new Error(`nslookup: ${name}: no simulated record found from ${state.terminal.hostId==="home"?"HOME-PC":state.terminal.hostId.toUpperCase()}`);
  const hostIds=[...new Set(records.map(x=>x.hostId).filter(Boolean))];
  for(const flag of records.map(x=>x.revealFlag).filter(Boolean))setFlag(flag);
  for(const id of hostIds)identifyHost(id);

  const alias=records.find(x=>x.type==="CNAME");
  const aliasTarget=alias&&records.find(x=>x.name===alias.value&&x.type==="A");
  const mx=records.find(x=>x.type==="MX");
  const mxTarget=mx?String(mx.value).trim().split(/\s+/).at(-1):null;
  const mxAddress=mxTarget?availableRecords.find(x=>x.name===mxTarget&&x.type==="A"):null;
  const diagnostics={
    aliasChain:alias?`${alias.name} -> ${alias.value}${aliasTarget?` -> ${aliasTarget.value}`:""}`:null,
    mailContext:mx?`${mx.name} mail host ${mxTarget}${mxAddress?` -> ${mxAddress.value}`:""}`:null
  };

  if(emitEvent)emit("dns:lookup",{dnsName:name,type,records,hostIds,universe:state.intrusion?.activeSandbox?.universe||universeOf(state.terminal.hostId)});
  return {name,type,records,hostIds,diagnostics};
}

export function formatDnsResult(result,{detailed=true}={}){
  const rows=[`SIMULATED DNS LOOKUP`, `Query:    ${result.name}`,`Type:     ${result.type}`,""];
  for(const record of result.records){
    rows.push(`${record.name}`);
    rows.push(`  ${record.type.padEnd(6)} ${record.value}${detailed?`  TTL ${record.ttl}`:""}`);
  }
  if(detailed&&result.diagnostics?.aliasChain)rows.push("",`Alias chain: ${result.diagnostics.aliasChain}`);
  if(detailed&&result.diagnostics?.mailContext)rows.push("",`Mail context: ${result.diagnostics.mailContext}`);
  rows.push("","Fictional NEXUS resolver response. No real DNS query was sent.");
  return rows.join("\n");
}

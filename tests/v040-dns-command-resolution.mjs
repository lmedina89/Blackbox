import assert from "node:assert/strict";
import { resetState, setFlag } from "../js/core/state.js";
import { executeCommand } from "../js/systems/terminal.js";
import { resolveDnsTarget } from "../js/systems/dns.js";

function text(result){return (result.lines||[]).map(line=>line.text||"").join("\n");}

// A public simulated alias is not treated as already learned before DNS discovery.
{
  const s=resetState();
  setFlag("lumen_contract_available");
  assert.equal(resolveDnsTarget("updates.lumen.test",{requireIdentified:true}),null);
  const before=await executeCommand("ping updates.lumen.test");
  assert.match(text(before),/unknown host/i);

  const lookup=await executeCommand("nslookup updates.lumen.test");
  assert.match(text(lookup),/10\.84\.2\.20/);
  const resolved=resolveDnsTarget("updates.lumen.test",{requireIdentified:true});
  assert.equal(resolved?.hostId,"lumenedge");

  const ping=await executeCommand("ping updates.lumen.test");
  assert.match(text(ping),/PING LUMEN-EDGE \(10\.84\.2\.20\)/);

  const trace=await executeCommand("traceroute updates.lumen.test");
  assert.match(text(trace),/traceroute to LUMEN-EDGE \(10\.84\.2\.20\)/);

  const connection=await executeCommand("connect updates.lumen.test");
  assert.match(text(connection),/Connected to LUMEN-EDGE \(10\.84\.2\.20\)/);
  assert.equal(s.terminal.hostId,"lumenedge");
}

// Internal DNS boundaries remain meaningful: HOME-PC cannot resolve Harbor's internal claims alias.
{
  resetState();
  setFlag("harbor_contract_available");
  assert.equal(resolveDnsTarget("claims.harbor.test",{requireIdentified:false}),null,"internal Harbor alias must not resolve from HOME-PC");
}

// Scan-index convenience remains separate from real hostname syntax.
{
  const s=resetState();
  s.terminal.lastScanResults=["lumenedge"];
  const ping=await executeCommand("ping scan 0");
  assert.match(text(ping),/unknown host/i,"ping scan <#> must remain unsupported");
}

console.log("BLACKBOX v0.4.0 Alpha 4.2 DNS command-resolution tests passed");

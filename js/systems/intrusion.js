import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { exploitProfile } from "../data/exploits.js";

export const PRIVILEGE_RANK={guest:0,user:1,service:2,admin:3,root:4};
const VALID_PRIVILEGES=new Set(Object.keys(PRIVILEGE_RANK));

function absoluteNow(state=getState()){return ((state.world.day||1)-1)*1440+(state.world.minute||0);}
function normalizePrivilege(value,fallback="user"){
  const key=String(value||fallback).toLowerCase();
  return VALID_PRIVILEGES.has(key)?key:fallback;
}
function hostUniverse(host){return host?.universe||"campaign";}
function hostKey(host){return `${hostUniverse(host)}:${host.id}`;}
function ensure(){
  const s=getState();
  s.intrusion??={credentials:[],sessions:{},serviceIntel:{},artifacts:[],noise:{},attempts:[],activeSandbox:null};
  s.intrusion.credentials??=[];s.intrusion.sessions??={};s.intrusion.serviceIntel??={};s.intrusion.artifacts??=[];s.intrusion.noise??={};s.intrusion.attempts??=[];
  if(s.intrusion.activeSandbox===undefined)s.intrusion.activeSandbox=null;
  return s.intrusion;
}
function isAvailableHost(host){
  if(!host)return false;
  const flags=new Set(getState().world.flags||[]);
  if((host.visibleWhen||[]).some(flag=>!flags.has(flag)))return false;
  if((host.hiddenWhen||[]).some(flag=>flags.has(flag)))return false;
  return true;
}
function reachable(host){
  const s=getState(),current=HOSTS[s.terminal.hostId];
  if(!current||!host)return false;
  if(current.id===host.id)return true;
  const sandbox=s.intrusion?.activeSandbox;
  if(sandbox?.universe&&sandbox.universe!=="campaign"){
    if(hostUniverse(host)!==sandbox.universe)return false;
    if(current.id==="home"){
      const explicit=sandbox.targetIds||[];
      if(explicit.length)return explicit.includes(host.id);
      return (current.routes||[]).includes(host.id);
    }
  }
  return (current.routes||[]).includes(host.id);
}
function serviceFor(host,ref){
  const token=String(ref||"").trim().toLowerCase();
  if(!token)return null;
  return (host.services||[]).find(service=>String(service.port)===token||String(service.name||"").toLowerCase()===token)||null;
}
function serviceKey(service){return String(service?.port||service?.name||"").toLowerCase();}
function recordAttempt(kind,data){
  const intrusion=ensure();
  intrusion.attempts.push({kind,at:absoluteNow(),...data});
  if(intrusion.attempts.length>100)intrusion.attempts.splice(0,intrusion.attempts.length-100);
}
function noiseState(host){
  const intrusion=ensure(),key=hostKey(host),threshold=Math.max(1,Number(host.detectionThreshold)||5);
  intrusion.noise[key]??={value:0,threshold,alerted:false,lastAt:null};
  const state=intrusion.noise[key];
  state.threshold=threshold;
  return state;
}
function addNoise(host,amount,reason){
  const state=noiseState(host),delta=Math.max(0,Number(amount)||0);
  if(delta<=0)return state;
  state.value=Math.max(0,state.value+delta);state.lastAt=absoluteNow();
  if(state.value>=state.threshold)state.alerted=true;
  recordAttempt("noise",{hostId:host.id,universe:hostUniverse(host),amount:delta,reason,noise:state.value,threshold:state.threshold});
  return state;
}
function credentialScopeMatches(credential,host,service){
  const scope=credential.scope||{};
  if(Array.isArray(scope.universes)&&scope.universes.length&&!scope.universes.includes(hostUniverse(host)))return false;
  if(Array.isArray(scope.hosts)&&scope.hosts.length&&!scope.hosts.includes(host.id))return false;
  if(Array.isArray(scope.services)&&scope.services.length&&!scope.services.includes(service.name))return false;
  return true;
}
function acceptedCredential(host,service,credential){
  const rules=host.authentication?.[service.name]||host.authentication?.[String(service.port)]||[];
  return (Array.isArray(rules)?rules:[]).find(rule=>
    String(rule.username||"")===String(credential.username||"")&&String(rule.secret||"")===String(credential.secret||"")
  )||null;
}
function nextId(prefix,parts){return `${prefix}-${parts.join("-")}`.replace(/[^a-zA-Z0-9_-]/g,"-");}

export function accessModel(hostOrId){
  const host=typeof hostOrId==="string"?HOSTS[hostOrId]:hostOrId;
  return host?.accessModel||"legacy";
}
export function universeOf(hostOrId){
  const host=typeof hostOrId==="string"?HOSTS[hostOrId]:hostOrId;
  return hostUniverse(host);
}
export function isIsolatedBlackboxContext(state=getState()){
  const active=state.intrusion?.activeSandbox;
  if(active?.universe&&active.universe!=="campaign")return true;
  return universeOf(state.terminal.hostId)!=="campaign";
}
export function setActiveSandbox(value){
  const intrusion=ensure();
  intrusion.activeSandbox=value&&typeof value==="object"?{...value}:null;
  return intrusion.activeSandbox;
}
export function getEstablishedSession(hostId){
  const host=HOSTS[hostId];if(!host)return null;
  const intrusion=ensure(),session=intrusion.sessions[hostKey(host)];
  return session&&session.status==="established"?session:null;
}
export function currentPrivilege(state=getState()){
  const host=HOSTS[state.terminal.hostId];
  if(!host||accessModel(host)!=="advanced")return "root"; // legacy hosts preserve historical unrestricted behavior.
  return normalizePrivilege(getEstablishedSession(host.id)?.privilege,"guest");
}
export function privilegeAllows(actual,required="guest"){
  return (PRIVILEGE_RANK[normalizePrivilege(actual,"guest")]??0)>=(PRIVILEGE_RANK[normalizePrivilege(required,"guest")]??0);
}
export function canAccessNode(node,state=getState()){
  if(!node)return false;
  const host=HOSTS[state.terminal.hostId];
  if(!host||accessModel(host)!=="advanced")return true;
  const required=normalizePrivilege(node.access?.minPrivilege||node.minPrivilege||"guest","guest");
  return privilegeAllows(currentPrivilege(state),required);
}

export function enumerateService(host,serviceRef){
  if(!host)throw new Error("enum: unknown target");
  if(!isAvailableHost(host))throw new Error("enum: target is not currently available");
  if(!reachable(host))throw new Error(`enum: no route to ${host.hostname}`);
  const service=serviceFor(host,serviceRef);
  if(!service||!service.port)throw new Error("enum: requested service is not exposed on this target");
  if(service.state!=="open")throw new Error(`enum: ${service.name} is present but not accepting connections`);
  const intrusion=ensure(),key=hostKey(host);
  intrusion.serviceIntel[key]??={};
  const intel={hostId:host.id,universe:hostUniverse(host),service:service.name,port:service.port,product:service.product||null,version:service.version||null,observations:[...(service.observations||[])],enumeratedAt:absoluteNow()};
  intrusion.serviceIntel[key][serviceKey(service)]=intel;
  intrusion.serviceIntel[key][String(service.name).toLowerCase()]=intel;
  recordAttempt("enumeration",{hostId:host.id,universe:hostUniverse(host),service:service.name,port:service.port,result:"success"});
  return intel;
}
export function hasEnumerated(host,serviceRef){
  if(!host)return false;
  const service=serviceFor(host,serviceRef);if(!service)return false;
  const entries=ensure().serviceIntel[hostKey(host)]||{};
  return !!(entries[serviceKey(service)]||entries[String(service.name).toLowerCase()]);
}

export function addKnownCredential({id,username,secret,source="unknown",scope={},status="known"}){
  const intrusion=ensure();
  if(!username||secret===undefined||secret===null)throw new Error("Credential requires a username and simulated secret");
  const credentialId=id||nextId("cred",[username,source,intrusion.credentials.length+1]);
  const existing=intrusion.credentials.find(item=>item.id===credentialId||(
    item.username===username&&item.secret===String(secret)&&JSON.stringify(item.scope||{})===JSON.stringify(scope||{})
  ));
  if(existing)return existing;
  const credential={id:credentialId,username:String(username),secret:String(secret),source:String(source),scope:{...scope},status:String(status||"known"),discoveredAt:absoluteNow(),tested:[]};
  intrusion.credentials.push(credential);
  return credential;
}
export function knownCredentials(){return ensure().credentials;}
function credentialByRef(ref){
  const token=String(ref||"").toLowerCase();
  return ensure().credentials.find(item=>item.id.toLowerCase()===token||item.username.toLowerCase()===token)||null;
}
function recordCredentialTest(credential,host,service,result){
  credential.tested??=[];
  const entry={hostId:host.id,universe:hostUniverse(host),service:service.name,result,at:absoluteNow()};
  credential.tested.push(entry);if(credential.tested.length>30)credential.tested.shift();
}

export function authenticate(host,serviceRef,credentialRef){
  if(!host)throw new Error("auth: unknown target");
  if(accessModel(host)!=="advanced")throw new Error("auth: legacy-access host does not require the advanced authentication model");
  if(!isAvailableHost(host))throw new Error("auth: target is not currently available");
  if(!reachable(host))throw new Error(`auth: no route to ${host.hostname}`);
  const service=serviceFor(host,serviceRef);
  if(!service||!service.port)throw new Error("auth: requested service is not exposed on this target");
  if(service.state!=="open")throw new Error(`auth: connection refused; ${service.name} is not accepting connections`);
  const credential=credentialByRef(credentialRef);
  if(!credential)throw new Error("auth: credential is not known to BLACKBOX; inspect access records first");
  if(!credentialScopeMatches(credential,host,service)){
    recordCredentialTest(credential,host,service,"out-of-scope");const noise=addNoise(host,1,"credential-scope-failure");
    recordAttempt("authentication",{hostId:host.id,universe:hostUniverse(host),service:service.name,credentialId:credential.id,result:"out-of-scope"});
    return {ok:false,reason:"out-of-scope",credential,service,noise,message:"Credential scope does not include this target/service."};
  }
  const rule=acceptedCredential(host,service,credential);
  if(!rule){
    recordCredentialTest(credential,host,service,"rejected");const noise=addNoise(host,1,"authentication-failure");
    recordAttempt("authentication",{hostId:host.id,universe:hostUniverse(host),service:service.name,credentialId:credential.id,result:"rejected"});
    return {ok:false,reason:"rejected",credential,service,noise,message:`Authentication failed for ${credential.username}.`};
  }
  recordCredentialTest(credential,host,service,"accepted");
  const session={id:nextId("session",[hostUniverse(host),host.id,credential.username]),hostId:host.id,universe:hostUniverse(host),user:credential.username,privilege:normalizePrivilege(rule.privilege,"user"),service:service.name,source:`credential:${credential.id}`,establishedAt:absoluteNow(),status:"established"};
  ensure().sessions[hostKey(host)]=session;
  recordAttempt("authentication",{hostId:host.id,universe:hostUniverse(host),service:service.name,credentialId:credential.id,result:"accepted",privilege:session.privilege});
  return {ok:true,session,credential,service};
}

function vulnerabilityInstance(host,id){return (host.vulnerabilities||[]).find(item=>String(item.id||item).toUpperCase()===id)||null;}
function normalizeInstance(raw){return typeof raw==="string"?{id:raw,state:"vulnerable"}:raw;}
function applyEffects(host,profile,instance){
  const effects=instance.effects||{},result={artifacts:[],credentials:[],session:null,elevated:null};
  for(const artifact of effects.artifacts||[]){
    const item={id:artifact.id||nextId("artifact",[host.id,result.artifacts.length+1]),hostId:host.id,universe:hostUniverse(host),path:artifact.path||null,label:artifact.label||artifact.path||"exposed artifact",content:artifact.content==null?null:String(artifact.content),source:profile.id,discoveredAt:absoluteNow()};
    const intrusion=ensure();
    if(!intrusion.artifacts.some(x=>x.id===item.id))intrusion.artifacts.push(item);
    result.artifacts.push(item);
  }
  for(const raw of effects.credentials||[]){
    const credential=addKnownCredential({...raw,source:raw.source||`${host.hostname}/${profile.id}`});result.credentials.push(credential);
  }
  if(effects.session){
    const raw=effects.session;
    const session={id:nextId("session",[hostUniverse(host),host.id,raw.user||"service"]),hostId:host.id,universe:hostUniverse(host),user:String(raw.user||"service"),privilege:normalizePrivilege(raw.privilege,"service"),service:String(raw.service||profile.requiredService||"simulated"),source:`probe:${profile.id}`,establishedAt:absoluteNow(),status:"established"};
    ensure().sessions[hostKey(host)]=session;result.session=session;
  }
  if(effects.elevateTo){
    const session=getEstablishedSession(host.id);
    if(!session)throw new Error("probe: privilege effect requires an established session on the target");
    const required=normalizePrivilege(instance.requiresPrivilege||"user","user");
    if(!privilegeAllows(session.privilege,required))throw new Error(`probe: current session privilege (${session.privilege}) does not meet the simulated requirement (${required})`);
    const target=normalizePrivilege(effects.elevateTo,"admin");
    if(PRIVILEGE_RANK[target]>PRIVILEGE_RANK[session.privilege])session.privilege=target;
    result.elevated=session.privilege;
  }
  return result;
}

export function probeProfile(host,profileId){
  if(!host)throw new Error("probe: unknown target");
  if(accessModel(host)!=="advanced")throw new Error("probe: legacy-access host does not expose advanced vulnerability profiles");
  if(!isAvailableHost(host))throw new Error("probe: target is not currently available");
  if(!reachable(host))throw new Error(`probe: no route to ${host.hostname}`);
  const profile=exploitProfile(profileId);
  if(!profile)throw new Error("probe: unknown fictional BBX profile");
  if(profile.requiredService!=="local"){
    const service=serviceFor(host,profile.requiredService);
    if(!service||!service.port||service.state!=="open")throw new Error(`probe: required ${profile.requiredService} service is not reachable on this target`);
    if(profile.requiresEnumeration&&!hasEnumerated(host,profile.requiredService))throw new Error(`probe: enumerate the ${profile.requiredService} service before testing this profile`);
  }else if(getState().terminal.hostId!==host.id){
    throw new Error("probe: this fictional profile requires a local session on the target");
  }
  const raw=vulnerabilityInstance(host,profile.id),instance=raw?normalizeInstance(raw):null;
  const noise=addNoise(host,profile.baseNoise,"probe");
  if(!instance||instance.state==="not-vulnerable"){
    recordAttempt("probe",{hostId:host.id,universe:hostUniverse(host),profileId:profile.id,result:"no-match"});
    return {ok:false,reason:"no-match",profile,noise,message:"Target behavior does not match this fictional vulnerability profile."};
  }
  if(instance.state==="mitigated"||instance.state==="patched"){
    recordAttempt("probe",{hostId:host.id,universe:hostUniverse(host),profileId:profile.id,result:"mitigated"});
    return {ok:false,reason:"mitigated",profile,noise,message:"Target behavior matches the service family, but the simulated vulnerable path appears mitigated."};
  }
  const effects=applyEffects(host,profile,instance);
  recordAttempt("probe",{hostId:host.id,universe:hostUniverse(host),profileId:profile.id,result:"success"});
  return {ok:true,profile,noise,effects,message:"Simulated target behavior matches the fictional profile."};
}

export function artifactByRef(ref){
  const token=String(ref??"").trim().toLowerCase(),items=ensure().artifacts;
  if(/^\d+$/.test(token))return items[Number(token)]||null;
  return items.find(item=>String(item.id||"").toLowerCase()===token||String(item.label||"").toLowerCase()===token)||null;
}

export function accessSnapshot(){
  const intrusion=ensure();
  return {
    credentials:intrusion.credentials.map(item=>({...item,secret:"********"})),
    sessions:Object.values(intrusion.sessions).filter(item=>item?.status==="established").map(item=>({...item})),
    artifacts:intrusion.artifacts.map(item=>({...item})),
    noise:Object.entries(intrusion.noise).map(([key,value])=>({key,...value})),
    activeSandbox:intrusion.activeSandbox?{...intrusion.activeSandbox}:null
  };
}

import { SAVE_VERSION, WORLD_SCHEMA, baseState } from "./state.js";

const migrations={
  2(save){
    save.player.notes ??= "";
    save.world.readSocialPosts ??= [];
    save.world.readNewsStories ??= [];
    save.terminal.sessionCount ??= 0;
    save.ui ??= {};
    save.ui.lastBrowserSite ??= "news";
    return save;
  },
  3(save){
    save.player.discoveredClues ??= [];
    save.player.discoveredHosts ??= [];
    save.player.relationships ??= {maya:1,sam:0,zero:0};
    save.communications ??= {choicesMade:[]};
    save.communications.choicesMade ??= [];
    save.terminal.sessionOpen ??= false;
    save.terminal.suspended ??= false;
    return save;
  },
  4(save){
    save.meta.identityId ??= `identity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
    save.terminal.pendingAction ??= null;
    return save;
  },
  5(save){
    save.player.proficiencies ??= {systems:0,network:0,analysis:0,social:0};
    save.player.learnedActions ??= [];
    save.player.downloads ??= [];
    return save;
  },
  6(save){
    save.player.identifiedHosts ??= ["home",...(save.player.discoveredHosts||[])];
    return save;
  },
  7(save){
    const legacySeen=[...(save.player.discoveredHosts||[])];
    save.player.seenHosts ??= legacySeen;
    const missionHosts=new Set(["archives01","mirror02","meridian01","helixedge","helixlog","axiomrelay"]);
    save.player.savedTargets ??= legacySeen
      .filter(id=>missionHosts.has(id))
      .map(id=>({hostId:id,source:"legacy",missionId:null,savedAt:Date.now()}));
    save.terminal ??= {};
    save.terminal.lastScanResults=[];
    return save;
  },
  8(save){
    save.world ??= {};
    save.world.readNewsStories ??= [];
    return save;
  },
  9(save){
    save.player ??= {};
    save.player.installedSoftware ??= ["resolver_basic"];
    save.world ??= {};
    save.world.readThreats ??= [];
    if(save.world.readMessages===undefined){
      const flags=new Set(save.world.flags||[]),completed=new Set(save.world.completedMissions||[]);
      // Historical unread suppression is intentionally separate from clue discovery.
      // Sam/Chris clues are reconciled when their visible threads are actually presented.
      const read=["m1","m2","sam1","sam2","sam3","c1","c2","c3"];
      if(flags.has("alias_created"))read.push("m3");
      if(flags.has("mission_first_complete")||completed.has("mission_first"))read.push("m4","m5");
      if(flags.has("choice_mirror_send"))read.push("m6");
      if(flags.has("choice_mirror_why"))read.push("m7");
      if(flags.has("mirror_lead_accepted"))read.push("m8");
      if(flags.has("mission_mirror_complete")||completed.has("mission_mirror"))read.push("m9");
      save.world.readMessages=read;
    }
    save.world.completedLabs ??= [];
    save.world.actionTick ??= 0;
    save.world.networkEpoch ??= Math.floor((save.world.actionTick||0)/5);
    save.world.scanCounters ??= {};
    save.world.deliveredEvents ??= [];
    save.world.eventEligibleAt ??= {};
    save.world.countedActions ??= [];
    save.world.caseHistory ??= [];
    for(const id of save.world.completedMissions||[]){
      if(!save.world.caseHistory.some(x=>x.id===`mission:${id}`)){
        save.world.caseHistory.push({id:`mission:${id}`,kind:"mission",refId:id,day:save.world.day||1,minute:save.world.minute||0,historical:true});
      }
    }
    return save;
  },
  10(save){
    save.world ??= {};
    save.world.timeline ??= {scheduled:{},delivered:[],deliveryTimes:{},cancelled:[],expired:[],cooldowns:{},occurrenceCounters:{}};
    save.communications ??= {choicesMade:[]};
    save.communications.threads ??= {};
    save.learning ??= {questionAttempts:{},topicStats:{},reviewQueue:[]};
    save.helpDesk ??= {availableTickets:[],activeTickets:[],completedTickets:[],ticketProgress:{}};
    save.behavior ??= {autonomy:0,empathy:0,intervention:0,transparency:0,trust:0,decisions:[]};
    return save;
  },
  11(save){
    save.nexusSystem ??= baseState().nexusSystem;
    return save;
  },
  12(save){
    save.communications ??= {choicesMade:[],threads:{}};
    save.communications.choiceTimes ??= {};
    // A4.5 already persisted each thread's most recent choice and timestamp.
    // Use that to preserve canonical reply timing when migrating an in-progress save.
    for(const raw of Object.values(save.communications.threads||{})){
      if(!raw||typeof raw!=="object"||Array.isArray(raw))continue;
      const id=typeof raw.lastChoiceId==="string"?raw.lastChoiceId:"";
      const at=Number(raw.lastChoiceAt);
      if(id&&Number.isFinite(at)&&at>=0&&save.communications.choiceTimes[id]===undefined)save.communications.choiceTimes[id]=Math.trunc(at);
    }
    return save;
  },
  13(save){
    save.helpDesk ??= {};
    save.helpDesk.availableTickets ??= [];
    save.helpDesk.activeTickets ??= [];
    save.helpDesk.completedTickets ??= [];
    save.helpDesk.ticketProgress ??= {};
    save.helpDesk.machines ??= {};
    save.helpDesk.remoteSession ??= null;
    save.helpDesk.job ??= {level:1,resolved:0,escalated:0,score:0};
    return save;
  },
  14(save){
    save.intrusion ??= {credentials:[],sessions:{},serviceIntel:{},artifacts:[],noise:{},attempts:[],activeSandbox:null};
    save.terminal ??= {};
    save.terminal.accessSessionId ??= null;
    return save;
  },
  15(save){
    save.nightwire ??= {readPosts:[],readMessages:[],range:{activeLabId:null,completed:[],runs:{},results:{}}};
    save.terminal ??= {};
    save.terminal.serviceSession ??= null;
    return save;
  }
};

const isObject=value=>!!value&&typeof value==="object"&&!Array.isArray(value);
const asArray=(value,fallback=[])=>Array.isArray(value)?value:fallback;
const asObject=(value,fallback={})=>isObject(value)?value:fallback;
const asString=(value,fallback="")=>typeof value==="string"?value:fallback;
const asBoolean=(value,fallback=false)=>typeof value==="boolean"?value:fallback;
function asNumber(value,fallback,{integer=false,min=-Infinity,max=Infinity}={}){
  const n=Number(value);
  if(!Number.isFinite(n))return fallback;
  const out=integer?Math.trunc(n):n;
  return Math.min(max,Math.max(min,out));
}
function uniqueStrings(value,fallback=[]){
  return [...new Set(asArray(value,fallback).filter(x=>typeof x==="string"))];
}
function safePlainObject(value,fallback={}){
  return asObject(value,fallback);
}

function normalize(save){
  const d=baseState();
  save.meta=safePlainObject(save.meta,{});
  save.player=safePlainObject(save.player,{});
  save.world=safePlainObject(save.world,{});
  save.missions=safePlainObject(save.missions,{});
  save.communications=safePlainObject(save.communications,{});
  save.learning=safePlainObject(save.learning,{});
  save.helpDesk=safePlainObject(save.helpDesk,{});
  save.intrusion=safePlainObject(save.intrusion,{});
  save.nightwire=safePlainObject(save.nightwire,{});
  save.behavior=safePlainObject(save.behavior,{});
  save.nexusSystem=safePlainObject(save.nexusSystem,{});
  save.terminal=safePlainObject(save.terminal,{});
  save.ui=safePlainObject(save.ui,{});

  save.meta.identityId=asString(save.meta.identityId,d.meta.identityId)||d.meta.identityId;
  save.meta.createdAt=asNumber(save.meta.createdAt,d.meta.createdAt,{min:0});
  save.meta.updatedAt=asNumber(save.meta.updatedAt,d.meta.updatedAt,{min:0});
  save.meta.saveVersion=SAVE_VERSION;
  save.meta.worldSchema=WORLD_SCHEMA;

  save.player.alias=asString(save.player.alias,d.player.alias).slice(0,64);
  save.player.credits=asNumber(save.player.credits,d.player.credits,{min:0});
  save.player.reputation=asNumber(save.player.reputation,d.player.reputation,{min:0});
  save.player.inventory=asArray(save.player.inventory,[]);
  save.player.installedHardware=uniqueStrings(save.player.installedHardware,d.player.installedHardware);
  if(!save.player.installedHardware.includes("base_pc"))save.player.installedHardware.unshift("base_pc");
  save.player.discoveredClues=uniqueStrings(save.player.discoveredClues,[]);
  save.player.discoveredHosts=uniqueStrings(save.player.discoveredHosts,[]);
  save.player.seenHosts=uniqueStrings(save.player.seenHosts,[...save.player.discoveredHosts]);
  save.player.identifiedHosts=uniqueStrings(save.player.identifiedHosts,["home"]);
  if(!save.player.identifiedHosts.includes("home"))save.player.identifiedHosts.unshift("home");
  save.player.savedTargets=asArray(save.player.savedTargets,[]).filter(isObject).map(entry=>({
    ...entry,
    hostId:asString(entry.hostId,""),
    source:asString(entry.source,"manual"),
    missionId:entry.missionId==null?null:asString(entry.missionId,""),
    savedAt:asNumber(entry.savedAt,Date.now(),{min:0})
  })).filter(entry=>entry.hostId);
  const rel=safePlainObject(save.player.relationships,{});
  save.player.relationships={
    maya:asNumber(rel.maya,d.player.relationships.maya),
    sam:asNumber(rel.sam,d.player.relationships.sam),
    zero:asNumber(rel.zero,d.player.relationships.zero)
  };
  const prof=safePlainObject(save.player.proficiencies,{});
  save.player.proficiencies={
    systems:asNumber(prof.systems,0,{min:0}),
    network:asNumber(prof.network,0,{min:0}),
    analysis:asNumber(prof.analysis,0,{min:0}),
    social:asNumber(prof.social,0,{min:0})
  };
  save.player.learnedActions=uniqueStrings(save.player.learnedActions,[]);
  save.player.downloads=uniqueStrings(save.player.downloads,[]);
  save.player.installedSoftware=uniqueStrings(save.player.installedSoftware,d.player.installedSoftware);
  if(!save.player.installedSoftware.includes("resolver_basic"))save.player.installedSoftware.unshift("resolver_basic");
  save.player.notes=asString(save.player.notes,"");

  save.world.minute=asNumber(save.world.minute,d.world.minute,{integer:true,min:0,max:1439});
  save.world.day=asNumber(save.world.day,d.world.day,{integer:true,min:1});
  for(const key of ["flags","readEmails","readForumPosts","readSocialPosts","readNewsStories","readMessages","readThreats","completedLabs","completedMissions","deliveredEvents","countedActions"]){
    save.world[key]=uniqueStrings(save.world[key],[]);
  }
  save.world.notifications=asArray(save.world.notifications,[]).filter(isObject);
  save.world.actionTick=asNumber(save.world.actionTick,0,{integer:true,min:0});
  save.world.networkEpoch=asNumber(save.world.networkEpoch,Math.floor(save.world.actionTick/5),{integer:true,min:0});
  save.world.scanCounters=safePlainObject(save.world.scanCounters,{});
  save.world.eventEligibleAt=safePlainObject(save.world.eventEligibleAt,{});
  save.world.caseHistory=asArray(save.world.caseHistory,[]).filter(isObject);
  save.world.lastActionKey=save.world.lastActionKey==null?undefined:asString(save.world.lastActionKey,"");
  const timeline=safePlainObject(save.world.timeline,{});
  const validTimelineModes=new Set(["afterActions","afterMinutes","timeWindow","afterEvent","absolute"]);
  const scheduled={};
  for(const [contentId,raw] of Object.entries(safePlainObject(timeline.scheduled,{}))){
    if(typeof contentId!=="string"||!contentId||!isObject(raw))continue;
    const mode=validTimelineModes.has(raw.mode)?raw.mode:"afterMinutes";
    const entry={
      mode,
      eligibleAt:asNumber(raw.eligibleAt,0,{integer:true,min:0})
    };
    if(mode==="afterActions"){
      entry.eligibleActionTick=asNumber(raw.eligibleActionTick,0,{integer:true,min:0});
      entry.dueActionTick=asNumber(raw.dueActionTick,entry.eligibleActionTick,{integer:true,min:0});
    }else{
      entry.at=asNumber(raw.at,entry.eligibleAt,{integer:true,min:0});
    }
    if(raw.anchorId!==undefined)entry.anchorId=asString(raw.anchorId,"").slice(0,128);
    if(raw.expiresAt!==undefined)entry.expiresAt=asNumber(raw.expiresAt,entry.eligibleAt,{integer:true,min:0});
    scheduled[contentId]=entry;
  }
  const deliveryTimes={};
  for(const [contentId,raw] of Object.entries(safePlainObject(timeline.deliveryTimes,{}))){
    if(typeof contentId!=="string"||!contentId)continue;
    if(isObject(raw)){
      const absolute=asNumber(raw.absolute,0,{integer:true,min:0});
      deliveryTimes[contentId]={
        day:asNumber(raw.day,Math.floor(absolute/1440)+1,{integer:true,min:1}),
        minute:asNumber(raw.minute,absolute%1440,{integer:true,min:0,max:1439}),
        absolute
      };
    }else{
      const absolute=asNumber(raw,NaN,{integer:true,min:0});
      if(Number.isFinite(absolute))deliveryTimes[contentId]={day:Math.floor(absolute/1440)+1,minute:absolute%1440,absolute};
    }
  }
  save.world.timeline={
    scheduled,
    delivered:uniqueStrings(timeline.delivered,[]),
    deliveryTimes,
    cancelled:uniqueStrings(timeline.cancelled,[]),
    expired:uniqueStrings(timeline.expired,[]),
    cooldowns:safePlainObject(timeline.cooldowns,{}),
    occurrenceCounters:safePlainObject(timeline.occurrenceCounters,{})
  };

  save.missions.active=uniqueStrings(save.missions.active,[]);
  save.missions.progress=safePlainObject(save.missions.progress,{});
  save.communications.choicesMade=uniqueStrings(save.communications.choicesMade,[]);
  const choiceTimes={};
  for(const [choiceId,raw] of Object.entries(safePlainObject(save.communications.choiceTimes,{}))){
    if(typeof choiceId!=="string"||!choiceId)continue;
    const absolute=asNumber(raw,NaN,{integer:true,min:0});
    if(Number.isFinite(absolute))choiceTimes[choiceId]=absolute;
  }
  save.communications.choiceTimes=choiceTimes;
  const rawThreads=safePlainObject(save.communications.threads,{}),threads={};
  for(const [threadId,raw] of Object.entries(rawThreads)){
    if(typeof threadId!=="string"||!threadId||!isObject(raw))continue;
    const nullableString=value=>value==null?null:asString(value,"").slice(0,128)||null;
    const nullableAbsolute=value=>value==null?null:asNumber(value,0,{integer:true,min:0});
    threads[threadId]={
      lastDeliveredNode:nullableString(raw.lastDeliveredNode),
      lastDeliveryAt:nullableAbsolute(raw.lastDeliveryAt),
      lastPresentedNode:nullableString(raw.lastPresentedNode),
      lastPresentedAt:nullableAbsolute(raw.lastPresentedAt),
      waitingForReply:nullableString(raw.waitingForReply),
      lastChoiceId:nullableString(raw.lastChoiceId),
      lastChoiceAt:nullableAbsolute(raw.lastChoiceAt),
      cooldownUntil:nullableAbsolute(raw.cooldownUntil)
    };
  }
  save.communications.threads=threads;

  save.learning.questionAttempts=safePlainObject(save.learning.questionAttempts,{});
  save.learning.topicStats=safePlainObject(save.learning.topicStats,{});
  save.learning.reviewQueue=uniqueStrings(save.learning.reviewQueue,[]);

  save.helpDesk.availableTickets=uniqueStrings(save.helpDesk.availableTickets,[]);
  save.helpDesk.activeTickets=uniqueStrings(save.helpDesk.activeTickets,[]);
  save.helpDesk.completedTickets=uniqueStrings(save.helpDesk.completedTickets,[]);
  save.helpDesk.ticketProgress=safePlainObject(save.helpDesk.ticketProgress,{});
  save.helpDesk.machines=safePlainObject(save.helpDesk.machines,{});
  save.helpDesk.remoteSession=isObject(save.helpDesk.remoteSession)?save.helpDesk.remoteSession:null;
  const helpJob=safePlainObject(save.helpDesk.job,{});
  save.helpDesk.job={
    level:asNumber(helpJob.level,1,{integer:true,min:1,max:99}),
    resolved:asNumber(helpJob.resolved,0,{integer:true,min:0}),
    escalated:asNumber(helpJob.escalated,0,{integer:true,min:0}),
    score:asNumber(helpJob.score,0,{integer:true,min:0})
  };


  const rawIntrusion=safePlainObject(save.intrusion,{});
  const credentials=asArray(rawIntrusion.credentials,[]).filter(isObject).slice(-100).map((item,index)=>({
    id:asString(item.id,`cred-${index}`).slice(0,160),
    username:asString(item.username,"unknown").slice(0,128),
    secret:asString(item.secret,"").slice(0,256),
    source:asString(item.source,"unknown").slice(0,256),
    scope:safePlainObject(item.scope,{}),
    status:asString(item.status,"known").slice(0,64),
    discoveredAt:asNumber(item.discoveredAt,0,{integer:true,min:0}),
    tested:asArray(item.tested,[]).filter(isObject).slice(-30)
  }));
  const sessions={};
  for(const [key,item] of Object.entries(safePlainObject(rawIntrusion.sessions,{}))){
    if(typeof key!=="string"||!key||!isObject(item))continue;
    sessions[key]={
      id:asString(item.id,`session-${key}`).slice(0,192),
      hostId:asString(item.hostId,"").slice(0,128),
      universe:asString(item.universe,"campaign").slice(0,64),
      user:asString(item.user,"guest").slice(0,128),
      privilege:["guest","user","service","admin","root"].includes(item.privilege)?item.privilege:"guest",
      service:asString(item.service,"simulated").slice(0,128),
      source:asString(item.source,"unknown").slice(0,256),
      establishedAt:asNumber(item.establishedAt,0,{integer:true,min:0}),
      status:item.status==="closed"?"closed":"established"
    };
  }
  const serviceIntel={};
  for(const [key,value] of Object.entries(safePlainObject(rawIntrusion.serviceIntel,{}))){
    if(typeof key!=="string"||!key||!isObject(value))continue;
    serviceIntel[key]=safePlainObject(value,{});
  }
  const noise={};
  for(const [key,item] of Object.entries(safePlainObject(rawIntrusion.noise,{}))){
    if(typeof key!=="string"||!key||!isObject(item))continue;
    noise[key]={value:asNumber(item.value,0,{integer:true,min:0}),threshold:asNumber(item.threshold,5,{integer:true,min:1,max:99}),alerted:asBoolean(item.alerted,false),lastAt:item.lastAt==null?null:asNumber(item.lastAt,0,{integer:true,min:0})};
  }
  save.intrusion={
    credentials,
    sessions,
    serviceIntel,
    artifacts:asArray(rawIntrusion.artifacts,[]).filter(isObject).slice(-100),
    noise,
    attempts:asArray(rawIntrusion.attempts,[]).filter(isObject).slice(-100),
    activeSandbox:isObject(rawIntrusion.activeSandbox)?rawIntrusion.activeSandbox:null
  };

  const rawNightwire=safePlainObject(save.nightwire,{}),rawRange=safePlainObject(rawNightwire.range,{});
  const runs={};
  for(const [key,item] of Object.entries(safePlainObject(rawRange.runs,{}))){
    if(typeof key!=="string"||!key||!isObject(item))continue;
    runs[key]={attempt:asNumber(item.attempt,0,{integer:true,min:0}),startedAt:item.startedAt==null?null:asNumber(item.startedAt,0,{integer:true,min:0}),hintsUsed:asNumber(item.hintsUsed,0,{integer:true,min:0,max:99}),completedThisRun:asBoolean(item.completedThisRun,false),completedAt:item.completedAt==null?null:asNumber(item.completedAt,0,{integer:true,min:0})};
  }
  save.nightwire={
    readPosts:uniqueStrings(rawNightwire.readPosts,[]).slice(-200),
    readMessages:uniqueStrings(rawNightwire.readMessages,[]).slice(-100),
    range:{activeLabId:rawRange.activeLabId==null?null:asString(rawRange.activeLabId,"").slice(0,64)||null,completed:uniqueStrings(rawRange.completed,[]).slice(-100),runs,results:safePlainObject(rawRange.results,{})}
  };

  for(const key of ["autonomy","empathy","intervention","transparency","trust"])save.behavior[key]=asNumber(save.behavior[key],0);
  save.behavior.decisions=asArray(save.behavior.decisions,[]).filter(isObject);

  const nexus=safePlainObject(save.nexusSystem,{}),nd=d.nexusSystem;
  const network=safePlainObject(nexus.network,{});
  save.nexusSystem.network={
    adapterEnabled:asBoolean(network.adapterEnabled,nd.network.adapterEnabled),
    dhcp:asBoolean(network.dhcp,nd.network.dhcp),
    ip:asString(network.ip,nd.network.ip).slice(0,64)||nd.network.ip,
    subnet:asString(network.subnet,nd.network.subnet).slice(0,64)||nd.network.subnet,
    gateway:asString(network.gateway,nd.network.gateway).slice(0,64)||nd.network.gateway,
    dns:uniqueStrings(network.dns,nd.network.dns).slice(0,4),
    leaseRenewals:asNumber(network.leaseRenewals,0,{integer:true,min:0}),
    lastRepairAt:network.lastRepairAt==null?null:asNumber(network.lastRepairAt,0,{integer:true,min:0})
  };
  if(!save.nexusSystem.network.dns.length)save.nexusSystem.network.dns=[...nd.network.dns];
  const firewall=safePlainObject(nexus.firewall,{}),rules=safePlainObject(firewall.rules,{});
  save.nexusSystem.firewall={
    enabled:asBoolean(firewall.enabled,nd.firewall.enabled),
    profile:["Home","Work","Public"].includes(firewall.profile)?firewall.profile:nd.firewall.profile,
    rules:{
      fileSharing:asBoolean(rules.fileSharing,nd.firewall.rules.fileSharing),
      remoteAssistance:asBoolean(rules.remoteAssistance,nd.firewall.rules.remoteAssistance),
      webBrowser:asBoolean(rules.webBrowser,nd.firewall.rules.webBrowser),
      messenger:asBoolean(rules.messenger,nd.firewall.rules.messenger)
    }
  };
  const services=safePlainObject(nexus.services,{}),validService=new Set(["running","stopped"]);
  save.nexusSystem.services={};
  for(const [name,initial] of Object.entries(nd.services)){const value=asString(services[name],initial);save.nexusSystem.services[name]=validService.has(value)?value:initial;}
  const devices=safePlainObject(nexus.devices,{}),validDevice=new Set(["enabled","disabled"]);
  save.nexusSystem.devices={};
  for(const [name,initial] of Object.entries(nd.devices)){const value=asString(devices[name],initial);save.nexusSystem.devices[name]=validDevice.has(value)?value:initial;}
  save.nexusSystem.eventLog=asArray(nexus.eventLog,nd.eventLog).filter(isObject).slice(-100).map((entry,index)=>({
    id:asString(entry.id,`event-${index}`),
    level:["Information","Warning","Error"].includes(entry.level)?entry.level:"Information",
    source:asString(entry.source,"System").slice(0,64),
    eventId:asNumber(entry.eventId,0,{integer:true,min:0,max:99999}),
    message:asString(entry.message,"System event").slice(0,500)
  }));

  save.terminal.hostId=asString(save.terminal.hostId,d.terminal.hostId)||d.terminal.hostId;
  save.terminal.user=asString(save.terminal.user,d.terminal.user)||d.terminal.user;
  save.terminal.cwd=asString(save.terminal.cwd,d.terminal.cwd)||d.terminal.cwd;
  save.terminal.history=asArray(save.terminal.history,[]).filter(x=>typeof x==="string").slice(-100);
  save.terminal.historyIndex=asNumber(save.terminal.historyIndex,save.terminal.history.length,{integer:true,min:0,max:save.terminal.history.length});
  save.terminal.trace=asNumber(save.terminal.trace,0,{min:0,max:100});
  save.terminal.sessionCount=asNumber(save.terminal.sessionCount,0,{integer:true,min:0});
  save.terminal.sessionOpen=asBoolean(save.terminal.sessionOpen,false);
  save.terminal.suspended=asBoolean(save.terminal.suspended,false);
  save.terminal.pendingAction=save.terminal.pendingAction??null;
  save.terminal.lastScanResults=uniqueStrings(save.terminal.lastScanResults,[]);
  save.terminal.accessSessionId=save.terminal.accessSessionId==null?null:asString(save.terminal.accessSessionId,"").slice(0,192)||null;
  const serviceSession=safePlainObject(save.terminal.serviceSession,{});
  save.terminal.serviceSession=serviceSession.type==="nightwire"?{type:"nightwire",section:asString(serviceSession.section,"home").slice(0,32)||"home"}:null;

  save.ui.openApps=uniqueStrings(save.ui.openApps,[]);
  save.ui.lastBrowserSite=asString(save.ui.lastBrowserSite,d.ui.lastBrowserSite)||d.ui.lastBrowserSite;
  const terminalInputMode=asString(save.ui.terminalInputMode,d.ui.terminalInputMode);
  save.ui.terminalInputMode=["auto","blackbox","system"].includes(terminalInputMode)?terminalInputMode:"auto";
  const nexusInputMode=asString(save.ui.nexusInputMode,d.ui.nexusInputMode);
  save.ui.nexusInputMode=["auto","nexus","system"].includes(nexusInputMode)?nexusInputMode:"auto";
  return save;
}

export function migrateSave(input){
  if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Invalid save");
  let save=input;
  save.meta=isObject(save.meta)?save.meta:{saveVersion:1,worldSchema:1,createdAt:Date.now(),updatedAt:Date.now()};
  const declaredSave=Number(save.meta.saveVersion||1);
  const declaredWorld=Number(save.meta.worldSchema||1);
  if(!Number.isFinite(declaredSave)||declaredSave<1)throw new Error("Invalid save version");
  if(!Number.isFinite(declaredWorld)||declaredWorld<1)throw new Error("Invalid world schema");
  if(declaredSave>SAVE_VERSION)throw new Error(`Unsupported future save version ${declaredSave}`);
  if(declaredWorld>WORLD_SCHEMA)throw new Error(`Unsupported future world schema ${declaredWorld}`);
  let current=Math.trunc(declaredSave);
  while(current<SAVE_VERSION){
    const next=current+1,fn=migrations[next];
    if(typeof fn!=="function")throw new Error(`Missing save migration ${next}`);
    save=fn(save);
    current=next;
    save.meta.saveVersion=current;
  }
  return normalize(save);
}

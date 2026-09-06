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
  save.behavior=safePlainObject(save.behavior,{});
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
  save.world.timeline={
    scheduled:safePlainObject(timeline.scheduled,{}),
    delivered:uniqueStrings(timeline.delivered,[]),
    deliveryTimes:safePlainObject(timeline.deliveryTimes,{}),
    cancelled:uniqueStrings(timeline.cancelled,[]),
    expired:uniqueStrings(timeline.expired,[]),
    cooldowns:safePlainObject(timeline.cooldowns,{}),
    occurrenceCounters:safePlainObject(timeline.occurrenceCounters,{})
  };

  save.missions.active=uniqueStrings(save.missions.active,[]);
  save.missions.progress=safePlainObject(save.missions.progress,{});
  save.communications.choicesMade=uniqueStrings(save.communications.choicesMade,[]);
  save.communications.threads=safePlainObject(save.communications.threads,{});

  save.learning.questionAttempts=safePlainObject(save.learning.questionAttempts,{});
  save.learning.topicStats=safePlainObject(save.learning.topicStats,{});
  save.learning.reviewQueue=uniqueStrings(save.learning.reviewQueue,[]);

  save.helpDesk.availableTickets=uniqueStrings(save.helpDesk.availableTickets,[]);
  save.helpDesk.activeTickets=uniqueStrings(save.helpDesk.activeTickets,[]);
  save.helpDesk.completedTickets=uniqueStrings(save.helpDesk.completedTickets,[]);
  save.helpDesk.ticketProgress=safePlainObject(save.helpDesk.ticketProgress,{});

  for(const key of ["autonomy","empathy","intervention","transparency","trust"])save.behavior[key]=asNumber(save.behavior[key],0);
  save.behavior.decisions=asArray(save.behavior.decisions,[]).filter(isObject);

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

  save.ui.openApps=uniqueStrings(save.ui.openApps,[]);
  save.ui.lastBrowserSite=asString(save.ui.lastBrowserSite,d.ui.lastBrowserSite)||d.ui.lastBrowserSite;
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

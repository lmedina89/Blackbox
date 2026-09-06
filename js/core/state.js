import { emit } from "./events.js";

export const SAVE_VERSION=13;
export const WORLD_SCHEMA=10;

function id(prefix="id"){
  const value=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  return `${prefix}-${value}`;
}

export const baseState=()=>({
  meta:{saveVersion:SAVE_VERSION,worldSchema:WORLD_SCHEMA,identityId:id("identity"),createdAt:Date.now(),updatedAt:Date.now()},
  player:{
    alias:"",
    credits:0,
    reputation:0,
    inventory:[],
    installedHardware:["base_pc"],
    discoveredClues:[],
    discoveredHosts:[],
    seenHosts:[],
    identifiedHosts:["home"],
    savedTargets:[],
    relationships:{maya:1,sam:0,zero:0},
    proficiencies:{systems:0,network:0,analysis:0,social:0},
    learnedActions:[],
    downloads:[],
    installedSoftware:["resolver_basic"],
    notes:""
  },
  world:{
    minute:18*60+42,
    day:1,
    flags:[],
    readEmails:[],
    readForumPosts:[],
    readSocialPosts:[],
    readNewsStories:[],
    readMessages:[],
    readThreats:[],
    completedLabs:[],
    notifications:[],
    completedMissions:[],
    actionTick:0,
    networkEpoch:0,
    scanCounters:{},
    deliveredEvents:[],
    eventEligibleAt:{},
    countedActions:[],
    caseHistory:[],
    timeline:{scheduled:{},delivered:[],deliveryTimes:{},cancelled:[],expired:[],cooldowns:{},occurrenceCounters:{}}
  },
  missions:{active:[],progress:{}},
  communications:{choicesMade:[],choiceTimes:{},threads:{}},
  learning:{questionAttempts:{},topicStats:{},reviewQueue:[]},
  helpDesk:{availableTickets:[],activeTickets:[],completedTickets:[],ticketProgress:{},machines:{},remoteSession:null,job:{level:1,resolved:0,escalated:0,score:0}},
  behavior:{autonomy:0,empathy:0,intervention:0,transparency:0,trust:0,decisions:[]},
  nexusSystem:{
    network:{adapterEnabled:true,dhcp:true,ip:"192.168.1.24",subnet:"255.255.255.0",gateway:"192.168.1.1",dns:["192.168.1.1"],leaseRenewals:0,lastRepairAt:null},
    firewall:{enabled:true,profile:"Home",rules:{fileSharing:false,remoteAssistance:false,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    eventLog:[
      {id:"boot-system",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"boot-network",level:"Information",source:"Tcpip",eventId:4201,message:"Local Area Connection initialized with DHCP."}
    ]
  },
  terminal:{
    hostId:"home",
    user:"user",
    cwd:"/home",
    history:[],
    historyIndex:0,
    trace:0,
    sessionCount:0,
    sessionOpen:false,
    suspended:false,
    pendingAction:null,
    lastScanResults:[]
  },
  ui:{openApps:[],lastBrowserSite:"news",terminalInputMode:"auto",nexusInputMode:"auto"}
});

let state=baseState();

export function getState(){return state;}
export function resetState(){state=baseState();return state;}
export function replaceState(next){state=next;return state;}
export function hasFlag(flag){return state.world.flags.includes(flag);}
export function setFlag(flag){
  if(hasFlag(flag))return false;
  state.world.flags.push(flag);
  emit("state:flag-set",{flag});
  return true;
}
export function addCredits(amount){state.player.credits=Math.max(0,state.player.credits+amount);}
export function touch(){state.meta.updatedAt=Date.now();}

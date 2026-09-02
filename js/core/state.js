export const SAVE_VERSION=3;
export const WORLD_SCHEMA=3;

const baseState=()=>({
  meta:{saveVersion:SAVE_VERSION,worldSchema:WORLD_SCHEMA,createdAt:Date.now(),updatedAt:Date.now()},
  player:{
    alias:"",credits:0,reputation:0,inventory:[],installedHardware:["base_pc"],
    discoveredClues:[],discoveredHosts:[],notes:"",relationships:{maya:0,zero:0}
  },
  world:{
    minute:18*60+42,day:1,flags:[],readEmails:[],readForumPosts:[],readSocialPosts:[],
    chatChoices:{},notifications:[],completedMissions:[]
  },
  missions:{active:[],progress:{}},
  terminal:{hostId:"home",user:"user",cwd:"/home",history:[],historyIndex:0,trace:0,sessionCount:0},
  ui:{openApps:[],lastBrowserSite:"news"}
});
let state=baseState();
export function getState(){return state;}
export function resetState(){state=baseState();return state;}
export function replaceState(next){state=next;return state;}
export function hasFlag(flag){return state.world.flags.includes(flag);}
export function setFlag(flag){if(!hasFlag(flag))state.world.flags.push(flag);}
export function addCredits(amount){state.player.credits=Math.max(0,state.player.credits+amount);}
export function touch(){state.meta.updatedAt=Date.now();}

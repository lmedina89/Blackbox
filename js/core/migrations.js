import { SAVE_VERSION, WORLD_SCHEMA } from "./state.js";

const migrations={
  2(save){
    save.player.notes ??= "";
    save.world.readSocialPosts ??= [];
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
  }
};

function normalize(save){
  save.player ??= {};
  save.world ??= {};
  save.missions ??= {active:[],progress:{}};
  save.communications ??= {};
  save.communications.choicesMade ??= [];
  save.player.relationships ??= {maya:1,sam:0,zero:0};
  save.player.discoveredClues ??= [];
  save.player.discoveredHosts ??= [];
  save.player.identifiedHosts ??= ["home"];
  if(!save.player.identifiedHosts.includes("home"))save.player.identifiedHosts.unshift("home");
  save.player.proficiencies ??= {systems:0,network:0,analysis:0,social:0};
  save.player.learnedActions ??= [];
  save.player.downloads ??= [];
  save.world.flags ??= [];
  save.world.readEmails ??= [];
  save.world.readForumPosts ??= [];
  save.world.readSocialPosts ??= [];
  save.world.notifications ??= [];
  save.world.completedMissions ??= [];
  save.missions.active ??= [];
  save.missions.progress ??= {};
  save.ui ??= {openApps:[],lastBrowserSite:"news"};
  save.ui.openApps ??= [];
  save.ui.lastBrowserSite ??= "news";
  save.terminal ??= {};
  save.terminal.hostId ??= "home";
  save.terminal.cwd ??= "/home";
  save.terminal.history ??= [];
  save.terminal.historyIndex ??= save.terminal.history.length;
  save.terminal.trace ??= 0;
  save.terminal.sessionCount ??= 0;
  save.terminal.sessionOpen ??= false;
  save.terminal.suspended ??= false;
  save.terminal.pendingAction ??= null;
  return save;
}

export function migrateSave(save){
  if(!save||typeof save!=="object")throw new Error("Invalid save");
  save.meta ??= {saveVersion:1,worldSchema:1,createdAt:Date.now(),updatedAt:Date.now()};
  let current=Number(save.meta.saveVersion||1);
  while(current<SAVE_VERSION){
    const next=current+1,fn=migrations[next];
    if(typeof fn!=="function")throw new Error(`Missing save migration ${next}`);
    save=fn(save);
    current=next;
    save.meta.saveVersion=current;
  }
  save.meta.worldSchema=WORLD_SCHEMA;
  return normalize(save);
}

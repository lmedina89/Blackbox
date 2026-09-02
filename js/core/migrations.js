import { SAVE_VERSION, WORLD_SCHEMA } from "./state.js";

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
    // Existing progress is canonical. Mark its historical milestones without
    // replaying mail, messages, rewards, or completed investigations.
    for(const id of save.world.completedMissions||[]){
      if(!save.world.caseHistory.some(x=>x.id===`mission:${id}`)){
        save.world.caseHistory.push({id:`mission:${id}`,kind:"mission",refId:id,day:save.world.day||1,minute:save.world.minute||0,historical:true});
      }
    }
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
  save.player.seenHosts ??= [...save.player.discoveredHosts];
  save.player.savedTargets ??= [];
  save.player.identifiedHosts ??= ["home"];
  if(!save.player.identifiedHosts.includes("home"))save.player.identifiedHosts.unshift("home");
  save.player.proficiencies ??= {systems:0,network:0,analysis:0,social:0};
  save.player.learnedActions ??= [];
  save.player.downloads ??= [];
  save.player.installedSoftware ??= ["resolver_basic"];
  save.world.flags ??= [];
  save.world.readEmails ??= [];
  save.world.readForumPosts ??= [];
  save.world.readSocialPosts ??= [];
  save.world.readNewsStories ??= [];
  save.world.readMessages ??= [];
  save.world.readThreats ??= [];
  save.world.completedLabs ??= [];
  save.world.notifications ??= [];
  save.world.completedMissions ??= [];
  save.world.actionTick ??= 0;
  save.world.networkEpoch ??= Math.floor(save.world.actionTick/5);
  save.world.scanCounters ??= {};
  save.world.deliveredEvents ??= [];
  save.world.eventEligibleAt ??= {};
  save.world.countedActions ??= [];
  save.world.caseHistory ??= [];
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
  save.terminal.lastScanResults ??= [];
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

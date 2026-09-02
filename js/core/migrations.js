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
    save.player.relationships ??= {maya:0,zero:0};
    save.world.chatChoices ??= {};
    return save;
  }
};

export function migrateSave(save){
  if(!save||typeof save!=="object")throw new Error("Invalid save");
  save.meta ??= {saveVersion:1,worldSchema:1,createdAt:Date.now(),updatedAt:Date.now()};
  let current=Number(save.meta.saveVersion||1);
  while(current<SAVE_VERSION){
    const next=current+1,fn=migrations[next];
    if(typeof fn!=="function")throw new Error(`Missing save migration ${next}`);
    save=fn(save);current=next;save.meta.saveVersion=current;
  }
  save.meta.worldSchema=WORLD_SCHEMA;
  return save;
}

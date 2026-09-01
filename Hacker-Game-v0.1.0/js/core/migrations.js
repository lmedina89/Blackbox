import { SAVE_VERSION, WORLD_SCHEMA } from "./state.js";

const migrations = {};

export function migrateSave(save){
  if(!save || typeof save!=="object") throw new Error("Invalid save");
  let current=Number(save?.meta?.saveVersion||1);
  while(current<SAVE_VERSION){
    const migrate=migrations[current+1];
    if(typeof migrate!=="function") throw new Error(`Missing save migration ${current+1}`);
    save=migrate(save);
    current++;
    save.meta.saveVersion=current;
  }
  save.meta.worldSchema=WORLD_SCHEMA;
  return save;
}

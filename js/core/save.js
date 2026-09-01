import { getState, replaceState, touch } from "./state.js";
import { migrateSave } from "./migrations.js";

const KEY="blackbox_firstboot_save";

export function saveGame(){
  touch();
  localStorage.setItem(KEY,JSON.stringify(getState()));
}

export function loadGame(){
  const raw=localStorage.getItem(KEY);
  if(!raw) return false;
  try{
    replaceState(migrateSave(JSON.parse(raw)));
    return true;
  }catch(err){
    console.error("Save load failed",err);
    return false;
  }
}

export function hasSave(){ return !!localStorage.getItem(KEY); }
export function clearSave(){ localStorage.removeItem(KEY); }

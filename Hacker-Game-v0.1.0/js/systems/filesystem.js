import { FILESYSTEMS } from "../data/filesystems.js";
import { HOSTS } from "../data/hosts.js";

function parts(path){ return path.split("/").filter(Boolean); }

export function normalizePath(cwd,input){
  if(!input || input===".") return cwd;
  const stack=(input.startsWith("/")?[]:parts(cwd));
  for(const piece of parts(input)){
    if(piece==="..") stack.pop();
    else if(piece!==".") stack.push(piece);
  }
  return "/"+stack.join("/");
}

export function getNode(hostId,path){
  const host=HOSTS[hostId];
  if(!host) return null;
  let node=FILESYSTEMS[host.filesystem]?.["/"];
  if(!node) return null;
  for(const p of parts(path)){
    if(node.type!=="dir") return null;
    node=node.children?.[p];
    if(!node) return null;
  }
  return node;
}

export function listDir(hostId,path){
  const node=getNode(hostId,path);
  if(!node || node.type!=="dir") throw new Error("Not a directory");
  return Object.entries(node.children||{}).map(([name,item])=>({name,type:item.type}));
}

export function readFile(hostId,path){
  const node=getNode(hostId,path);
  if(!node) throw new Error("No such file");
  if(node.type!=="file") throw new Error("Is a directory");
  return node.content;
}

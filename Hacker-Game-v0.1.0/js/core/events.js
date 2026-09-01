const listeners = new Map();

export function on(eventName, handler){
  if(!listeners.has(eventName)) listeners.set(eventName,new Set());
  listeners.get(eventName).add(handler);
  return ()=>listeners.get(eventName)?.delete(handler);
}

export function emit(eventName, payload={}){
  const group=listeners.get(eventName);
  if(!group) return;
  for(const handler of [...group]){
    try{ handler(payload); }catch(err){ console.error(`[event:${eventName}]`,err); }
  }
}

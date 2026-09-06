import { getState, hasFlag } from "../core/state.js";

function legacyVisible(item){
  if((item.visibleWhen||[]).some(flag=>!hasFlag(flag)))return false;
  if((item.hiddenWhen||[]).some(flag=>hasFlag(flag)))return false;
  return true;
}

export function contentAvailable(item){
  if(!item)return false;
  const scheduleId=item.scheduleId||item.deliveryId||null;
  if(!scheduleId)return legacyVisible(item);
  const timeline=getState().world.timeline||{};
  if((timeline.cancelled||[]).includes(scheduleId)||(timeline.expired||[]).includes(scheduleId))return false;
  if(!(timeline.delivered||[]).includes(scheduleId))return false;
  return legacyVisible(item);
}

export function contentDelivery(item){
  const scheduleId=item?.scheduleId||item?.deliveryId||null;
  if(!scheduleId)return null;
  return getState().world.timeline?.deliveryTimes?.[scheduleId]||null;
}

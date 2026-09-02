export const WORLD_EVENTS=[
  {id:"threatdesk_online",afterActions:1,when:{flagsAll:["alias_created"]},setFlags:["threatdesk_online"],notice:"NEXUS ThreatDesk intelligence feed is now available."},
  {id:"wider_net_invite",afterActions:2,when:{flagsAll:["mission_relay_complete"]},setFlags:["lumen_contract_available"],notice:"New contract received: False Name."},
  {id:"lumen_public_response",afterActions:2,when:{flagsAll:["mission_dns_complete"]},setFlags:["lumen_world_updated"],notice:"ThreatDesk published a follow-up on the Lumen incident."},
  {id:"iris_contract",afterActions:3,when:{flagsAll:["mission_dns_complete"]},setFlags:["iris_contract_available"],notice:"New contract received: Quiet Hours."},
  {id:"iris_public_response",afterActions:2,when:{flagsAll:["mission_beacon_complete"]},setFlags:["iris_world_updated"],notice:"MetroWire updated the overnight Iris outage story."},
  {id:"harbor_contract",afterActions:3,when:{flagsAll:["mission_beacon_complete"]},setFlags:["harbor_contract_available"],notice:"New contract received: Glass Harbor."},
  {id:"harbor_public_response",afterActions:2,when:{flagsAll:["mission_cascade_complete"]},setFlags:["harbor_world_updated"],notice:"A Harbor Mutual incident review is now available."},
  {id:"cedar_lead",afterActions:3,when:{flagsAll:["threatdesk_online"]},setFlags:["cedar_lead_available"],notice:"A new FriendSpace post mentions an intermittent home server."},
  {id:"juno_advisory",afterActions:5,when:{flagsAll:["threatdesk_online"]},setFlags:["juno_advisory_available"],notice:"ThreatDesk added a public archive advisory."},
  {id:"quartz_thread",afterActions:7,when:{flagsAll:["threatdesk_online"]},setFlags:["quartz_thread_available"],notice:"NightWire has a new thread about an old relay board."},
  {id:"relay_cache_lead",afterActions:2,when:{cluesAll:["relay_cache_host"]},setFlags:["relay_cache_available"],notice:"World intel updated: a cache node was identified."}
];

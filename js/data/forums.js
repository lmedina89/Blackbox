export const FORUM_POSTS = [
  {id:"f1",author:"samk91",title:"Anyone remember the old Northstar training archive?",body:"Found an old mirror reference. Hostname was ARCHIVES-01. Pretty sure it used 10.14.8.22 on the lab network.",visibleWhen:[]},
  {id:"f2",author:"packetmoth",title:"NightWire rules",body:"Don't post real credentials. Don't be stupid. Learn the systems before you touch anything.",visibleWhen:[]},
  {id:"f3",author:"oldnet_admin",title:"ARCHIVES-01 had a guest account",body:"If it's the same image I remember, the training build exposed a guest shell. Mostly harmless documentation and test data.",visibleWhen:["mission_first_started"]},
  {id:"f4",author:"routetable",title:"Meridian support lab still answering",body:"MERIDIAN-01 / 10.30.5.18. Old support image. Recovery indexes used to live under /srv/projects.",visibleWhen:["mission_recovery_started"]},
  {id:"f5",author:"oldnet_admin",title:"Two interfaces means two neighborhoods",body:"Reminder for the new folks: inspect interfaces before assuming a remote box sees the same network you do.",visibleWhen:["mission_route_started"]},
  {id:"f6",author:"packetmoth",title:"Axiom retirement window",body:"AXIOM-RELAY / 10.60.9.14 is still reachable in the simulation lab. Review account only. Preserve configs, don't modify state.",visibleWhen:["mission_deaddrop_started"]},
  {id:"f7",author:"oldnet_admin",title:"Cobalt BBS still answers on the old address",body:"COBALT-BBS / 10.91.6.23. Visitor shell is still up. Not a contract, just a weird little piece of the old net if you want to look around.",visibleWhen:[],clueId:"cobalt_bbs_host"},
  {id:"f8",author:"packetmoth",title:"Reminder: curiosity is not a quest marker",body:"If you find a host on your own, inspect it because you understand what you're looking at—not because you expect a reward screen. Some boxes are boring. That's the point.",visibleWhen:[]}
];

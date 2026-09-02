export const FORUM_POSTS = [
  {
    id:"f1",author:"samk91",title:"Anyone remember the old Northstar training archive?",
    body:"Found an old mirror reference. Hostname was ARCHIVES-01. Pretty sure it used 10.14.8.22 on the lab network.",
    visibleWhen:[],clues:["clue_archives01"]
  },
  {
    id:"f2",author:"packetmoth",title:"NightWire rules",
    body:"Don't post real credentials. Don't be stupid. Learn the systems before you touch anything.",
    visibleWhen:[]
  },
  {
    id:"f3",author:"oldnet_admin",title:"ARCHIVES-01 had a guest account",
    body:"If it's the same image I remember, the training build exposed a guest shell. Mostly harmless documentation and test data.",
    visibleWhen:["mission_first_started"]
  },
  {
    id:"f4",author:"samk91",title:"Found the other Northstar box",
    body:"Follow-up to the archive thread: the old training relay was RELAY-02 at 10.14.8.31. Looks like it was used to mirror training data before shutdown.",
    visibleWhen:["second_lead_accepted"],clues:["clue_relay02"]
  }
];

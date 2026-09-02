export const THREADS = [
  {
    id:"maya",
    npcId:"maya",
    messages:[
      {id:"m1",from:"maya",time:"18:38",text:"yo, you finally got that machine running?",visibleWhen:[]},
      {id:"m2",from:"player",time:"18:39",text:"barely. it sounds like a jet engine.",visibleWhen:[]},
      {id:"m3",from:"maya",time:"18:39",text:"lol. check your email. someone sent you something weird.",visibleWhen:["alias_created"]},
      {id:"m4",from:"maya",time:"19:01",text:"wait... did you actually do it?",visibleWhen:["mission_first_complete"]},
      {
        id:"m5",
        from:"maya",
        time:"19:03",
        text:"Sam says another one of those old Northstar mirror boxes is still online. He wants somebody to check what it's serving.",
        visibleWhen:["mission_first_complete"],
        choice:{
          id:"mirror_offer",
          options:[
            {id:"mirror_send",text:"Send me what he found.",setFlags:["mirror_lead_accepted"],relationship:{maya:1}},
            {id:"mirror_why",text:"What exactly did he find?",setFlags:["mirror_lead_accepted","asked_about_mirror"],relationship:{maya:1}}
          ]
        }
      },
      {id:"m6",from:"player",time:"19:04",text:"Send me what he found.",visibleWhen:["choice_mirror_send"]},
      {id:"m7",from:"player",time:"19:04",text:"What exactly did he find?",visibleWhen:["choice_mirror_why"]},
      {id:"m8",from:"maya",time:"19:05",text:"Check Sam's FriendSpace. He posted the hostname and address before he went offline.",visibleWhen:["mirror_lead_accepted"]},
      {id:"m9",from:"maya",time:"19:18",text:"Sam says the mirror looks normal again. Whatever you found, that helped.",visibleWhen:["mission_mirror_complete"]}
    ]
  }
];

export const THREADS = [
  {
    id:"maya",npcId:"maya",messages:[
      {id:"m1",from:"maya",text:"yo, you finally got that machine running?",visibleWhen:[]},
      {id:"m2",from:"player",text:"barely. it sounds like a jet engine.",visibleWhen:[]},
      {id:"m3",from:"maya",text:"lol. check your email. someone sent you something weird.",visibleWhen:["alias_created"]},
      {id:"m4",from:"maya",text:"wait... did you actually do it?",visibleWhen:["mission_first_complete"]},
      {id:"m5",from:"maya",text:"sam says that archive wasn't the only old Northstar machine. he posted something else on NightWire. want me to send you down that rabbit hole?",visibleWhen:["mission_first_complete"]},
      {id:"m6",from:"maya",text:"lol knew you'd look. Sam put the details in a new NightWire thread.",visibleWhen:["second_lead_accepted"]},
      {id:"m7",from:"maya",text:"so it was just an old relay? honestly that's kind of a relief.",visibleWhen:["mission_second_complete"]}
    ],
    choices:[
      {
        id:"maya_second_lead",afterMessageId:"m5",visibleWhen:["mission_first_complete"],hiddenWhen:["second_lead_accepted"],
        prompt:"Reply to Maya",
        options:[
          {id:"accept_curious",label:"Yeah. What did Sam find?",playerText:"Yeah. What did Sam find?",flags:["second_lead_accepted"],relationship:{maya:1},eventTarget:"maya_second_lead"},
          {id:"accept_direct",label:"Send it. I'll take a look.",playerText:"Send it. I'll take a look.",flags:["second_lead_accepted"],relationship:{maya:0},eventTarget:"maya_second_lead"}
        ]
      }
    ]
  }
];

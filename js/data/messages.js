export const THREADS = [
  {
    id:"maya",
    npcId:"maya",
    messages:[
      { id:"m1", from:"maya", text:"yo, you finally got that machine running?", visibleWhen:[] },
      { id:"m2", from:"player", text:"barely. it sounds like a jet engine.", visibleWhen:[] },
      { id:"m3", from:"maya", text:"lol. check your email. someone sent you something weird.", visibleWhen:["alias_created"] },
      { id:"m4", from:"maya", text:"wait... did you actually do it?", visibleWhen:["mission_first_complete"] }
    ]
  }
];

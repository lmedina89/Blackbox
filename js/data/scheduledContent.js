// v0.4.0 Alpha 3 migrates only a deliberately small set of NON-MISSION-CRITICAL
// ambient content. Contract mail, clue-bearing messages, current mission choices, and
// existing v0.3 world events remain on their proven legacy paths.
export const SCHEDULED_CONTENT=[
  {
    id:"ambient_maya_food_01",kind:"message",threadId:"maya",itemId:"m13",
    when:{flagsAll:["alias_created"],flagsNone:["mission_first_complete"],dayMax:2},
    timing:{mode:"timeWindow",startMinute:18*60+46,endMinute:18*60+58,minLeadMinutes:2},
    cancelWhen:{flagsAll:["mission_first_complete"]}
  },
  {
    id:"ambient_sam_drives_01",kind:"message",threadId:"sam",itemId:"sam6",
    when:{flagsAll:["alias_created"],flagsNone:["quartz_thread_available"],dayMax:2},
    timing:{mode:"timeWindow",startMinute:20*60+10,endMinute:22*60+20,minLeadMinutes:20},
    cancelWhen:{flagsAll:["quartz_thread_available"]}
  },
  {
    id:"ambient_chris_laptop_01",kind:"message",threadId:"chris",itemId:"c5",
    when:{flagsAll:["alias_created"],flagsNone:["cedar_lead_available"],dayMax:2},
    timing:{mode:"timeWindow",startMinute:19*60+25,endMinute:21*60+45,minLeadMinutes:15},
    cancelWhen:{flagsAll:["cedar_lead_available"]}
  },
  {
    id:"ambient_social_byteghost_01",kind:"social",itemId:"s14",
    when:{flagsAll:["alias_created"],dayMax:2},
    timing:{mode:"timeWindow",startMinute:19*60,endMinute:22*60+30,minLeadMinutes:18}
  },
  {
    id:"ambient_news_library_01",kind:"news",itemId:"news13",
    when:{flagsAll:["alias_created"],dayMax:2},
    timing:{mode:"afterMinutes",minMinutes:45,maxMinutes:95}
  }
];

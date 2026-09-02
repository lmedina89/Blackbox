export const MISSIONS = [
  {
    id:"mission_first",title:"Easy Money",
    description:"Recover an archived employee record from a retired Northstar training system.",
    startWhen:{type:"email_read",target:"first_job"},
    objectives:[
      {id:"find_host",type:"forum_read",target:"f1",label:"Find information about the archive host"},
      {id:"connect",type:"host_connected",target:"archives01",label:"In BLACKBOX, run scan, then connect ARCHIVES-01"},
      {id:"read_record",type:"file_read",target:"archives01:/archive/employees.db",label:"Navigate to /archive and read employees.db"}
    ],
    rewards:{credits:250,reputation:5},flagsOnStart:["mission_first_started"],flagsOnComplete:["mission_first_complete"]
  },
  {
    id:"mission_second",title:"Loose Ends",
    description:"Follow Sam's second Northstar lead and determine what the retired relay was doing.",
    startWhen:{type:"chat_choice",target:"maya_second_lead"},
    objectives:[
      {id:"find_relay",type:"forum_read",target:"f4",label:"Read Sam's new NightWire post"},
      {id:"connect_relay",type:"host_connected",target:"relay02",label:"Connect to RELAY-02"},
      {id:"read_relay_log",type:"file_read",target:"relay02:/var/log/relay.log",label:"Inspect the relay shutdown log"}
    ],
    rewards:{credits:100,reputation:3},flagsOnStart:["mission_second_started"],flagsOnComplete:["mission_second_complete"]
  }
];

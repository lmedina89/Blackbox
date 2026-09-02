export const MISSIONS = [
  {
    id:"mission_first",
    title:"Easy Money",
    description:"Recover an archived employee record from a retired Northstar training system.",
    startWhen:{event:"email:read",target:"first_job"},
    objectives:[
      {id:"find_host",type:"forum_read",target:"f1",label:"Find information about the archive host"},
      {id:"connect",type:"host_connected",target:"archives01",label:"In BLACKBOX, run scan, then connect ARCHIVES-01"},
      {id:"read_record",type:"file_read",target:"archives01:/archive/employees.db",label:"Navigate to /archive and read employees.db"}
    ],
    rewards:{credits:250,reputation:5},
    flagsOnStart:["mission_first_started"],
    flagsOnComplete:["mission_first_complete"]
  },
  {
    id:"mission_mirror",
    title:"Old Mirror",
    description:"Sam found a retired Northstar mirror still answering. Figure out what it is serving.",
    startWhen:{event:"dialogue:choice",target:"mirror_send|mirror_why"},
    objectives:[
      {id:"find_mirror",type:"social_read",target:"s5",label:"Check Sam's FriendSpace post"},
      {id:"connect_mirror",type:"host_connected",target:"mirror02",label:"Inspect the discovered mirror host in BLACKBOX"},
      {id:"read_status",type:"file_read",target:"mirror02:/var/www/status.txt",label:"Find what the mirror service is serving"}
    ],
    rewards:{credits:100,reputation:2},
    flagsOnStart:["mission_mirror_started"],
    flagsOnComplete:["mission_mirror_complete"]
  }
];

export const MISSIONS = [
  {
    id:"mission_first",
    title:"Easy Money",
    description:"Recover an archived employee record from a retired Northstar training system.",
    startWhen:{type:"email_read",target:"first_job"},
    objectives:[
      {id:"find_host",type:"forum_read",target:"f1",label:"Find information about the archive host"},
      {id:"connect",type:"host_connected",target:"archives01",label:"In BLACKBOX, run scan, then connect ARCHIVES-01"},
      {id:"read_record",type:"file_read",target:"archives01:/archive/employees.db",label:"Navigate to /archive and read employees.db"}
    ],
    rewards:{credits:250,reputation:5},
    flagsOnStart:["mission_first_started"],
    flagsOnComplete:["mission_first_complete"]
  }
];

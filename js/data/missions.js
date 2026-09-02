export const MISSIONS = [
  {
    id:"mission_first",title:"Easy Money",description:"Recover an archived employee record from a retired Northstar training system.",
    startWhen:{event:"email:read",target:"first_job"},
    objectives:[
      {id:"find_host",type:"forum_read",target:"f1",label:"Find information about the archive host"},
      {id:"connect",type:"host_connected",target:"archives01",label:"Connect to ARCHIVES-01"},
      {id:"read_record",type:"file_read",target:"archives01:/archive/employees.db",label:"Read /archive/employees.db"}
    ],rewards:{credits:250,reputation:5},flagsOnStart:["mission_first_started"],flagsOnComplete:["mission_first_complete"]
  },
  {
    id:"mission_mirror",title:"Old Mirror",description:"Sam found a retired Northstar mirror still answering. Figure out what it is serving.",
    startWhen:{event:"dialogue:choice",target:"mirror_send|mirror_why"},
    objectives:[
      {id:"find_mirror",type:"social_read",target:"s5",label:"Check Sam's FriendSpace post"},
      {id:"connect_mirror",type:"host_connected",target:"mirror02",label:"Connect to MIRROR-02"},
      {id:"read_status",type:"file_read",target:"mirror02:/var/www/status.txt",label:"Determine what the mirror is serving"}
    ],rewards:{credits:100,reputation:2},flagsOnStart:["mission_mirror_started"],flagsOnComplete:["mission_mirror_complete"]
  },
  {
    id:"mission_recovery",title:"Recovery Index",description:"Meridian lost a project folder during cleanup. Locate the recovery record and confirm the recovered data.",
    startWhen:{event:"email:read",target:"meridian_job"},
    objectives:[
      {id:"meridian_lead",type:"forum_read",target:"f4",label:"Find Meridian's support host on NightWire"},
      {id:"meridian_connect",type:"host_connected",target:"meridian01",label:"Connect to MERIDIAN-01"},
      {id:"meridian_find",type:"command_used",target:"find",label:"Use find to locate the Halcyon recovery data"},
      {id:"meridian_read",type:"file_read",target:"meridian01:/srv/projects/recovered/halcyon.txt",label:"Confirm the recovered Halcyon document"}
    ],rewards:{credits:180,reputation:3},flagsOnStart:["mission_recovery_started"],flagsOnComplete:["mission_recovery_complete"]
  },
  {
    id:"mission_ghost",title:"Ghost Account",description:"Helix sees activity from a supposedly retired service account. Trace the internal diagnostics path and identify it in the logs.",
    startWhen:{event:"email:read",target:"helix_job"},
    objectives:[
      {id:"edge_connect",type:"host_connected",target:"helixedge",label:"Connect to HELIX-EDGE"},
      {id:"inspect_interfaces",type:"command_used",target:"ip",label:"Inspect HELIX-EDGE network interfaces with ip"},
      {id:"internal_scan",type:"command_used_at",target:"helixedge:scan",label:"Scan from HELIX-EDGE for the internal diagnostics network"},
      {id:"log_connect",type:"host_connected",target:"helixlog",label:"Connect to HELIX-LOG"},
      {id:"filter_auth",type:"file_searched",target:"helixlog:/var/log/auth.log:svc_old",label:"Use grep to find svc_old activity in auth.log"}
    ],rewards:{credits:260,reputation:4},flagsOnStart:["mission_route_started"],flagsOnComplete:["mission_ghost_complete"]
  },
  {
    id:"mission_deaddrop",title:"Dead Drop",description:"A NightWire contact wants a harmless configuration sample preserved before a lab node is retired.",
    startWhen:{event:"email:read",target:"deaddrop_job"},
    objectives:[
      {id:"drop_lead",type:"forum_read",target:"f6",label:"Read packetmoth's Axiom relay note"},
      {id:"drop_connect",type:"host_connected",target:"axiomrelay",label:"Connect to AXIOM-RELAY"},
      {id:"drop_services",type:"command_used",target:"services",label:"Inspect listening services"},
      {id:"drop_download",type:"file_downloaded",target:"axiomrelay:/etc/relay.conf",label:"Download relay.conf as evidence"}
    ],rewards:{credits:300,reputation:5},flagsOnStart:["mission_deaddrop_started"],flagsOnComplete:["mission_deaddrop_complete"]
  },
  {
    id:"mission_relay",title:"The Relay",description:"Review the Axiom relay's outbound path and identify the unexpected compatibility label.",
    startWhen:{event:"email:read",target:"relay_job"},
    objectives:[
      {id:"relay_connect",type:"host_connected",target:"axiomrelay",label:"Return to AXIOM-RELAY"},
      {id:"relay_netstat",type:"command_used_at",target:"axiomrelay:netstat",label:"Inspect active network connections"},
      {id:"relay_trace",type:"command_used",target:"traceroute",label:"Use traceroute to inspect the relay path"},
      {id:"relay_config",type:"file_read",target:"axiomrelay:/etc/relay.conf",label:"Read the relay configuration"}
    ],rewards:{credits:350,reputation:6},flagsOnStart:["mission_relay_started"],flagsOnComplete:["mission_relay_complete"]
  }
];

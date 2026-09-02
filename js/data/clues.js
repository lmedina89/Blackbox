export const CLUES = [
  {id:"northstar_archive_host",title:"Northstar archive host",summary:"ARCHIVES-01 — 10.14.8.22",hostId:"archives01",discoverOn:{event:"forum:read",target:"f1"}},
  {id:"marcus_carter_record",title:"Marcus Carter",summary:"Inactive Northstar Field Systems employee, record NS-4471.",discoverOn:{event:"file:read",target:"archives01:/archive/employees.db"}},
  {id:"mirror02_host",title:"Sam's mirror node",summary:"MIRROR-02 — 10.14.8.31",hostId:"mirror02",discoverOn:{event:"social:read",target:"s5"}},
  {id:"mirror02_status",title:"Mirror service state",summary:"MIRROR-02 served an old Northstar image despite being marked retired.",discoverOn:{event:"file:read",target:"mirror02:/var/www/status.txt"}},
  {id:"meridian_host",title:"Meridian support host",summary:"MERIDIAN-01 — 10.30.5.18",hostId:"meridian01",discoverOn:{event:"forum:read",target:"f4"}},
  {id:"halcyon_recovered",title:"Project Halcyon",summary:"Meridian recovery data confirms the Halcyon document set survived.",discoverOn:{event:"file:read",target:"meridian01:/srv/projects/recovered/halcyon.txt"}},
  {id:"helix_edge",title:"Helix edge host",summary:"HELIX-EDGE — 10.44.2.10. Diagnostics entry point.",hostId:"helixedge",discoverOn:{event:"email:read",target:"helix_job"}},
  {id:"helix_log",title:"Helix internal log node",summary:"HELIX-LOG — 172.20.4.18, reachable from HELIX-EDGE.",hostId:"helixlog",discoverOn:{event:"host:connected",target:"helixlog"}},
  {id:"axiom_relay",title:"Axiom relay",summary:"AXIOM-RELAY — 10.60.9.14",hostId:"axiomrelay",discoverOn:{event:"forum:read",target:"f6"}},
  {id:"orbit_label",title:"ORBIT compatibility label",summary:"Axiom relay.conf references ORBIT-COMPAT and BBX-NODE-04.",discoverOn:{event:"file:read",target:"axiomrelay:/etc/relay.conf"}}
];

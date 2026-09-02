export const CLUES = [
  {
    id:"northstar_archive_host",
    title:"Northstar archive host",
    summary:"ARCHIVES-01 — 10.14.8.22",
    hostId:"archives01",
    discoverOn:{event:"forum:read",target:"f1"}
  },
  {
    id:"marcus_carter_record",
    title:"Marcus Carter",
    summary:"Inactive Northstar Field Systems employee, record NS-4471.",
    discoverOn:{event:"file:read",target:"archives01:/archive/employees.db"}
  },
  {
    id:"mirror02_host",
    title:"Sam's mirror node",
    summary:"MIRROR-02 — 10.14.8.31",
    hostId:"mirror02",
    discoverOn:{event:"social:read",target:"s5"}
  },
  {
    id:"mirror02_status",
    title:"Mirror service state",
    summary:"MIRROR-02 is serving an old Northstar mirror image despite being marked retired.",
    discoverOn:{event:"file:read",target:"mirror02:/var/www/status.txt"}
  }
];

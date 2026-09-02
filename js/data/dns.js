export const DNS_RECORDS=[
  {name:"archives.northstar.test",type:"A",value:"10.14.8.22",ttl:600,hostId:"archives01"},
  {name:"mirror.northstar.test",type:"A",value:"10.14.8.31",ttl:600,hostId:"mirror02"},
  {name:"vanta-support.test",type:"A",value:"10.72.4.20",ttl:300,hostId:"vantaedge"},
  {name:"updates.lumen.test",type:"CNAME",value:"staging-cache.lumen.test",ttl:300,visibleWhen:["lumen_contract_available"]},
  {name:"staging-cache.lumen.test",type:"A",value:"10.84.2.20",ttl:300,hostId:"lumenedge",visibleWhen:["lumen_contract_available"]},
  {name:"ns1.lumen.test",type:"A",value:"10.84.2.53",ttl:900,hostId:"lumendns",visibleWhen:["lumen_contract_available"]},
  {name:"lumen.test",type:"MX",value:"10 mail.lumen.test",ttl:600,hostId:"lumenmail",visibleWhen:["lumen_contract_available"]},
  {name:"mail.lumen.test",type:"A",value:"10.84.2.25",ttl:600,hostId:"lumenmail",visibleWhen:["lumen_contract_available"]},
  {name:"status.iris-transit.test",type:"A",value:"10.48.6.12",ttl:180,hostId:"irisgate",visibleWhen:["iris_contract_available"]},
  {name:"ops.iris-transit.test",type:"A",value:"172.26.5.18",ttl:180,hostId:"irisops",visibleWhen:["iris_contract_available"],availableFrom:["irisgate","irisops"]},
  {name:"edge.harbor.test",type:"A",value:"10.66.4.16",ttl:300,hostId:"harboredge",visibleWhen:["harbor_contract_available"]},
  {name:"ns.harbor-int.test",type:"A",value:"172.29.14.53",ttl:600,hostId:"harborresolver",visibleWhen:["harbor_contract_available"],availableFrom:["harboredge","harborresolver"]},
  {name:"claims.harbor.test",type:"CNAME",value:"vault-int.harbor.test",ttl:300,visibleWhen:["harbor_contract_available"],availableFrom:["harborresolver"]},
  {name:"vault-int.harbor.test",type:"A",value:"172.29.22.40",ttl:300,hostId:"harborvault",revealFlag:"harbor_vault_revealed",visibleWhen:["harbor_contract_available"],availableFrom:["harborresolver"]},
  {name:"juno-open.test",type:"A",value:"10.57.8.33",ttl:900,hostId:"junoarchive"},
  {name:"quartz-board.test",type:"A",value:"10.73.9.19",ttl:420,hostId:"quartzbbs"}
];

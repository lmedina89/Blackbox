export const HOSTS = {
  home:{
    id:"home",hostname:"HOME-PC",address:"192.168.1.12",owner:"Player",os:"NEXUS/OS 4.2",filesystem:"home",users:["player"],homeDir:"/home",
    interfaces:[{name:"eth0",address:"192.168.1.12",cidr:24,gateway:"192.168.1.1"}],
    routes:["homegw","familypc","printer01","web03","mail02","archives01","mirror02","meridian01","helixedge","axiomrelay","evanpc","vantaedge","cobaltbbs","orchidnas","lumendns","lumenedge","lumenmail","irisgate","harboredge","relaycache","quartzbbs","junoarchive","cedarnode"],
    services:[{name:"local-shell",port:0,state:"open",pid:118},{name:"messenger",port:5222,state:"open",pid:244}],
    processes:[{pid:1,user:"system",cpu:"0.0",mem:"0.1",name:"init"},{pid:118,user:"player",cpu:"0.1",mem:"1.8",name:"blackboxd"},{pid:244,user:"player",cpu:"0.0",mem:"2.4",name:"messenger"}],
    connections:[{proto:"tcp",local:"192.168.1.12:5222",remote:"10.2.4.18:5222",state:"ESTABLISHED"}]
  },
  homegw:{
    id:"homegw",hostname:"HOME-GW",address:"192.168.1.1",owner:"Local Network",os:"Gateway Firmware 2.1",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"lan0",address:"192.168.1.1",cidr:24,gateway:null}],routes:[],services:[{name:"dns",port:53,state:"open",pid:0},{name:"http",port:80,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known",visibility:"essential"
  },
  familypc:{
    id:"familypc",hostname:"FAMILY-PC",address:"192.168.1.24",owner:"Local Network",os:"NEXUS/OS Home",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"192.168.1.24",cidr:24,gateway:"192.168.1.1"}],routes:[],services:[{name:"files",port:445,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
  },
  printer01:{
    id:"printer01",hostname:"PRINT-01",address:"192.168.1.37",owner:"Local Network",os:"JetPrint Embedded",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"192.168.1.37",cidr:24,gateway:"192.168.1.1"}],routes:[],services:[{name:"ipp",port:631,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
  },
  web03:{
    id:"web03",hostname:"WEB-03",address:"10.22.7.16",owner:"Regional Hosting",os:"NIX Web Appliance",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"10.22.7.16",cidr:24,gateway:"10.22.7.1"}],routes:[],services:[{name:"http",port:80,state:"open",pid:0},{name:"https",port:443,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
  },
  mail02:{
    id:"mail02",hostname:"MAIL-02",address:"10.18.3.41",owner:"Unknown",os:"Unknown",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"10.18.3.41",cidr:24,gateway:"10.18.3.1"}],routes:[],services:[{name:"smtp",port:25,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"unknown"
  },
  archives01:{
    id:"archives01",hostname:"ARCHIVES-01",address:"10.14.8.22",owner:"Northstar Data Services",os:"NIX Training Server 3.2",filesystem:"archives01",users:["guest"],homeDir:"/home/guest",
    interfaces:[{name:"eth0",address:"10.14.8.22",cidr:24,gateway:"10.14.8.1"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:92},{name:"archive-http",port:8080,state:"open",pid:131}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:92,user:"root",cpu:"0.0",mem:"0.9",name:"sshd"},{pid:131,user:"archive",cpu:"0.1",mem:"3.1",name:"archived"}],
    connections:[{proto:"tcp",local:"10.14.8.22:22",remote:"192.168.1.12:*",state:"LISTEN"}],access:{mode:"guest"}
  },
  mirror02:{
    id:"mirror02",hostname:"MIRROR-02",address:"10.14.8.31",owner:"Northstar Data Services",os:"NIX Mirror Appliance 2.7",filesystem:"mirror02",users:["guest"],homeDir:"/home/guest",
    interfaces:[{name:"eth0",address:"10.14.8.31",cidr:24,gateway:"10.14.8.1"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:77},{name:"http",port:80,state:"open",pid:144}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:77,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:144,user:"mirror",cpu:"0.2",mem:"4.2",name:"httpd"}],
    connections:[{proto:"tcp",local:"10.14.8.31:80",remote:"0.0.0.0:*",state:"LISTEN"},{proto:"tcp",local:"10.14.8.31:22",remote:"192.168.1.12:*",state:"LISTEN"}],access:{mode:"guest"}
  },
  meridian01:{
    id:"meridian01",hostname:"MERIDIAN-01",address:"10.30.5.18",owner:"Meridian Systems",os:"MeriNIX 5.4",filesystem:"meridian01",users:["support"],homeDir:"/home/support",
    interfaces:[{name:"eth0",address:"10.30.5.18",cidr:24,gateway:"10.30.5.1"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:81},{name:"files",port:445,state:"open",pid:155}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:81,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:155,user:"support",cpu:"0.2",mem:"3.4",name:"filesvc"}],
    connections:[{proto:"tcp",local:"10.30.5.18:22",remote:"0.0.0.0:*",state:"LISTEN"}],access:{mode:"support"}
  },
  helixedge:{
    id:"helixedge",hostname:"HELIX-EDGE",address:"10.44.2.10",owner:"Helix Communications",os:"Helix RouterOS 1.9",filesystem:"helixedge",users:["operator"],homeDir:"/home/operator",
    interfaces:[{name:"eth0",address:"10.44.2.10",cidr:24,gateway:"10.44.2.1"},{name:"eth1",address:"172.20.4.7",cidr:24,gateway:null}],routes:["helixgw","helixprint","helixlog","helixunknown"],
    services:[{name:"ssh",port:22,state:"open",pid:61},{name:"route",port:0,state:"open",pid:12}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:12,user:"root",cpu:"0.1",mem:"0.5",name:"routed"},{pid:61,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"}],
    connections:[{proto:"tcp",local:"10.44.2.10:22",remote:"0.0.0.0:*",state:"LISTEN"},{proto:"tcp",local:"172.20.4.7:*",remote:"172.20.4.18:*",state:"ESTABLISHED"}],access:{mode:"operator"}
  },
  helixgw:{
    id:"helixgw",hostname:"HELIX-GW",address:"172.20.4.1",owner:"Helix Communications",os:"Helix RouterOS",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"lan0",address:"172.20.4.1",cidr:24,gateway:null}],routes:[],services:[{name:"route",port:0,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
  },
  helixprint:{
    id:"helixprint",hostname:"PRINT-02",address:"172.20.4.12",owner:"Helix Communications",os:"JetPrint Embedded",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"172.20.4.12",cidr:24,gateway:"172.20.4.1"}],routes:[],services:[{name:"ipp",port:631,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
  },
  helixunknown:{
    id:"helixunknown",hostname:"TELEM-04",address:"172.20.4.33",owner:"Helix Communications",os:"Unknown",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"172.20.4.33",cidr:24,gateway:"172.20.4.1"}],routes:[],services:[{name:"telemetry",port:9100,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"unknown"
  },
  helixlog:{
    id:"helixlog",hostname:"HELIX-LOG",address:"172.20.4.18",owner:"Helix Communications",os:"NIX Log Node 4.8",filesystem:"helixlog",users:["audit"],homeDir:"/home/audit",
    interfaces:[{name:"eth0",address:"172.20.4.18",cidr:24,gateway:"172.20.4.7"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:71},{name:"syslog",port:514,state:"open",pid:98}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:71,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:98,user:"audit",cpu:"0.1",mem:"2.1",name:"syslogd"}],
    connections:[{proto:"udp",local:"172.20.4.18:514",remote:"172.20.4.7:*",state:"OPEN"}],access:{mode:"audit"}
  },
  axiomrelay:{
    id:"axiomrelay",hostname:"AXIOM-RELAY",address:"10.60.9.14",owner:"Axiom Financial",os:"Axiom Gateway 3.1",filesystem:"axiomrelay",users:["review"],homeDir:"/home/review",
    interfaces:[{name:"eth0",address:"10.60.9.14",cidr:24,gateway:"10.60.9.1"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:64},{name:"relay",port:2525,state:"open",pid:170}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:64,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:170,user:"relay",cpu:"0.3",mem:"5.8",name:"relay-service"}],
    connections:[{proto:"tcp",local:"10.60.9.14:2525",remote:"198.51.100.27:443",state:"ESTABLISHED"}],access:{mode:"review"}
  },
  evanpc:{
    id:"evanpc",hostname:"EVAN-BOX",address:"10.33.8.44",owner:"Evan Mercer",os:"NEXUS/OS Server 3.9",filesystem:"evanpc",users:["guest"],homeDir:"/home/guest",
    interfaces:[{name:"eth0",address:"10.33.8.44",cidr:24,gateway:"10.33.8.1"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:67},{name:"files",port:445,state:"open",pid:133}],
    processes:[{pid:1,user:"system",cpu:"0.0",mem:"0.2",name:"init"},{pid:67,user:"system",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:133,user:"evan",cpu:"0.1",mem:"2.6",name:"filesvc"}],
    connections:[{proto:"tcp",local:"10.33.8.44:22",remote:"0.0.0.0:*",state:"LISTEN"}],access:{mode:"guest"},identity:"unknown"
  },
  vantaedge:{
    id:"vantaedge",hostname:"VANTA-WEB",address:"10.72.4.20",owner:"Vanta Dynamics",os:"Vanta Web Appliance 4.6",filesystem:"vantaedge",users:["webguest"],homeDir:"/home/webguest",
    interfaces:[{name:"eth0",address:"10.72.4.20",cidr:24,gateway:"10.72.4.1"},{name:"eth1",address:"172.31.8.10",cidr:24,gateway:null}],routes:["vantadev","vantaprint","vantadb"],
    services:[{name:"ssh",port:22,state:"open",pid:72},{name:"http",port:80,state:"open",pid:140},{name:"https",port:443,state:"open",pid:140}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:72,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:140,user:"web",cpu:"0.2",mem:"4.3",name:"httpd"}],
    connections:[{proto:"tcp",local:"172.31.8.10:443",remote:"172.31.8.24:8443",state:"ESTABLISHED"}],access:{mode:"webguest"},identity:"unknown"
  },
  vantadev:{
    id:"vantadev",hostname:"DEV-02",address:"172.31.8.24",owner:"Vanta Dynamics",os:"NIX Dev Image 6.1",filesystem:"vantadev",users:["build"],homeDir:"/home/build",
    interfaces:[{name:"eth0",address:"172.31.8.24",cidr:24,gateway:"172.31.8.10"}],routes:["vantaedge","vantaprint","vantadb"],
    services:[{name:"ssh",port:22,state:"open",pid:83},{name:"dev-http",port:8443,state:"open",pid:177}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:83,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:177,user:"build",cpu:"0.2",mem:"5.1",name:"dev-httpd"}],
    connections:[{proto:"tcp",local:"172.31.8.24:8443",remote:"172.31.8.10:*",state:"ESTABLISHED"}],access:{mode:"build"},identity:"unknown"
  },
  vantaprint:{
    id:"vantaprint",hostname:"PRINT-07",address:"172.31.8.31",owner:"Vanta Dynamics",os:"JetPrint Embedded",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"172.31.8.31",cidr:24,gateway:"172.31.8.10"}],routes:[],services:[{name:"ipp",port:631,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
  },
  vantadb:{
    id:"vantadb",hostname:"DB-01",address:"172.31.8.40",owner:"Vanta Dynamics",os:"Unknown",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"eth0",address:"172.31.8.40",cidr:24,gateway:"172.31.8.10"}],routes:[],services:[{name:"database",port:5432,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"unknown"
  },
  cobaltbbs:{
    id:"cobaltbbs",hostname:"COBALT-BBS",address:"10.91.6.23",owner:"Cobalt Hobby Network",os:"NIX BBS 2.4",filesystem:"cobaltbbs",users:["visitor"],homeDir:"/home/visitor",
    interfaces:[{name:"eth0",address:"10.91.6.23",cidr:24,gateway:"10.91.6.1"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:51},{name:"bbs",port:2323,state:"open",pid:119}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:51,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:119,user:"bbs",cpu:"0.1",mem:"3.0",name:"cobaltd"}],
    connections:[{proto:"tcp",local:"10.91.6.23:2323",remote:"0.0.0.0:*",state:"LISTEN"}],access:{mode:"visitor"},identity:"unknown"
  },
  orchidnas:{
    id:"orchidnas",hostname:"ORCHID-NAS",address:"10.55.2.19",owner:"Orchid Media",os:"StoreBox 5.0",filesystem:"orchidnas",users:["public"],homeDir:"/home/public",
    interfaces:[{name:"eth0",address:"10.55.2.19",cidr:24,gateway:"10.55.2.1"}],routes:[],
    services:[{name:"ssh",port:22,state:"open",pid:60},{name:"files",port:445,state:"open",pid:121}],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:60,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:121,user:"media",cpu:"0.1",mem:"3.2",name:"filesvc"}],
    connections:[{proto:"tcp",local:"10.55.2.19:445",remote:"10.91.6.23:*",state:"ESTABLISHED"}],access:{mode:"public"},identity:"unknown"
  },
  lumendns:{
    id:"lumendns",hostname:"LUMEN-NS1",address:"10.84.2.53",owner:"Lumen Civic Systems",os:"Resolver Appliance 2.8",filesystem:null,users:[],homeDir:"/",interfaces:[{name:"eth0",address:"10.84.2.53",cidr:24,gateway:"10.84.2.1"}],routes:[],services:[{name:"dns",port:53,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"unknown",visibleWhen:["lumen_contract_available"]
  },
  lumenedge:{
    id:"lumenedge",hostname:"LUMEN-EDGE",address:"10.84.2.20",owner:"Lumen Civic Systems",os:"NIX Web Gateway 5.7",filesystem:"lumenedge",users:["review"],homeDir:"/home/review",interfaces:[{name:"eth0",address:"10.84.2.20",cidr:24,gateway:"10.84.2.1"}],routes:["lumendns","lumenmail"],services:[{name:"ssh",port:22,state:"open",pid:70},{name:"https",port:443,state:"open",pid:151}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:70,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:151,user:"web",cpu:"0.2",mem:"4.8",name:"gatewayd"}],connections:[{proto:"udp",local:"10.84.2.20:*",remote:"10.84.2.53:53",state:"OPEN"}],access:{mode:"review"},identity:"unknown",visibleWhen:["lumen_contract_available"]
  },
  lumenmail:{
    id:"lumenmail",hostname:"LUMEN-MX",address:"10.84.2.25",owner:"Lumen Civic Systems",os:"Mail Relay 4.1",filesystem:null,users:[],homeDir:"/",interfaces:[{name:"eth0",address:"10.84.2.25",cidr:24,gateway:"10.84.2.1"}],routes:[],services:[{name:"smtp",port:25,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"unknown",visibleWhen:["lumen_contract_available"]
  },
  irisgate:{
    id:"irisgate",hostname:"IRIS-GATE",address:"10.48.6.12",owner:"Iris Transit Cooperative",os:"Iris EdgeOS 3.4",filesystem:"irisgate",users:["monitor"],homeDir:"/home/monitor",interfaces:[{name:"eth0",address:"10.48.6.12",cidr:24,gateway:"10.48.6.1"},{name:"ops0",address:"172.26.5.5",cidr:24,gateway:null}],routes:["irisops","irisarchive"],services:[{name:"ssh",port:22,state:"open",pid:62},{name:"telemetry",port:9443,state:"open",pid:180}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:62,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:180,user:"iris",cpu:"0.3",mem:"5.0",name:"telemetryd"}],connections:[{proto:"tcp",local:"172.26.5.5:9443",remote:"172.26.5.18:5514",state:"ESTABLISHED"}],access:{mode:"monitor"},identity:"unknown",visibleWhen:["iris_contract_available"]
  },
  irisops:{
    id:"irisops",hostname:"IRIS-OPS",address:"172.26.5.18",owner:"Iris Transit Cooperative",os:"NIX Operations Node 6.0",filesystem:"irisops",users:["audit"],homeDir:"/home/audit",interfaces:[{name:"eth0",address:"172.26.5.18",cidr:24,gateway:"172.26.5.5"}],routes:["irisgate","irisarchive"],services:[{name:"ssh",port:22,state:"open",pid:73},{name:"syslog",port:5514,state:"open",pid:122}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:73,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:122,user:"audit",cpu:"0.2",mem:"3.7",name:"logwatch"}],connections:[{proto:"tcp",local:"172.26.5.18:5514",remote:"172.26.5.5:*",state:"LISTEN"}],access:{mode:"audit"},identity:"unknown"
  },
  irisarchive:{
    id:"irisarchive",hostname:"IRIS-ARCHIVE",address:"172.26.5.27",owner:"Iris Transit Cooperative",os:"ArchiveBox 2.1",filesystem:"irisarchive",users:["reader"],homeDir:"/home/reader",interfaces:[{name:"eth0",address:"172.26.5.27",cidr:24,gateway:"172.26.5.5"}],routes:["irisgate","irisops"],services:[{name:"ssh",port:22,state:"open",pid:44},{name:"files",port:445,state:"open",pid:109}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:44,user:"root",cpu:"0.0",mem:"0.6",name:"sshd"},{pid:109,user:"archive",cpu:"0.1",mem:"2.3",name:"filesvc"}],connections:[],access:{mode:"reader"},identity:"unknown"
  },
  harboredge:{
    id:"harboredge",hostname:"HARBOR-EDGE",address:"10.66.4.16",owner:"Harbor Mutual",os:"Harbor Gateway 7.2",filesystem:"harboredge",users:["response"],homeDir:"/home/response",interfaces:[{name:"eth0",address:"10.66.4.16",cidr:24,gateway:"10.66.4.1"},{name:"core0",address:"172.29.14.4",cidr:24,gateway:null}],routes:["harborresolver","harborprint"],services:[{name:"ssh",port:22,state:"open",pid:65},{name:"https",port:443,state:"open",pid:148}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:65,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:148,user:"proxy",cpu:"0.2",mem:"4.5",name:"proxyd"}],connections:[{proto:"udp",local:"172.29.14.4:*",remote:"172.29.14.53:53",state:"OPEN"}],access:{mode:"response"},identity:"unknown",visibleWhen:["harbor_contract_available"]
  },
  harborresolver:{
    id:"harborresolver",hostname:"HARBOR-NS",address:"172.29.14.53",owner:"Harbor Mutual",os:"NIX Resolver 5.0",filesystem:"harborresolver",users:["dnsops"],homeDir:"/home/dnsops",interfaces:[{name:"eth0",address:"172.29.14.53",cidr:24,gateway:"172.29.14.4"}],routes:["harboredge","harborvault","harborprint"],services:[{name:"ssh",port:22,state:"open",pid:55},{name:"dns",port:53,state:"open",pid:111}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:55,user:"root",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:111,user:"dns",cpu:"0.1",mem:"2.8",name:"named"}],connections:[{proto:"udp",local:"172.29.14.53:53",remote:"172.29.14.4:*",state:"OPEN"}],access:{mode:"dnsops"},identity:"unknown"
  },
  harborvault:{
    id:"harborvault",hostname:"HARBOR-VAULT",address:"172.29.22.40",owner:"Harbor Mutual",os:"NIX Evidence Vault 4.3",filesystem:"harborvault",users:["auditor"],homeDir:"/home/auditor",interfaces:[{name:"eth0",address:"172.29.22.40",cidr:24,gateway:"172.29.22.1"}],routes:["harborresolver"],services:[{name:"ssh",port:22,state:"open",pid:88},{name:"files",port:445,state:"open",pid:166}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:88,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:166,user:"vault",cpu:"0.2",mem:"4.1",name:"evidenced"}],connections:[],access:{mode:"auditor"},identity:"unknown",visibleWhen:["harbor_vault_revealed"]
  },
  harborprint:{
    id:"harborprint",hostname:"HARBOR-PRINT",address:"172.29.14.31",owner:"Harbor Mutual",os:"JetPrint Embedded",filesystem:null,users:[],homeDir:"/",interfaces:[{name:"eth0",address:"172.29.14.31",cidr:24,gateway:"172.29.14.4"}],routes:[],services:[{name:"ipp",port:631,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
  },
  relaycache:{
    id:"relaycache",hostname:"RELAY-CACHE",address:"10.73.9.28",owner:"Independent Mirror",os:"NIX Cache Node 3.0",filesystem:"relaycache",users:["guest"],homeDir:"/home/guest",interfaces:[{name:"eth0",address:"10.73.9.28",cidr:24,gateway:"10.73.9.1"}],routes:[],services:[{name:"ssh",port:22,state:"open",pid:49},{name:"http",port:8080,state:"open",pid:118}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:49,user:"root",cpu:"0.0",mem:"0.6",name:"sshd"},{pid:118,user:"cache",cpu:"0.1",mem:"2.5",name:"cached"}],connections:[],access:{mode:"guest"},identity:"unknown",visibleWhen:["relay_cache_available"]
  },
  quartzbbs:{
    id:"quartzbbs",hostname:"QUARTZ-BBS",address:"10.73.9.19",owner:"Quartz Hobby Network",os:"NIX BBS 3.1",filesystem:"quartzbbs",users:["visitor"],homeDir:"/home/visitor",interfaces:[{name:"eth0",address:"10.73.9.19",cidr:24,gateway:"10.73.9.1"}],routes:[],services:[{name:"ssh",port:22,state:"open",pid:47},{name:"bbs",port:2323,state:"open",pid:108}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:47,user:"root",cpu:"0.0",mem:"0.6",name:"sshd"},{pid:108,user:"bbs",cpu:"0.1",mem:"2.8",name:"quartzd"}],connections:[],access:{mode:"visitor"},identity:"unknown",visibleWhen:["quartz_thread_available"]
  },
  junoarchive:{
    id:"junoarchive",hostname:"JUNO-ARCHIVE",address:"10.57.8.33",owner:"Juno Open Research",os:"Archive NIX 4.2",filesystem:"junoarchive",users:["public"],homeDir:"/home/public",interfaces:[{name:"eth0",address:"10.57.8.33",cidr:24,gateway:"10.57.8.1"}],routes:[],services:[{name:"ssh",port:22,state:"open",pid:46},{name:"http",port:80,state:"open",pid:113}],processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:46,user:"root",cpu:"0.0",mem:"0.6",name:"sshd"},{pid:113,user:"archive",cpu:"0.1",mem:"2.4",name:"httpd"}],connections:[],access:{mode:"public"},identity:"unknown",visibleWhen:["juno_advisory_available"]
  },
  cedarnode:{
    id:"cedarnode",hostname:"CEDAR-NODE",address:"10.39.7.41",owner:"Cedar Home Lab",os:"NEXUS/OS Server 4.0",filesystem:"cedarnode",users:["guest"],homeDir:"/home/guest",interfaces:[{name:"eth0",address:"10.39.7.41",cidr:24,gateway:"10.39.7.1"}],routes:[],services:[{name:"ssh",port:22,state:"open",pid:52},{name:"files",port:445,state:"open",pid:117}],processes:[{pid:1,user:"system",cpu:"0.0",mem:"0.2",name:"init"},{pid:52,user:"system",cpu:"0.0",mem:"0.7",name:"sshd"},{pid:117,user:"cedar",cpu:"0.1",mem:"2.7",name:"filesvc"}],connections:[],access:{mode:"guest"},identity:"unknown",visibleWhen:["cedar_lead_available"]
  }
  ,
  rangeweb01:{
    id:"rangeweb01",hostname:"RANGE-WEB-01",address:"10.77.4.18",owner:"NightWire Range",os:"RangeNIX Web 1.0",filesystem:"rangeweb01",users:["range"],homeDir:"/home/range",
    universe:"range",rangeLabId:"range01",accessModel:"advanced",detectionThreshold:5,identity:"known",
    interfaces:[{name:"eth0",address:"10.77.4.18",cidr:24,gateway:"10.77.4.1"}],routes:[],
    services:[
      {name:"http",port:80,state:"open",pid:80,product:"Northstar Web",version:"2.4",observations:["Directory indexing enabled","Backup artifact pattern observed"]}
    ],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:80,user:"web",cpu:"0.1",mem:"2.3",name:"httpd"}],connections:[],
    authentication:{},
    vulnerabilities:[
      {id:"BBX-014",state:"vulnerable",effects:{artifacts:[{id:"range01-proof",path:"/public/backup/proof.txt",label:"proof.txt",content:"NW-RANGE-PROOF-01\nEnumeration before exploitation."}]}}
    ]
  },
  rangefile02:{
    id:"rangefile02",hostname:"RANGE-FILE-02",address:"10.77.5.21",owner:"NightWire Range",os:"RangeNIX File 1.3",filesystem:"rangefile02",users:["rangeops","root"],homeDir:"/home/rangeops",
    universe:"range",rangeLabId:"range02",accessModel:"advanced",detectionThreshold:5,identity:"known",
    interfaces:[{name:"eth0",address:"10.77.5.21",cidr:24,gateway:"10.77.5.1"}],routes:[],
    services:[
      {name:"ssh",port:22,state:"open",pid:41,product:"NEXUS Secure Shell",version:"4.1",observations:["Password authentication enabled"]},
      {name:"http",port:8080,state:"open",pid:80,product:"Northstar Web",version:"2.4",observations:["Legacy backup directory exposed","Configuration artifact signature detected"]}
    ],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:41,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},{pid:80,user:"web",cpu:"0.1",mem:"2.4",name:"httpd"}],connections:[],
    authentication:{ssh:[{username:"rangeops",secret:"NW_RANGE_02",privilege:"user"}]},
    vulnerabilities:[
      {id:"BBX-014",state:"vulnerable",effects:{artifacts:[{id:"range02-service-conf",path:"/backup/service.conf",label:"service.conf",content:"service_user=rangeops\nauth_source=legacy-backup\nnote=credential material recorded by BLACKBOX"}],credentials:[{id:"cred-range02-ops",username:"rangeops",secret:"NW_RANGE_02",scope:{universes:["range"],hosts:["rangefile02"],services:["ssh"]}}]}}
    ]
  },
  rangeops03:{
    id:"rangeops03",hostname:"RANGE-OPS-03",address:"10.77.6.30",owner:"NightWire Range",os:"RangeNIX Ops 2.0",filesystem:"rangeops03",users:["svc-range","root"],homeDir:"/home/svc-range",
    universe:"range",rangeLabId:"range03",accessModel:"advanced",detectionThreshold:6,identity:"known",
    interfaces:[{name:"eth0",address:"10.77.6.30",cidr:24,gateway:"10.77.6.1"}],routes:[],
    services:[
      {name:"files",port:445,state:"open",pid:90,product:"Range File Service",version:"1.2",observations:["Guest boundary disabled","Service-account context exposed"]}
    ],
    processes:[{pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},{pid:90,user:"svc-range",cpu:"0.1",mem:"2.7",name:"filesvc"}],connections:[],
    authentication:{},
    vulnerabilities:[
      {id:"BBX-021",state:"vulnerable",effects:{session:{user:"svc-range",privilege:"service",service:"files"}}},
      {id:"BBX-037",state:"vulnerable",requiresPrivilege:"service",effects:{elevateTo:"root"}}
    ]
  }

};

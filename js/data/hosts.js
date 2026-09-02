export const HOSTS = {
  home:{
    id:"home",hostname:"HOME-PC",address:"192.168.1.12",owner:"Player",os:"NEXUS/OS 4.2",filesystem:"home",users:["player"],homeDir:"/home",
    interfaces:[{name:"eth0",address:"192.168.1.12",cidr:24,gateway:"192.168.1.1"}],
    routes:["homegw","familypc","printer01","web03","mail02","archives01","mirror02","meridian01","helixedge","axiomrelay"],
    services:[{name:"local-shell",port:0,state:"open",pid:118},{name:"messenger",port:5222,state:"open",pid:244}],
    processes:[{pid:1,user:"system",cpu:"0.0",mem:"0.1",name:"init"},{pid:118,user:"player",cpu:"0.1",mem:"1.8",name:"blackboxd"},{pid:244,user:"player",cpu:"0.0",mem:"2.4",name:"messenger"}],
    connections:[{proto:"tcp",local:"192.168.1.12:5222",remote:"10.2.4.18:5222",state:"ESTABLISHED"}]
  },
  homegw:{
    id:"homegw",hostname:"HOME-GW",address:"192.168.1.1",owner:"Local Network",os:"Gateway Firmware 2.1",filesystem:null,users:[],homeDir:"/",
    interfaces:[{name:"lan0",address:"192.168.1.1",cidr:24,gateway:null}],routes:[],services:[{name:"dns",port:53,state:"open",pid:0},{name:"http",port:80,state:"open",pid:0}],processes:[],connections:[],connectable:false,identity:"known"
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
  }
};

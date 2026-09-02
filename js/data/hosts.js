export const HOSTS = {
  home:{
    id:"home",hostname:"HOME-PC",address:"192.168.1.12",owner:"Player",os:"NEXUS/OS 4.2",
    filesystem:"home",users:["user"],homeDir:"/home",
    services:[{name:"local-shell",port:0,state:"open",pid:118},{name:"messenger",port:5222,state:"open",pid:244}],
    processes:[
      {pid:1,user:"system",cpu:"0.0",mem:"0.1",name:"init"},
      {pid:118,user:"user",cpu:"0.1",mem:"1.8",name:"blackboxd"},
      {pid:244,user:"user",cpu:"0.0",mem:"2.4",name:"messenger"}
    ],
    connections:[{proto:"tcp",local:"192.168.1.12:5222",remote:"10.2.4.18:5222",state:"ESTABLISHED"}]
  },
  archives01:{
    id:"archives01",hostname:"ARCHIVES-01",address:"10.14.8.22",owner:"Northstar Data Services",os:"NIX Training Server 3.2",
    filesystem:"archives01",users:["guest"],homeDir:"/home/guest",
    services:[{name:"ssh",port:22,state:"open",pid:92},{name:"archive-http",port:8080,state:"open",pid:131}],
    processes:[
      {pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},
      {pid:92,user:"root",cpu:"0.0",mem:"0.9",name:"sshd"},
      {pid:131,user:"archive",cpu:"0.1",mem:"3.1",name:"archived"}
    ],
    connections:[{proto:"tcp",local:"10.14.8.22:22",remote:"192.168.1.12:*",state:"LISTEN"}],
    access:{mode:"guest"}
  },
  mirror02:{
    id:"mirror02",hostname:"MIRROR-02",address:"10.14.8.31",owner:"Northstar Data Services",os:"NIX Mirror Appliance 2.7",
    filesystem:"mirror02",users:["guest"],homeDir:"/home/guest",
    services:[{name:"ssh",port:22,state:"open",pid:77},{name:"http",port:80,state:"open",pid:144}],
    processes:[
      {pid:1,user:"root",cpu:"0.0",mem:"0.2",name:"init"},
      {pid:77,user:"root",cpu:"0.0",mem:"0.8",name:"sshd"},
      {pid:144,user:"mirror",cpu:"0.2",mem:"4.2",name:"httpd"}
    ],
    connections:[
      {proto:"tcp",local:"10.14.8.31:80",remote:"0.0.0.0:*",state:"LISTEN"},
      {proto:"tcp",local:"10.14.8.31:22",remote:"192.168.1.12:*",state:"LISTEN"}
    ],
    access:{mode:"guest"}
  }
};

export const HOSTS = {
  home:{
    id:"home",
    hostname:"HOME-PC",
    address:"192.168.1.12",
    owner:"Player",
    os:"NEXUS/OS 4.2",
    filesystem:"home",
    users:["user"],
    services:[
      {name:"local-shell",port:0,state:"open"}
    ]
  },
  archives01:{
    id:"archives01",
    hostname:"ARCHIVES-01",
    address:"10.14.8.22",
    owner:"Northstar Data Services",
    os:"NIX Training Server 3.2",
    filesystem:"archives01",
    users:["guest"],
    services:[
      {name:"shell",port:22,state:"open"},
      {name:"archive",port:8080,state:"open"}
    ],
    access:{mode:"guest"}
  }
};

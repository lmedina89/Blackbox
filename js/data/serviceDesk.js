export const REMOTE_MACHINE_TEMPLATES={
  "FIN-WS-07":{
    id:"FIN-WS-07",hostname:"FIN-WS-07",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Support Modem (out-of-band)",
    user:{name:"Maria Santos",username:"msantos",department:"Finance"},
    network:{adapterEnabled:false,dhcp:true,ip:"0.0.0.0",subnet:"255.255.255.0",gateway:"10.20.10.1",dns:["10.20.0.10"],leaseIp:"10.20.10.57",leaseRenewals:0},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    devices:{networkAdapter:"disabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar P3 800 MHz",memory:"256 MB",disk:"20 GB DeskStar HDD",network:"FastLink 100 PCI Adapter"},
    eventLog:[
      {id:"fin-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"fin-nic-disabled",level:"Warning",source:"PlugPlayManager",eventId:4002,message:"FastLink 100 PCI Adapter was disabled by a local user."}
    ]
  },
  "OPS-WS-12":{
    id:"OPS-WS-12",hostname:"OPS-WS-12",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Remote Assistance over LAN",
    user:{name:"Derrick Cole",username:"dcole",department:"Operations"},
    network:{adapterEnabled:true,dhcp:true,ip:"10.20.20.84",subnet:"255.255.255.0",gateway:"10.20.20.1",dns:["10.20.0.10"],leaseIp:"10.20.20.84",leaseRenewals:1},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"stopped",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar P3 933 MHz",memory:"256 MB",disk:"20 GB DeskStar HDD",network:"FastLink 100 PCI Adapter"},
    eventLog:[
      {id:"ops-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"ops-dns-stop",level:"Warning",source:"Service Control Manager",eventId:7035,message:"DNS Client service entered the stopped state."}
    ]
  },
  "HR-LT-03":{
    id:"HR-LT-03",hostname:"HR-LT-03",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Support Modem (out-of-band)",
    user:{name:"Alicia Green",username:"agreen",department:"Human Resources"},
    network:{adapterEnabled:true,dhcp:true,ip:"169.254.44.17",subnet:"255.255.0.0",gateway:"",dns:[],leaseIp:"10.20.30.44",leaseRenewals:0},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"stopped",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar Mobile P3 750 MHz",memory:"192 MB",disk:"20 GB Mobile HDD",network:"FastLink CardBus 10/100 Adapter"},
    eventLog:[
      {id:"hr-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"hr-dhcp-stop",level:"Warning",source:"Service Control Manager",eventId:7035,message:"DHCP Client service entered the stopped state."},
      {id:"hr-apipa",level:"Warning",source:"Tcpip",eventId:4199,message:"No DHCP lease was available. Automatic private address 169.254.44.17 assigned."}
    ]
  }
};

export const SERVICE_DESK_TICKETS=[
  {
    id:"INC-0001",title:"No network connection",priority:"Normal",category:"Network / Workstation",machineId:"FIN-WS-07",
    summary:"User reports that no network sites load after arriving this morning.",
    description:"Internet and shared resources do not load. I restarted twice already. It started after I moved the tower so I could clean under the desk.",
    userNote:"I think the network cable might have gone bad.",
    learning:["Device Manager status","Code 22","Adapter state","Post-repair verification"],
    expectedActions:["device:networkAdapter:enabled"],relevantTools:["devices","network"],relevantCommands:["ipconfig","ping"],nextTicketId:"INC-0002"
  },
  {
    id:"INC-0002",title:"Names do not resolve",priority:"Normal",category:"Network / DNS",machineId:"OPS-WS-12",
    summary:"Network link appears connected, but sites fail when users type names.",
    description:"The network icon says connected. I can reach an internal server by the IP someone gave me, but the intranet name does not work.",
    userNote:"This happened right after the update popup, so maybe the browser update broke it.",
    learning:["IP connectivity vs name resolution","Services","DNS troubleshooting","Verification"],
    expectedActions:["service:dnsClient:running"],relevantTools:["services","network","events"],relevantCommands:["ping","nslookup","ipconfig"],nextTicketId:"INC-0003"
  },
  {
    id:"INC-0003",title:"Limited connectivity after docking",priority:"Normal",category:"Network / DHCP",machineId:"HR-LT-03",
    summary:"Laptop shows a connection but cannot reach company resources.",
    description:"The laptop says it is connected after I docked it, but nothing on the company network opens. Wi-Fi was working at home last night.",
    userNote:"Maybe the wall jack on this desk is bad. I have a meeting soon.",
    learning:["APIPA 169.254.0.0/16","DHCP Client","ipconfig","Lease renewal","Gateway/DNS verification"],
    expectedActions:["service:dhcpClient:running","dhcp:renew"],relevantTools:["network","services","events"],relevantCommands:["ipconfig","ping"],nextTicketId:null
  }
];

export const SERVICE_DESK_TICKET_MAP=Object.fromEntries(SERVICE_DESK_TICKETS.map(ticket=>[ticket.id,ticket]));

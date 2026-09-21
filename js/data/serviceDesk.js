export const REMOTE_MACHINE_TEMPLATES={
  "FIN-WS-07":{
    id:"FIN-WS-07",hostname:"FIN-WS-07",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Support Modem (out-of-band)",
    user:{name:"Maria Santos",username:"msantos",department:"Finance"},
    network:{adapterEnabled:false,dhcp:true,ip:"0.0.0.0",subnet:"255.255.255.0",gateway:"10.20.10.1",correctGateway:"10.20.10.1",gatewayEditable:false,dns:["10.20.0.10"],leaseIp:"10.20.10.57",leaseRenewals:0},
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
    network:{adapterEnabled:true,dhcp:true,ip:"10.20.20.84",subnet:"255.255.255.0",gateway:"10.20.20.1",correctGateway:"10.20.20.1",gatewayEditable:false,dns:["10.20.0.10"],leaseIp:"10.20.20.84",leaseRenewals:1},
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
    network:{adapterEnabled:true,dhcp:true,ip:"169.254.44.17",subnet:"255.255.0.0",gateway:"",correctGateway:"10.20.30.1",gatewayEditable:false,dns:[],leaseIp:"10.20.30.44",leaseRenewals:0},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"stopped",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar Mobile P3 750 MHz",memory:"192 MB",disk:"20 GB Mobile HDD",network:"FastLink CardBus 10/100 Adapter"},
    eventLog:[
      {id:"hr-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"hr-dhcp-stop",level:"Warning",source:"Service Control Manager",eventId:7035,message:"DHCP Client service entered the stopped state."},
      {id:"hr-apipa",level:"Warning",source:"Tcpip",eventId:4199,message:"No DHCP lease was available. Automatic private address 169.254.44.17 assigned."}
    ]
  },
  "ENG-WS-21":{
    id:"ENG-WS-21",hostname:"ENG-WS-21",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Remote Assistance over LAN",
    user:{name:"Tara Bishop",username:"tbishop",department:"Engineering"},
    network:{adapterEnabled:true,dhcp:false,ip:"10.20.40.88",subnet:"255.255.255.0",gateway:"10.20.41.1",correctGateway:"10.20.40.1",gatewayEditable:true,dns:["10.20.0.10"],leaseIp:"10.20.40.88",leaseRenewals:0},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar P4 1.4 GHz",memory:"384 MB",disk:"40 GB DeskStar HDD",network:"FastLink 100 PCI Adapter"},
    eventLog:[
      {id:"eng-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"eng-route",level:"Warning",source:"Tcpip",eventId:4201,message:"Remote network traffic could not be forwarded through the configured default gateway."}
    ]
  },
  "LOG-WS-05":{
    id:"LOG-WS-05",hostname:"LOG-WS-05",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Remote Assistance over LAN",
    user:{name:"Evan Ross",username:"eross",department:"Logistics"},
    network:{adapterEnabled:true,dhcp:true,ip:"10.20.50.62",subnet:"255.255.255.0",gateway:"10.20.50.1",correctGateway:"10.20.50.1",gatewayEditable:false,dns:["10.20.0.10"],leaseIp:"10.20.50.62",leaseRenewals:1},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running",inventoryAgent:"stopped"},
    applications:{inventory:{name:"Northstar Inventory Client",service:"inventoryAgent",endpoint:"10.20.0.30"}},
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar P4 1.5 GHz",memory:"384 MB",disk:"40 GB DeskStar HDD",network:"FastLink 100 PCI Adapter"},
    eventLog:[
      {id:"log-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"log-inventory-stop",level:"Error",source:"Service Control Manager",eventId:7031,message:"Northstar Inventory Agent terminated unexpectedly and remained stopped."},
      {id:"log-inventory-client",level:"Warning",source:"Inventory Client",eventId:1204,message:"Inventory client could not connect to its local synchronization agent."}
    ]
  },
  "FIN-WS-19":{
    id:"FIN-WS-19",hostname:"FIN-WS-19",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Remote Assistance over LAN",
    user:{name:"Megan Price",username:"mprice",department:"Finance"},
    network:{adapterEnabled:true,dhcp:true,ip:"10.20.10.91",subnet:"255.255.255.0",gateway:"10.20.10.1",correctGateway:"10.20.10.1",gatewayEditable:false,dns:["10.20.0.10"],leaseIp:"10.20.10.91",leaseRenewals:1},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running",reportWriter:"running"},
    storage:{
      capacityMb:20480,
      baseUsedMb:15752,
      minimumFreeMb:2048,
      cleanup:{
        tempExports:{label:"Temporary report exports",remainingMb:3500,cleanupAllowed:true},
        appLogs:{label:"Archived report logs",remainingMb:650,cleanupAllowed:true},
        crashDumps:{label:"Old crash dumps",remainingMb:450,cleanupAllowed:true}
      }
    },
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar P4 1.3 GHz",memory:"384 MB",disk:"20 GB DeskStar HDD",network:"FastLink 100 PCI Adapter"},
    eventLog:[
      {id:"fin19-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"fin19-disk",level:"Warning",source:"Disk",eventId:2013,message:"The C: volume has less than 1 percent free space remaining."},
      {id:"fin19-report",level:"Error",source:"Report Writer",eventId:1120,message:"Unable to create output file. Insufficient disk space."}
    ]
  },
  "ENG-WS-27":{
    id:"ENG-WS-27",hostname:"ENG-WS-27",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Remote Assistance over LAN",
    user:{name:"Leah Kim",username:"lkim",department:"Engineering"},
    network:{adapterEnabled:true,dhcp:true,ip:"10.20.40.104",subnet:"255.255.255.0",gateway:"10.20.40.1",correctGateway:"10.20.40.1",gatewayEditable:false,dns:["10.20.0.10"],leaseIp:"10.20.40.104",leaseRenewals:1},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:true,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    access:{
      groups:["DOMAIN-USERS","ENG-STAFF"],
      editableGroups:["ENG-PROJECT-R","ENG-PROJECT-RW","DOMAIN-ADMINS"],
      shares:{engineeringProjects:{name:"Engineering Projects",path:"\\\\FILES-02\\ENG-PROJECTS",allowedGroups:["ENG-PROJECT-R","ENG-PROJECT-RW","DOMAIN-ADMINS"],leastPrivilegeGroup:"ENG-PROJECT-R"}}
    },
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar P4 1.6 GHz",memory:"512 MB",disk:"40 GB DeskStar HDD",network:"FastLink 100 PCI Adapter"},
    eventLog:[
      {id:"eng27-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"eng27-auth",level:"Information",source:"Security",eventId:528,message:"Interactive logon succeeded for NEXUS\\lkim."},
      {id:"eng27-share",level:"Warning",source:"Workstation",eventId:3019,message:"Access to \\\\FILES-02\\ENG-PROJECTS was denied for NEXUS\\lkim."}
    ]
  },
  "OPS-WS-24":{
    id:"OPS-WS-24",hostname:"OPS-WS-24",os:"NEXUS/OS Professional 4.0",remoteTransport:"NEXUS Remote Assistance over LAN",
    user:{name:"Jordan Miles",username:"jmiles",department:"Operations"},
    network:{adapterEnabled:true,dhcp:true,ip:"10.20.20.103",subnet:"255.255.255.0",gateway:"10.20.20.1",correctGateway:"10.20.20.1",gatewayEditable:false,dns:["10.20.0.10"],leaseIp:"10.20.20.103",leaseRenewals:1},
    firewall:{enabled:true,profile:"Domain",rules:{fileSharing:false,remoteAssistance:true,webBrowser:true,messenger:true}},
    services:{dnsClient:"running",dhcpClient:"running",printSpooler:"running",workstation:"running",nexusUpdate:"running"},
    authentication:{accountStatus:"unlocked",badPasswordCount:5,passwordChanged:"09/20/2026 16:42",lastFailureSource:"OPS-WS-24",lastFailureType:"Batch",lastFailureProcess:"Task Scheduler"},
    scheduledTasks:{
      nexusUpdateCheck:{name:"NEXUS Update Check",command:"nexusupdate.exe /check",runAs:"NEXUS-SVC\\update",enabled:true,credentialState:"managed",obsolete:false,lastResult:"0x0 — Completed successfully"},
      legacyFileSync:{name:"Legacy File Sync",command:"filesync.exe /legacy /quiet",runAs:"NEXUS\\jmiles",enabled:true,credentialState:"stale",obsolete:true,lastResult:"0x8007052E — Logon failure: unknown user name or bad password"}
    },
    devices:{networkAdapter:"enabled",soundAdapter:"enabled"},
    hardware:{cpu:"Northstar P4 1.5 GHz",memory:"384 MB",disk:"40 GB DeskStar HDD",network:"FastLink 100 PCI Adapter"},
    eventLog:[
      {id:"ops24-boot",level:"Information",source:"System",eventId:6005,message:"NEXUS/OS system services started."},
      {id:"ops24-logon-ok",level:"Information",source:"Security",eventId:528,message:"Interactive logon succeeded for NEXUS\\jmiles."},
      {id:"ops24-authfail-1",level:"Failure Audit",source:"Security",eventId:529,message:"Logon failure for NEXUS\\jmiles. Logon type: Batch. Caller process: Task Scheduler. Source workstation: OPS-WS-24."},
      {id:"ops24-authfail-2",level:"Failure Audit",source:"Security",eventId:529,message:"Logon failure for NEXUS\\jmiles. Logon type: Batch. Caller process: Task Scheduler. Source workstation: OPS-WS-24."},
      {id:"ops24-taskfail",level:"Warning",source:"Task Scheduler",eventId:101,message:"Legacy File Sync could not start because its stored logon credential was rejected."}
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
    expectedActions:["device:networkAdapter:enabled"],relevantTools:["devices","network"],relevantCommands:["ipconfig","ping"],nextTicketId:"INC-0002",
    troubleshooting:{
      version:1,
      rootCause:{id:"nic_disabled",label:"Network adapter disabled in Device Manager"},
      evidence:[
        {id:"device_state",label:"Device Manager state inspected",matches:[{type:"observe:devices"}]},
        {id:"media_state",label:"TCP/IP media state inspected",matches:[{typePrefix:"command:ipconfig"}]}
      ],
      minimumEvidence:1,
      verification:[
        {id:"adapter",label:"Network adapter enabled",path:"devices.networkAdapter",op:"equals",value:"enabled"},
        {id:"address",label:"Corporate IPv4 address assigned",path:"network.ip",op:"corporate-ip"}
      ]
    }
  },
  {
    id:"INC-0002",title:"Names do not resolve",priority:"Normal",category:"Network / DNS",machineId:"OPS-WS-12",
    summary:"Network link appears connected, but sites fail when users type names.",
    description:"The network icon says connected. I can reach an internal server by the IP someone gave me, but the intranet name does not work.",
    userNote:"This happened right after the update popup, so maybe the browser update broke it.",
    learning:["IP connectivity vs name resolution","Services","DNS troubleshooting","Verification"],
    expectedActions:["service:dnsClient:running"],relevantTools:["services","network","events"],relevantCommands:["ping","nslookup","ipconfig"],nextTicketId:"INC-0003",
    troubleshooting:{
      version:1,
      rootCause:{id:"dns_client_stopped",label:"DNS Client service is stopped on the workstation"},
      evidence:[
        {id:"tcpip",label:"TCP/IP configuration inspected",matches:[{type:"observe:network"},{typePrefix:"command:ipconfig"}]},
        {id:"ip_reachability",label:"Direct IP reachability tested",matches:[{type:"command:ping 10.20.0.20"}]},
        {id:"name_failure",label:"Name-based reachability failure reproduced",matches:[{type:"command:ping intranet.nexus.local"}]},
        {id:"dns_query",label:"Configured DNS server queried directly",matches:[{type:"command:nslookup intranet.nexus.local"}]},
        {id:"service_state",label:"Service state inspected",matches:[{type:"observe:services"}]},
        {id:"service_event",label:"Relevant service event reviewed",matches:[{type:"observe:events"}]}
      ],
      minimumEvidence:2,
      verification:[
        {id:"address",label:"Workstation retains a valid corporate IPv4 address",path:"network.ip",op:"corporate-ip"},
        {id:"dns_client",label:"DNS Client service is running",path:"services.dnsClient",op:"equals",value:"running"},
        {id:"dns_config",label:"A DNS server is configured",path:"network.dns",op:"nonempty"},
        {id:"dns_server",label:"Configured DNS server is reachable",op:"dns-server-reachable"}
      ]
    }
  },
  {
    id:"INC-0003",title:"Limited connectivity after docking",priority:"Normal",category:"Network / DHCP",machineId:"HR-LT-03",
    summary:"Laptop shows a connection but cannot reach company resources.",
    description:"The laptop says it is connected after I docked it, but nothing on the company network opens. Wi-Fi was working at home last night.",
    userNote:"Maybe the wall jack on this desk is bad. I have a meeting soon.",
    learning:["APIPA 169.254.0.0/16","DHCP Client","ipconfig","Lease renewal","Gateway/DNS verification"],
    expectedActions:["service:dhcpClient:running","dhcp:renew"],relevantTools:["network","services","events"],relevantCommands:["ipconfig","ping"],nextTicketId:"INC-0004",
    troubleshooting:{
      version:1,
      rootCause:{id:"dhcp_client_stopped",label:"DHCP Client service is stopped, leaving the workstation on an APIPA address"},
      evidence:[
        {id:"tcpip",label:"APIPA/TCP-IP configuration inspected",matches:[{type:"observe:network"},{typePrefix:"command:ipconfig"}]},
        {id:"service_state",label:"DHCP Client service state inspected",matches:[{type:"observe:services"}]},
        {id:"dhcp_event",label:"DHCP/APIPA events reviewed",matches:[{type:"observe:events"}]}
      ],
      minimumEvidence:2,
      verification:[
        {id:"adapter",label:"Network adapter is enabled",path:"network.adapterEnabled",op:"equals",value:true},
        {id:"dhcp_mode",label:"Adapter is configured to use DHCP",path:"network.dhcp",op:"equals",value:true},
        {id:"dhcp_client",label:"DHCP Client service is running",path:"services.dhcpClient",op:"equals",value:"running"},
        {id:"lease",label:"A corporate DHCP lease has been obtained",path:"network.ip",op:"corporate-ip"},
        {id:"gateway",label:"Default gateway matches the assigned local subnet",path:"network.gateway",op:"equals-path",otherPath:"network.correctGateway"},
        {id:"dns",label:"DNS configuration was restored",path:"network.dns",op:"nonempty"},
        {id:"renewal",label:"DHCP lease renewal completed",path:"network.leaseRenewals",op:"greater-than",value:0}
      ]
    }
  },
  {
    id:"INC-0004",title:"Local network works, remote resources fail",priority:"Normal",category:"Network / Routing",machineId:"ENG-WS-21",
    summary:"Engineering workstation reaches local devices but times out when opening remote company resources.",
    description:"The shared lab system on this floor responds, but the intranet and other department resources do not. The workstation was manually re-addressed yesterday after a desk move.",
    userNote:"A teammate thinks DNS is down, but the lab controller by IP still works.",
    learning:["Local vs remote reachability","Default gateway","Subnet reasoning","Bounded configuration change","Post-change verification"],
    expectedActions:["network:gateway:10.20.40.1"],relevantTools:["network","events"],relevantCommands:["ipconfig","ping"],nextTicketId:"INC-0005",
    troubleshooting:{
      version:1,
      rootCause:{id:"wrong_gateway",label:"Default gateway is outside the workstation's local subnet"},
      evidence:[
        {id:"tcpip",label:"TCP/IP configuration inspected",matches:[{type:"observe:network"},{typePrefix:"command:ipconfig"}]},
        {id:"local_ok",label:"Local-subnet reachability tested",matches:[{type:"command:ping 10.20.40.20"}]},
        {id:"remote_fail",label:"Remote-network reachability tested",matches:[{type:"command:ping 10.20.0.20"}]},
        {id:"route_event",label:"Relevant TCP/IP event reviewed",matches:[{type:"observe:events"}]}
      ],
      minimumEvidence:2,
      verification:[
        {id:"address",label:"Workstation retains a valid corporate IPv4 address",path:"network.ip",op:"corporate-ip"},
        {id:"gateway",label:"Default gateway matches the local subnet",path:"network.gateway",op:"equals-path",otherPath:"network.correctGateway"},
        {id:"remote",label:"Remote company resource is reachable",op:"reachable",target:"10.20.0.20"}
      ]
    }
  },
  {
    id:"INC-0005",title:"Inventory client cannot sync",priority:"Normal",category:"Application / Services",machineId:"LOG-WS-05",
    summary:"The inventory client opens, but synchronization fails while other network functions still work.",
    description:"The warehouse inventory screen opens normally, but it stays offline and will not pull current stock. Email and the intranet still work on this computer.",
    userNote:"Someone said the inventory server might be down for everyone, but the next desk is still updating stock.",
    learning:["Application dependencies","Service state","Event correlation","Bounded service restart","Post-change verification"],
    expectedActions:["service:inventoryAgent:running"],relevantTools:["services","events","network"],relevantCommands:["ping"],nextTicketId:"INC-0006",
    troubleshooting:{
      version:1,
      rootCause:{id:"inventory_agent_stopped",label:"Northstar Inventory Agent service is stopped on the workstation"},
      evidence:[
        {id:"network_ok",label:"Inventory endpoint reachability tested",matches:[{type:"command:ping 10.20.0.30"}]},
        {id:"service_state",label:"Application service state inspected",matches:[{type:"observe:services"}]},
        {id:"service_event",label:"Inventory/Service Control events reviewed",matches:[{type:"observe:events"}]}
      ],
      minimumEvidence:2,
      verification:[
        {id:"network",label:"Inventory endpoint is reachable",op:"reachable",target:"10.20.0.30"},
        {id:"service",label:"Northstar Inventory Agent is running",path:"services.inventoryAgent",op:"equals",value:"running"}
      ]
    }
  },
  {
    id:"INC-0006",title:"Reports fail to save",priority:"Normal",category:"Storage / Workstation",machineId:"FIN-WS-19",
    summary:"Finance reports open normally but fail when the user attempts to save or export them.",
    description:"The reporting tool works until I save a file. Then it says the output cannot be created. Restarting the program did not help.",
    userNote:"I am worried the reporting application is corrupted because it started during month-end exports.",
    learning:["Free-space diagnosis","Event logs","Safe cleanup targets","Change restraint","Post-change verification"],
    expectedActions:["storage:cleanup:tempExports"],relevantTools:["computer","events"],relevantCommands:["dir"],nextTicketId:"INC-0007",
    troubleshooting:{
      version:1,
      rootCause:{id:"disk_exhaustion",label:"Temporary report exports consumed nearly all free space on the system volume"},
      evidence:[
        {id:"disk_usage",label:"System-volume free space inspected",matches:[{type:"observe:computer"},{typePrefix:"command:dir c:"}]},
        {id:"disk_event",label:"Disk/report write errors reviewed",matches:[{type:"observe:events"}]}
      ],
      minimumEvidence:2,
      verification:[
        {id:"service",label:"Report Writer service remains running",path:"services.reportWriter",op:"equals",value:"running"},
        {id:"free_space",label:"At least 2 GB of free disk space is available",op:"storage-free-at-least",value:2048}
      ]
    }
  },
  {
    id:"INC-0007",title:"Project share access denied",priority:"Normal",category:"Identity / Permissions",machineId:"ENG-WS-27",
    summary:"A transferred Engineering employee can sign in and use the network but cannot open a required project share.",
    description:"I moved into Engineering this week. Email and the intranet work, but the Engineering Projects folder says Access Denied. I only need to read the current drawings.",
    userNote:"Another engineer said IT could just make me an administrator, but I only need the project files.",
    learning:["Authentication vs authorization","Group membership","Effective access","Least privilege","Access verification"],
    expectedActions:["group:add:ENG-PROJECT-R"],relevantTools:["access","events"],relevantCommands:["dir"],nextTicketId:"INC-0008",
    troubleshooting:{
      version:1,
      rootCause:{id:"missing_project_group",label:"Required read-only Engineering project group is missing from the user's memberships"},
      evidence:[
        {id:"membership",label:"User group memberships and share ACL inspected",matches:[{type:"observe:access"}]},
        {id:"access_failure",label:"Project-share access failure reproduced",matches:[{typePrefix:"command:dir \\\\files-02\\eng-projects"}]},
        {id:"access_event",label:"Relevant access-denied event reviewed",matches:[{type:"observe:events"}]}
      ],
      minimumEvidence:2,
      verification:[
        {id:"required_group",label:"User has the scoped ENG-PROJECT-R group",op:"group-present",value:"ENG-PROJECT-R"},
        {id:"no_broad_write",label:"Broader ENG-PROJECT-RW access was not granted",op:"group-absent",value:"ENG-PROJECT-RW"},
        {id:"no_admin",label:"DOMAIN-ADMINS was not used as a workaround",op:"group-absent",value:"DOMAIN-ADMINS"},
        {id:"share",label:"Engineering Projects share is readable",op:"share-access",shareId:"engineeringProjects"}
      ]
    }
  },
  {
    id:"INC-0008",title:"Account keeps locking after password change",priority:"High",category:"Identity / Authentication",machineId:"OPS-WS-24",
    summary:"Operations user reports repeated account lockouts even though interactive sign-in succeeds after each unlock.",
    description:"My password was changed yesterday. IT has unlocked the account twice, but it locks again after I have been working for a little while. I have not seen any sign-ins I do not recognize.",
    userNote:"It seems to happen every ten or fifteen minutes. Email and the intranet work normally between lockouts.",
    learning:["Authentication evidence","Source attribution","Logon-type correlation","Change restraint","Post-change verification"],
    expectedActions:["task:disable:legacyFileSync"],relevantTools:["events","tasks","access"],relevantCommands:["whoami","schtasks"],nextTicketId:null,
    troubleshooting:{
      version:1,requireEvidence:true,
      rootCause:{id:"stale_scheduled_task_credential",label:"An obsolete scheduled task is repeatedly attempting batch logons with the user's stale stored credential"},
      evidence:[
        {id:"auth_events",label:"Failed authentication events and logon type correlated",matches:[{type:"observe:events"}]},
        {id:"task_state",label:"Scheduled task identities and last-run results inspected",matches:[{type:"observe:tasks"},{typePrefix:"command:schtasks"}]},
        {id:"identity_context",label:"Current user identity or account context confirmed",matches:[{type:"observe:access"},{typePrefix:"command:whoami"}]}
      ],
      minimumEvidence:2,
      verification:[
        {id:"legacy_disabled",label:"Obsolete Legacy File Sync task is disabled",op:"task-disabled",taskId:"legacyFileSync"},
        {id:"no_stale_batch",label:"No enabled scheduled task is using this user with a stale stored credential",op:"no-enabled-stale-user-task"},
        {id:"network",label:"Normal workstation network connectivity remains available",op:"reachable",target:"10.20.0.20"}
      ]
    }
  }
];

export const SERVICE_DESK_TICKET_MAP=Object.fromEntries(SERVICE_DESK_TICKETS.map(ticket=>[ticket.id,ticket]));

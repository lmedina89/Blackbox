export const FILESYSTEMS = {
  home:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{
        "readme.txt":{type:"file",content:"Welcome to your local machine.\nTry: ls, cd, cat, pwd, whoami, scan, targets, ps, netstat, uname"},
        "notes.txt":{type:"file",content:"Maya said to check email.\nNightWire might be useful for technical rumors."},
        downloads:{type:"dir",children:{}}
      }},
      etc:{type:"dir",children:{"blackbox.conf":{type:"file",content:"terminal=vt100\nscanlines=on\nremote_logging=off"}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"session.log":{type:"file",content:"BLACKBOX initialized successfully."}}}}}
    }}
  },
  archives01:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{guest:{type:"dir",children:{"motd.txt":{type:"file",content:"Northstar Training Archive\nGuest shell active.\nAuthorized training data only."}}}}},
      archive:{type:"dir",children:{"employees.db":{type:"file",content:"EMPLOYEE RECORD\nID: NS-4471\nNAME: MARCUS CARTER\nSTATUS: INACTIVE\nDEPARTMENT: FIELD SYSTEMS\nARCHIVE CLASS: TRAINING"}}},
      logs:{type:"dir",children:{"access.log":{type:"file",content:"03:11 guest login\n03:16 archive read\n03:17 session closed"}}},
      etc:{type:"dir",children:{"issue":{type:"file",content:"Northstar NIX Training Image 3.2"}}}
    }}
  },
  mirror02:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{guest:{type:"dir",children:{
        "readme.txt":{type:"file",content:"Mirror appliance guest shell.\nWeb content lives under /var/www."}
      }}}},
      var:{type:"dir",children:{
        www:{type:"dir",children:{
          "status.txt":{type:"file",content:"MIRROR SERVICE STATUS\nNODE: MIRROR-02\nIMAGE: NORTHSTAR-TRAINING-ARCHIVE-2019\nSTATE: STALE IMAGE ACTIVE\nLAST SYNC: 03:17\nNOTE: automatic retirement flag was not applied."},
          "index.txt":{type:"file",content:"Northstar legacy training mirror. This node is scheduled for retirement."}
        }},
        log:{type:"dir",children:{
          "mirror.log":{type:"file",content:"03:17 sync rejected: retirement flag missing\n03:18 fallback image mounted\n03:19 http service started"}
        }}
      }},
      etc:{type:"dir",children:{"issue":{type:"file",content:"Northstar NIX Mirror Appliance 2.7"}}}
    }}
  }
,
  meridian01:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{support:{type:"dir",children:{"ticket.txt":{type:"file",content:"MERIDIAN SUPPORT TICKET 441\nUser: r.hale\nIssue: project folder disappeared after cleanup job.\nExpected path: /srv/projects/halcyon"}}}}},
      srv:{type:"dir",children:{projects:{type:"dir",children:{"recovery.log":{type:"file",content:"RECOVERY INDEX\nHALCYON -> /srv/recovered/halcyon\nTEMP -> purged\nCACHE -> purged"},recovered:{type:"dir",children:{"halcyon.txt":{type:"file",content:"PROJECT HALCYON\nRecovered document set intact.\nOwner: R. Hale\nStatus: RESTORED"}}}}}}},
      etc:{type:"dir",children:{"issue":{type:"file",content:"Meridian Systems support image"}}}
    }}
  },
  helixedge:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{operator:{type:"dir",children:{"motd.txt":{type:"file",content:"Helix edge diagnostics. Use ip to inspect interfaces."}}}}},
      etc:{type:"dir",children:{"routes.conf":{type:"file",content:"eth0 10.44.2.10/24 gateway 10.44.2.1\neth1 172.20.4.7/24 internal diagnostics"}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"edge.log":{type:"file",content:"21:02 route health OK\n21:04 diagnostics collector 172.20.4.18 reachable\n21:06 customer edge stable"}}}}}
    }}
  },
  helixlog:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{audit:{type:"dir",children:{"readme.txt":{type:"file",content:"Diagnostics archive. Filter large logs instead of reading everything."}}}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"auth.log":{type:"file",content:"18:11 login user=ops source=10.44.2.55\n18:19 login user=svc_old source=10.44.2.99\n18:20 logout user=svc_old\n19:02 login user=ops source=10.44.2.55\n19:44 login user=svc_old source=10.44.2.99\n19:45 logout user=svc_old\n20:31 login user=ops source=10.44.2.55"}, "accounts.txt":{type:"file",content:"ops ACTIVE\nsvc_old DISABLED-HR / ENABLED-SYSTEM\naudit ACTIVE"}}}}},
      etc:{type:"dir",children:{"issue":{type:"file",content:"Helix diagnostic log node"}}}
    }}
  },
  axiomrelay:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{review:{type:"dir",children:{"brief.txt":{type:"file",content:"Review outbound relay configuration. Do not modify production state."}}}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"relay.log":{type:"file",content:"20:10 relay peer=198.51.100.27:443 bytes=8821\n20:12 relay peer=198.51.100.27:443 bytes=9102\n20:14 relay peer=198.51.100.27:443 bytes=9011"}}}}},
      etc:{type:"dir",children:{"relay.conf":{type:"file",content:"peer=198.51.100.27\nport=443\nmode=compat\nlabel=ORBIT-COMPAT\nnode=BBX-NODE-04"}}}
    }}
  }
};

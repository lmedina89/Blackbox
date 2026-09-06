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
      srv:{type:"dir",children:{projects:{type:"dir",children:{"recovery.log":{type:"file",content:"RECOVERY INDEX\nHALCYON -> /srv/projects/recovered/halcyon.txt\nTEMP -> purged\nCACHE -> purged"},recovered:{type:"dir",children:{"halcyon.txt":{type:"file",content:"PROJECT HALCYON\nRecovered document set intact.\nOwner: R. Hale\nStatus: RESTORED"}}}}}}},
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
  },
  evanpc:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{guest:{type:"dir",children:{
        "welcome.txt":{type:"file",content:"EVAN-BOX guest shell\nOld LAN-party machine. If you found this, Evan never disabled the training guest account."},
        "todo.txt":{type:"file",content:"replace dying fan\nmove photos off the old drive\nshut down guest access\nask Chris why COBALT-BBS is still online"}
      }}}},
      shared:{type:"dir",children:{"lanparty.txt":{type:"file",content:"LAN NIGHT NOTES\nCobalt board: 10.91.6.23\nNothing important here. Mostly game patches and old chat logs."}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"connections.log":{type:"file",content:"18:02 guest shell opened\n18:44 filesvc idle\n19:11 fan warning ignored"}}}}}
    }}
  },
  vantaedge:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{webguest:{type:"dir",children:{"welcome.txt":{type:"file",content:"Vanta public web maintenance shell. Read-only training image."}}}}},
      var:{type:"dir",children:{www:{type:"dir",children:{
        "index.txt":{type:"file",content:"VANTA DYNAMICS SUPPORT MIRROR\nPublic status mirror. Internal development content should not be linked here."},
        "deploy.txt":{type:"file",content:"DEPLOY NOTES\npublic=10.72.4.20\nbackend=172.31.8.24:8443\nbackend_label=DEV-02\nDatabase traffic remains internal."}
      }},log:{type:"dir",children:{"proxy.log":{type:"file",content:"20:01 proxy upstream=172.31.8.24:8443 ok\n20:04 proxy upstream=172.31.8.24:8443 ok\n20:08 stale staging route still active"}}}}},
      etc:{type:"dir",children:{"interfaces.conf":{type:"file",content:"eth0 10.72.4.20/24 public\neth1 172.31.8.10/24 development"}}}
    }}
  },
  vantadev:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{build:{type:"dir",children:{"readme.txt":{type:"file",content:"DEV-02 build node. Temporary staging content only."}}}}},
      srv:{type:"dir",children:{builds:{type:"dir",children:{
        "release-notes.txt":{type:"file",content:"VANTA PORTAL BUILD 0.9.14\nKnown issue: test database hostname still hardcoded in diagnostics."},
        "diagnostics.conf":{type:"file",content:"db_host=172.31.8.40\ndb_port=5432\ndb_label=DB-01\ntelemetry=disabled"}
      }}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"build.log":{type:"file",content:"19:42 build passed\n19:43 staging sync complete\n19:44 warning: diagnostics.conf included in package"}}}}}
    }}
  },
  cobaltbbs:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{visitor:{type:"dir",children:{"welcome.txt":{type:"file",content:"COBALT BBS visitor shell\nOld hardware. Old jokes. No guarantees."}}}}},
      var:{type:"dir",children:{bbs:{type:"dir",children:{
        "messages.txt":{type:"file",content:"[oldnet_admin] if you can read this, the board survived another year\n[evm] EVAN-BOX is still louder than a vacuum cleaner\n[orchidtech] moving media backups to 10.55.2.19 this weekend"},
        "motd.txt":{type:"file",content:"COBALT HOBBY NETWORK\nVisitors welcome. Do not treat every address you see as a mission."}
      }},log:{type:"dir",children:{"bbs.log":{type:"file",content:"17:20 visitor login\n17:44 orchidtech posted backup note\n18:02 evm disconnected"}}}}}
    }}
  },
  orchidnas:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{public:{type:"dir",children:{"readme.txt":{type:"file",content:"ORCHID MEDIA public transfer area. Client deliverables belong under /shared/public."}}}}},
      shared:{type:"dir",children:{public:{type:"dir",children:{
        "schedule.txt":{type:"file",content:"ORCHID MEDIA\nMon - product shoot\nTue - edit suite maintenance\nWed - archive migration\nNo confidential client material stored in public transfer area."},
        "about.txt":{type:"file",content:"Small studio archive node. Public share intentionally contains only transfer notes and sample assets."}
      }}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"sync.log":{type:"file",content:"18:00 sync source=10.91.6.23 status=ok\n18:30 public share indexed\n19:00 archive volume offline"}}}}}
    }}
  },
  lumenedge:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{review:{type:"dir",children:{"brief.txt":{type:"file",content:"LUMEN REVIEW\nCompare the public update hostname with the authoritative resolver response. The approved public node is LUMEN-EDGE."}}}}},
      var:{type:"dir",children:{www:{type:"dir",children:{"dns-audit.txt":{type:"file",content:"DNS CHANGE REVIEW\nupdates.lumen.test -> staging-cache.lumen.test\nstaging-cache.lumen.test -> 10.84.2.20\nREQUESTOR: legacy-deploy\nSTATUS: alias removed; public record restored"}}},log:{type:"dir",children:{"access.log":{type:"file",content:"22:04 GET /updates 200\n22:06 resolver check ns1=10.84.2.53\n22:08 legacy alias disabled"}}}}},
      etc:{type:"dir",children:{"issue":{type:"file",content:"Lumen Civic Systems public update gateway"}}}
    }}
  },
  irisgate:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{monitor:{type:"dir",children:{"motd.txt":{type:"file",content:"IRIS overnight monitoring gateway. Inspect interfaces before following operations traffic."}}}}},
      etc:{type:"dir",children:{"interfaces.conf":{type:"file",content:"eth0 10.48.6.12/24 public\nops0 172.26.5.5/24 operations"}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"beacon.log":{type:"file",content:"00:11 ops collector 172.26.5.18 connected\n00:16 legacy heartbeat repeated\n00:21 route stable"}}}}}
    }}
  },
  irisops:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{audit:{type:"dir",children:{"readme.txt":{type:"file",content:"IRIS operations audit node. Use grep to isolate repeated identifiers in overnight.log."}}}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"overnight.log":{type:"file",content:"00:02 route-check id=ops-main status=ok\n00:07 heartbeat id=beacon-legacy source=172.26.5.44\n00:12 heartbeat id=beacon-legacy source=172.26.5.44\n00:17 heartbeat id=beacon-legacy source=172.26.5.44\n00:22 route-check id=ops-main status=ok"}}}}},
      etc:{type:"dir",children:{"accounts.txt":{type:"file",content:"ops-main ACTIVE\nbeacon-legacy RETIRED / DEVICE STILL SCHEDULED\naudit READ-ONLY"}}}
    }}
  },
  irisarchive:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{reader:{type:"dir",children:{"welcome.txt":{type:"file",content:"IRIS public schedule archive."}}}}},
      public:{type:"dir",children:{"retirement.txt":{type:"file",content:"DEVICE RETIREMENT CALENDAR\nbeacon-legacy removal was scheduled for last quarter. Operations scheduler cleanup remains pending."},"routes.txt":{type:"file",content:"Archive copies are informational and do not control live transit systems."}}}
    }}
  },
  harboredge:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{response:{type:"dir",children:{"brief.txt":{type:"file",content:"HARBOR MUTUAL INCIDENT 17\nAn internal claims alias resolves beyond the edge subnet. Inspect interfaces and the internal resolver; preserve the final incident record."}}}}},
      etc:{type:"dir",children:{"resolver.conf":{type:"file",content:"resolver=172.29.14.53\nsearch=harbor.test\ninternal-zone=harbor-int.test"},"interfaces.conf":{type:"file",content:"eth0 10.66.4.16/24 public\ncore0 172.29.14.4/24 internal"}}},
      var:{type:"dir",children:{log:{type:"dir",children:{"proxy.log":{type:"file",content:"01:04 claims.harbor.test lookup requested\n01:05 resolver 172.29.14.53 response cached\n01:06 vault route not present on edge"}}}}}
    }}
  },
  harborresolver:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{dnsops:{type:"dir",children:{"note.txt":{type:"file",content:"Authoritative internal records live under /var/named. Follow aliases carefully; the edge cannot directly reach every returned network."}}}}},
      var:{type:"dir",children:{named:{type:"dir",children:{"harbor.zone":{type:"file",content:"claims.harbor.test CNAME vault-int.harbor.test TTL 300\nvault-int.harbor.test A 172.29.22.40 TTL 300\nmail.harbor.test MX 10 mail-gw.harbor.test TTL 600"}}},log:{type:"dir",children:{"queries.log":{type:"file",content:"01:04 query claims.harbor.test type=CNAME\n01:04 answer vault-int.harbor.test\n01:05 query vault-int.harbor.test type=A\n01:05 answer 172.29.22.40"}}}}}
    }}
  },
  harborvault:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{auditor:{type:"dir",children:{"instructions.txt":{type:"file",content:"Read incident-17.txt and download resolution.txt for the case archive."}}}}},
      cases:{type:"dir",children:{"incident-17.txt":{type:"file",content:"INCIDENT 17\nA retired claims alias remained in an internal DNS zone. The alias pointed to the evidence vault after the public route was removed. No customer records were exposed."},"resolution.txt":{type:"file",content:"RESOLUTION\nRemoved claims.harbor.test CNAME. Preserved resolver logs. Confirmed HARBOR-VAULT remained internal-only. Case closed."}}},
      etc:{type:"dir",children:{"issue":{type:"file",content:"Harbor Mutual evidence vault — authorized simulation archive"}}}
    }}
  },
  quartzbbs:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{visitor:{type:"dir",children:{"welcome.txt":{type:"file",content:"QUARTZ BBS visitor shell. Old boards, public notes, no contracts."}}}}},
      var:{type:"dir",children:{bbs:{type:"dir",children:{"relay-thread.txt":{type:"file",content:"[glasswire] the old board cache still answers\n[packetmoth] label was RELAY-CACHE / 10.73.9.28\n[glasswire] public mirror only; do not confuse it with a job"},"motd.txt":{type:"file",content:"QUARTZ HOBBY NETWORK\nCuriosity is allowed. Rewards are not guaranteed."}}}}}
    }}
  },
  relaycache:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{guest:{type:"dir",children:{"readme.txt":{type:"file",content:"Public cache shell. Content mirrors old community documentation."}}}}},
      cache:{type:"dir",children:{"index.txt":{type:"file",content:"CACHE INDEX\nquartz-board-2004.txt\nresolver-notes.txt\nstatus: read-only"},"resolver-notes.txt":{type:"file",content:"Historic note: a hostname is useful evidence, but resolution, reachability, services, and access are separate questions."}}}
    }}
  },
  junoarchive:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{public:{type:"dir",children:{"about.txt":{type:"file",content:"Juno Open Research public technical archive."}}}}},
      papers:{type:"dir",children:{"dns-history.txt":{type:"file",content:"FIELD NOTE\nA records map names to IPv4 addresses. CNAME records create aliases. MX records identify mail exchangers. TTL describes how long a result may be cached."},"ethics.txt":{type:"file",content:"All examples in this archive use fictional simulation networks."}}}
    }}
  },
  cedarnode:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{guest:{type:"dir",children:{"welcome.txt":{type:"file",content:"CEDAR-NODE home lab guest area."},"uptime.txt":{type:"file",content:"The server wakes for evening backups and may be absent from some scans. Saved targets remain useful when a host rotates out of discovery."}}}}},
      shared:{type:"dir",children:{"lab-map.txt":{type:"file",content:"HOME LAB\nrouter 10.39.7.1\nserver CEDAR-NODE 10.39.7.41\nbackup window 19:00-23:00"}}}
    }}
  }
  ,
  rangeweb01:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{range:{type:"dir",children:{"readme.txt":{type:"file",content:"NightWire Range web node. No interactive shell is required for this exercise."}}}}}
    }}
  },
  rangefile02:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{rangeops:{type:"dir",children:{"proof.txt":{type:"file",content:"NW-RANGE-PROOF-02\nAuthenticated access is not administrative access."},"notes.txt":{type:"file",content:"Range account: ordinary operator privileges only."}}}}},
      root:{type:"dir",access:{minPrivilege:"root"},children:{"admin-only.txt":{type:"file",content:"This file is intentionally outside the RANGE-02 objective."}}}
    }}
  },
  rangeops03:{
    "/":{type:"dir",children:{
      home:{type:"dir",children:{"svc-range":{type:"dir",children:{"readme.txt":{type:"file",content:"Restricted file-service context. Verify privilege before assuming authority."}}}}},
      var:{type:"dir",children:{range:{type:"dir",children:{"policy-note.txt":{type:"file",content:"LOCAL POLICY AUDIT\nThe service context is subject to a simulated privilege-policy defect. Review fictional local profiles."}}}}},
      root:{type:"dir",access:{minPrivilege:"root"},children:{"proof.txt":{type:"file",content:"NW-RANGE-PROOF-03\nFoothold, boundary, elevation, verification."}}}
    }}
  }

};

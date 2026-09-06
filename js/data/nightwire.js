// NightWire private node content and isolated Range curriculum.
// The public NightWire website in NEXUS remains a separate, public-facing mirror.

export const NIGHTWIRE_NODE_POSTS=[
  {
    id:"nw4412",board:"field",number:4412,author:"packetmoth",title:"Enumeration isn't scanning",
    body:[
      "A port number is a starting point, not an answer.",
      "Scanning tells you what appears reachable. Enumeration tells you what is actually speaking, what version it claims to be, and what configuration clues it exposes.",
      "If you skip that step, you're guessing."
    ].join("\n\n")
  },
  {
    id:"nw4418",board:"field",number:4418,author:"routetable",title:"Read failure messages literally",
    body:[
      "Unreachable, refused, and rejected are different failures.",
      "No route means you did not reach the target. Connection refused means the host answered but that service is not accepting you. Authentication failed means you reached the service and your identity was rejected.",
      "Those distinctions are evidence."
    ].join("\n\n")
  },
  {
    id:"nw4421",board:"general",number:4421,author:"glasswire",title:"Access is not authority",
    body:[
      "Getting a session does not mean you own the machine.",
      "Check who you are. Check what you can read. A restricted service account should behave like one."
    ].join("\n\n")
  },
  {
    id:"nw4426",board:"general",number:4426,author:"packetmoth",title:"Range reset etiquette",
    body:[
      "The Range is disposable on purpose. Break the image, learn from the failure, reset it, try again.",
      "Do not confuse a clean reset with a real target forgetting what you did."
    ].join("\n\n")
  }
];

export const NIGHTWIRE_NODE_MESSAGES=[
  {
    id:"nwmsg-welcome",from:"packetmoth",subject:"range access",
    body:"If you're seeing this node, you made it through the old training routes. The Range is isolated. Failed attempts are expected. Read what the system tells you instead of throwing commands at it."
  }
];

export const RANGE_LABS=[
  {
    id:"range01",code:"01",title:"Enumeration Basics",difficulty:"BEGINNER",unlockAfter:null,
    targetIds:["rangeweb01"],
    objective:"Recover the exposed proof artifact without obtaining a shell.",
    brief:[
      "A single web node is mounted in an isolated segment.",
      "Discover it, identify the exposed service, enumerate what is actually running, then test the appropriate fictional BBX profile.",
      "The proof is exposed information; you do not need a login for this box."
    ],
    completion:{type:"artifact",artifactId:"range01-proof"},
    hints:[
      "Start with scan. In the Range, scan output includes service ports so the exercise does not depend on hardware upgrades.",
      "Enumerate the HTTP service before probing it. Try: enum <scan-number> 80.",
      "Use 'probe list' to review the fictional BBX profiles. BBX-014 models backup-artifact exposure.",
      "After a successful probe, 'access artifacts' lists exposed material. Read it with 'access artifact <#>'."
    ]
  },
  {
    id:"range02",code:"02",title:"Credential Foothold",difficulty:"BEGINNER",unlockAfter:"range01",
    targetIds:["rangefile02"],
    objective:"Recover a credential, authenticate to SSH, enter a USER session, and read /home/rangeops/proof.txt.",
    brief:[
      "This node exposes a web service and SSH.",
      "A public-facing mistake leaks access material, but the leaked identity is deliberately limited.",
      "Recover the credential, authenticate, connect, and verify what the account can actually read."
    ],
    completion:{type:"file",hostId:"rangefile02",path:"/home/rangeops/proof.txt"},
    hints:[
      "Scan, then enumerate the web service. Do not start with SSH authentication if you do not know a credential yet.",
      "BBX-014 can expose backup configuration material on a matching simulated service.",
      "Successful probes record credentials automatically. 'access credentials' shows the username and credential ID without revealing the stored secret.",
      "Authenticate with: auth <host-or-scan#> ssh <username>. Then use connect to enter the staged session."
    ]
  },
  {
    id:"range03",code:"03",title:"Privilege Boundaries",difficulty:"INTERMEDIATE",unlockAfter:"range02",
    targetIds:["rangeops03"],
    objective:"Establish a restricted service foothold, recognize the privilege boundary, elevate through a fictional local policy flaw, and read /root/proof.txt.",
    brief:[
      "This host exposes a file service with a simulated boundary error.",
      "The initial foothold is intentionally restricted. Reaching the host is not the same as having administrative authority.",
      "Use local evidence and the fictional profile catalog to cross the final privilege boundary."
    ],
    completion:{type:"file",hostId:"rangeops03",path:"/root/proof.txt"},
    hints:[
      "Enumerate the file service before testing a service-boundary profile.",
      "BBX-021 models a simulated service-boundary misconfiguration and may establish only a restricted foothold.",
      "After connecting, use whoami and try the objective. Permission denied is useful evidence, not a dead end.",
      "BBX-037 is a fictional LOCAL privilege-policy profile. Local profiles must be tested from an established session on the target."
    ]
  }
];

export function rangeLab(ref){
  const token=String(ref||"").trim().toLowerCase();
  return RANGE_LABS.find(lab=>lab.id.toLowerCase()===token||lab.code===token)||null;
}

export function nightwirePost(ref){
  const token=String(ref||"").replace(/^#/,'').trim().toLowerCase();
  return NIGHTWIRE_NODE_POSTS.find(post=>post.id.toLowerCase()===token||String(post.number)===token)||null;
}

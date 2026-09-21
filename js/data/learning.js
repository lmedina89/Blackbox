// Shared learning vocabulary for ThreatDesk, Service Desk, the Range, and later missions.
// These IDs are deliberately stable so authored content can report experience without
// knowing how the learning UI stores or presents it.

export const LEARNING_CONCEPTS=[
  {id:"systems.device_state",domain:"systems",title:"Device state",summary:"Distinguish disabled, disconnected, failed, and healthy hardware states."},
  {id:"systems.services",domain:"systems",title:"Service state",summary:"Recognize when an operating-system service is required for a feature to work."},
  {id:"systems.event_logs",domain:"systems",title:"Event logs",summary:"Use timestamps and system events as evidence instead of guessing from symptoms."},
  {id:"systems.storage",domain:"systems",title:"Storage capacity",summary:"Recognize low-space failure modes, identify safe cleanup targets, and preserve required data."},
  {id:"systems.verification",domain:"systems",title:"Post-change verification",summary:"Confirm that the reported fault is actually gone after making a change."},
  {id:"network.ip_addressing",domain:"network",title:"IP addressing",summary:"Interpret local addresses, subnets, and basic host addressing."},
  {id:"network.dhcp",domain:"network",title:"DHCP",summary:"Understand lease assignment, renewal, and common DHCP failure symptoms."},
  {id:"network.apipa",domain:"network",title:"APIPA",summary:"Recognize 169.254.0.0/16 as an automatic private address commonly associated with failed DHCP."},
  {id:"network.dns",domain:"network",title:"DNS",summary:"Separate name resolution from basic IP connectivity and identify common DNS record roles."},
  {id:"network.gateway",domain:"network",title:"Default gateway",summary:"Understand the gateway's role in reaching networks beyond the local subnet."},
  {id:"network.routing_visibility",domain:"network",title:"Network position & visibility",summary:"Understand that different hosts and interfaces can expose different reachable networks."},
  {id:"security.enumeration",domain:"security",title:"Service enumeration",summary:"Move from 'a port exists' to evidence about the service, version, and configuration."},
  {id:"security.exposed_information",domain:"security",title:"Exposed information",summary:"Recognize backup files, indexes, configuration artifacts, and other unintended disclosures."},
  {id:"security.authentication",domain:"security",title:"Authentication",summary:"Determine whether an identity or credential is accepted by a service."},
  {id:"security.authorization",domain:"security",title:"Authorization",summary:"Determine what an authenticated identity is permitted to access or change."},
  {id:"security.group_membership",domain:"security",title:"Group-based access",summary:"Use group membership and resource permissions to reason about effective access."},
  {id:"security.credentials",domain:"security",title:"Credential handling",summary:"Treat credentials as scoped access material rather than universal keys."},
  {id:"security.privilege_boundaries",domain:"security",title:"Privilege boundaries",summary:"Recognize restricted sessions, permission failures, and changes in authority."},
  {id:"security.failure_evidence",domain:"security",title:"Failure-state evidence",summary:"Distinguish unreachable, refused, rejected, and permission-denied outcomes."},
  {id:"security.least_privilege",domain:"security",title:"Least privilege",summary:"Grant identities only the authority needed for their role."},
  {id:"analysis.evidence_correlation",domain:"analysis",title:"Evidence correlation",summary:"Combine independent observations before drawing a conclusion."},
  {id:"analysis.evidence_preservation",domain:"analysis",title:"Evidence preservation",summary:"Preserve relevant logs and observations before changing a system when investigation matters."},
  {id:"architecture.defense_in_depth",domain:"architecture",title:"Defense in depth",summary:"Use multiple independent safeguards so one failure does not decide the outcome."},
  {id:"architecture.change_control",domain:"architecture",title:"Change control",summary:"Make bounded, attributable changes and verify their effects."}
];

export const LEARNING_TRACKS=[
  {id:"it_foundations",title:"IT Foundations",shortTitle:"IT",description:"Workstation state, services, storage, logs, and disciplined troubleshooting.",concepts:["systems.device_state","systems.services","systems.event_logs","systems.storage","systems.verification","architecture.change_control"]},
  {id:"networking",title:"Networking",shortTitle:"NET",description:"Addressing, DHCP, DNS, gateways, and network visibility.",concepts:["network.ip_addressing","network.dhcp","network.apipa","network.dns","network.gateway","network.routing_visibility"]},
  {id:"security_fundamentals",title:"Security Fundamentals",shortTitle:"SEC",description:"Identity, permissions, least privilege, evidence, and exposed information.",concepts:["security.exposed_information","security.authentication","security.authorization","security.group_membership","security.credentials","security.privilege_boundaries","security.least_privilege","analysis.evidence_correlation"]},
  {id:"offensive_foundations",title:"Offensive Security Foundations",shortTitle:"OPS",description:"Safe fictional practice in enumeration, footholds, failure states, and privilege boundaries.",concepts:["security.enumeration","security.exposed_information","security.authentication","security.authorization","security.credentials","security.privilege_boundaries","security.failure_evidence","network.routing_visibility"]},
  {id:"security_architecture",title:"Security Architecture & Governance",shortTitle:"ARCH",description:"Verification, evidence preservation, defense in depth, and controlled change.",concepts:["security.least_privilege","analysis.evidence_correlation","analysis.evidence_preservation","architecture.defense_in_depth","architecture.change_control","systems.verification"]}
];

const o=(id,label)=>({id,label});

export const THREATDESK_QUESTIONS=[
  {
    id:"q_device_code22",trackId:"it_foundations",difficulty:"FOUNDATION",concepts:["systems.device_state"],type:"single",
    prompt:"Device Manager reports that a network adapter is disabled by the user (Code 22). What should you verify first?",
    options:[o("enable","Whether the adapter can be enabled"),o("replace","Whether the motherboard should be replaced"),o("dns","Whether DNS cache should be cleared")],answer:"enable",
    explanation:"Code 22 indicates a disabled device. Verify and restore the device state before replacing hardware or troubleshooting higher layers."
  },
  {
    id:"q_service_state",trackId:"it_foundations",difficulty:"FOUNDATION",concepts:["systems.services"],type:"single",
    prompt:"IP connectivity works, but a feature depends on a stopped operating-system service. What is the most direct next check?",
    options:[o("service","Confirm the required service state and start it if appropriate"),o("format","Reformat the workstation"),o("router","Replace the default gateway")],answer:"service",
    explanation:"A stopped dependency should be verified at the service layer before unrelated hardware or network changes are made."
  },
  {
    id:"q_event_evidence",trackId:"it_foundations",difficulty:"FOUNDATION",concepts:["systems.event_logs","analysis.evidence_correlation"],type:"multi",
    prompt:"Which TWO observations make an Event Viewer entry more useful during troubleshooting?",
    options:[o("time","Its timestamp lines up with when the symptom began"),o("source","Its source/component matches the affected function"),o("color","The window theme is red"),o("length","The message is the longest entry")],answer:["time","source"],
    explanation:"Timing and component/source correlation turn a log entry into stronger evidence. Visual prominence or message length does not."
  },
  {
    id:"q_verify_after_change",trackId:"it_foundations",difficulty:"FOUNDATION",concepts:["systems.verification","architecture.change_control"],type:"single",
    prompt:"You make a change that should fix a user's issue. What should happen before the ticket is closed?",
    options:[o("verify","Reproduce or verify the original function now works"),o("assume","Assume the change worked because no error appeared"),o("stack","Make several more unrelated changes just in case")],answer:"verify",
    explanation:"A successful change is not the same as a verified resolution. Re-test the reported function before closure."
  },
  {
    id:"q_troubleshoot_order",trackId:"it_foundations",difficulty:"FOUNDATION",concepts:["systems.verification","analysis.evidence_correlation","architecture.change_control"],type:"order",
    prompt:"Put this basic troubleshooting loop in the most defensible order.",
    options:[o("observe","Observe and define the symptom"),o("test","Test the most likely bounded cause"),o("change","Apply the smallest justified change"),o("verify","Verify the original symptom is resolved")],answer:["observe","test","change","verify"],
    explanation:"Start from evidence, test a bounded hypothesis, make the smallest justified change, then verify the original problem."
  },

  {
    id:"lab_dns",trackId:"networking",difficulty:"FOUNDATION",concepts:["network.dns"],type:"single",
    prompt:"Which DNS record maps a hostname directly to an IPv4 address?",
    options:[o("A","A"),o("CNAME","CNAME"),o("MX","MX")],answer:"A",
    explanation:"An A record maps a name directly to an IPv4 address."
  },
  {
    id:"q_cname",trackId:"networking",difficulty:"FOUNDATION",concepts:["network.dns"],type:"single",
    prompt:"Which DNS record aliases one hostname to another hostname?",
    options:[o("A","A"),o("CNAME","CNAME"),o("MX","MX")],answer:"CNAME",
    explanation:"A CNAME points one hostname at another canonical name; it does not directly store an IPv4 address."
  },
  {
    id:"q_apipa",trackId:"networking",difficulty:"FOUNDATION",concepts:["network.apipa","network.dhcp","network.ip_addressing"],type:"single",
    prompt:"A workstation has 169.254.44.17 with no default gateway after boot. Which condition should be high on your list?",
    options:[o("dhcp","It failed to obtain a DHCP lease"),o("dns","Its DNS A record expired"),o("mail","Its mail exchanger is unavailable")],answer:"dhcp",
    explanation:"A 169.254/16 APIPA address commonly appears when a DHCP-enabled host cannot obtain a usable lease."
  },
  {
    id:"q_dns_isolation",trackId:"networking",difficulty:"FOUNDATION",concepts:["network.dns","network.ip_addressing","analysis.evidence_correlation"],type:"multi",
    prompt:"A user can ping an internal server by IP but not by hostname. Which TWO facts does that immediately support?",
    options:[o("ip_path","Basic IP reachability to that server exists"),o("name_problem","Name resolution deserves investigation"),o("router_dead","The default gateway is definitely dead"),o("host_off","The server must be powered off")],answer:["ip_path","name_problem"],
    explanation:"Successful IP reachability narrows the problem. Hostname failure makes name resolution a relevant next layer to inspect."
  },
  {
    id:"q_gateway",trackId:"networking",difficulty:"FOUNDATION",concepts:["network.gateway"],type:"single",
    prompt:"What is the default gateway primarily used for?",
    options:[o("remote","Forwarding traffic toward destinations outside the local subnet"),o("names","Translating hostnames into IP addresses"),o("lease","Issuing DHCP leases")],answer:"remote",
    explanation:"The default gateway is the next hop for traffic that is not local to the host's subnet."
  },
  {
    id:"q_dhcp_order",trackId:"networking",difficulty:"FOUNDATION",concepts:["network.dhcp","network.apipa","systems.verification"],type:"order",
    prompt:"For a DHCP client that is stopped and currently has APIPA, order these recovery steps.",
    options:[o("confirm","Confirm the adapter/link is available"),o("start","Start the DHCP Client service"),o("renew","Renew the DHCP lease"),o("verify","Verify IP, gateway, DNS, and connectivity")],answer:["confirm","start","renew","verify"],
    explanation:"Restore the dependency first, request a new lease, then verify the resulting addressing and connectivity."
  },

  {
    id:"q_authn_authz",trackId:"security_fundamentals",difficulty:"FOUNDATION",concepts:["security.authentication","security.authorization"],type:"single",
    prompt:"A username/password is accepted, but the account cannot read an admin-only file. What does that demonstrate?",
    options:[o("authz","Authentication succeeded while authorization still restricts the account"),o("route","The network route disappeared"),o("dns","DNS authentication failed")],answer:"authz",
    explanation:"Authentication proves who the service accepted; authorization determines what that identity is allowed to do."
  },
  {
    id:"q_least_privilege",trackId:"security_fundamentals",difficulty:"FOUNDATION",concepts:["security.least_privilege","security.authorization"],type:"single",
    prompt:"Which access model best reflects least privilege?",
    options:[o("minimum","Give an account only the permissions required for its task"),o("admin","Give every support account administrator rights to avoid delays"),o("shared","Use one shared root account so permissions are simple")],answer:"minimum",
    explanation:"Least privilege limits authority to what is required, reducing the impact of mistakes or compromise."
  },
  {
    id:"q_evidence_corr",trackId:"security_fundamentals",difficulty:"FOUNDATION",concepts:["analysis.evidence_correlation"],type:"multi",
    prompt:"Which TWO observations are stronger together than either is alone when investigating a suspicious service?",
    options:[o("version","Enumeration reports a specific product/version"),o("log","A matching service log records the same time window"),o("hunch","Someone says the server 'feels hacked'"),o("wallpaper","The desktop wallpaper changed months ago")],answer:["version","log"],
    explanation:"Independent technical observations that agree on component and timing strengthen a conclusion."
  },
  {
    id:"q_backup_artifact",trackId:"security_fundamentals",difficulty:"FOUNDATION",concepts:["security.exposed_information"],type:"single",
    prompt:"A public web directory exposes an old configuration backup containing internal details. What class of problem is this first?",
    options:[o("disclosure","Unintended information disclosure"),o("dos","Denial of service"),o("routing","A routing loop")],answer:"disclosure",
    explanation:"The primary issue is information that should not be publicly exposed, even if it does not immediately grant a shell."
  },
  {
    id:"q_permission_denied",trackId:"security_fundamentals",difficulty:"FOUNDATION",concepts:["security.authorization","security.failure_evidence","security.privilege_boundaries"],type:"single",
    prompt:"You are already connected to a system, but reading a protected file returns 'permission denied.' What is that message evidence of?",
    options:[o("boundary","A privilege/authorization boundary at the requested resource"),o("noroute","No network route to the host"),o("offline","The host is powered off")],answer:"boundary",
    explanation:"The host and session are already reachable. Permission denial is evidence about authority, not reachability."
  },

  {
    id:"lab_route",trackId:"offensive_foundations",difficulty:"FOUNDATION",concepts:["network.routing_visibility"],type:"single",
    prompt:"On a connected fictional host, which command should you use first to inspect its interfaces and network position?",
    options:[o("ip","ip"),o("cat","cat"),o("download","download")],answer:"ip",
    explanation:"Inspecting interfaces shows the host's network position and may explain visibility that HOME-PC does not have."
  },
  {
    id:"lab_access",trackId:"offensive_foundations",difficulty:"FOUNDATION",concepts:["security.failure_evidence"],type:"single",
    prompt:"A fictional host replies to ping but a connection attempt is refused. What is the best conclusion?",
    options:[o("noshell","The host is reachable, but that requested remote service is not accepting the connection"),o("noroute","No route exists"),o("fake","The IP address is fake")],answer:"noshell",
    explanation:"Reachability and service availability are separate facts. A refusal means the host was reached and rejected that connection at the service layer."
  },
  {
    id:"q_enum_vs_scan",trackId:"offensive_foundations",difficulty:"FOUNDATION",concepts:["security.enumeration"],type:"single",
    prompt:"In the BLACKBOX Range, what does enumeration add beyond a broad scan?",
    options:[o("detail","Service/product/version/configuration evidence"),o("magic","Automatic administrator access"),o("delete","A way to erase the target")],answer:"detail",
    explanation:"A scan suggests what is exposed. Enumeration collects more specific evidence about what is actually speaking and how it is configured."
  },
  {
    id:"q_credential_scope",trackId:"offensive_foundations",difficulty:"FOUNDATION",concepts:["security.credentials","security.authentication"],type:"single",
    prompt:"A credential works for one fictional SSH service but is rejected by another host. What should you conclude first?",
    options:[o("scope","The credential may be valid but scoped to a different account, host, or service"),o("universal","All credentials should work everywhere, so the simulator is broken"),o("route","Authentication rejection proves no route exists")],answer:"scope",
    explanation:"Credentials are not universal. Rejection after reaching the service can be evidence of account, host, service, or policy scope."
  },
  {
    id:"q_local_profile",trackId:"offensive_foundations",difficulty:"INTERMEDIATE",concepts:["security.privilege_boundaries","security.authorization"],type:"single",
    prompt:"A fictional profile is marked LOCAL and changes privilege policy. When does testing it make conceptual sense?",
    options:[o("session","After an established session exists on that target"),o("before","Before the target is even reachable"),o("dns","Only after changing its DNS record")],answer:"session",
    explanation:"A local privilege condition is evaluated from an existing foothold on the system, not from an unrelated remote name lookup."
  },
  {
    id:"q_failure_states",trackId:"offensive_foundations",difficulty:"INTERMEDIATE",concepts:["security.failure_evidence"],type:"multi",
    prompt:"Which TWO failure messages prove you reached at least part of the target/service path?",
    options:[o("refused","Connection refused"),o("auth","Authentication rejected"),o("noroute","No route to host"),o("unknown","Unknown target identifier before lookup")],answer:["refused","auth"],
    explanation:"A refusal or authentication rejection requires meaningful contact with the target/service. 'No route' fails earlier."
  },

  {
    id:"q_defense_depth",trackId:"security_architecture",difficulty:"FOUNDATION",concepts:["architecture.defense_in_depth"],type:"single",
    prompt:"Which design best represents defense in depth?",
    options:[o("layers","Independent controls at identity, host, network, and data layers"),o("one","One very strong password protecting everything"),o("hidden","Relying only on keeping the system name secret")],answer:"layers",
    explanation:"Defense in depth uses multiple independent safeguards so one failed control does not determine the entire outcome."
  },
  {
    id:"q_preserve_evidence",trackId:"security_architecture",difficulty:"FOUNDATION",concepts:["analysis.evidence_preservation","architecture.change_control"],type:"single",
    prompt:"During an investigation, why capture relevant logs or observations before making broad changes?",
    options:[o("preserve","Changes can overwrite or alter evidence needed to understand what happened"),o("speed","Screenshots make the computer faster"),o("dns","Logs are required for DNS to function")],answer:"preserve",
    explanation:"Investigation-quality evidence can disappear or change as systems are modified, restarted, or cleaned up."
  },
  {
    id:"q_change_control",trackId:"security_architecture",difficulty:"FOUNDATION",concepts:["architecture.change_control","systems.verification"],type:"multi",
    prompt:"Which TWO habits make troubleshooting changes easier to trust and reverse?",
    options:[o("small","Change one bounded thing at a time when practical"),o("verify","Verify the expected effect after the change"),o("many","Change many unrelated settings simultaneously"),o("memory","Avoid recording what was changed")],answer:["small","verify"],
    explanation:"Bounded changes plus verification make cause/effect clearer and reduce accidental collateral changes."
  },
  {
    id:"q_access_review",trackId:"security_architecture",difficulty:"FOUNDATION",concepts:["security.least_privilege","security.authorization"],type:"multi",
    prompt:"Which TWO findings should trigger an access review?",
    options:[o("stale","A departed employee's account remains active"),o("excess","A service account has administrator rights it does not need"),o("patch","A workstation received an approved patch"),o("uptime","A server has been up for three days")],answer:["stale","excess"],
    explanation:"Stale identities and unnecessary privilege are direct access-control concerns."
  },
  {
    id:"q_response_order",trackId:"security_architecture",difficulty:"INTERMEDIATE",concepts:["analysis.evidence_preservation","analysis.evidence_correlation","architecture.change_control","systems.verification"],type:"order",
    prompt:"Order this small incident-response decision loop.",
    options:[o("scope","Establish what is affected from available evidence"),o("preserve","Preserve the evidence needed for the decision"),o("contain","Apply a bounded containment/change"),o("verify","Verify containment and watch for remaining symptoms")],answer:["scope","preserve","contain","verify"],
    explanation:"Understand scope, preserve what you need, make a bounded response, then verify the result."
  }
];

export const QUESTION_MAP=Object.fromEntries(THREATDESK_QUESTIONS.map(question=>[question.id,question]));
export const CONCEPT_MAP=Object.fromEntries(LEARNING_CONCEPTS.map(concept=>[concept.id,concept]));
export const TRACK_MAP=Object.fromEntries(LEARNING_TRACKS.map(track=>[track.id,track]));

// Existing A4.0 Training Lab completion IDs are preserved exactly so old identities
// keep their prior completed-lab state and timeline semantics.
export const LEGACY_TRAINING_IDS=["lab_dns","lab_route","lab_access"];

export const RANGE_LEARNING_MAP={
  range01:["security.enumeration","security.exposed_information","analysis.evidence_correlation"],
  range02:["security.enumeration","security.exposed_information","security.credentials","security.authentication","security.authorization","security.privilege_boundaries"],
  range03:["security.enumeration","security.authorization","security.privilege_boundaries","security.failure_evidence"]
};

export const SERVICE_DESK_LEARNING_MAP={
  "INC-0001":["systems.device_state","systems.verification","architecture.change_control"],
  "INC-0002":["systems.services","network.dns","systems.verification","analysis.evidence_correlation"],
  "INC-0003":["network.dhcp","network.apipa","network.ip_addressing","network.gateway","systems.services","systems.verification"],
  "INC-0004":["network.ip_addressing","network.gateway","network.routing_visibility","analysis.evidence_correlation","architecture.change_control","systems.verification"],
  "INC-0005":["systems.services","systems.event_logs","analysis.evidence_correlation","architecture.change_control","systems.verification"],
  "INC-0006":["systems.storage","systems.event_logs","analysis.evidence_correlation","architecture.change_control","systems.verification"],
  "INC-0007":["security.authentication","security.authorization","security.group_membership","security.least_privilege","analysis.evidence_correlation","architecture.change_control","systems.verification"],
  "INC-0008":["security.authentication","security.credentials","systems.event_logs","analysis.evidence_correlation","analysis.evidence_preservation","architecture.change_control","systems.verification"]
};

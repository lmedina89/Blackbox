export const THREATS=[
  {id:"td_scan",title:"Observable does not mean complete",severity:"FIELD NOTE",body:"A discovery scan is a time-bound view from one machine. Quiet systems may be absent, saved systems may remain known, and internal systems still require the correct route.",visibleWhen:["threatdesk_online"]},
  {id:"td_lumen",title:"Lumen update alias mismatch",severity:"ADVISORY",body:"Lumen Civic Systems reports that updates.lumen.test briefly followed an unauthorized legacy alias. Resolve the name, preserve the authoritative response, and compare it with the public gateway.",visibleWhen:["lumen_contract_available"],clueId:"lumen_dns_case"},
  {id:"td_iris",title:"Iris overnight heartbeat",severity:"MONITOR",body:"A retired device identifier is still appearing during Iris Transit Cooperative's overnight window. Begin at the public status gateway and follow only routes visible from that machine.",visibleWhen:["iris_contract_available"],clueId:"iris_beacon_case"},
  {id:"td_harbor",title:"Harbor internal alias review",severity:"CASE",body:"Harbor Mutual requested review of a claims alias that resolves beyond its edge subnet. Their internal resolver should establish the authoritative path.",visibleWhen:["harbor_contract_available"],clueId:"harbor_alias_case"},
  {id:"td_juno",title:"Juno opens DNS history archive",severity:"REFERENCE",body:"Juno Open Research published a small public archive explaining A, CNAME, MX, and TTL records through fictional examples.",visibleWhen:["juno_advisory_available"],clueId:"juno_archive_host"},
  {id:"td_harbor_close",title:"Harbor closes Incident 17",severity:"RESOLVED",body:"Harbor Mutual removed the retired internal alias and preserved its resolver evidence. The company reports no exposure of customer records.",visibleWhen:["harbor_world_updated"]}
];

export const FIELD_NOTES=[
  {id:"fn_dns",title:"Names and addresses",body:"An A record maps a name to IPv4. A CNAME points one name at another. MX identifies a mail exchanger. TTL describes cache lifetime."},
  {id:"fn_route",title:"Position changes visibility",body:"A host with two interfaces can reveal a network HOME-PC cannot see. Inspect ip, then scan from the pivot."},
  {id:"fn_services",title:"Reachable is not connectable",body:"Ping reachability, exposed services, and an available remote shell are separate facts."},
  {id:"fn_evidence",title:"Correlate before concluding",body:"Match names, addresses, timestamps, services, and logs. One indicator rarely tells the whole story."}
];

export const LABS=[
  {id:"lab_dns",title:"DNS Basics",question:"Which record maps a hostname directly to an IPv4 address?",options:["A","CNAME","MX"],answer:"A",explanation:"Correct: an A record maps a name to IPv4."},
  {id:"lab_route",title:"Hidden Network",question:"Which command should you use first on a connected host to inspect its interfaces?",options:["ip","cat","download"],answer:"ip",explanation:"Correct: ip shows the host's interfaces and network position."},
  {id:"lab_access",title:"Reachability vs access",question:"A host replies to ping but connect is refused. What is the best conclusion?",options:["No route exists","The host has no available remote shell","The IP is fake"],answer:"The host has no available remote shell",explanation:"Correct: a reachable machine may expose services without offering a shell."}
];

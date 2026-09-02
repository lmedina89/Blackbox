export const EMAILS = [
  {id:"welcome",from:"NEXUS/OS",subject:"Welcome to NEXUS/OS",body:"Your local environment is ready. Remember to back up important files.",visibleWhen:[]},
  {id:"first_job",from:"zero_signal@nightwire.local",subject:"small job. easy money.",body:`Found your handle through a mutual contact.

I need an archived employee record from an abandoned training server.
Start with NightWire. Search for "Northstar archive".

Payment: 250 credits.

— Z`,visibleWhen:["alias_created"]},
  {id:"job_paid",from:"zero_signal@nightwire.local",subject:"paid.",body:"Clean work. 250 credits transferred. There may be more later.",visibleWhen:["mission_first_complete"]},
  {id:"meridian_job",from:"jobs@meridian.local",subject:"contract: recovery index",body:`Small support contract. A project folder disappeared during an automated cleanup. The recovery index should still be on MERIDIAN-01.

NightWire has the old lab address. Confirm whether project HALCYON survived.

Payment: 180 credits.`,visibleWhen:["mission_mirror_complete"]},
  {id:"helix_job",from:"ops@helix.local",subject:"diagnostic review: stale account",body:`We have a retired service identity appearing in diagnostics. Start at HELIX-EDGE.

Do not guess the internal address. Inspect the machine's interfaces and determine what it can actually reach. Filter the authentication log for svc_old.

Payment: 260 credits.`,visibleWhen:["mission_recovery_complete"]},
  {id:"deaddrop_job",from:"packetmoth@nightwire.local",subject:"preserve a config",body:`Axiom is retiring a lab relay. I want its relay.conf preserved before the image disappears.

I posted the node details on NightWire. Inspect the services first, then download the configuration.

Payment: 300 credits.`,visibleWhen:["mission_ghost_complete"]},
  {id:"relay_job",from:"zero_signal@nightwire.local",subject:"one more look at that relay",body:`Before you forget Axiom: look at the active connections, trace what you can, then read the relay configuration carefully.

I'm interested in the label, not the traffic.

Payment: 350 credits.`,visibleWhen:["mission_deaddrop_complete"]},
  {id:"threatdesk_welcome",from:"alerts@threatdesk.local",subject:"ThreatDesk feed activated",body:"Your NEXUS ThreatDesk access is active. Reports, field notes, simulated lookups, and training labs are available from the desktop. All targets and records are fictional.",visibleWhen:["threatdesk_online"]},
  {id:"lumen_job",from:"response@lumen.local",subject:"contract: false name",body:`A retired deployment identity changed the alias for updates.lumen.test. Resolve the name, review the ThreatDesk advisory, and inspect the public gateway's DNS audit.

Payment: 420 credits.`,visibleWhen:["lumen_contract_available"]},
  {id:"lumen_closed",from:"response@lumen.local",subject:"Lumen alias restored",body:"The legacy alias has been removed and the public update record is authoritative again. Your evidence matched our resolver history.",visibleWhen:["lumen_world_updated"]},
  {id:"iris_job",from:"nightops@iris-transit.local",subject:"contract: quiet hours",body:`A retired device ID continues to beacon during the overnight monitoring window. Start with ThreatDesk, enter through IRIS-GATE, inspect its interfaces, and isolate the identifier on the operations log node.

Payment: 520 credits.`,visibleWhen:["iris_contract_available"]},
  {id:"iris_closed",from:"nightops@iris-transit.local",subject:"scheduler entry removed",body:"The retired heartbeat remained in an old device schedule. Operations removed it without disrupting the live route monitor.",visibleWhen:["iris_world_updated"]},
  {id:"harbor_job",from:"incident@harbor.local",subject:"contract: glass harbor",body:`A retired claims alias resolves beyond our edge subnet. Establish the path through the internal resolver, locate the evidence vault, and preserve the resolution record.

Payment: 700 credits.`,visibleWhen:["harbor_contract_available"]},
  {id:"harbor_closed",from:"incident@harbor.local",subject:"Incident 17 closed",body:"The alias was removed, resolver evidence was preserved, and the vault remained internal. Harbor Mutual has closed Incident 17.",visibleWhen:["harbor_world_updated"]}
];

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

Payment: 350 credits.`,visibleWhen:["mission_deaddrop_complete"]}
];

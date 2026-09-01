export const EMAILS = [
  {
    id:"welcome",
    from:"NEXUS/OS",
    subject:"Welcome to NEXUS/OS",
    body:"Your local environment is ready. Remember to back up important files.",
    visibleWhen:[]
  },
  {
    id:"first_job",
    from:"zero_signal@nightwire.local",
    subject:"small job. easy money.",
    body:`Found your handle through a mutual contact.

I need an archived employee record from an abandoned training server.
Nothing glamorous. No damage. Just retrieve the record.

Start with NightWire. Search for "Northstar archive".

Payment: 250 credits.

— Z`,
    visibleWhen:["alias_created"]
  },
  {
    id:"job_paid",
    from:"zero_signal@nightwire.local",
    subject:"paid.",
    body:"Clean work. 250 credits transferred. There may be more later.",
    visibleWhen:["mission_first_complete"]
  }
];

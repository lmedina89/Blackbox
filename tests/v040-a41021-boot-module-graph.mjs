import assert from "node:assert/strict";

await import("../js/ui/desktop.js");

const { SERVICE_DESK_TICKETS, REMOTE_MACHINE_TEMPLATES } = await import("../js/data/serviceDesk.js");
assert.ok(SERVICE_DESK_TICKETS.some(ticket => ticket.id === "INC-0008"), "INC-0008 must remain present");
assert.ok(REMOTE_MACHINE_TEMPLATES["OPS-WS-24"]?.scheduledTasks?.legacyFileSync, "INC-0008 scheduled-task fixture must remain present");

console.log("BLACKBOX v0.4.0 A4.10.2.1 boot/module-graph regression passed");

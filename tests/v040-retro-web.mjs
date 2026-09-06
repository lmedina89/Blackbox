import assert from "node:assert/strict";
import fs from "node:fs";

const desktop=fs.readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
const apps=fs.readFileSync(new URL("../css/apps.css",import.meta.url),"utf8");
const mobile=fs.readFileSync(new URL("../css/mobile.css",import.meta.url),"utf8");

for(const destination of ["MetroWire","FriendSpace","NightWire","Packet Underground","DeadDrop","ByteBarn"])assert.match(desktop,new RegExp(destination));
for(const cls of ["metrowire90","friendspace90","nightwire90","packet90","deaddrop90","bytebarn90"])assert.match(apps,new RegExp(`\\.${cls}`));

// Existing clue/reward action hooks survive the visual rewrite.
for(const hook of ["data-news","news:read","data-social","social:read","data-post","forum:read","data-buy","data-software"])assert.match(desktop,new RegExp(hook));

// Browser chrome has working local history/navigation instead of a permanently disabled back button.
assert.match(desktop,/const browserHistory=\[\]/);
assert.match(desktop,/browserHistory\.push/);
assert.match(desktop,/browserHistory\.pop/);
assert.match(desktop,/data-nav="home"/);
assert.match(desktop,/data-nav="refresh"/);
assert.match(desktop,/siteUrl=/);

// Network/DNS failures produce troubleshooting feedback rather than silently loading pages.
assert.match(desktop,/Local Area Connection is disabled/);
assert.match(desktop,/DNS Client service is not running/);

// A4.5.1 keeps the BLACKBOX palette/component but moves the keyboard into a right-side landscape dock.
assert.match(mobile,/landscape becomes a split workstation/);
assert.match(mobile,/grid-template-columns:minmax\(0,1fr\) clamp\(340px,44vw,560px\)/);
assert.match(mobile,/terminal-keyboard-brand\{display:flex/);
assert.match(mobile,/terminal-key[^}]*min-height:38px;height:38px/);

console.log("BLACKBOX v0.4.0 Alpha 4.5.1 retro web and landscape guards passed");

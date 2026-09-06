import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const desktop=readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
const main=readFileSync(new URL("../js/main.js",import.meta.url),"utf8");
const mobile=readFileSync(new URL("../css/mobile.css",import.meta.url),"utf8");

assert.match(desktop,/selectedMailId/);
assert.match(desktop,/threatDeskView/);
assert.match(desktop,/queueMicrotask\(\(\)=>\{renderScheduled=false;renderOpenApps\(\);\}\)/);
assert.match(desktop,/if\(win\.dataset\.window==="notes"\)continue/);
assert.match(desktop,/data-nav="back"/);
assert.match(desktop,/browserHistory\.pop/);
assert.match(desktop,/document\.querySelector\("#desktop"\)\?\.classList\.contains\("hidden"\)/);
assert.match(desktop,/reconcilePresentedMessageClues\(m\.id\)/);
assert.match(desktop,/mails\.filter\(m=>!s\.world\.readEmails\.includes\(m\.id\)\)\.length/);
assert.match(main,/if\(hasActiveIdentity\(\)\)saveGame\(\)/);
assert.match(mobile,/\.terminal-form\{flex-direction:column;align-items:stretch;gap:2px\}/);
assert.match(mobile,/\.terminal-prompt\{white-space:normal;overflow-wrap:anywhere;word-break:break-word/);

console.log("BLACKBOX v0.3.0 RC4 UI/static repair guards passed");

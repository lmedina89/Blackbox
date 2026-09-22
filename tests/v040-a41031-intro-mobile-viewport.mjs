import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync(new URL("../css/intro.css",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");

assert.match(css,/@media \(max-width:600px\)\{[\s\S]*?\.opening-intro\{[^}]*overflow:hidden/,
  "phone intro overlay should not become the outer scrolling surface");
assert.match(css,/\.opening-intro-shell\{[^}]*height:100%;[^}]*min-height:0;[^}]*max-height:100%;[^}]*overflow:hidden/,
  "phone intro shell should be clamped to the visible overlay height");
assert.match(css,/\.opening-intro-console\{[^}]*flex:1 1 auto;[^}]*min-height:0;[^}]*overflow:hidden/,
  "phone recovery console should shrink when the session brief appears");
assert.match(css,/\.opening-intro-lines\{[^}]*min-height:0;[^}]*overflow-y:auto;[^}]*-webkit-overflow-scrolling:touch/,
  "boot transcript should own any required vertical scrolling on iPhone");
assert.match(css,/\.opening-intro-briefing\{[^}]*flex:0 0 auto;[^}]*max-height:46%;[^}]*overflow-y:auto/,
  "session brief and Continue control should stay inside the viewport");
assert.match(index,/v0\.4\.0 A4\.10\.3\.2 QA/,
  "visible build label should identify the mobile viewport hotfix");

console.log("BLACKBOX v0.4.0 A4.10.3.1 intro mobile viewport regression tests passed");

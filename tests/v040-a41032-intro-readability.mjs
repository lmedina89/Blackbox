import assert from "node:assert/strict";
import fs from "node:fs";

const introCss=fs.readFileSync(new URL("../css/intro.css",import.meta.url),"utf8");
const terminalCss=fs.readFileSync(new URL("../css/terminal.css",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");

for(const [label,color] of [
  ["normal recovery text","#d1dbe0"],
  ["phase labels","#91a9b7"],
  ["OK status","#add8bd"],
  ["warning status","#dec784"],
  ["BLACKBOX status","#9ce7aa"],
  ["final boot line","#eef4f6"],
  ["session brief body","#c9d5dc"],
  ["session brief emphasis","#dce6eb"],
  ["continue button text","#edf4f7"]
]){
  assert.ok(introCss.includes(color),`${label} should use the brighter A4.10.3.2 contrast color ${color}`);
}

// User-requested invariant: readability polish must not weaken the established CRT scanlines.
assert.match(terminalCss,/background:linear-gradient\(transparent 50%,#0005 50%\);background-size:100% 4px/,
  "established BLACKBOX CRT scanline strength/spacing must remain unchanged");
assert.match(index,/v0\.4\.0 A4\.10\.3\.3 QA/,
  "visible build label should identify the readability/contrast hotfix");

console.log("BLACKBOX v0.4.0 A4.10.3.2 intro readability/contrast regression tests passed");

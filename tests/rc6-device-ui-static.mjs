import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mobile=readFileSync(new URL("../css/mobile.css",import.meta.url),"utf8");
const appsCss=readFileSync(new URL("../css/apps.css",import.meta.url),"utf8");
const desktopCss=readFileSync(new URL("../css/desktop.css",import.meta.url),"utf8");
const desktop=readFileSync(new URL("../js/ui/desktop.js",import.meta.url),"utf8");
const apps=readFileSync(new URL("../js/data/apps.js",import.meta.url),"utf8");

assert.doesNotMatch(mobile,/\.taskbar-apps\s*\{[^}]*display\s*:\s*none/,
  "mobile taskbar app buttons are still hidden");
assert.match(mobile,/\.taskbar-apps\{display:flex;[^}]*overflow-x:auto/,
  "portrait taskbar app strip is not visible and horizontally scrollable");
assert.match(mobile,/@media \(orientation:landscape\) and \(max-height:520px\) and \(pointer:coarse\)/,
  "dedicated phone-landscape breakpoint missing");
assert.match(mobile,/grid-template-columns:repeat\(4,minmax\(72px,1fr\)\)/,
  "landscape desktop does not use a reachable multi-column icon grid");
assert.match(mobile,/\.app-window\{[\s\S]*?right:max\(6px,env\(safe-area-inset-right\)\);[\s\S]*?bottom:5px;/,
  "landscape app windows are not constrained to the short viewport");
assert.match(appsCss,/\.notepad-shell\{[^}]*height:100%;[^}]*display:flex;[^}]*flex-direction:column/,
  "Notepad shell does not fill its app window");
assert.match(appsCss,/\.notepad\{[^}]*width:100%;[^}]*flex:1 1 auto;[^}]*box-sizing:border-box/,
  "Notepad editor does not flex to fill remaining app space");
assert.match(apps,/export const BLACKBOX_SHORTCUT/);
assert.match(apps,/A2: sharper single-eye housing/);
assert.match(desktop,/BLACKBOX_SHORTCUT/);
assert.match(desktop,/blackboxIcon\.addEventListener\("click",\(\)=>enterBlackbox\(\)\)/,
  "BLACKBOX desktop shortcut does not launch the existing terminal transition");
assert.match(desktopCss,/\.desktop-icon \.svg-glyph svg\{[^}]*width:44px;[^}]*height:44px/,
  "inline BLACKBOX SVG is not sized as a desktop glyph");

console.log("BLACKBOX v0.3.0 RC6 device UI/static guards passed");

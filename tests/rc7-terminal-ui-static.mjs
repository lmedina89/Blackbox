import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const css=read('css/terminal.css');
const mobile=read('css/mobile.css');
const desktopCss=read('css/desktop.css');
const terminalUi=read('js/ui/terminalUI.js');
const desktopUi=read('js/ui/desktop.js');
const html=read('index.html');
const manifest=JSON.parse(read('build-manifest.json'));

assert.equal(manifest.sourceBaseline?.version,'0.3.0-RC7');
assert.equal(manifest.sourceBaseline?.sha256,'cd05d8fb6994ebf6e9b00a11d25dcfe814ac29c3770e70e5d002a265d216254e');
assert.equal(manifest.saveVersion,13);
assert.equal(manifest.worldSchema,10);

// Fixed shell: BLACKBOX itself owns viewport height, middle history scrolls, form stays outside it.
assert.match(css,/\.blackbox\{[^}]*height:100dvh[^}]*display:flex[^}]*flex-direction:column/);
assert.match(css,/\.terminal-shell\{[^}]*flex:1[^}]*min-height:0[^}]*display:flex[^}]*flex-direction:column[^}]*overflow:hidden/);
assert.match(css,/\.terminal-output\{[^}]*flex:1[^}]*min-height:0[^}]*overflow:auto/);
assert.match(css,/\.terminal-form\{[^}]*flex:0 0 auto/);
assert.match(html,/id="terminal-latest"[^>]*>↓ LATEST<\/button>/);
assert.match(terminalUi,/autoFollow/);
assert.match(terminalUi,/nearLatest\(\)/);
assert.match(terminalUi,/latestButton\.addEventListener\("click"/);

// Semantic palette is meaning-based and safe-DOM rendered, not HTML string injection.
for(const cls of ['semantic-section','semantic-info','semantic-warning','semantic-success','semantic-anomaly','terminal-token.ip','terminal-token.host','terminal-token.unknown','terminal-command-text']){
  assert.ok(css.includes(cls),`missing semantic CSS ${cls}`);
}
assert.match(terminalUi,/function semanticLineClass/);
assert.match(terminalUi,/function renderSemanticText/);
assert.match(terminalUi,/document\.createTextNode/);
assert.match(terminalUi,/span\.textContent=value/);
assert.doesNotMatch(terminalUi,/renderSemanticText[\s\S]{0,900}innerHTML/);

// User-entered command has independent prompt/command spans.
assert.match(terminalUi,/terminal-command-prompt/);
assert.match(terminalUi,/terminal-command-text/);
assert.match(terminalUi,/c\.textContent=raw/);

// Portrait taskbar fits many apps with icon buttons; landscape restores labels.
assert.match(mobile,/@media \(max-width:700px\)[\s\S]*?\.taskbar-app\{[^}]*flex:0 0 42px[^}]*max-width:42px/);
assert.match(mobile,/\.taskbar-app-label\{display:none\}/);
assert.match(mobile,/@media \(orientation:landscape\)[\s\S]*?\.taskbar-app-label\{display:inline/);
assert.match(desktopUi,/taskbar-app-glyph/);
assert.match(desktopUi,/taskbar-app-label/);
assert.match(desktopUi,/task\.setAttribute\("aria-label",title\)/);

// World Intel discovery explicitly tells the player where it lives.
assert.match(desktopUi,/My Computer → World Intel and BLACKBOX "clues"/);
assert.match(desktopUi,/titleText:"WORLD INTEL"/);
assert.match(terminalUi,/Stored in My Computer → World Intel and BLACKBOX "clues"/);

// RC7 terminal/navigation implementation remains present after the v0.4.0 state-schema scaffold.
const stateFiles=['js/systems/terminal.js','js/core/state.js','js/core/migrations.js','js/core/save.js'];
for(const f of stateFiles){
  const data=fs.readFileSync(path.join(root,f));
  assert.ok(data.length>0,`${f} exists`);
}

console.log('BLACKBOX RC7 terminal/navigation compatibility guards passed under v0.4.0 A1');

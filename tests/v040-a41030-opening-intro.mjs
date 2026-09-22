import assert from "node:assert/strict";
import fs from "node:fs";
import { baseState } from "../js/core/state.js";
import { migrateSave } from "../js/core/migrations.js";
import { INTRO_VERSION, shouldPlayOpeningIntro } from "../js/ui/openingIntro.js";

const fresh=baseState();
assert.equal(fresh.ui.introVersionSeen,0,"new identities should begin with an unseen opening sequence");
assert.equal(shouldPlayOpeningIntro(fresh),true,"normal new identities should receive the opening sequence");

const migrated=baseState();
delete migrated.ui.introVersionSeen;
const normalized=migrateSave(migrated);
assert.equal(normalized.ui.introVersionSeen,0,"older saves should normalize intro state without a schema bump");
normalized.ui.introVersionSeen=INTRO_VERSION;
assert.equal(shouldPlayOpeningIntro(normalized),false,"completed intro version should not autoplay again");
normalized.meta.qaMode="nightwire_range";
normalized.ui.introVersionSeen=0;
assert.equal(shouldPlayOpeningIntro(normalized),false,"QA identities should bypass narrative startup");

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/id="opening-intro"/);
assert.match(index,/id="opening-intro-skip"/);
assert.match(index,/id="opening-intro-audio"/);
assert.match(index,/CONTINUE TO NEXUS/);

const audio=fs.readFileSync(new URL("../js\/systems\/audio.js",import.meta.url),"utf8");
for(const sound of ["boot_tick","boot_warn","intro_ambience","nexus_ready","blackbox_boot"]){
  assert.ok(audio.includes(`${sound}()`),`audio palette should include ${sound}`);
}

const intro=fs.readFileSync(new URL("../js\/ui\/openingIntro.js",import.meta.url),"utf8");
for(const text of ["USER PROFILE ......... UNVERIFIED","SESSION RESTORE ...... PARTIAL","BLACKBOX","ORIGIN CHECK ......... NO RESPONSE"]){
  assert.ok(intro.includes(text),`opening sequence should retain planned line: ${text}`);
}
assert.ok(index.includes("Not everything unusual is important."),"session brief should retain the non-omniscient investigation guidance");

const apps=fs.readFileSync(new URL("../js\/data\/apps.js",import.meta.url),"utf8");
assert.match(apps,/id:"startup"/);
assert.match(apps,/desktop:false/);

console.log("BLACKBOX v0.4.0 A4.10.3.0 opening experience/audio foundation tests passed");

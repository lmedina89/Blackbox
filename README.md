# BLACKBOX v0.4.0 A4.10.4.0 QA — World Consistency Foundation

Built directly from the physically accepted A4.10.3.3 mobile-input/banner hotfix. This checkpoint starts the A4.10.4 world-consistency branch without adding new story beats or changing the player-facing investigation flow.

## A4.10.4.0 scope

- Adds a canonical read-only **world registry** covering all 39 campaign hosts, the 5 established Messenger/NightWire people, all 8 Service Desk employees, and all 8 managed Service Desk machines: **60 canonical entities total**.
- Canonical references can be resolved by stable entity ID plus existing host IDs, hostnames, addresses, usernames, handles, and support-machine IDs. This gives future apps one identity layer instead of independently inventing names/addresses.
- Adds persistent, bounded `world.consistency` memory. Cross-app encounters can now record which canonical entities the identity has actually seen, where they were encountered, and when.
- Wires the foundation to existing events only: BLACKBOX host connections/saved targets, Service Desk activity, and Messenger reads. These observations **do not** award clues, set story flags, change missions, or unlock content.
- The encounter ledger is deliberately bounded to 64 first-seen records and 8 source labels per entity so it cannot become another indefinitely growing log.
- Adds registry diagnostics for orphan Service Desk ticket references, machine identity mismatches, and duplicate campaign host addresses. The A4.10.4.0 catalog reports zero integrity issues.
- Fixes one real pre-existing world contradiction discovered while building the registry: HOME-PC was shown as `192.168.1.24` in NEXUS system tools while BLACKBOX/campaign networking canonically used `192.168.1.12`, and `192.168.1.24` already belongs to FAMILY-PC. HOME-PC now consistently uses `192.168.1.12`. Existing identities carrying the old uneditable `.24` default normalize safely to `.12`; other stored addresses are preserved.
- Keeps **SAVE_VERSION 15 / WORLD_SCHEMA 10** unchanged. The new consistency state is additive and normalized for old saves.
- Updates visible/internal build identity to **A4.10.4.0 QA** while keeping the player-facing interactive-shell banner free of the `QA` suffix.

## Intentionally deferred to A4.10.4.1+

- No new ambient messages, fake activity spam, or procedural noise yet.
- No existing Mail/News/FriendSpace/ThreatDesk content has been rewritten to consume registry state yet.
- No Free Investigation clue graph, Findings UI, or A4.11 progression is introduced here.
- No new Service Desk tickets, mission objectives, rewards, BLACKBOX commands, or hidden-player-identity reveals.

## Physical-device acceptance

1. Continue an existing identity and confirm normal startup/desktop behavior is unchanged.
2. Open **Start → System Tools → Command Prompt**, run `ipconfig /all`, and confirm HOME-PC reports `192.168.1.12`.
3. Enter BLACKBOX and confirm the banner reads `INTERACTIVE SHELL 0.4.0-A4.10.4.0` with aligned rails and no `QA` suffix.
4. Connect to an ordinary campaign host and return to NEXUS; confirm no unexpected toast, clue, mission, or story unlock appears.
5. Open Service Desk, interact with a ticket/Remote Assistance, and confirm ticket behavior/scoring is unchanged.
6. Read a Messenger thread and confirm normal read state/timing remains unchanged.
7. Reload and recheck the active identity to confirm existing mission, Service Desk, Range/NightWire, intro, notes, and settings state survives.

## Automated verification

- **41/41 automated suites pass**, including the new world-registry/entity-memory regression and all prior campaign, Service Desk, learning, Range/NightWire, save, terminal, opening, mobile-input, and chronology coverage.
- **100/100 JavaScript/test modules pass `node --check`**.
- Registry diagnostics verify **60 canonical entities** with zero orphan-ticket, machine-identity, or duplicate-campaign-address findings.
- The final ZIP is re-extracted and the complete test/syntax verification set is rerun from packaged bytes before delivery.

## Immediate rollback baseline

`BLACKBOX-v0.4.0-A4.10.3.3-Mobile-Input-Consistency-Terminal-Banner-Hotfix-QA-GitHub.zip`  
SHA-256: `1a0e0ba8c94bccd0359bbc10ee36079b3c15ea84515437f14d50ded99d67e86e`

---

# BLACKBOX v0.4.0 A4.10.3.3 QA — Mobile Input Consistency / Terminal Banner Hotfix

Built directly from A4.10.3.2 after physical iPhone Safari QA found two remaining presentation/input inconsistencies: Service Desk Work Notes invoked the native iOS keyboard instead of the established NEXUS keyboard, and the BLACKBOX terminal version line exposed the internal QA suffix and pushed its right rail out of alignment.

## A4.10.3.3 scope

- Service Desk **Work Notes** now use the same beige **NEXUS PERSONAL KEYBOARD / MODEL N95** interaction model already proven in Notepad on touch devices.
- Touch Work Notes default to NEXUS input, keep the real textarea readonly with `inputmode=none`, and suppress the native mobile keyboard until the player explicitly chooses **SYSTEM KEYBOARD**.
- The Service Desk keyboard starts collapsed so it does not consume ticket space; tapping Work Notes opens it, and **SHOW/HIDE KEYS** remains available.
- Save semantics are unchanged: custom-keyboard typing edits the Work Notes field, while **SAVE NOTE** remains the persistence boundary.
- The player-facing BLACKBOX terminal banner now shows `INTERACTIVE SHELL 0.4.0-A4.10.3.3` without the internal `-QA` suffix; the shortened line restores the right rail to the same 44-character width as the rest of the banner.
- Internal/package QA identity remains intact elsewhere for build tracking.
- No save/schema bump, mission change, Service Desk scoring change, intro behavior change, scanline change, or BLACKBOX command-semantic change.

## Physical QA checklist

1. Open **Service Desk**, accept/select an in-progress ticket, and tap **Work Notes**.
2. Confirm the iOS keyboard does **not** appear and the NEXUS personal keyboard opens instead.
3. Type letters, numbers, punctuation, spaces and a newline; test Backspace, Shift/Caps and cursor arrows.
4. Tap **SAVE NOTE**, move away from the ticket and return; confirm the note persists.
5. Tap **SYSTEM KEYBOARD** and confirm the iOS keyboard opens only then. Switch back to **NEXUS KEYS** and confirm the custom keyboard returns.
6. Open BLACKBOX and confirm the terminal banner has no `QA` text and all left/right rails align.
7. Recheck Notepad and the BLACKBOX secure keyboard to confirm their existing behavior is unchanged.

## Automated verification

- **40/40 automated suites pass**, including the new Service Desk input-consistency / terminal-banner regression and every previous campaign, Service Desk, mission, NightWire/Range, learning, save, terminal, opening, and mobile regression.
- **97/97 JavaScript/test modules pass `node --check`**.
- The final ZIP is re-extracted and the complete verification set is rerun from packaged bytes before delivery.

## Immediate rollback baseline

`BLACKBOX-v0.4.0-A4.10.3.2-Opening-Intro-Readability-Contrast-Hotfix-QA-GitHub.zip`  
SHA-256: `48180ccd45e70ca4bd7653ccff67c88e36e8c8e4bd34875eff1910b7e6c07c30`

---

# BLACKBOX v0.4.0 A4.10.3.2 QA — Opening Intro Readability / Contrast Hotfix

Built directly from the physically accepted A4.10.3.1 mobile-viewport hotfix after iPhone Safari QA confirmed the layout fix and identified only a text-legibility issue against the dark recovery-console presentation.

## A4.10.3.2 scope

- Brightens normal recovery-console text and phase labels without changing font sizing, spacing, timing, layout, or transcript behavior.
- Raises contrast for OK/AVAILABLE green, DEGRADED/UNVERIFIED/PARTIAL amber, BLACKBOX green, the final `DO NOT DISCONNECT.` line, Session Brief body text, and **CONTINUE TO NEXUS**.
- Keeps the existing dark NEXUS recovery palette rather than turning the intro into a bright UI.
- **Does not reduce, soften, remove, or otherwise alter the established CRT/scanline treatment.**
- Does not change intro copy, audio, startup timing, persistence, mobile viewport behavior, Service Desk, missions, BLACKBOX mechanics, Range/NightWire, learning state, SAVE_VERSION 15, or WORLD_SCHEMA 10.
- Updates visible build identity to **A4.10.3.2 QA**.

## Physical iPhone acceptance

1. Replay **Startup Record** or use an identity that has not completed intro version 1.
2. Confirm normal boot lines are easier to read while the screen remains dark and atmospheric.
3. Confirm green OK/AVAILABLE states and amber warning states are clearly distinguishable at normal phone brightness.
4. Confirm the Session Brief paragraphs and **CONTINUE TO NEXUS** are comfortably readable.
5. Confirm the CRT/scanline appearance is unchanged from A4.10.3.1.
6. Confirm the A4.10.3.1 viewport fix remains intact: no whole-page scrolling is required to reach the Session Brief/Continue handoff.

## Automated verification

- **39/39 automated suites pass**, including the new readability/scanline-preservation regression and every previous campaign, Service Desk, mission, NightWire/Range, learning, save, terminal, opening, and mobile-viewport regression.
- **96/96 JavaScript/test modules pass `node --check`**.
- The final ZIP is re-extracted and the full suite is rerun from packaged bytes before delivery.

## Immediate rollback baseline

`BLACKBOX-v0.4.0-A4.10.3.1-Opening-Intro-Mobile-Viewport-Hotfix-QA-GitHub.zip`

SHA-256: `c68b8c534426f7b04104f6bf8a66d6b1c4e18441c421effa0a4a7fad39914769`

---

# BLACKBOX v0.4.0 A4.10.3.1 QA — Opening Intro Mobile Viewport Hotfix

Built directly from A4.10.3.0 after physical iPhone Safari QA showed the recovery transcript expanding the intro shell beyond the visible viewport. The result was outer-page scrolling: later boot lines such as `STATUS ............... AVAILABLE` could drift away from the handoff while **CONTINUE TO NEXUS** remained much farther down the page.

## A4.10.3.1 scope

- Clamps the phone opening-intro shell to the actual fixed overlay instead of allowing its `min-height` to grow with transcript content.
- Makes the recovery console a shrinkable flex region and keeps the boot transcript as the dedicated internal scroll surface.
- Keeps the Session Brief as a bounded footer region, so the final recovery lines and **CONTINUE TO NEXUS** remain in the same phone viewport.
- Retains iOS momentum scrolling inside the transcript/briefing if a short viewport genuinely needs it.
- Changes presentation only: intro copy, timing, audio, persistence, skip/replay behavior, Service Desk, missions, BLACKBOX, Range/NightWire, learning state, SAVE_VERSION 15, and WORLD_SCHEMA 10 are unchanged.
- Updates visible build identity to **A4.10.3.1 QA**.

## Physical iPhone acceptance

1. Replay **Startup Record** or use an identity that has not completed intro version 1.
2. Let the sequence run through `STATUS ............... AVAILABLE`, `ORIGIN CHECK ......... NO RESPONSE`, and `DO NOT DISCONNECT.`
3. Confirm the browser page itself does **not** need to be scrolled to reach the Session Brief.
4. Confirm **CONTINUE TO NEXUS** is visible in the same viewport once the brief appears.
5. If the transcript exceeds available space, confirm only the transcript region scrolls and the Session Brief remains anchored below it.
6. Confirm sound toggle, Skip Startup, replay, and normal NEXUS handoff still work.

## Automated verification

- **38/38 automated suites pass**, including the focused mobile-intro viewport regression and all prior campaign, Service Desk, mission, NightWire/Range, learning, save, terminal, and opening regressions.
- **95/95 JavaScript/test modules pass `node --check`**.
- The final archive is re-extracted and the same full suite is rerun from packaged bytes before delivery.

---

# BLACKBOX v0.4.0 A4.10.3.0 QA — Opening Experience & Audio Foundation

Built directly from the physically accepted A4.10.2.1 boot-hotfix baseline. This checkpoint adds the first-run NEXUS recovery/startup experience as an isolated presentation layer while leaving Service Desk, missions, BLACKBOX intrusion, NightWire/Range, and the learning architecture unchanged.

## A4.10.3.0 scope

- Adds a restrained first-run **NEXUS Recovery Environment** sequence for normal identities. QA identities intentionally bypass it.
- Preserves the hidden-player-identity mystery: the sequence uses ambiguous recovery/session language and does **not** reveal that the player is AI.
- Adds synchronized audio cues to the existing Web Audio system instead of creating a second audio engine:
  - `boot_tick` for normal initialization steps;
  - `boot_warn` for degraded/unverified/partial states;
  - `intro_ambience` for restrained electrical startup texture;
  - the existing `blackbox_boot` signature when BLACKBOX is first detected;
  - `nexus_ready` for the handoff into the desktop.
- Reuses the existing audio preference and iPhone AudioContext recovery path. The startup screen includes a sound toggle and does not bypass the player's global sound preference.
- Adds **SKIP** and **CONTINUE TO NEXUS** controls. Reduced-motion users receive compressed timing rather than forced animation.
- Adds persistent `ui.introVersionSeen` state, normalized by the existing migration layer without a SAVE_VERSION or WORLD_SCHEMA bump. Existing normal identities see the new intro once after upgrade; QA identities do not.
- Adds **Start → System Tools → Startup Record** so the opening can be replayed later without mutating story, ticket, mission, or world state.
- Keeps startup presentation isolated in `js/ui/openingIntro.js` and `css/intro.css`; gameplay systems do not depend on intro timing.
- Updates visible build identity to **A4.10.3.0 QA**.

## Physical-device acceptance

1. Continue a normal existing identity and confirm the opening runs once before the desktop.
2. Confirm boot lines remain readable in iPhone portrait and the page does not unexpectedly zoom or horizontally scroll.
3. With sound enabled, confirm restrained boot ticks/warnings, the existing BLACKBOX boot signature, message cue, and final NEXUS-ready cue align with visible events.
4. Toggle **SOUND OFF** during the intro and confirm later intro sounds stop; toggle it back on and confirm the existing global audio preference remains coherent on the desktop.
5. Use **SKIP** and confirm the desktop appears cleanly and the intro does not autoplay again on the next reload.
6. Let the sequence complete, read the short session brief, then choose **CONTINUE TO NEXUS** and confirm the normal desktop/campaign state is unchanged.
7. Reload and confirm the intro does not autoplay a second time for that identity.
8. Open **Start → System Tools → Startup Record → REPLAY STARTUP SEQUENCE** and confirm replay works without changing missions, Service Desk, NightWire/Range, credits, time, or BLACKBOX state.
9. Create/use the NightWire QA identity and confirm it bypasses the narrative startup.
10. Background/foreground Safari once, then replay the intro from Startup Record and confirm audio recovers on the trusted tap.

## Automated verification

- **37/37 automated suites pass** after recovery.
- **94/94 JavaScript/test modules pass `node --check`**.
- Local HTTP smoke confirms `index.html`, `js/ui/openingIntro.js`, and `css/intro.css` are served from the repo-root structure.
- The container Chromium policy blocks localhost/file navigation, so physical Safari remains the final visual/audio acceptance target.

## Deferred intentionally

- No world-registry/background-noise changes yet; those remain A4.10.4.
- No Free Investigation/clue graph yet; that remains A4.11.
- No Act II reveal, AI-identity reveal, multiplayer, leaderboards, or procedural investigation content.
- No new Service Desk tickets in this checkpoint.

## Rollback baseline

A4.10.2.1 remains the immediate rollback baseline:

`BLACKBOX-v0.4.0-A4.10.2.1-Boot-Hotfix-QA-GitHub.zip`

SHA-256: `74ba00dedcde7958d3eaf9c280f7eb6ce5e15b74b849fef45867293fd8165d1f`

---

# BLACKBOX v0.4.0 A4.10.3.0 QA — Opening Experience & Audio Foundation

Built directly from the accepted A4.10.2.1 boot-hotfix baseline. This checkpoint introduces the first integrated opening/recovery sequence while keeping Service Desk, missions, BLACKBOX intrusion, NightWire/Range, ThreatDesk, save data, and world behavior unchanged.

## A4.10.3.0 scope

- Adds a first-run **NEXUS Recovery Environment** sequence for normal identities.
- Existing normal identities that have never seen intro version 1 receive it once on their next Continue; future launches go directly to NEXUS.
- New identities receive the opening immediately after alias creation.
- Development/QA NightWire identities bypass the narrative opening so Range testing remains fast.
- Adds persistent `ui.introVersionSeen` state without changing **SAVE_VERSION 15 / WORLD_SCHEMA 10**. Older saves normalize safely to version `0` and are not wiped.
- Adds a restrained recovery-console script with `USER PROFILE: UNVERIFIED`, `SESSION RESTORE: PARTIAL`, limited network access, BLACKBOX detection, an ambiguous origin-check failure, and `DO NOT DISCONNECT.`
- Ends with a short NEXUS Operations session brief that establishes the intended mindset: notice patterns, learn the environment before making assumptions, and remember that not everything unusual is important.
- Adds **Skip Startup** and an intro-local **Sound On/Off** control.
- Adds **Start → System Tools → Startup Record** so the sequence can be replayed later without changing story, mission, Service Desk, or BLACKBOX state.
- Reuses the existing Web Audio system and adds only four related cues: `boot_tick`, `boot_warn`, `intro_ambience`, and `nexus_ready`.
- Reuses the existing `blackbox_boot` signature when BLACKBOX is detected so the intro fits the game's existing sonic language.
- Preserves the existing iOS AudioContext recovery path; the intro does not create a second audio engine.
- Respects reduced-motion preferences by shortening presentation delays while retaining the same information and controls.

## Design intent

The first-play interpretation should be a partially recovered corporate/security workstation session, not an obvious AI/simulation reveal. The opening uses ambiguous system language that can gain a second meaning later, but avoids neural-model terminology, sentience claims, horror stingers, or an omniscient narrator. NEXUS remains clean and utilitarian; BLACKBOX keeps the slightly rougher low-frequency/noise signature already established by `blackbox_boot`.

## Physical-device acceptance

1. Continue a normal identity that has not seen intro version 1 and confirm the recovery sequence appears before the desktop.
2. Confirm startup text remains readable in iPhone portrait with no horizontal overflow.
3. Confirm boot checks make subtle matched sounds when sound is enabled.
4. Confirm warning lines use a restrained different cue and BLACKBOX detection uses the familiar BLACKBOX boot signature.
5. Toggle **SOUND ON/OFF** during the sequence and confirm audio changes without interrupting progression.
6. Tap **SKIP STARTUP** during boot and confirm NEXUS opens normally and the intro does not autoplay again after reload.
7. Create a new identity and confirm the intro runs after alias creation.
8. Confirm the QA NightWire identity still enters the desktop directly.
9. Open **Start → System Tools → Startup Record**, replay the opening, and confirm replay does not modify missions, tickets, Range, BLACKBOX sessions, credits, or world state.
10. Confirm **CONTINUE TO NEXUS** transitions cleanly and normal notifications appear afterward.
11. Reload and confirm completed intro state persists with A4.10.2.1 gameplay/save data intact.
12. Recheck one mission, INC-0008, NightWire Range, local CMD, and BLACKBOX boot for shared UI/audio regressions.

## Deferred intentionally

- No A4.10.4 world registry/background-noise systems yet.
- No Free Investigation clue graph or Findings UI yet.
- No Act II reveal or explicit explanation of the player's identity.
- No background music; sound remains contextual cues plus restrained electrical ambience.
- Intro copy/timing can receive a later A4.10.3.x physical-QA polish pass.

## Automated verification

- **37/37 automated suites pass** in the working tree, including the new opening-state/audio/static regression and all prior campaign, Service Desk, mission, NightWire/Range, learning, save, terminal, and UI suites.
- **94/94 JavaScript/test modules pass `node --check`** before packaging.
- Local HTTP smoke checks confirm the new versioned index and opening-intro module are served from the repo root.
- The final ZIP is re-extracted and the full suite is rerun from packaged bytes before delivery.

## Rollback baseline

A4.10.2.1 remains the immediate rollback baseline:

`BLACKBOX-v0.4.0-A4.10.2.1-Boot-Hotfix-QA-GitHub.zip`

SHA-256: `74ba00dedcde7958d3eaf9c280f7eb6ce5e15b74b849fef45867293fd8165d1f`

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

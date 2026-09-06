# BLACKBOX v0.4.0 Alpha 2 — Living-World Scheduler Engine

Built from the verified **v0.4.0 Alpha 1 Compatibility Foundation** (`6829621dab4ec36fe65ee66cebe64d3aeccab72d3149feefde05aeb94ff6091a`), which itself was built directly from exact v0.3.0 RC7 SHA-256 `cd05d8fb6994ebf6e9b00a11d25dcfe814ac29c3770e70e5d002a265d216254e`.

This milestone intentionally adds **no new missions, Help Desk tickets, ambient conversations, Act II story beats, or migrated mission-critical mail**. It proves the scheduler machinery before current content depends on it.

## Alpha 2 changes

- Adds the new persistent living-world scheduler engine alongside the existing v0.3 world-event path.
- Preserves all 11 current `WORLD_EVENTS` on their exact existing `afterActions` / `actionTick` semantics.
- Adds scheduler timing modes for `afterMinutes`, `timeWindow`, `afterEvent`, `afterActions`, and explicit absolute game time.
- Supports ordinary daytime windows and overnight windows such as 22:00–02:00.
- Persists scheduled delivery times so save/reload never rerolls a conversation or world event.
- Preserves the original scheduled timestamp during catch-up, so overdue content does not all acquire the same return-time timestamp.
- Adds declarative prerequisites for flags, missions, clues, prior delivered/expired/cancelled content, dialogue choices, read state, and day bounds.
- Adds cancellation, expiration, and replacement handling for stale conversations/content.
- Distinguishes content delivery from content reading; scheduling a message cannot discover a clue or start a read-triggered mission.
- Adds `content:cancelled` to autosave boundaries so stale-content state persists immediately.
- Hardens scheduler state normalization so malformed scheduled entries cannot poison an otherwise runnable save.
- Keeps the live scheduled-content catalog empty in Alpha 2. Existing Mail, Messenger, News, Social, NightWire, ThreatDesk, and mission-critical content still use their proven legacy visibility paths.

## Compatibility target

The existing nine-case campaign must remain mechanically identical while the new timeline engine is proven. No current mission ID, objective ID/target, reward, host, clue, dialogue choice, or contract-read trigger is changed in Alpha 2.

## Automated verification for Alpha 2

- Every JavaScript and test module passes `node --check`.
- Existing smoke/regression/campaign/audio/device/RC7 terminal guard suites pass.
- `tests/v040-foundation.mjs` remains green.
- New `tests/v040-timeline.mjs` verifies persistent scheduling, no reload rerolls, daytime and overnight windows, event-relative delivery, action-delay mode, cancellation/replacement, expiration, chronological catch-up timestamps, read prerequisites, and malformed scheduler-state normalization.
- The continuous nine-case campaign still completes with the existing expected 3,080 credits / 50 reputation result.

## Next safe milestone

Alpha 3 should migrate only a **small, non-mission-critical sample of ambient content** onto this scheduler first. Mission-starting emails and the existing Old Mirror reply path should remain on the legacy path until scheduled ambient content has passed save/load and iPhone testing.


---

## RC7 baseline notes retained for reference

# BLACKBOX v0.3.0 — The Wider Net

**RC7 candidate:** focused terminal/readability and mobile-taskbar polish built directly from the exact RC6 candidate (SHA-256 `1bfd86ac94844e9f53a25c900bb5dfed858d98c0f41f0f53a498ea88aa89faf6`) after on-device testing confirmed the RC6 responsive layout and BLACKBOX shortcut. RC7 adds semantic terminal colors, a fixed BLACKBOX status header, an independently scrollable terminal history with pinned prompt and Latest control, compact portrait taskbar restore icons, and clearer World Intel destination feedback. Missions, saves, progression, host topology, content, command syntax, rewards, and network behavior are unchanged.

Built from the exact stable **v0.2.3.4** iPhone-tested package. v0.3.0 is a major playable expansion that preserves the original six-investigation sequence and expands BLACKBOX into a larger, changing fictional network.

## What is new

- **Dynamic scans:** each scan can reorder its results, while optional membership rotates on a saved world cadence. Current mission targets are pinned only when the active objective requires them.
- **36-host world:** the persistent simulation now contains public infrastructure, internal pivots, hobby systems, home labs, resolvers, mail nodes, archives, ordinary devices, and harmless dead ends. One scan never dumps the whole world.
- **Explicit target syntax:** use `connect scan <#>` for a recent scan result and `connect target <#>` for Saved Targets. Ambiguous bare numbers produce an explanation instead of silently selecting the wrong list.
- **Simulated DNS:** `nslookup` supports fictional A, CNAME, and MX records. Case-specific records are gated to the appropriate contract/network context; DNS can identify an UNKNOWN host, but it does not grant reachability or shell access.
- **NEXUS ThreatDesk:** a normal-desktop app with a Threat Feed, fictional Lookup Tools, concise Field Notes, and three optional Training Labs.
- **Three investigations:** False Name, Quiet Hours, and Glass Harbor apply DNS, scanning, interfaces, internal routes, log filtering, evidence reading, and downloads.
- **Living world:** eleven persistent events pace new contracts, replies, stories, messages, advisories, and optional leads through meaningful actions and game time. Harmless terminal toggling does not fast-forward the world clock.
- **Progression:** FastLink 100 widens scans and service detail; the RAM upgrade unlocks LogScope; the CPU upgrade unlocks Resolver Pro; storage still expands evidence capacity.
- **Unread feedback:** relevant desktop apps show visible numeric badges, while important changes also remain available after the notification disappears.

## RC7 terminal and navigation polish

- **Semantic BLACKBOX palette:** green remains the primary identity; cyan marks network/intel structure, amber marks caution/unknown states, red marks errors and denied actions, pale text separates typed commands, and violet is reserved for rare anomalous BLACKBOX events. IP addresses, hostnames, ports, quoted commands, and UNKNOWN scan entries receive consistent token styling.
- **True terminal viewport:** the compact BLACKBOX status header stays visible, terminal history scrolls independently, and the command prompt remains pinned at the bottom. When the player manually scrolls upward, new output no longer yanks the view back down; a `↓ LATEST` control returns to current output.
- **Compact portrait taskbar:** open/minimized NEXUS apps use icon-sized restore buttons in portrait so more than two remain visible. Desktop and phone landscape retain icon + label buttons.
- **World Intel routing feedback:** discovery toasts now explicitly say that optional World Intel is stored in `My Computer → World Intel` and available through BLACKBOX `clues`.

## RC6 device-polish repairs

- **Long-background Safari audio recovery:** when iOS backgrounds or page-suspends BLACKBOX, the old Web Audio graph is treated as stale even if Safari later reports it as `running`. The next trusted tap/key gesture retires that graph, creates a fresh context, restores the master gain, and resumes sound without loading a save.
- **Visible phone taskbar apps:** portrait no longer hides open/minimized app buttons. The center task strip scrolls horizontally while Start, sound, and clock remain available.
- **Intentional phone landscape:** coarse-pointer landscape screens with short height keep a compact multi-column desktop, viewport-fitted app windows, smaller browser chrome, and reachable app/taskbar controls instead of falling back to desktop geometry.
- **Notepad mobile sizing:** the editor now owns the full content width/height rather than using Safari's intrinsic textarea width.
- **BLACKBOX desktop shortcut:** the approved single-eye A2 SVG is embedded directly as vector markup and launches the existing BLACKBOX terminal transition. The Start-menu launcher remains available.

## Core sequence

The original progression remains intact:

1. Easy Money
2. Old Mirror
3. Recovery Index
4. Ghost Account
5. Dead Drop
6. The Relay
7. False Name
8. Quiet Hours
9. Glass Harbor

The three new cases arrive gradually after The Relay. Existing v0.2.3.4 identities resume from their real completion, choice, read, target, clue, download, and relationship state; completed work is not replayed.

## Useful commands

```text
scan
connect scan 0
targets
connect target 0
target add scan 0
nslookup updates.lumen.test
nslookup lumen.test MX
ip
services
netstat
traceroute <host>
grep <text> <file>
download <file>
```

The resolver never contacts real DNS. Every address, hostname, organization, person, service, and network in the game is fictional simulation data.

## Save compatibility

- SAVE_VERSION: **9**
- WORLD_SCHEMA: **9**
- Profile format: **1**
- Automatic migration: v0.2.3.4 save 8 → v0.3.0 save 9
- Stable IDs prevent event redelivery after save, reload, app reopening, or identity restoration.

The original v0.2.3.4 ZIP and the audited RC2 candidate are not modified by this release and remain rollback checkpoints.

## Verification

Run the deterministic gameplay suites with:

```text
node tests/smoke.mjs
node tests/rc4-regression.mjs
node tests/rc4-campaign.mjs
node tests/audio-rc4.mjs
node tests/audio-rc5-gesture.mjs
node tests/audio-rc6-background.mjs
node tests/rc6-device-ui-static.mjs
node tests/rc7-terminal-ui-static.mjs
```

Together they verify migration, unique host addressing, filesystem and service-process coverage, scan variation, mission-target reliability, explicit numeric namespaces, post-command save/reload behavior, contextual objective rejection, semantic anti-spam equivalence, clock-poll-invariant event timing, safe mutable-text boundaries, all nine investigations, full-storage mandatory evidence, corrupt/future-save handling, purge lifecycle safety, storage-write failures, DNS fact matching, migrated Messenger clue recovery, and instrumented Web Audio interruption/closed-context recovery.

Automated JavaScript syntax checks and all campaign/regression/UI/audio suites pass in the release workspace, including the RC5 gesture-retry regression and the RC6 stale-`running` long-background lifecycle regression and RC7 terminal/navigation static guards. The packaged RC5 ZIP was also extracted and verified byte-identical to the RC5 working tree before RC6 was created. The available container Chromium still blocks local/file navigation by administrator policy, so the new responsive layout and real iPhone/Safari long-background recovery remain direct-device acceptance gates before stable promotion.

## Explicitly deferred

Packet capture/sniffing simulation, multiplayer, procedural missions, free-form AI conversations, real network access, and IPv6 are not part of v0.3.0. Packet analysis remains a strong candidate for a later investigation-focused update.

## Root-ready layout

```text
index.html
README.md
build-manifest.json
css/
js/
tests/
```

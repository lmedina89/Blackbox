# BLACKBOX v0.3.0 — The Wider Net

**RC6 candidate:** focused iPhone device-polish repair built from the exact packaged RC5 candidate (SHA-256 `3e7a1f40b8c7dd324f7cf9bd8e6d2fc04dcdd80db7ccb41dde5110f74fc44e12`). Physical iPhone testing of RC5 confirmed initial sound recovery but exposed a long-background Safari audio failure, hidden portrait taskbar app buttons, desktop-style landscape geometry, and an undersized Notepad editor. RC6 repairs only those device issues and adds the approved BLACKBOX A2 desktop shortcut. Missions, saves, progression, host topology, content, and command behavior are unchanged.

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
```

Together they verify migration, unique host addressing, filesystem and service-process coverage, scan variation, mission-target reliability, explicit numeric namespaces, post-command save/reload behavior, contextual objective rejection, semantic anti-spam equivalence, clock-poll-invariant event timing, safe mutable-text boundaries, all nine investigations, full-storage mandatory evidence, corrupt/future-save handling, purge lifecycle safety, storage-write failures, DNS fact matching, migrated Messenger clue recovery, and instrumented Web Audio interruption/closed-context recovery.

Automated JavaScript syntax checks and all campaign/regression/UI/audio suites pass in the release workspace, including the RC5 gesture-retry regression and the new RC6 stale-`running` long-background lifecycle regression. The packaged RC5 ZIP was also extracted and verified byte-identical to the RC5 working tree before RC6 was created. The available container Chromium still blocks local/file navigation by administrator policy, so the new responsive layout and real iPhone/Safari long-background recovery remain direct-device acceptance gates before stable promotion.

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

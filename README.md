# BLACKBOX v0.4.0 Alpha 4 — Chronology & Conversation State

Built directly from verified **v0.4.0 Alpha 3** SHA-256 `899d4ce1d15feb78c86f30895f17ce981f72f34aec429cca0563d1b2a0c06298`, descended from exact v0.3.0 RC7.

Alpha 4 fixes the chronology defects found during physical iPhone testing before any larger conversation migration occurs.

## Alpha 4 changes

- Adds one canonical effective-time model shared by Messenger/FriendSpace presentation.
- Messenger now renders visible messages chronologically by their real effective timestamp rather than source-array position.
- Scheduled messages use their persisted scheduler delivery time.
- Existing `timeFromEvent` messages use the actual recorded world-event time.
- Legacy event/mission-linked content can infer a stable event anchor from case history.
- Equal-minute messages retain deterministic authored order.
- FriendSpace now withholds non-mission-critical posts whose effective publication time is still in the future.
- FriendSpace renders due posts newest-first.
- Old Mirror's required Sam FriendSpace post remains explicitly legacy-available so presentation chronology cannot block mission progression.
- Adds persistent per-thread conversation state for delivered/presented node, waiting-for-reply, last choice, and future cooldown support.
- Records mission-start timestamps in case history for future coherent event-relative conversations.
- No new missions, rewards, hosts, DNS records, clues, contract emails, ThreatDesk content, or story progression were added.

## Device findings addressed

Physical A3 testing showed Maya's scheduled 18:55 ambient message rendering above an existing 18:46 ThreatDesk line. Alpha 4 sorts by effective time so 18:46 now renders first.

The same test showed FriendSpace displaying 19:26 and 20:08 posts while the NEXUS clock was 19:05. Alpha 4 time-gates non-critical legacy posts so they cannot appear before their publication time.

## Safety strategy

This remains a compatibility-first migration. Existing mission-critical contracts and dialogue are not moved to the scheduler in Alpha 4. The new conversation-state layer is foundation only; larger ambient branching comes after chronology is proven on device.

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

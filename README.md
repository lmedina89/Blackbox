# BLACKBOX v0.3.0 — The Wider Net

**RC2 candidate:** fixes DNS progression gates, the Quartz optional chain, command-spam time advancement, migrated Messenger unread state, event-driven Messenger timestamps, and Resolver Pro diagnostics.

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

The original v0.2.3.4 ZIP is not modified by this release and remains the rollback checkpoint.

## Verification

Run the deterministic gameplay suite with:

```text
node tests/smoke.mjs
```

It verifies migration, unique host addressing, filesystem coverage, scan variation, mission-target reliability, explicit numeric namespaces, anti-spam time behavior, all six established investigations, and all three new investigation paths.

Automated JavaScript syntax checks and the gameplay suite pass in the release workspace. Direct iPhone/Safari feel and layout testing should still be performed on the deployed candidate before replacing the stable public build.

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

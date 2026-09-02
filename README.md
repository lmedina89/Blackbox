# BLACKBOX — v0.1.2.1 Desktop Life & BLACKBOX Polish

This build continues directly from v0.1.0 and preserves the modular, data-driven architecture.

## What changed in v0.1.1.1

- Desktop feels more like a real personal computer rather than a menu shell.
- Desktop apps are now defined in `js/data/apps.js`.
- FriendSpace posts are data-driven in `js/data/social.js`.
- Browser sites have distinct visual identities: MetroWire, FriendSpace, NightWire and ByteBarn.
- Email now tracks unread/read presentation.
- Messenger has a period-style buddy list and conversational history.
- Added a persistent Notepad for player-written clues.
- My Computer now reflects hardware upgrades in its system display.
- BLACKBOX presentation was strengthened with CRT styling and a denser secure-shell boot header.
- Transition sequence is faster, more technical, and remains skippable/reduced-motion friendly.
- Terminal now supports believable shared host state for `uname`, `ps`, and `netstat` in addition to filesystem/network commands.
- Hosts now define processes, services and active connections as data.
- Save version raised to 2 and world schema to 2 with a migration from v0.1.0.

## Playable opening

1. Create an alias.
2. Read normal communications and browse the fake internet.
3. Read the `small job. easy money.` email.
4. Use NightWire to discover ARCHIVES-01.
5. Enter BLACKBOX.
6. Use `scan`, `connect ARCHIVES-01`, `cd /archive`, `ls`, and `cat employees.db`.
7. The mission resolves through emitted world events, pays 250 credits, and changes desktop content.
8. Spend credits at ByteBarn or explore the richer shell state.

## Architecture rule

**Systems contain rules. Data contains the world. UI displays state. Events connect systems. Saves preserve state.**

## Save compatibility

- SAVE_VERSION: 2
- WORLD_SCHEMA: 2
- v0.1.0 saves migrate automatically.

## Run

Serve the folder through a web server because ES modules are used. GitHub Pages is supported.

## v0.1.1.1 mobile hotfix

- iPhone terminal autocapitalization/autocorrect disabled where supported.
- Terminal command names are case-insensitive.
- First job now teaches `scan` then `connect ARCHIVES-01`.
- Added touch-friendly BLACKBOX `DESKTOP` control.
- Improved iOS terminal input zoom/exit recovery.
- BLACKBOX banner narrowed so the right border closes on mobile.
- Nexus Explorer toolbar is horizontally scrollable on narrow screens.
- Added overflow/safe-area handling and first-paint stabilization for mobile.


## v0.1.2 — Desktop ↔ BLACKBOX Gameplay Foundation

- Working BLACKBOX DESKTOP return from local or remote sessions.
- Case-insensitive terminal command names for mobile keyboards.
- Persistent discovered target system with numbered `targets` / `hosts` list.
- `scan` exposes touch-friendly USE actions that preload `connect #` commands.
- Data-driven clue registry shared between desktop investigations and BLACKBOX.
- Case Notes automatically collect discovered hosts and records while preserving player notes.
- Messenger now supports data-driven reply choices and relationship state.
- Added a second playable investigation, **Loose Ends**, beginning through Maya after the first job.
- Added RELAY-02 as a second simulated host with its own services, processes, connections and filesystem.
- Added reactive news/social content after the second investigation.
- Save version 3 / world schema 3 with migration from v0.1.1.1.

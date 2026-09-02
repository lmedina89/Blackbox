# BLACKBOX v0.2.1 — Network Realism & Restore Polish

Built directly from the tested v0.1.2 Desktop ↔ BLACKBOX Gameplay Foundation.

## v0.2.1 goals

This milestone hardens the player-life lifecycle and BLACKBOX session UX before broader v0.2.1 story expansion.

### Profile / identity lifecycle

- The old single flat save is now wrapped in a profile container.
- A profile can hold one active identity plus archived identities.
- Existing v0.1.2 saves migrate automatically into the active identity slot.
- Startup now offers Continue, New Identity, and Archived Identities when applicable.
- Starting a new identity archives the existing active identity first instead of deleting it.
- Restoring an archived identity moves it back into the active slot.

### `purge identity`

From the local BLACKBOX shell:

```text
purge identity
```

BLACKBOX displays the destructive-action warning and requires:

```text
CONFIRM PURGE
```

The active life is archived, not deleted, then BLACKBOX performs an immersive purge sequence and returns to the startup menu. `cancel` aborts a pending purge. Purging is blocked while connected to a remote host.

### Session-safe DESKTOP control

- Local BLACKBOX session: DESKTOP suspends BLACKBOX and returns to NEXUS/OS.
- Remote session: DESKTOP opens a confirmation instead of bypassing the remote session.
- `DISCONNECT & RETURN` uses the normal remote `exit` path before suspending BLACKBOX.
- `CANCEL` keeps the player on the remote host.

### Mission clarity

Terminal actions that complete mission objectives now generate a visible in-shell objective notice. Final objectives are followed by a job-complete notice and payment information. These notices do not force the player out of BLACKBOX, so optional exploration remains possible.

### BLACKBOX banner

The shell banner is wider again and uses responsive sizing so it keeps the stronger original presence without clipping on narrow mobile displays.

## Compatibility

- SAVE_VERSION: 4
- WORLD_SCHEMA: 4
- Profile format: 1
- v0.1.2 flat saves: automatic migration supported
- v0.1.1.x saves: supported through the existing save migrations and then wrapped into the profile format

## Release layout

The GitHub release ZIP is root-ready and contains:

```text
index.html
README.md
build-manifest.json
css/
js/
```


## v0.2.1 direction
BLACKBOX now rewards correct real-world CLI and networking knowledge inside a fully fictional simulated environment. Networking is host-contextual and graph-based: each machine sees only the systems reachable from its own interfaces. The release adds identity-aware prompts, `ip`, `ping`, `traceroute`, `grep`, `find`, `head`, `tail`, `services`, and `download`; use-based Systems/Network/Analysis/Social proficiency; four additional investigations; meaningful evidence storage and scan-detail hardware effects; Packet Underground and DeadDrop; reactive world content; and subtle ORBIT/BBX breadcrumbs.

All targets, addresses, organizations, credentials, routes, and services are fictional/simulated game data.


## v0.2.1 focus
This maintenance/realism release preserves the v0.2.0 mission set and UI while strengthening two areas discovered during on-device QA.

- Archived identities are normalized on restore so Messenger communication state, choices, relationships, and other identity-owned state rebuild correctly.
- `purge identity` remains the literal command; its help description is shortened to `archive & reset`.
- Scans are topology-driven rather than mission-target-driven. Reachable ambient systems can exist before a mission mentions them.
- Reachability, discovery, identification, and shell accessibility are separate concepts.
- Some discovered hosts intentionally appear as `UNKNOWN` until the player learns their identity from a clue.
- A reachable machine can answer `ping` while refusing `connect`, teaching that network reachability does not imply a remote shell.
- HOME-PC has believable local/background infrastructure.
- HELIX-EDGE exposes a populated internal subnet that remains invisible from HOME-PC.

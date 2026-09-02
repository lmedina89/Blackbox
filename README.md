# BLACKBOX v0.2.2 — Targeting & Terminal Polish

Built directly from the exact tested v0.2.1 — Network Realism & Restore Polish release.

## Purpose

v0.2.2 refines the larger simulated network introduced in v0.2.1 without adding another story chapter. The network may contain many ambient systems, while the player's working target list remains intentional and useful.

## Target and discovery architecture

BLACKBOX now separates:
- `seenHosts`: systems observed by a scan or clue.
- `identifiedHosts`: systems whose identity the player has legitimately learned.
- `savedTargets`: the player's persistent working shortlist.
- `terminal.lastScanResults`: temporary indexes from the most recent scan.

Ordinary scan results are not automatically saved. Active-mission hosts are saved automatically when the player finds them, including when a mission starts after the host was already seen. Mission completion does not remove saved targets.

Commands:

```text
targets
target add <host|scan #>
target remove <#>
target info <#>
```

A scan number is temporary. A saved-target number remains stable until a target is removed.

## Scan presentation

Scan records use deliberate multi-line mobile formatting instead of relying on narrow-screen wrapping:

```text
[2] 10.18.3.41
    UNKNOWN · 1 service
```

With FastLink 100 installed, service/port detail is also displayed.

## Services and access

`services [host]` distinguishes reachability from shell access. A reachable gateway, printer, web server, or unknown device can expose network services while still refusing `connect`.

Remote service detail is gated by the FastLink 100 hardware upgrade. The base setup reports a service count; FastLink exposes port/service detail.

## Proficiency feedback

Routine proficiency gains no longer occupy terminal history. They appear as small temporary BLACKBOX notifications. Crossing a proficiency tier produces a larger milestone notification.

Repeatedly spamming the same command does not grant endless proficiency. Learning actions are unique or contextual, such as first use on a new host, discovering a new network context, or applying a command to a new investigation environment.

The `skills` command remains the detailed progression view.

## Mission behavior

The existing v0.2.0/v0.2.1 mission content is preserved. Mission targets are automatically added to Saved Targets when discovered during an active investigation. Random ambient hosts are not added to Case Notes or Saved Targets unless the player chooses to save them.

## Compatibility

- SAVE_VERSION: 7
- WORLD_SCHEMA: 7
- Profile format: 1
- v0.2.1 identities migrate automatically.
- Archived identities are migrated/normalized on load and restore.
- Existing Messenger archive/restore hardening from v0.2.1 is preserved.

## Release layout

The GitHub ZIP is root-ready:

```text
index.html
README.md
build-manifest.json
css/
js/
```

All networking remains a fictional in-game simulation. BLACKBOX does not scan or connect to real systems.

# BLACKBOX v0.2.3 — Free Exploration & Emergent Leads

Built directly from the exact tested **v0.2.2 — Targeting & Terminal Polish** release.

## Purpose

v0.2.3 turns the simulated network into a world the player can investigate even when no job is active. Formal missions remain intact, but they are no longer the only reason for a machine to exist.

The player can now notice an address in MetroWire, NightWire, FriendSpace, Messenger, or a file on another computer and decide independently whether to investigate it. Optional exploration never creates a mission objective or guaranteed reward.

## Free exploration

HOME-PC now has additional ambient routes to several optional systems:

- **EVAN-BOX / 10.33.8.44** — an old personal server mentioned casually by friends.
- **VANTA-WEB / 10.72.4.20** — a Vanta Dynamics public support mirror with a second interface into a development subnet.
- **COBALT-BBS / 10.91.6.23** — a surviving hobby BBS with a visitor shell and old board files.
- **ORCHID-NAS / 10.55.2.19** — a small media studio public transfer node that can be discovered through another optional machine.

These machines are present whether or not the player reads the lead first. A raw scan may therefore show an `UNKNOWN` address that becomes meaningful later.

## Vanta Dynamics exploration chain

VANTA-WEB is a fully optional corporate exploration path. It has both a public interface and an internal development interface. From HOME-PC the internal Vanta subnet is invisible.

After reaching VANTA-WEB, real CLI/networking habits reveal more:

```text
ip
scan
netstat
ls
cat /var/www/deploy.txt
```

The public mirror can expose the existence of **DEV-02 / 172.31.8.24**. From that development node, additional evidence can identify **DB-01 / 172.31.8.40**. **PRINT-07** is also present as ordinary infrastructure.

Nothing in this chain becomes a formal mission. There is no quest marker telling the player to map the network.

## Emergent leads

Optional host information can now originate from multiple parts of NEXUS/OS:

- MetroWire news can contain a technical detail worth noticing.
- NightWire can mention a machine without offering a contract.
- FriendSpace can expose a hostname or address through normal conversation.
- Messenger now has selectable threads for Maya, Sam, and Chris; casual messages can reveal optional systems.
- Files found on one optional computer can point toward another.

The player decides whether to run `scan`, inspect `services`, save a target, connect, or ignore the lead.

## Case clues vs world intel

Formal investigation information remains **Case clues**.

Optional information is stored separately as **World intel**. World intel records only information the player actually learned from a source; it does not turn every scanned host into a case note and does not generate objectives.

The `clues` command groups already-learned information into Case Clues and World Intel. My Computer displays the same separation.

## Saved targets

v0.2.2 target behavior is preserved:

- ordinary ambient hosts do not auto-save;
- active mission targets auto-save when found;
- optional/free-exploration hosts must be manually saved with `target add` if the player wants them kept in the working target list;
- temporary scan indexes remain temporary.

## Networking and progression

The v0.2.2 networking/proficiency rules remain in force. Reachability does not imply shell access, FastLink 100 controls remote service detail, and repeated command spam does not farm proficiency.

The new optional environments provide additional contexts in which the player can naturally practice `ip`, `scan`, `services`, `netstat`, `traceroute`, `ls`, `cd`, `cat`, `grep`, `find`, `head`, and `tail`.

## Compatibility

- SAVE_VERSION: **8**
- WORLD_SCHEMA: **8**
- Profile format: **1**
- v0.2.2 identities migrate automatically from save 7 → 8.
- Existing archived-identity and Messenger-state hardening remains preserved.

## Release layout

The GitHub ZIP remains root-ready:

```text
index.html
README.md
build-manifest.json
css/
js/
```

All hosts, IPs, people, companies, credentials, services, and networks are fictional in-game simulation data. BLACKBOX performs no real network scanning or access.

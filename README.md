# BLACKBOX v0.4.0 A4.10.1.1 QA — NEXUS Desktop & Remote Tool Consistency

Built directly from the physically accepted A4.10.1 Intermediate Service Desk Ticket Pack checkpoint. This is a deliberately small consistency/polish checkpoint: it does not add or change ticket solutions, learning rules, Range behavior, story state, or BLACKBOX intrusion mechanics.

## A4.10.1.1 scope

- Keeps the seven A4.10.1 Service Desk tickets unchanged on the same structured **root cause → evidence → change → verification** engine.
- Removes **Users & Groups** as a ticket-specific remote-desktop icon. It is now a normal secondary administration utility under **Remote Start → System Tools** on every managed workstation.
- Normalizes a read-only identity/access view on every Service Desk workstation so the presence of Users & Groups no longer telegraphs the permissions ticket.
  - ordinary machines expose standard domain/department memberships;
  - machines without delegated rights show that no membership changes are available;
  - `ENG-WS-27` retains the authored delegated Engineering groups/share ACLs required by `INC-0007`.
- Adds a functional Remote Assistance **Start** menu with a consistent System Tools list: My Computer, Command Prompt, Device Manager, Network Connections, Services, Event Viewer, Users & Groups, and NEXUS Firewall.
- Keeps the familiar high-use remote desktop icons for fast troubleshooting while moving secondary identity administration into Start/System Tools.
- Adds a real **local NEXUS/OS Command Prompt** to the main desktop Start menu under **System Tools** without adding another desktop shortcut.
- Local NEXUS CMD provides ordinary workstation diagnostics only: `help`, `hostname`, `whoami`, `ver`, `ipconfig`, `ipconfig /all`, `ipconfig /renew`, `ping`, `nslookup`, `dir`, and `cls`.
- BLACKBOX-only commands such as `scan`, `enum`, `probe`, and `auth` remain unavailable in ordinary NEXUS CMD, preserving the thematic/technical distinction between NEXUS/OS and the BLACKBOX secure environment.
- Local CMD uses the same 16px mobile input protection as Remote Command, avoiding iPhone Safari focus zoom.
- **SAVE_VERSION 15 / WORLD_SCHEMA 10** remain unchanged. Existing A4.10.1 identities upgrade in place; generic identity-tool state is normalized from the existing remote workstation templates/saves.
- A4.10.1 remains the immediate rollback baseline.

## Physical-device acceptance

1. Confirm the main NEXUS Start menu now has clear **Programs** and **System Tools** groupings.
2. Open **Start → System Tools → Command Prompt** on the local NEXUS desktop.
   - confirm it opens as a normal NEXUS/OS window and does not create a new desktop icon;
   - test `hostname`, `whoami`, `ipconfig /all`, and `help`;
   - confirm entering `scan` or another BLACKBOX-only command is rejected as a NEXUS command;
   - confirm tapping the CMD input on iPhone does not zoom the page.
3. Open any Service Desk Remote Assistance session and tap the remote **Start** button.
   - confirm the menu is readable/tappable in portrait;
   - confirm **Users & Groups** is present under System Tools even on a non-permissions ticket;
   - open it on an ordinary ticket and confirm memberships are visible but no delegated group-change controls appear.
4. Reopen `INC-0007` / `ENG-WS-27` and confirm Users & Groups still exposes `ENG-PROJECT-R`, `ENG-PROJECT-RW`, and `DOMAIN-ADMINS` controls plus the Engineering Projects effective-access view.
5. Confirm Users & Groups is no longer sitting on the remote desktop as an obvious one-off clue for the permissions ticket.
6. Verify existing remote desktop icons, Command Prompt, Network, Services, Event Viewer, Firewall, storage cleanup, gateway editing, Activity, Case Review, and ticket completion still behave exactly as A4.10.1.
7. Reload and confirm all existing Service Desk progress and machine state persist.
8. Briefly recheck ThreatDesk, BLACKBOX terminal, NightWire, and Range for regression.

## Deferred intentionally

- No new Service Desk incidents are added here. `A4.10.2` remains reserved for the suspicious-authentication investigation bridge.
- Deterministic ticket variants remain deferred until the authored ticket set is fully accepted on physical devices.
- The short atmospheric NEXUS/BLACKBOX intro remains planned before A4.11 Free Investigation and must not reveal the player's AI nature.

## Automated verification

- **34/34 automated suites pass** in the working tree, including the new A4.10.1.1 local-CMD / remote-tool-consistency regression and all prior Service Desk, learning, Range, campaign, save, terminal, and UI suites.
- **90/90 JavaScript/test modules pass `node --check`.**
- Final ZIP is re-extracted and the full suite is rerun from packaged bytes before delivery.

## Rollback baseline

A4.10.1 remains the immediate rollback baseline:

`BLACKBOX-v0.4.0-A4.10.1-Intermediate-Service-Desk-Ticket-Pack-QA-GitHub.zip`

SHA-256: `be2f6b6c3f9e225828d952e275f7e2af270fe1314afc0aa7ed43f631670a374a`

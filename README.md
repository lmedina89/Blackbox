# BLACKBOX v0.4.0 A4.10.1 QA — Intermediate Service Desk Ticket Pack

Built directly from the physically accepted A4.10.0.1 Mobile Input & Legacy Ticket Migration checkpoint. A4.10.1 deliberately treats the generalized Service Desk engine as frozen infrastructure: the update adds three deeper troubleshooting cases and only the bounded remote-support controls required by those cases.

## A4.10.1 scope

- Keeps all seven Service Desk incidents on the same structured **root cause → evidence → change → verification** engine.
- Adds `INC-0005 — Inventory client cannot sync`, an application/service-dependency case where network reachability remains healthy while the local Northstar Inventory Agent is stopped.
- Adds `INC-0006 — Reports fail to save`, a disk-exhaustion case with a visible system-volume breakdown and bounded cleanup targets. Small unrelated cleanups do not satisfy the authored free-space requirement; the temporary report-export cache is the intended fix.
- Adds `INC-0007 — Project share access denied`, an authorization/group-membership case. Broad `DOMAIN-ADMINS` or read/write access can create effective access, but ticket verification requires the scoped read-only `ENG-PROJECT-R` membership and rejects excessive privilege.
- Extends Remote Assistance rather than creating a second troubleshooting UI:
  - My Computer can display disk use and approved cleanup categories when a machine has authored storage state.
  - Users & Groups appears only on machines with delegated group controls.
  - Command Prompt adds `dir <path>` for system-volume/free-space inspection and share-access reproduction.
  - Services automatically exposes authored application services such as Northstar Inventory Agent and Report Writer.
- Existing Activity telemetry remains the single troubleshooting history. Disk cleanups and group changes are recorded as normal structured Activity events.
- Case Review now includes a **Process** line showing relevant evidence observed, configuration changes, unnecessary changes, and whether explicit verification was recorded. This is preparation for future challenge/leaderboard telemetry, not a new progression system.
- Adds two stable learning concepts: `systems.storage` and `security.group_membership`. The three new tickets feed the existing A4.9 learning engine; Service Desk still contains no separate mastery/scoring model.
- Existing tickets, Range, NightWire, mission/story, intrusion, ThreatDesk question rules, and BLACKBOX terminal mechanics are unchanged.
- **SAVE_VERSION 15 / WORLD_SCHEMA 10** remain unchanged. Existing A4.10.0.1 identities upgrade in place with no save wipe.
- A4.10.0.1 remains the immediate rollback baseline.

## A4.10.1 physical-device acceptance

1. Confirm the A4.10.0.1 iPhone focus-zoom fix still holds in Remote Command, work notes, and the manual gateway field.
2. Complete or open the first four existing Service Desk tickets and verify they behave exactly as before.
3. `INC-0005`:
   - connect to `LOG-WS-05`;
   - confirm `ping 10.20.0.30` succeeds even while the inventory problem remains;
   - inspect Services/Event Viewer;
   - start **Northstar Inventory Agent**;
   - VERIFY and resolve;
   - confirm Case Review records the service root cause and Process telemetry.
4. `INC-0006`:
   - connect to `FIN-WS-19`;
   - inspect My Computer and Event Viewer;
   - confirm the system volume is nearly full and `dir C:\` reports very little free space;
   - clean **Temporary report exports**;
   - VERIFY and resolve;
   - confirm cleanup controls remain readable and easy to tap in portrait.
5. `INC-0007`:
   - connect to `ENG-WS-27`;
   - open **Users & Groups** and reproduce the share failure with `dir \\FILES-02\ENG-PROJECTS`;
   - confirm the correct scoped fix is `ENG-PROJECT-R`;
   - optionally verify that `DOMAIN-ADMINS` does not pass ticket verification even though it can make the share readable;
   - restore the scoped group, VERIFY, and resolve.
6. Confirm Activity remains readable with the new cleanup/group actions and Case Review Process line.
7. Reload and confirm ticket status, machine storage/group state, Activity, Case Reviews, and ThreatDesk applied-learning credit persist.
8. Briefly recheck ThreatDesk, BLACKBOX terminal, Range, and NightWire for regression.

## Deferred intentionally

- Deterministic ticket variants remain deferred until the fixed authored cases have passed physical QA; A4.10.1 does not introduce procedural/random ticket generation.
- `INC-0008` / A4.10.2 is reserved for the suspicious-authentication investigation bridge into Free Investigation.
- The short atmospheric NEXUS/BLACKBOX intro is planned before A4.11 Free Investigation, after the current Service Desk content milestone is stable. It must not reveal that the player is AI.

## Automated verification

- **33/33 automated suites pass** in the working tree, including the new A4.10.1 service/disk/permissions regression plus all prior Service Desk, learning, Range, campaign, save, terminal, and mobile/UI coverage.
- **88/88 JavaScript/test modules pass `node --check`.**
- Final ZIP is re-extracted and the full test suite is rerun from the packaged bytes before delivery.

## Rollback baseline

A4.10.0.1 remains the immediate rollback baseline:

`BLACKBOX-v0.4.0-A4.10.0.1-Mobile-Input-Legacy-Ticket-Migration-QA-GitHub.zip`

SHA-256: `3559cee6670857cfca8a22ee1d5528b479570859dd91f00c7a87c01175a11eb7`

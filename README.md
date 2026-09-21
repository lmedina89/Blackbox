# BLACKBOX v0.4.0 A4.10.0.1 QA — Mobile Input & Legacy Ticket Migration

Built directly from the physically accepted A4.10.0 Service Desk Engine & Routing checkpoint. A4.10.0.1 is intentionally small: it fixes iPhone Safari focus-zoom in editable Service Desk/Remote Assistance fields and finishes migrating the two remaining legacy Service Desk tickets onto the generalized A4.10 troubleshooting schema.

## A4.10.0.1 scope

- Keeps the accepted A4.10.0 Service Desk / Remote Assistance UI and routing-ticket behavior intact.
- Raises the mobile font size of the internal Remote Command input, manual gateway input, and Service Desk work-notes field to **16px** so iPhone Safari no longer auto-zooms the page when those controls receive focus.
- `INC-0002 — Names do not resolve` now declares its root cause, evidence signals, minimum evidence target, and verification conditions through the same structured troubleshooting schema used by INC-0001 and INC-0004.
- `INC-0003 — Limited connectivity after docking` is migrated to the same schema and explicitly verifies DHCP mode, DHCP Client state, a corporate lease, correct gateway, restored DNS configuration, and a completed lease renewal.
- Removes the old ticket-ID-specific verification branches for INC-0002 and INC-0003. All four current Service Desk tickets now use one authored troubleshooting architecture.
- Existing A4.10.0 saves are preserved. Resolved old tickets with the generic `Resolved reported fault` Case Review are enriched in place with the newly authored root-cause label.
- Historical evidence is backfilled only when the player's existing Activity history actually proves it; the update does **not** invent diagnostics the player never performed.
- Existing Activity history, scores, ticket status, machine state, learning credit, Range progress, campaign state, and ThreatDesk progress remain intact.
- **SAVE_VERSION 15 / WORLD_SCHEMA 10** remain unchanged; no save wipe or migration bump is required.
- A4.10.0 remains the immediate rollback baseline.

## A4.10.0.1 physical-device acceptance

1. Open any Service Desk Remote Support session and tap the internal **Command Prompt** input. Confirm iPhone Safari opens the keyboard without zooming the page.
2. Open the INC-0004 manual gateway editor and confirm focusing the gateway field also does not zoom.
3. Tap the Service Desk work-notes field and confirm it remains stable at normal page scale.
4. Re-open resolved INC-0002 and INC-0003 on the existing identity. Confirm their Case Review now identifies the authored DNS/DHCP root cause rather than the generic legacy label.
5. On a clean identity, resolve INC-0002 normally and confirm Case Review reports the stopped DNS Client root cause plus only the evidence actually inspected.
6. Resolve INC-0003 normally. Starting DHCP Client alone must not be enough; renew/repair must obtain a corporate lease before verification passes.
7. Confirm INC-0001 and INC-0004 still resolve exactly as in A4.10.0.
8. Reload and confirm all Service Desk status, Activity, Case Reviews, ThreatDesk learning credit, and campaign progress persist.
9. Recheck BLACKBOX terminal, Range, and ThreatDesk briefly for regression.

## Automated verification

- 32/32 automated test suites pass.
- 87 JavaScript/test modules pass `node --check`.
- New regression coverage verifies all four current tickets use the structured troubleshooting schema, INC-0002/0003 no longer use ticket-specific verification branches, old A4.10.0 case summaries enrich safely, and mobile editable fields retain the 16px iOS focus-zoom guard.

## Rollback baseline

A4.10.0 remains the immediate rollback baseline:

`BLACKBOX-v0.4.0-A4.10.0-Service-Desk-Engine-Routing-QA-GitHub.zip`

SHA-256: `b2ef7619a0cda1423933d3a6b6c8b693d0af784c6aafdccd05bc0a142a06f475`

# BLACKBOX v0.4.0 A4.10.0 QA — Service Desk Engine Expansion & Routing Ticket

Built directly from the verified A4.9.1 ThreatDesk & Mobile Terminal UX hotfix checkpoint. A4.10.0 is the first Service Desk depth checkpoint: it preserves the existing NEXUS Service Desk / Remote Assistance interface, upgrades the existing Activity stream into structured troubleshooting telemetry, introduces declarative root-cause/evidence/verification definitions, and adds one new routing incident as the proving case.

## A4.10.0 scope

- Keeps the current Service Desk workflow intact: **My Queue → ticket → Remote Support → Verify / Resolve / Escalate → Activity**.
- Reuses the existing Activity panel rather than adding a duplicate troubleshooting journal.
- Activity records now carry human-readable labels, action kind, optional details/outcome, and remain backward-compatible with old action entries.
- Changes invalidate stale verification state, so the ticket remembers whether a verification pass occurred after the latest change.
- Structured ticket definitions may now declare a root cause, evidence signals, minimum useful evidence, and declarative verification conditions.
- `INC-0001 — No network connection` is converted to the new schema as the regression proof while preserving its original solution and behavior.
- Adds `INC-0004 — Local network works, remote resources fail` on `ENG-WS-21`.
- `INC-0004` starts with a valid local address but an invalid default gateway outside the local /24; local-subnet traffic works while remote company resources fail.
- Remote Assistance exposes a bounded manual default-gateway editor only on the authored static-IP workstation; existing managed/DHCP machines do not expose that control.
- Automatic **REPAIR** intentionally refuses to rewrite manual TCP/IP configuration, so the new case cannot be solved by a magic repair button.
- Ping routing now distinguishes same-subnet reachability from routed reachability using the workstation's address, subnet, and expected local gateway.
- Closed structured tickets persist a compact **Case Review** containing root cause, evidence actually inspected, changes made, and verification results.
- `INC-0004` reports applied learning evidence for IP addressing, gateways, routing visibility, evidence correlation, bounded change, and verification through the existing A4.9 learning engine.
- Existing identity/save compatibility is preserved: **SAVE_VERSION 15 / WORLD_SCHEMA 10**. No save wipe or migration bump is required.
- Range, NightWire, mission/story, intrusion, ThreatDesk question logic, and A4.9.1 mobile terminal behavior are unchanged.

## A4.10.0 physical-device acceptance

1. Confirm A4.9.1 ThreatDesk, terminal wrapping, keyboard spacing, and Help layout still look correct on iPhone.
2. Resolve `INC-0001` normally and verify its Activity entries are readable rather than raw event tokens.
3. Complete `INC-0002` and `INC-0003`; confirm `INC-0004` appears next.
4. Open `INC-0004` Remote Support → Network. Confirm the machine shows `10.20.40.88 / 255.255.255.0` with gateway `10.20.41.1`.
5. In Command Prompt, run `ipconfig /all`, `ping 10.20.40.20`, and `ping 10.20.0.20`. Local should pass; remote should fail before the gateway fix.
6. Press **REPAIR** and confirm it does not magically rewrite the manual gateway.
7. In Network, change the gateway to `10.20.40.1`. Re-run `ping 10.20.0.20`; it should now pass.
8. Press **VERIFY**, then **RESOLVE**. Confirm the closed ticket shows a Case Review with root cause, evidence, change, and verification.
9. Reload the page and confirm the resolved case, Activity history, and Case Review persist.
10. Confirm no unrelated Range, BLACKBOX campaign, or ThreatDesk progression changed.

## Rollback baseline

A4.9.1 remains the immediate rollback baseline:

`BLACKBOX-v0.4.0-A4.9.1-ThreatDesk-Mobile-Terminal-UX-Hotfix-QA-GitHub.zip`

SHA-256: `73d2830b22a70fef9d1c72234e2d60db3b5a053259432f03fac855ef171779ad`

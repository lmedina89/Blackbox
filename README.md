# BLACKBOX v0.4.0 A4.10.2.1 QA — Suspicious Authentication Investigation


**A4.10.2.1 boot hotfix:** restores application startup by closing the Scheduled Tasks renderer block correctly. No ticket logic, save schema, or investigation behavior changed.
Built directly from the physically accepted A4.10.1.1 NEXUS Desktop & Remote Tool Consistency checkpoint. A4.10.2 is the investigation bridge for the Service Desk milestone: it adds one higher-uncertainty authentication case while preserving the established Service Desk engine, campaign, missions, BLACKBOX intrusion model, NightWire/Range, and save/world schema.

## A4.10.2 scope

- Adds **INC-0008 — Account keeps locking after password change** on `OPS-WS-24`.
  - The user can sign in normally after an unlock, but the account begins locking again every 10–15 minutes.
  - Security events show repeated **batch** authentication failures originating from the same workstation.
  - The actual cause is deliberately mundane rather than a hidden attacker: an obsolete **Legacy File Sync** scheduled task is still using the user's stale stored credential after a password change.
- Extends the existing structured Service Desk flow rather than adding a separate investigation system:
  **root cause → evidence → bounded change → verification → Case Review**.
- Adds an authored **evidence requirement** for investigation-style tickets. INC-0008 can no longer be closed by blindly guessing the corrective action; at least two relevant evidence sources must be correlated before resolution.
- Adds **Scheduled Tasks** as a standard **Remote Start → System Tools** utility on every managed workstation, not as a ticket-specific desktop icon.
  - Every workstation gets a normal NEXUS Update Check task so the tool itself does not telegraph the new ticket.
  - `OPS-WS-24` additionally contains the failing Legacy File Sync task.
  - The task view exposes task name, run-as identity, command, state, and last result; it does not label the stale credential as "the answer."
- Adds read-only `schtasks /query` support to Remote Command Prompt for cross-checking scheduled automation from the CLI.
- Expands the normal Users & Groups view with a standard account-status panel. On the new incident it exposes recent bad-password count, password-change time, failure source, and logon type while remaining present on ordinary machines too.
- Adds task enable/disable changes to the existing Service Desk Activity telemetry and Case Review process accounting. Disabling unrelated healthy tasks is treated as an unnecessary change rather than silently rewarded.
- Verification for INC-0008 requires:
  - the obsolete Legacy File Sync task to be disabled;
  - no enabled scheduled task to remain using the affected user with a stale stored credential;
  - ordinary workstation network connectivity to remain intact.
- ThreatDesk/shared learning receives applied experience for authentication, credential handling, event logs, evidence correlation/preservation, bounded change, and post-change verification.
- `INC-0007` now unlocks `INC-0008`. Existing identities that already completed all seven prior tickets automatically receive the new ticket when A4.10.2 initializes.
- **SAVE_VERSION 15 / WORLD_SCHEMA 10 remain unchanged.** No save wipe or migration bump is required.

## Design intent

This ticket is intentionally less certain than the previous Service Desk cases. The player should initially have several plausible explanations—stale credentials, scheduled automation, forgotten services, or genuinely suspicious access—and use timestamps, source workstation, logon type, and process context to narrow the cause.

The lesson is not "account lockout = attacker." It is **correlate evidence before attributing cause**. That is the behavior we want before A4.11 Free Investigation removes the explicit ticket framing entirely.

## Physical-device acceptance

1. Load an identity that previously completed `INC-0001` through `INC-0007` and confirm **INC-0008** appears automatically without losing prior Service Desk progress.
2. Accept INC-0008 and open Remote Assistance to `OPS-WS-24`.
3. Confirm the remote desktop still has the same common high-use icons as A4.10.1.1; **Scheduled Tasks should not appear as a one-off desktop clue**.
4. Open **Remote Start → System Tools → Scheduled Tasks**.
   - confirm the menu remains usable in iPhone portrait;
   - confirm NEXUS Update Check and Legacy File Sync both appear;
   - confirm task text wraps cleanly without horizontal overflow.
5. Inspect **Event Viewer** and confirm the authentication failures identify:
   - `NEXUS\jmiles`;
   - logon type `Batch`;
   - Task Scheduler as the caller/source context;
   - the local workstation rather than an unexplained remote host.
6. Open **Users & Groups** and confirm the standard Account Status section is readable and does not break the existing INC-0007 membership/ACL controls.
7. In Remote Command Prompt, run `whoami` and `schtasks /query`; confirm both remain readable and the CMD input does not trigger Safari zoom.
8. Confirm simply disabling Legacy File Sync and pressing Resolve **before gathering enough evidence** is rejected with an evidence-correlation message.
9. After inspecting at least two relevant evidence sources, disable only Legacy File Sync, run **VERIFY**, and resolve the case.
10. Confirm Case Review reports the authored root cause, observed evidence, the task change, verification results, and process telemetry.
11. Reload and confirm all eight completed tickets, machine state, ThreatDesk practical-learning state, missions, NightWire/Range, and BLACKBOX terminal state persist.

## Deferred intentionally

- Deterministic ticket variants remain deferred until the authored Service Desk milestone is fully accepted on physical devices.
- No malicious actor or Act II plot reveal is attached to INC-0008; the incident remains a grounded support/security case.
- The short atmospheric NEXUS/BLACKBOX intro remains planned before A4.11 Free Investigation and must not reveal that the player is AI.
- Multiplayer/leaderboards, procedural cases, real-network access, and free-form external targeting remain out of scope.

## Automated verification

- **35/35 automated suites pass** in the working tree, including the new A4.10.2 authentication-investigation regression and every prior Service Desk, learning, mission/campaign, NightWire/Range, save, terminal, audio, and UI suite.
- **91/91 JavaScript/test modules pass `node --check`** before packaging.
- The final ZIP is re-extracted and the full suite is rerun from packaged bytes before delivery.

## Rollback baseline

A4.10.1.1 remains the immediate rollback baseline:

`BLACKBOX-v0.4.0-A4.10.1.1-NEXUS-Desktop-Remote-Tool-Consistency-QA-GitHub.zip`

SHA-256: `868bc047f513832decd2ce99be09b8ad1528f3596d29b5d13078a307813b909f`

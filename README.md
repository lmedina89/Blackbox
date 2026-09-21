# BLACKBOX v0.4.0 A4.9.1 QA — ThreatDesk & Mobile Terminal UX Hotfix

Built directly from the verified A4.9 Learning Architecture & ThreatDesk v2 QA checkpoint. A4.9.1 is intentionally a narrow physical-device hotfix: no Range solutions, Service Desk fault logic, campaign/story progression, learning progression rules, save schema, or world schema are changed.

## A4.9.1 hotfix

- ThreatDesk now labels interaction requirements explicitly: **SELECT ONE ANSWER**, **SELECT N ANSWERS**, or **ORDER ALL STEPS**.
- Multi-select questions require the exact authored number of choices before grading. Too few or too many selections produce validation feedback and do **not** record a false incorrect learning attempt.
- Submitted choices remain visible after grading, with correct choices and incorrect player selections visually distinguished.
- Ordering questions shuffle once per attempt, remain stable through rerenders, and are prevented from initially appearing in the solved sequence.
- Long BLACKBOX prompts can switch to a stacked prompt/command layout on narrow touch screens so the current command keeps usable width.
- Current commands and prior command lines wrap instead of clipping horizontally.
- The BBX-90 keyboard moves **Backspace** between **SPACE** and the history arrows, keeps **↑ / ↓** together, and gives SPACE more separation from accidental history recall.
- `help` now returns structured command metadata to a responsive renderer rather than depending on padded monospace text. Mobile help stacks command syntax above descriptions while desktop keeps a compact two-column layout.
- Help sections, commands, arguments, and descriptions use restrained color hierarchy for faster scanning.
- The **↓ LATEST** control participates in terminal layout rather than floating over command output.
- Version identity is consistent across boot, NEXUS system properties, BLACKBOX transition text, and terminal banner.
- `SAVE_VERSION = 15` and `WORLD_SCHEMA = 10` remain unchanged.
- Automated QA: **30/30 suites passing**, including the new A4.9.1 UX guards plus all prior A4.9 learning, Range, Service Desk, campaign, chronology, save, audio, and mobile/static regressions.

## A4.9.1 physical-device acceptance

1. Confirm single-choice, multi-select, and ordering questions show the correct instruction label.
2. On a two-answer multi-select item, submit one choice and then three choices; both should show validation without adding a learning miss.
3. Submit the correct pair and confirm normal grading/review behavior.
4. Confirm ordering steps start shuffled, remain stable while editing, and never initially appear solved.
5. Use a long remote prompt such as `guest@archives-01:/archive$` and type a long command; prompt/input and history output must remain fully visible in portrait.
6. Repeatedly tap SPACE on the BBX-90 and confirm the history arrows are no longer in the easy-mistap position. Verify ↑ / ↓ still recall history correctly.
7. Run `help` in portrait and verify section titles, syntax, arguments, and descriptions stay paired and readable without horizontal clipping.
8. Scroll away from the newest terminal output and confirm **↓ LATEST** appears without covering text, returns to the bottom, and disappears again.
9. Recheck Range 01–03, Service Desk, ThreatDesk Review persistence, and save/reload for regressions.

---

## A4.9 foundation retained below


Built directly from the A4.8.2 Range & Terminal Mobile Polish QA checkpoint. This milestone adds the first shared learning backbone without changing the campaign missions, Range solutions, intrusion rules, or Service Desk fault logic.

## A4.9 foundation

- ThreatDesk training is now data-driven: **27 questions** across **5 tracks** instead of three hard-coded quiz cards.
- Shared taxonomy defines **22 stable concepts** across systems, networking, security, analysis, and architecture.
- Question formats now include single-answer, multiple-select, and ordered-sequence exercises.
- Missed questions enter a persistent **Review Queue**. They clear after two later correct review passes instead of disappearing after one lucky retry.
- Concept records deliberately avoid fake mastery percentages. Statuses are **INTRODUCED**, **PRACTICED**, **DEMONSTRATED**, or **NEEDS REVIEW**.
- ThreatDesk knowledge and hands-on evidence remain separate. A concept becomes DEMONSTRATED only when the player has both correct knowledge evidence and applied evidence.
- NightWire Range completions now feed applied learning evidence for enumeration, exposed information, credentials, authentication, authorization, privilege boundaries, and failure-state interpretation.
- Service Desk resolutions feed applied evidence for device state, services, DNS, DHCP/APIPA, addressing, gateways, verification, and controlled change. Escalation does not falsely count as a practical success.
- Range and Service Desk learning evidence is idempotent. Repeating the same lab/ticket cannot farm concept progression.
- Existing saves with the original `lab_dns`, `lab_route`, and `lab_access` completions are reconciled into the new model automatically.
- A generic `learning:experience` path now exists so future missions and free exploration can report concept evidence without knowing how ThreatDesk stores it.
- ThreatDesk has four mobile-aware sections: **Training**, **Review**, **Field Intel**, and **Lookup**.
- `SAVE_VERSION = 15` and `WORLD_SCHEMA = 10` remain unchanged because the learning fields were already reserved in the save schema.
- Automated QA: **29/29 suites passing** after the update, including the new A4.9 learning tests and all prior Range, Service Desk, campaign, chronology, save, audio, and mobile/static regressions.

## Physical-device acceptance to do

A4.9 still needs direct iPhone Safari acceptance. On-device checks should cover:

1. Open ThreatDesk after it unlocks and confirm the four tabs fit and scroll cleanly.
2. Open each Learning Track and answer at least one single-answer, multi-select, and ordering question.
3. Miss a question deliberately and verify it appears in Review.
4. Answer that review item correctly twice and confirm it leaves Review.
5. Complete a Service Desk ticket and verify its concepts move from unseen/knowledge-only to practical evidence as appropriate.
6. Complete or revisit a NightWire Range lab and verify applied evidence is recorded without altering the Range flow.
7. Save/reload and confirm attempts, Review items, and concept records survive.
8. Confirm Field Intel and fictional DNS Lookup still behave exactly as before.

## Intended next milestone

After A4.9 physical acceptance: **A4.10 — Service Desk Expansion**. Add the next substantial ticket set using the shared concept model rather than expanding the learning engine again. Free Investigation remains the milestone after that.

---

## A4.8.2 baseline retained below


Built directly from the verified A4.8.1 QA NightWire Range test-access checkpoint. This is a **physical-device polish hotfix**: exploit rules, Range solutions, campaign/story content, and normal progression are unchanged.

## A4.8.2 physical-device polish

- Reading a Range proof now produces a clear **RANGE OBJECTIVE COMPLETE** terminal notice with completion stats; the image stays mounted until the player chooses `finish`.
- Re-entering NightWire while a completed image is mounted shows a dedicated completion state with `finish` and `resume` / `return` choices.
- `finish` confirms saved results, final noise, and the next unlocked Range exercise.
- BLACKBOX custom-keyboard mode now mirrors typed text with a blinking block cursor (`█`) so the input position remains visible while the native iOS keyboard is suppressed.
- BLACKBOX key legends are larger in portrait; the landscape split keyboard uses a slightly wider dock, 38px keys, and larger legends/brand text.
- `enum`, `probe`, and `auth` malformed syntax gives concise usage and one example. Unknown `probe` tokens are rejected as profile syntax before any target logic runs.
- While a Range image is mounted, the terminal header shows `LINK RANGE-<id>` and `TRACE <noise>/<threshold>`.
- `SAVE_VERSION = 15` and `WORLD_SCHEMA = 10` remain unchanged.

## QA test identity

The boot screen adds **QA: NightWire Range**. Selecting it:

- archives the current active identity first, if one exists;
- creates a separate `range_qa` identity;
- marks all nine legacy Act-I missions complete;
- derives the canonical **3,080 credits / 50 reputation** from the existing mission definitions;
- leaves all three Range labs uncompleted;
- clears any active Range sandbox, exploit credentials, sessions, artifacts, noise, and scan history;
- unlocks the private NightWire node through the completed Glass Harbor mission;
- intentionally does **not** seed the legacy mission-complete message/mail flags, so the QA identity stays quiet and focused on Range testing.

Normal **New Identity** behavior is unchanged and still starts from a clean world with NightWire locked until Glass Harbor is genuinely completed.

`SAVE_VERSION = 15` and `WORLD_SCHEMA = 10` remain unchanged because the QA marker is optional metadata rather than gameplay schema.

---

## A4.8 foundation retained

Alpha 4.8 is the first player-facing home for the advanced access model. The existing NEXUS NightWire website remains the **public message-board mirror**. After the nine legacy Act-I missions culminate in Glass Harbor, BLACKBOX discovers a separate **NightWire private node** that is accessed from the CLI with `nightwire`.

## What this milestone adds

### NightWire private node
- CLI/BBS-style service inside the existing BLACKBOX terminal; no new BLACKBOX desktop app and no redesign of the black/green shell.
- General Board, Field Reports, Jobs, The Range, and Private Messages sections.
- Number shortcuts and readable commands (`4` or `range`, `5` or `messages`, etc.) for phone-friendly navigation.
- Private node unlocks after Glass Harbor / `mission_cascade` completes.
- The NEXUS website is explicitly labeled **NightWire Public Message Board** so the two access layers are understandable in-world.

### The Range
Three sequential, isolated practice images:

1. **Enumeration Basics** — scan → enumerate HTTP → choose a fictional profile → expose and inspect a proof artifact. No shell is required.
2. **Credential Foothold** — enumerate a web service → expose configuration/credential material → authenticate to SSH → enter a USER session → verify the permission boundary → read proof.
3. **Privilege Boundaries** — enumerate a file service → establish a restricted SERVICE foothold → encounter permission denial → use a fictional local policy profile → elevate → read root-only proof.

Range hosts exist in the BLACKBOX host registry only as simulation definitions. They are **not permanent HOME-PC routes**. Starting a lab mounts only that lab's target routes; finishing or aborting detaches the runtime state, credentials, artifacts, sessions, noise, scan history, and target discovery so practice systems do not pollute the campaign.

### Exploit-model usability polish
- `probe list` shows the three fictional BBX profiles and does not count as an attack action or advance time.
- Range `scan` always displays service ports independent of the FastLink hardware upgrade.
- `access credentials`, `access sessions`, and `access artifacts` use numbered entries.
- `access artifact <#|id>` reads content exposed by an information-disclosure profile and can complete an isolated Range objective.
- Existing compact commands already work with scan numbers, e.g. `enum 0 80`, `probe BBX-014 0`, `auth 0 ssh rangeops`, keeping phone input short without replacing explicit host/service concepts.
- Failure messages remain stage-specific: no route, service unavailable, missing enumeration, profile mismatch/mitigation, authentication rejection, access denial, and permission denial communicate different evidence.

## Compatibility / isolation
- Original nine campaign missions remain legacy-access and are not retrofitted.
- Range commands use elapsed-only time: living-world messages may become due naturally, but campaign `actionTick` and `networkEpoch` do not advance.
- Range `lab:completed` events carry the Range universe and cannot satisfy campaign objectives.
- Service Desk workstation identifiers remain outside the BLACKBOX host namespace.
- No real sockets, CVEs, payload execution, malware, brute forcing, or external networking were added. BBX profiles operate only on in-memory fictional host state.

## Save schema
- `SAVE_VERSION = 15`
- `WORLD_SCHEMA = 10`
- Save 14 migrates with empty NightWire state and a null private-service session.

## Historical A4.8 intended next milestone
A5 / Act II can now introduce the first story investigation that expects the player to apply Range concepts against a non-legacy target. Before that, A4.8 should receive physical iPhone acceptance and, ideally, a resumed interactive Work audit of the remaining Act-I paths.

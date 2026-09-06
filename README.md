# BLACKBOX v0.4.0 Alpha 4.8.1 QA — NightWire Range Test Access

Built directly from the verified A4.8 NightWire Node + The Range checkpoint. This is a **QA convenience build**, not a progression redesign.

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

## Intended next milestone
A5 / Act II can now introduce the first story investigation that expects the player to apply Range concepts against a non-legacy target. Before that, A4.8 should receive physical iPhone acceptance and, ideally, a resumed interactive Work audit of the remaining Act-I paths.

# Major Incident Grouping v2 — propose + parent duplicates

Enterprise rebuild of the v1 inline before-insert BR
(`changes/2026-06-major-incident-grouping/`). Same goal — group look-alike
incidents under one Major Incident — but restructured per
[ADR-0012](https://github.com/orwellsanimal/servicenow-coder/blob/main/docs/architecture/0012-thin-business-rule-over-script-include.md)
and [ADR-0013](https://github.com/orwellsanimal/servicenow-coder/blob/main/docs/architecture/0013-major-incident-grouping.md),
and shipped with the new `script_include` artifact type
([ADR-0014](https://github.com/orwellsanimal/servicenow-coder/blob/main/docs/architecture/0014-update-set-generator-script-include.md)).

## What it does

- **`MajorIncidentGrouper`** Script Include — the logic. Reads (`groupKey`,
  `findLead`, `findUngroupedSiblings`) are side-effect-free; writes
  (`proposeLead`, `attachChild`) go through the **supported MIM API**
  (`sn_major_inc_mgmt.MajorIncidentTriggerRules`), never a raw
  `major_incident_state` write.
- **`MI Group - attach to existing lead`** (before/insert) — links a new
  incident to an existing lead (proposed candidate or accepted MI) in the
  window. One O(1) lookup, fail-open.
- **`MI Group - form cluster`** (async/insert) — when a cluster forms with no
  lead, proposes the earliest sibling as a **Major Incident Candidate** and
  parents the rest. Runs off the insert transaction.

## Why propose, not auto-accept

Turning an incident into an **accepted** major incident requires the
`major_incident_manager` role, which the inserting user / async BR does not
hold (`approveMIC()` is role-gated; verified in `MajorIncidentTriggerRulesSNC`
on dev392282). Only *proposing a candidate* is unprivileged. So the rule
clusters and proposes; a **major incident manager accepts** the candidate in the
MIM Workbench. This is the governed enterprise path — a human declares the major
incident — and needs no service account.

## The two timelines

| | When | Privilege | Work |
|---|---|---|---|
| Attach | before/insert (sync) | inserting user | O(1): link to an existing lead |
| Form | async/insert | inserting user | propose earliest candidate + parent siblings |
| Accept | manual, MIM Workbench | major incident manager | candidate → accepted major incident |

## Prerequisite

`com.snc.incident.mim` active (supplies `major_incident_state` + the
`MajorIncidentTriggerRules` API). Confirmed on dev392282 2026-06-29; property
`sn_major_inc_mgmt.com.snc.incident.mim.major_incident_creation = promote`.

## ⚠️ Supersedes v1 — deactivate the old BR

The v1 inline BR (`changes/2026-06-major-incident-grouping/`, live sys_id
`de85a0bd9e5ea24a1d11344177c418d4`) must be **deactivated** when this set is
committed, or both fire on insert.

## Build / import

```bash
# from the servicenow-coder repo root
node scripts/build-update-set.js ../servicenow-coder-global/changes/2026-06-mi-grouping-v2/
```

Then import `built/update-set.xml` via System Update Sets > Retrieved Update
Sets > Import Update Set from XML → Preview → Commit. The Script Include
serializes before the Business Rules (generator guarantees order).

## Smoke test

Create 2–3 incidents with an identical short description within 10 minutes. The
later ones land with `parent_incident` set; the earliest becomes a **Major
Incident Candidate** (`major_incident_state = Proposed`) visible in the MIM
Workbench, where a manager can accept it.

## Known edge cases / future work

- **Exact match only.** Wording variants don't group. Normalized/fuzzy key is a
  follow-up.
- **Concurrency.** Two simultaneous inserts could each propose a candidate.
  Deterministic earliest-first + the async heal make this rare; a hard guarantee
  would need a dedup scheduled-job backstop (P2) or a unique-key table.
- **Candidate rejection.** If a manager rejects the candidate, children keep
  their `parent_incident`; unwinding is manual (out of scope).

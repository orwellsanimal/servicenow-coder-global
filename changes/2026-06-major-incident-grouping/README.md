# Major Incident Grouping — duplicate detection

Global **before-insert Business Rule** on `incident`. When incidents sharing an
exact `short_description` are created within a **10-minute** window, they are
grouped as children (`parent_incident`) under a single **Major Incident**
parent.

## What it does

[`group-duplicate-incidents.js`](./group-duplicate-incidents.js):

1. New incident created. If `short_description` is empty, or it's already a
   child / already a Major Incident → do nothing.
2. Existing accepted Major Incident with the same short_description in the
   window → attach `current` as a child.
3. Otherwise, if other active siblings exist in the window → promote the
   **earliest** to a Major Incident (`major_incident_state = 'accepted'`,
   `impact`/`urgency = High`), re-parent any other ungrouped siblings, attach
   `current`.
4. A single incident with no duplicate in the window is left as an ordinary
   incident — we never spin up a Major Incident from one report.

`before/insert` is deliberate: the parent is resolved before the row is written,
so the child lands already linked with no second write to `current` and no
recursive rule firing. Writes to *other* incidents use `GlideRecord.update()`.

## Prerequisite — Major Incident Management (✅ active on dev392282)

The rule sets `incident.major_incident_state`, supplied by
**`com.snc.incident.mim`**. Confirmed active on dev392282 (2026-06-24) via
`sys_dictionary`: field exists (`type=string`), choices
`proposed` / `accepted` / `rejected` / `canceled`. The script's
`MI_STATE_ACCEPTED = 'accepted'` matches.

## Deploy order

This is inert global metadata (one business rule). No scoped app depends on it,
so order is not load-bearing — but per the standard flow: **merge this PR, then
import + commit the update set, then re-export `instance-config/`** so
`major_incident_state` lands in the grounding snapshot.

## Import (after merge)

1. **System Update Sets → Retrieved Update Sets → Import Update Set from XML**
2. Upload [`built/update-set.xml`](./built/update-set.xml)
3. Open the loaded set → **Preview Update Set** (expect one Insert: a
   `sys_script` on `incident`) → resolve any errors
4. **Commit Update Set**
5. Verify: `node scripts/import-update-set.js` (from the servicenow-coder repo,
   pointed at this change dir) automates preview + commit + post-import check.

## Smoke test

Create 2–3 incidents with an identical short description within 10 minutes. The
later ones should land with `parent_incident` set; the earliest should flip to
`major_incident_state = Accepted` with impact/urgency High.

## Known edge cases / future work

- **Exact match only.** "VPN down" vs "VPN is down" won't group. A normalized /
  fuzzy key is a follow-up.
- **Insert-only.** Editing a short_description after creation won't regroup. Add
  `action_update` + a `short_description.changes()` guard if needed.
- **Concurrency.** Two duplicates inserting simultaneously could each try to
  promote a parent. Earliest-sibling-wins + `addNullQuery` make this rare and
  self-correcting; a hard guarantee would need a dedup Scheduled Job backstop.

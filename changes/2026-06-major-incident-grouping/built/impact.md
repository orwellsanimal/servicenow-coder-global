# Impact summary: Major Incident Grouping — duplicate detection BR

Global before-insert Business Rule on incident that detects incidents
sharing a short_description within a 10-minute window and groups them as
children (parent_incident) under a single promoted Major Incident parent.

## Intent

Cut major-incident triage noise. When a real outage spawns a burst of
look-alike incidents, responders shouldn't hand-stitch them together. This
rule auto-detects same-short_description reports created within 10 minutes,
promotes the earliest to a Major Incident (major_incident_state=accepted,
impact/urgency=High), and parents the rest under it — so the Major Incident
Workbench shows one parent with its children already attached. A lone
incident never becomes a Major Incident.

## Artifacts in this update set

- **Business Rule** `Group duplicate incidents under major incident` — sys_script_de85a0bd9e5ea24a1d11344177c418d4

## Estimated impact

- Tables modified: `incident`
- Bulk data changes: no
- Rollback complexity: **low**

### Notes

- Prerequisite: com.snc.incident.mim must be active (supplies
  incident.major_incident_state). Confirmed active on dev392282
  2026-06-24; choices proposed/accepted/rejected/canceled.
- No schema change — adds one sys_script row. parent_incident and
  major_incident_state already exist OOTB / via MIM.
- Runtime writes: on a duplicate burst the BR sets parent_incident on
  children and flips the earliest sibling to major_incident_state=
  accepted with impact/urgency=High. No backfill of historical data.
- Insert-only: editing a short_description after creation will not
  regroup. Exact-match key only (no fuzzy matching). See README
  "Known edge cases".
- Rollback: deactivate or delete the business rule. Already-grouped
  incidents keep their parent_incident / major_incident_state until
  manually unwound; no data is corrupted by removing the rule.

## Gating checklist

Before importing this update set to a target instance:

- [ ] Generated XML hash (sha256) matches `update-set.sha256`
- [ ] Reviewer has read the source files in `source/`
- [ ] Target instance state has been previewed (see `preview.md`)
- [ ] CAB / change-management approval recorded (if applicable)
- [ ] Rollback procedure understood (see notes above)

On the target instance:

1. **System Update Sets > Retrieved Update Sets > Import Update Set from XML**
2. Upload `update-set.xml`
3. Open the loaded update set, click **Preview Update Set**
4. Resolve any preview errors
5. Click **Commit Update Set**
6. Verify expected changes via `scripts/python/preview-update-set.py --post-import`

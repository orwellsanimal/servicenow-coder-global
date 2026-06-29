# Impact summary: Major Incident Grouping v2 — propose + parent duplicates

Groups incidents that share an exact short_description within a 10-minute
window under a single Major Incident lead. A thin before/insert Business
Rule attaches new incidents to an existing lead (O(1)); a thin async
Business Rule forms the cluster by proposing the earliest sibling as a Major
Incident Candidate and parenting the rest. Core logic lives in the
MajorIncidentGrouper Script Include.

## Intent

Cut major-incident triage noise without bypassing the MIM process. When an
outage spawns a burst of look-alike incidents, the rule auto-detects them,
proposes the earliest as a Major Incident Candidate via the supported MIM
API (sn_major_inc_mgmt.MajorIncidentTriggerRules.proposeMIC), and parents
the rest under it (addAsChildToMajorIncident) — so the cluster is visible in
the MIM Workbench for a major incident manager to ACCEPT. We deliberately do
NOT auto-accept: promotion to an accepted major incident requires the
major_incident_manager role and a human's judgement (ADR-0013). A lone
incident never becomes a candidate.

## Artifacts in this update set

- **Script Include** `MajorIncidentGrouper` — sys_script_include_353799ef67fdda0039961570f1baf3ac
- **Business Rule** `MI Group - attach to existing lead` — sys_script_e4358e3adf603310606273ff8cdae599
- **Business Rule** `MI Group - form cluster` — sys_script_11808ef41bdcb1a7f196270da9aad1e6

## Estimated impact

- Tables modified: `incident`, `sys_script_include`, `sys_script`
- Bulk data changes: no
- Rollback complexity: **low**

### Notes

- Prerequisite: com.snc.incident.mim active (supplies
  major_incident_state + the MajorIncidentTriggerRules API). Confirmed
  active on dev392282 2026-06-29.
- Adds one sys_script_include + two sys_script rows. No schema change;
  parent_incident and major_incident_state already exist OOTB / via MIM.
- Runtime writes: on a duplicate burst, sets parent_incident on children
  and proposes (NOT accepts) the earliest as a Major Incident Candidate.
  No incident is auto-accepted as a major incident — a major incident
  manager accepts in the Workbench. No backfill of historical data.
- SUPERSEDES the v1 inline BR (changes/2026-06-major-incident-grouping/,
  live sys_id de85a0bd9e5ea24a1d11344177c418d4). DEACTIVATE the v1 BR
  before/when committing this set, or the two will both fire on insert.
- Rollback: deactivate or delete the two business rules (the Script
  Include is inert without a caller). Already-grouped incidents keep
  their parent_incident; no data is corrupted by removing the rules.

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

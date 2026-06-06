# Impact summary: FSM Change Bridge — correlation fields

Adds paired reference fields linking change_task and wm_order for the FSM
Work Order <-> Change Task bridge. change_task.u_linked_work_order points at
the mirrored work order; wm_order.u_linked_change_task points back at the
change task. Both nullable. Pairs with the scoped app x_jw_fsmchgbr.

## Intent

Give each side of the FSM/ITSM change bridge a direct, queryable reference
to its counterpart so either form can dereference the linked record in one
read (no join, no related-list scan). The scoped app x_jw_fsmchgbr's
FsmChangeBridge Script Include reads and writes these fields; the idempotent
read-before-write loop guard (ADR-0006) compares the destination's current
value against the intended value before writing, so these fields are also
the substrate the loop-containment logic operates on.

## Artifacts in this update set

- **Dictionary** `change_task.u_linked_work_order` — sys_dictionary_change_task_u_linked_work_order
- **Dictionary** `wm_order.u_linked_change_task` — sys_dictionary_wm_order_u_linked_change_task

## Estimated impact

- Tables modified: `change_task`, `wm_order`
- Bulk data changes: no
- Rollback complexity: **low**

### Notes

- Both fields are nullable references with no default — no data backfill.
- No business rule or workflow ships in this update set; these are inert
  columns until the x_jw_fsmchgbr scoped app reads/writes them.
- wm_order is the FSM Work Order table (extends sm_order). change_task is
  OOTB ITIL. Both are global scope, so the fields cannot ship via the
  scoped-app pipeline — hence this update-set-as-artifact (ADR-0001).
- Rollback: null both fields everywhere, then drop. No record state is
  corrupted by removal since neither field has a default or a dependent
  business rule in this set.
- Deploy order matters (ADR-0006): import + commit this set FIRST, then
  re-export instance-config/, then deploy x_jw_fsmchgbr.

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

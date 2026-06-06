# FSM Change Bridge — correlation fields

> Schema half of the FSM Work Order ↔ Change Task bridge. Pairs with the scoped
> Fluent app `x_jw_fsmchgbr` (CI/CD'd separately in the `servicenow-coder` repo).
> Implements ADR-0006 (cross-table bridge pattern).

## What this change does

Adds two nullable **reference** fields:

| Table | Field | References | Purpose |
|-------|-------|-----------|---------|
| `change_task` | `u_linked_work_order` | `wm_order` | The FSM work order mirrored from this change task |
| `wm_order` | `u_linked_change_task` | `change_task` | The change task mirrored from this work order |

No business rule, no workflow, no data. These are inert columns until the
`x_jw_fsmchgbr` scoped app's `FsmChangeBridge` Script Include reads and writes
them.

## Why this is a global change, not scoped

`change_task` is OOTB ITIL; `wm_order` is the FSM Work Order table (extends
`sm_order`). Both live in the **global** scope. A scoped Fluent app cannot add
columns to a global table, so the fields ship via the update-set-as-artifact
workflow (ADR-0001) while the bridge logic ships as a scoped app — the split-repo
shape ADR-0006 describes.

## Deploy order (ADR-0006: "global first")

This is a hard ordering, not a convention. The scoped app builds against these
field names but its queries **silently no-op** if the fields don't exist at
runtime.

1. Merge this PR.
2. Import + commit `built/update-set.xml` on the target instance (steps below).
3. Re-export `instance-config/` in `servicenow-coder` so the grounding snapshot
   knows the fields exist.
4. Deploy the `x_jw_fsmchgbr` scoped app.

## Files in this change

| File | Purpose |
|------|---------|
| `manifest.yaml` | Change description + the two dictionary_entry artifacts |
| `built/update-set.xml` | Generated importable artifact |
| `built/update-set.sha256` | Integrity hash |
| `built/impact.md` | Generated impact summary |
| `built/preview.md` | Generated pre-import preview |

## Regenerate

From the `servicenow-coder` repo root:

```bash
node scripts/build-update-set.js ../servicenow-coder-global/changes/2026-06-fsm-change-bridge/
```

Idempotent — sys_ids are deterministically derived from the update-set name +
artifact identifiers, so re-running produces the same XML (modulo `unload_date`).

> **Note:** this is the first change to use **reference-type** dictionary
> entries. It depends on the `reference`/`reference_qual` support added to
> `scripts/build-update-set.js` in `servicenow-coder` — that PR must merge first.

## Preview against a live instance

```bash
python scripts/python/preview-update-set.py built/update-set.xml
```

Confirms both target tables (`change_task`, `wm_order`) exist and shows whether
each field would be created or updated.

## Import

1. Download `built/update-set.xml`
2. ServiceNow → **System Update Sets** → **Retrieved Update Sets**
3. **Import Update Set from XML** → choose the file → **Upload**
4. Open the loaded set → **Preview Update Set**
5. Resolve any preview errors (a reference to a missing table would surface here)
6. **Commit Update Set**

## Verify post-import

```bash
python scripts/python/preview-update-set.py built/update-set.xml --post-import
```

Both artifacts should show `OK`, and the reference fields should resolve to
`wm_order` / `change_task` respectively.

## Rollback

Low-risk. Neither field has a default or a dependent business rule in this set:

1. Null `change_task.u_linked_work_order` and `wm_order.u_linked_change_task`
   everywhere they're populated.
2. **System Update Sets** → **Update Sets to Commit** → find the committed set →
   **Back Out**.
3. Resolve any back-out errors.

The scoped app continues to function but its bridge writes target fields that no
longer exist (silent no-op) until redeployed without the linkage.

## Dependencies

- `scripts/build-update-set.js` reference-dictionary support (`servicenow-coder`) —
  must merge first.
- The `x_jw_fsmchgbr` scoped app references these fields but is deployed *after*
  this set imports (see deploy order above).

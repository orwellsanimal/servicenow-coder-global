# Pre-import preview: FSM Change Bridge — correlation fields

This document describes what will happen when this update set is
imported and committed on the target instance. Compare against the
instance's own Preview Update Set output before committing.

## Records this update set will INSERT_OR_UPDATE

| Type | Target | sys_update_name |
| ---- | ------ | --------------- |
| Dictionary | `change_task.u_linked_work_order` | `sys_dictionary_change_task_u_linked_work_order` |
| Dictionary | `wm_order.u_linked_change_task` | `sys_dictionary_wm_order_u_linked_change_task` |

## What to expect during Preview Update Set

- ServiceNow will compare each `sys_update_xml` entry against the
  current state of the target. New artifacts show as **Inserts**,
  existing ones show as **Updates** with a field-level diff.
- Any reference fields (e.g. table references in `sys_dictionary`)
  will be resolved against the target instance. If a referenced
  record does not exist, the preview will surface a warning.
- For dictionary entries: confirm the target table exists. The new
  field will be created with no value on existing records.
- For business rules: confirm the `collection` (table) exists and
  the condition syntax is valid against current field names.

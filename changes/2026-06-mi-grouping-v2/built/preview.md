# Pre-import preview: Major Incident Grouping v2 — propose + parent duplicates

This document describes what will happen when this update set is
imported and committed on the target instance. Compare against the
instance's own Preview Update Set output before committing.

## Records this update set will INSERT_OR_UPDATE

| Type | Target | sys_update_name |
| ---- | ------ | --------------- |
| Script Include | `MajorIncidentGrouper` | `sys_script_include_353799ef67fdda0039961570f1baf3ac` |
| Business Rule | `MI Group - attach to existing lead` | `sys_script_e4358e3adf603310606273ff8cdae599` |
| Business Rule | `MI Group - form cluster` | `sys_script_11808ef41bdcb1a7f196270da9aad1e6` |

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
- For script includes: confirm the `api_name` does not collide with an
  existing Script Include, and that `access` matches how callers invoke
  it. When paired with a business rule, the SI is committed first.

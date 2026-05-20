# Pre-import preview: Catalog — Hardware Request fulfillment flow fix

This document describes what will happen when this update set is
imported and committed on the target instance. Compare against the
instance's own Preview Update Set output before committing.

## Records this update set will INSERT_OR_UPDATE

| Type | Target | sys_update_name |
| ---- | ------ | --------------- |
| Catalog Item Patch | `Development Laptop (PC)` | `sc_cat_item_3cecd2350a0a0a6a013a3a35a5e41c07_patch_cbe9413a` |
| Catalog Item Patch | `Office Desktop` | `sc_cat_item_10ec16b3c61122760021a44ec7746bb3_patch_432b89cc` |

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

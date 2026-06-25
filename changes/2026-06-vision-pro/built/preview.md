# Pre-import preview: Catalog — Apple Vision Pro (clone of iPad pro)

This document describes what will happen when this update set is
imported and committed on the target instance. Compare against the
instance's own Preview Update Set output before committing.

## Records this update set will INSERT_OR_UPDATE

| Type | Target | sys_update_name |
| ---- | ------ | --------------- |
| Catalog Item | `Apple Vision Pro` | `sc_cat_item_deae0ebb09c38bb7a0a2681794779fc6` |
| Variable | `Apple Vision Pro :: band_size` | `item_option_new_29cf0f776cba70dd9c1186e4f484b756` |
| Question Choice | `Apple Vision Pro :: band_size = small` | `question_choice_8bd363152edd69dde943bb37862fd705` |
| Question Choice | `Apple Vision Pro :: band_size = medium` | `question_choice_e7c0c80e2c80fe1dbd3cf99b61c8be35` |
| Question Choice | `Apple Vision Pro :: band_size = large` | `question_choice_70c3d9842c978557a8df47105ef6fe03` |
| Variable | `Apple Vision Pro :: storage` | `item_option_new_699ab9dfb06e556816b186aec24142dc` |
| Question Choice | `Apple Vision Pro :: storage = 256` | `question_choice_f3ea9eeadcef2ddfabd2595528cf465f` |
| Question Choice | `Apple Vision Pro :: storage = 512` | `question_choice_d9a6587053f6beb42d8cdfd733529455` |
| Question Choice | `Apple Vision Pro :: storage = 1024` | `question_choice_fce33c6741475b21beb520c2430607f6` |

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

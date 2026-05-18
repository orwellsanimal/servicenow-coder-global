# Pre-import preview: Catalog — Pixel 9a (clone of Pixel 4a)

This document describes what will happen when this update set is
imported and committed on the target instance. Compare against the
instance's own Preview Update Set output before committing.

## Records this update set will INSERT_OR_UPDATE

| Type | Target | sys_update_name |
| ---- | ------ | --------------- |
| Catalog Item | `Pixel 9a` | `sc_cat_item_c0c866458f59d1b716e16bd43fc466d4` |
| Variable | `Pixel 9a :: colour` | `item_option_new_3fe41d69326ee4727a265c704e039f29` |
| Question Choice | `Pixel 9a :: colour = obsidian` | `question_choice_72e6a7578ae2ed905ad0b38fd7d6c2b7` |
| Question Choice | `Pixel 9a :: colour = iris` | `question_choice_822f2ce8d7aad3caac26985427ba880d` |
| Question Choice | `Pixel 9a :: colour = peony` | `question_choice_7b1a7a96423e8c84da988c0b8b9c654b` |
| Question Choice | `Pixel 9a :: colour = porcelain` | `question_choice_e298142403aecc8375cc51d07f918deb` |
| Variable | `Pixel 9a :: storage` | `item_option_new_79541815724a75e0f06722f0cbc45331` |
| Question Choice | `Pixel 9a :: storage = 128` | `question_choice_b04488295e07cb45aae90c168bf99f1a` |
| Question Choice | `Pixel 9a :: storage = 256` | `question_choice_19d0355a794bc7c163670d25c9522036` |

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

# Impact summary: Catalog — Pixel 9a (clone of Pixel 4a)

Adds a new "Pixel 9a" catalog item to the Service Catalog under the
Mobiles category, with colour + storage variables. Modeled on the
existing Pixel 4a item (sys_id 07d8173e9756cd1021983d1e6253af1d).
First exercise of the catalog_item artifact type in the update set
generator.

## Intent

Validate the catalog_item builder against a known-good source item.
Pixel 9a is a low-risk addition — net-new sc_cat_item, no field
additions to OOTB tables, no overrides of existing data. Workflow
is the deliverable; the specific specs are easy to re-tune later.

## Artifacts in this update set

- **Catalog Item** `Pixel 9a` — sc_cat_item_c0c866458f59d1b716e16bd43fc466d4
- **Variable** `Pixel 9a :: colour` — item_option_new_3fe41d69326ee4727a265c704e039f29
- **Question Choice** `Pixel 9a :: colour = obsidian` — question_choice_72e6a7578ae2ed905ad0b38fd7d6c2b7
- **Question Choice** `Pixel 9a :: colour = iris` — question_choice_822f2ce8d7aad3caac26985427ba880d
- **Question Choice** `Pixel 9a :: colour = peony` — question_choice_7b1a7a96423e8c84da988c0b8b9c654b
- **Question Choice** `Pixel 9a :: colour = porcelain` — question_choice_e298142403aecc8375cc51d07f918deb
- **Variable** `Pixel 9a :: storage` — item_option_new_79541815724a75e0f06722f0cbc45331
- **Question Choice** `Pixel 9a :: storage = 128` — question_choice_b04488295e07cb45aae90c168bf99f1a
- **Question Choice** `Pixel 9a :: storage = 256` — question_choice_19d0355a794bc7c163670d25c9522036

## Estimated impact

- Tables modified: `sc_cat_item`, `item_option_new`, `question_choice`
- Bulk data changes: no
- Rollback complexity: **low**

### Notes

- Net-new sc_cat_item record — no risk to existing Pixel 4a or any
  other catalog item.
- 2 variables + 6 question_choice records all anchored to the new
  item by deterministic sys_id; no orphan risk on re-import.
- Rollback: deactivate the sc_cat_item (active=false) and the
  deterministic sys_ids stay stable for a future re-activation.
  Hard delete via UI if a true rollback is needed.
- This is also the test case for the catalog_item artifact type
  itself. If anything is wrong with the generator, it will surface
  at Preview Update Set time on the instance.

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

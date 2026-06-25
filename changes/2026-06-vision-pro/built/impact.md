# Impact summary: Catalog — Apple Vision Pro (clone of iPad pro)

Adds a new "Apple Vision Pro" catalog item to the Service Catalog under the
same Hardware category as iPad pro, with Band size + Storage variables.
Modeled on the existing iPad pro item (sys_id
c3b9cbf29716cd1021983d1e6253afad).

## Intent

Extend the hardware catalog with Apple's spatial-computing headset. Net-new
sc_cat_item — no field additions to OOTB tables, no overrides of existing
data. Cloned from iPad pro so it inherits the same Service Catalog, Hardware
category, restricted/snc_internal access, and OOTB fulfillment flow (so
submitted requests generate approvals rather than stalling).

## Artifacts in this update set

- **Catalog Item** `Apple Vision Pro` — sc_cat_item_deae0ebb09c38bb7a0a2681794779fc6
- **Variable** `Apple Vision Pro :: band_size` — item_option_new_29cf0f776cba70dd9c1186e4f484b756
- **Question Choice** `Apple Vision Pro :: band_size = small` — question_choice_8bd363152edd69dde943bb37862fd705
- **Question Choice** `Apple Vision Pro :: band_size = medium` — question_choice_e7c0c80e2c80fe1dbd3cf99b61c8be35
- **Question Choice** `Apple Vision Pro :: band_size = large` — question_choice_70c3d9842c978557a8df47105ef6fe03
- **Variable** `Apple Vision Pro :: storage` — item_option_new_699ab9dfb06e556816b186aec24142dc
- **Question Choice** `Apple Vision Pro :: storage = 256` — question_choice_f3ea9eeadcef2ddfabd2595528cf465f
- **Question Choice** `Apple Vision Pro :: storage = 512` — question_choice_d9a6587053f6beb42d8cdfd733529455
- **Question Choice** `Apple Vision Pro :: storage = 1024` — question_choice_fce33c6741475b21beb520c2430607f6

## Estimated impact

- Tables modified: `sc_cat_item`, `item_option_new`, `question_choice`
- Bulk data changes: no
- Rollback complexity: **low**

### Notes

- Net-new sc_cat_item record — no risk to existing iPad pro or any
  other catalog item.
- 2 variables + 6 question_choice records all anchored to the new item
  by deterministic sys_id; no orphan risk on re-import.
- Storage price uplift via question_choice.misc: 256GB +$0, 512GB +$200,
  1TB +$400 (base price 3499). Band size has no price implication.
- Picture/icon are NOT cloned (binary attachment refs, out of scope for
  the manifest builder); the item ships without a thumbnail.
- Rollback: deactivate the sc_cat_item (active=false); deterministic
  sys_ids stay stable for a future re-activation. Hard delete via UI if
  a true rollback is needed.

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

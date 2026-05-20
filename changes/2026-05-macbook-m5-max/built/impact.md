# Impact summary: Catalog — MacBook Pro 16" M5 Max

Adds a new "MacBook Pro 16\" M5 Max" catalog item to the Service Catalog
under the Hardware category, cloned from the existing Developer Laptop (Mac)
item (sys_id 774906834fbb4200086eeed18110c737). Updated specs and pricing
for the Apple M5 Max generation.

## Intent

Provide an up-to-date developer laptop option in the catalog reflecting
current Apple Silicon hardware. Keeps the same software variable pattern
(checkboxes for optional software + free-text field) as the source item.

## Artifacts in this update set

- **Catalog Item** `MacBook Pro 16" M5 Max` — sc_cat_item_e5471164167195981546a5abdd6388c9
- **Variable** `MacBook Pro 16" M5 Max :: optional_label` — item_option_new_e88a5f0bf0b71a11855227c4f3a22da2
- **Variable** `MacBook Pro 16" M5 Max :: acrobat` — item_option_new_4ed8cb705241592ae0036f28d10b7276
- **Variable** `MacBook Pro 16" M5 Max :: photoshop` — item_option_new_6dc2d4fca7f27ac641231a3f32608a96
- **Variable** `MacBook Pro 16" M5 Max :: eclipse_ide` — item_option_new_ab214c20a2acd96b4fbf31ff6fbdee0d
- **Variable** `MacBook Pro 16" M5 Max :: Additional_software_requirements` — item_option_new_dc48aa221a47cbdfe6cb267dfb0dd058

## Estimated impact

- Tables modified: `sc_cat_item`, `item_option_new`
- Bulk data changes: no
- Rollback complexity: **low**

### Notes

- Net-new sc_cat_item record — no risk to existing Developer Laptop (Mac)
  or any other catalog item.
- 5 variables (1 label, 3 checkboxes, 1 multi-line text), no question_choice
  records needed (no dropdown variables).
- Rollback: deactivate the sc_cat_item (active=false). Deterministic sys_ids
  stay stable for a future re-activation.

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

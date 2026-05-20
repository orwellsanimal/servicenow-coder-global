# Impact summary: Catalog — Hardware Request fulfillment flow fix

Adds `flow_designer_flow` (OOTB "Service Catalog item request" flow,
sys_id 30f3d26187e92300e0ef0cf888cb0b91) to two OOTB catalog items that
ship without one, and activates "Office Desktop" which ships inactive.
Without these patches, hw-request submissions for Windows or Desktop
devices get stuck in "Request Approval" with no approvals generated
(see CLAUDE.md catalog item fulfillment-flow note).

## Intent

Unblock the hw-request app's Windows and Desktop paths so that all
three Google Form device options actually fulfill end-to-end. Also
the first real exercise of the catalog_item_patch artifact type —
partial updates to existing OOTB catalog items by explicit sys_id.

## Artifacts in this update set

- **Catalog Item Patch** `Development Laptop (PC)` — sc_cat_item_3cecd2350a0a0a6a013a3a35a5e41c07_patch_cbe9413a
- **Catalog Item Patch** `Office Desktop` — sc_cat_item_10ec16b3c61122760021a44ec7746bb3_patch_432b89cc

## Estimated impact

- Tables modified: `sc_cat_item`
- Bulk data changes: no
- Rollback complexity: **low**

### Notes

- Two OOTB catalog items each get a single referenced field set.
  For "Office Desktop" the `active` flag also flips from false to
  true. No new records, no schema changes, no deletes.
- Rollback: re-patch with the prior values
  (flow_designer_flow="" and, for Office Desktop, active=false).
  Or undo from sys_update_xml history on the instance.
- The "Service Catalog item request" flow
  (30f3d26187e92300e0ef0cf888cb0b91) is the OOTB default that
  ServiceNow ships with the catalog plugin and that most other
  active catalog items on the instance already use — verified via
  instance-config/catalog/items.json snapshot from 2026-05-15.

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

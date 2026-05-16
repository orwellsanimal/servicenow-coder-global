# 2026-05-pixel-9a — Pixel 4a → Pixel 9a catalog clone

First end-to-end exercise of the `catalog_item` artifact type added to the
update set generator (Phase 2). Validates the workflow against a low-risk,
net-new catalog item.

## What this change does

Creates a single new `sc_cat_item` (Pixel 9a) in the Service Catalog under
the Mobiles category, with two Multiple Choice variables (colour, storage)
and their respective question_choice values.

Specifically:

| Table | Records | Action |
|-------|---------|--------|
| `sc_cat_item` | 1 | INSERT |
| `item_option_new` | 2 | INSERT (colour, storage) |
| `question_choice` | 6 | INSERT (4 colours, 2 storage tiers) |

No fields on OOTB tables modified. No existing records touched.

## Source

Cloned from Pixel 4a on `dev392282`:

- `sc_cat_item` sys_id: `07d8173e9756cd1021983d1e6253af1d`
- Parent catalog (`sc_catalogs`): `e0d08b13c3330100c8b837659bba8fb4` (Service Catalog)
- Primary category (`sc_category`): `d68eb4d637b1300054b6a3549dbe5db2` (Mobiles)

## Specs (Pixel 9a)

- Display: 6.3" OLED, 120Hz
- Camera: 48MP + 13MP ultrawide rear, 13MP front
- Battery: 5100 mAh
- RAM: 8 GB
- Processor: Google Tensor G4
- Price: **$499**
- Colours: Obsidian (default), Iris, Peony, Porcelain
- Storage: 128 GB (base), 256 GB (+$100)

## Generate + preview

```bash
cd /c/ServiceNow_Coder

# 1. Generate the update set
node scripts/build-update-set.js \
     /c/servicenow-coder-global/changes/2026-05-pixel-9a/

# 2. Preview against the live instance (optional, recommended)
.venv/Scripts/python scripts/python/preview-update-set.py \
     /c/servicenow-coder-global/changes/2026-05-pixel-9a/built/update-set.xml
```

Output lands in `built/` alongside this README.

## Apply on the instance

1. **System Update Sets → Retrieved Update Sets → Import Update Set from XML**
2. Upload `built/update-set.xml`
3. Open the loaded update set → **Preview Update Set**
4. Resolve any preview warnings
5. **Commit Update Set**
6. Verify via the Service Catalog UI: a new "Pixel 9a" item should appear
   under Mobiles at $499, with selectable colour + storage variables.
7. Commit a `.applied` marker file to close the change.

## Rollback

Soft rollback: open the `sc_cat_item` and set `active = false`. Deterministic
sys_ids remain stable, so a future regeneration would re-activate cleanly.

Hard rollback: delete the `sc_cat_item` from the UI (cascades to its
variables and choices via `cat_item` reference).

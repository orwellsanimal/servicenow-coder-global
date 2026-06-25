# Catalog item — Apple Vision Pro (clone of iPad pro)

Adds a new **Apple Vision Pro** catalog item to the Service Catalog, cloned from
the existing **iPad pro** item (`sc_cat_item c3b9cbf29716cd1021983d1e6253afad`)
and re-spec'd to real Apple Vision Pro values.

## What it creates

| Table | Count | Detail |
|-------|-------|--------|
| `sc_cat_item` | 1 | The Apple Vision Pro item |
| `item_option_new` | 2 | "Choose the band size" + "Choose the storage" |
| `question_choice` | 6 | band: Small/Medium/Large • storage: 256GB/512GB/1TB |

**8 records total**, all with deterministic sys_ids derived from the manifest.

## Inherited from iPad pro

- **Catalog**: Service Catalog (`e0d08b13c3330100c8b837659bba8fb4`)
- **Category**: Hardware (`d258b953c611227a0146101fb1be7c31`)
- **Access**: restricted / `snc_internal`
- **Fulfillment flow**: OOTB "Service Catalog item request"
  (`30f3d26187e92300e0ef0cf888cb0b91`) — wired so submitted requests generate
  approvals instead of stalling (CLAUDE.md fulfillment-flow rule).

## Re-spec'd for Vision Pro

- **Base price**: $3,499 (256GB tier)
- **Storage** uplift via `question_choice.misc`: 256GB +$0, 512GB +$200, 1TB +$400
- **Band size**: Small / Medium / Large (no price implication), default Medium
- **Specs**: dual micro-OLED 23MP, Apple M2 + R1, visionOS, Spatial Audio

> Not cloned: the product picture/icon (binary attachment refs are out of scope
> for the manifest builder). The item ships without a thumbnail; add one in the
> UI if desired.

## Ship it

```bash
# from the servicenow-coder repo root
node scripts/build-update-set.js ../servicenow-coder-global/changes/2026-06-vision-pro/
python scripts/python/preview-update-set.py \
  ../servicenow-coder-global/changes/2026-06-vision-pro/built/update-set.xml
```

Then: PR in `servicenow-coder-global` → merge → import `built/update-set.xml`
(System Update Sets → Retrieved Update Sets → Import from XML → Preview →
Commit). Expect **8 Inserts**, all reference fields resolving.

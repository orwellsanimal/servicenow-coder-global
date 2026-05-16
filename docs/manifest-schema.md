# Manifest schema

Every change has a `manifest.yaml` describing what the change does, what
artifacts it produces, and what its estimated impact is. The generator
(`build-update-set.js` in `servicenow-coder`) reads this file and produces
the importable update set XML.

## Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Human-readable name. Appears as the `<name>` of the `sys_remote_update_set`. Used as part of the deterministic sys_id seed. |
| `description` | string | no | Multi-line description. Appears on the update set record. |
| `application` | string | no | Target scope. Defaults to `global`. |
| `target_release` | string | no | Free-form release marker (e.g. `2026-Q2`). For your own tracking. |
| `intent` | string | no | Multi-line "why" — captured in `impact.md` for reviewers. |
| `artifacts` | list | yes | One entry per artifact (see below). |
| `estimated_impact` | object | no | Risk/rollback metadata for reviewers. |

## `artifacts` entries

Each artifact has a `type` field that selects the builder. Supported types:

### `dictionary_entry`

Adds a custom field to an existing table via `sys_dictionary`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Always `dictionary_entry` |
| `table` | string | yes | Target table name (e.g. `incident_task`) |
| `element` | string | yes | Field name. Should start with `u_` for custom fields. |
| `column_label` | string | yes | Display label |
| `internal_type` | string | yes | `boolean`, `string`, `integer`, `reference`, etc. |
| `default_value` | string | no | Default value as a string |
| `mandatory` | bool | no | Default `false` |
| `read_only` | bool | no | Default `false` |
| `active` | bool | no | Default `true` |
| `description` | string | no | Field comments / help text |

### `catalog_item`

Creates an `sc_cat_item` plus nested `item_option_new` variables, their
`question_choice` values, and any additional `sc_cat_item_category` mappings.
A single manifest entry emits multiple `sys_update_xml` records under the
same parent update set.

**Top-level fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Always `catalog_item` |
| `name` | string | yes | Item name (used as `sys_name` + display). Seeds the deterministic sys_id — don't change after applying. |
| `short_description` | string | no | One-line description |
| `description` | string | no | HTML description body (wrapped in CDATA) |
| `price` | number | no | Default `0` |
| `cost` | number | no | Default `0` |
| `recurring_price` | number | no | Default `0` |
| `list_price` | number | no | Default `0` |
| `active` | bool | no | Default `true` |
| `billable` | bool | no | Default `false` |
| `availability` | string | no | `on_desktop` (default), `mobile`, `both` |
| `access_type` | string | no | `restricted` (default) or `public` |
| `roles` | string | no | Comma-separated role names |
| `catalogs` | string | no | `sc_catalogs` sys_id (e.g. Service Catalog) |
| `category` | string | no | Primary category sys_id (lives on `sc_cat_item.category`) |
| `delivery_time` | string | no | Duration as epoch-offset datetime (`"1970-01-03 00:00:00"` = 2 days) |
| `owner` | string | no | `sys_user` sys_id |
| `flow_designer_flow` | string | no | Flow sys_id for fulfillment |
| `fulfillment_automation_level` | string | no | Default `semi_automated` |
| `variables` | list | no | Nested variables (see below) |
| `additional_categories` | list[string] | no | Extra category sys_ids — creates `sc_cat_item_category` rows |

**`variables[]` entries (each becomes an `item_option_new` record)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Internal field name. Seeds the sys_id. |
| `question_text` | string | no | Display label |
| `type` | int | no | `3`=Multiple Choice (default), `5`=Select Box, `6`=Single Line Text, etc. |
| `order` | int | no | Default `100` |
| `mandatory` | bool | no | Default `false` |
| `active` | bool | no | Default `true` |
| `default_value` | string | no | Should match one of `choices.value` for choice variables |
| `do_not_select_first` | bool | no | Default `false` |
| `include_none` | bool | no | Default `false` |
| `layout` | string | no | Default `normal` |
| `choices` | list | no | Nested choices (only for choice-type variables) |

**`choices[]` entries (each becomes a `question_choice` record)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | string/number | yes | Internal value. Seeds the sys_id. |
| `text` | string | no | Display label. Defaults to `value`. |
| `order` | int | no | Default `100` |
| `misc` | number | no | Price adjustment for this choice. Default `0`. |
| `inactive` | bool | no | Default `false` |

**Determinism for catalog items**

- Item sys_id: `(manifest.name, "sc_cat_item", item.name)`
- Variable sys_id: `(manifest.name, "item_option_new", item.name, variable.name)`
- Choice sys_id: `(manifest.name, "question_choice", item.name, variable.name, choice.value)`
- Category map sys_id: `(manifest.name, "sc_cat_item_category", item.name, category_sys_id)`

Renaming a variable or changing a choice `value` after applying mints new
sys_ids and orphans the old records. Re-name = re-create.

### `business_rule`

Adds a Business Rule via `sys_script`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Always `business_rule` |
| `table` | string | yes | Table the rule fires on (`collection` in sys_script) |
| `name` | string | yes | Rule name (must be unique on the target table) |
| `description` | string | no | Rule description |
| `when` | string | no | `before`, `after`, `async`, `display`. Default `after`. |
| `action_insert` | bool | no | Default `false` |
| `action_update` | bool | no | Default `false` |
| `action_query` | bool | no | Default `false` |
| `action_delete` | bool | no | Default `false` |
| `condition` | string | no | Server-side condition expression |
| `script_file` | string | yes | Path to JS file relative to the change folder (e.g. `source/dispatch-br.js`) |
| `order` | number | no | Default `100` |
| `active` | bool | no | Default `true` |
| `advanced` | bool | no | Default `true` (enables script body) |

## `estimated_impact` (optional but recommended)

| Field | Type | Description |
|-------|------|-------------|
| `tables_modified` | list[string] | Tables this change touches |
| `bulk_data_changes` | bool | True if the change modifies existing record data |
| `rollback_complexity` | string | `low` / `medium` / `high` |
| `notes` | string | Multi-line rollback procedure or other reviewer notes |

## Example

```yaml
name: FSM Bridge — incident_task field + dispatch BR
description: |
    Adds u_needs_field_service field to incident_task plus the Business Rule
    that dispatches to x_1111454_fsmbridge when the field flips true.
application: global
target_release: 2026-Q2

intent: |
    Enable incident analysts to flag an incident task as needing field service.

artifacts:
    - type: dictionary_entry
      table: incident_task
      element: u_needs_field_service
      column_label: Needs Field Service
      internal_type: boolean
      default_value: 'false'
      description: When checked, triggers FSM dispatch.

    - type: business_rule
      table: incident_task
      name: FSM Bridge - Dispatch on Flag
      when: after
      action_insert: true
      action_update: true
      condition: current.u_needs_field_service == true && (current.isNewRecord() || current.u_needs_field_service.changes())
      script_file: source/dispatch-br.js
      order: 100

estimated_impact:
    tables_modified:
        - incident_task
    bulk_data_changes: false
    rollback_complexity: low
    notes: |
        - New field is nullable with default 'false' — no backfill needed
        - BR only fires when flag changes — no retroactive execution
        - Rollback: deactivate BR, then drop field (no data loss)
```

## Determinism

Sys_ids are derived deterministically from:

- The manifest `name`
- The artifact type
- For `sys_dictionary`: `(table, element)`
- For `sys_script`: `(table, rule name)`
- For `sc_cat_item` (and its nested variables / choices / category maps): see
  the per-record seeds documented under [`catalog_item`](#catalog_item)

This means **re-running the generator produces the same sys_ids**, so the
generated update set is recognized as an update on re-import rather than
creating duplicate records.

Don't change the manifest `name` after a change has been applied — that will
change all the sys_ids and the next regeneration will look like a brand-new
update set to the target instance.

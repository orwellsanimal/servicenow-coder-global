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

This means **re-running the generator produces the same sys_ids**, so the
generated update set is recognized as an update on re-import rather than
creating duplicate records.

Don't change the manifest `name` after a change has been applied — that will
change all the sys_ids and the next regeneration will look like a brand-new
update set to the target instance.

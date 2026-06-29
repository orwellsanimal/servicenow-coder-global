/**
 * BR: MI Group - form cluster   (incident, async/insert, order 100)
 *
 * Thin wrapper (ADR-0012). Runs OFF the insert transaction. When a duplicate
 * cluster has formed, proposes the earliest sibling as a Major Incident
 * Candidate (unprivileged) and parents the rest under it; a major incident
 * manager accepts it in the MIM Workbench. Fail-open.
 *
 * Params MUST match the before/insert wrapper (group-attach-br.js) — the
 * Script Include holds the same values as defaults if either drifts.
 */
(function executeRule(current, previous /*null when async*/) {
    try {
        new MajorIncidentGrouper({
            windowMinutes: 10,
            matchField: 'short_description',
            scopeQuery: '',
            debug: false
        }).formGroup(current.getUniqueValue());
    } catch (e) {
        gs.error('[MajorIncidentGrouper] form BR failed (fail-open): ' + e);
    }
})(current, previous);

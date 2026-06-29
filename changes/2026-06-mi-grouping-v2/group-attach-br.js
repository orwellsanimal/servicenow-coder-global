/**
 * BR: MI Group - attach to existing lead   (incident, before/insert, order 100)
 *
 * Thin wrapper (ADR-0012). Carries the use-case params and calls the Script
 * Include. In-transaction work is a single O(1) lookup + a field assignment on
 * `current` — no writes to other records. Fail-open: a grouping error must
 * never block incident creation.
 */
(function executeRule(current, previous /*null when async*/) {
    try {
        new MajorIncidentGrouper({
            windowMinutes: 10,
            matchField: 'short_description',
            scopeQuery: '',
            debug: false
        }).attachOnInsert(current);
    } catch (e) {
        gs.error('[MajorIncidentGrouper] attach BR failed (fail-open): ' + e);
    }
})(current, previous);

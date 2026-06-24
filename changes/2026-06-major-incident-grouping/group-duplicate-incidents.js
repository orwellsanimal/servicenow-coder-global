/**
 * Business Rule: Group duplicate incidents under a major-incident parent
 * ---------------------------------------------------------------------------
 * Table : incident
 * When  : before / insert        (parent is resolved before the row is written,
 *                                  so the child lands already linked — no second
 *                                  write to `current`, no recursive BR firing)
 * Order : 100
 *
 * Behaviour
 *   When a new incident is created, look for OTHER active incidents that share
 *   the same short_description and were created within the trailing window
 *   (WINDOW_MIN). If found:
 *     1. If one of them is already an accepted Major Incident -> attach current
 *        to it as a child (parent_incident).
 *     2. Otherwise promote the EARLIEST sibling to a Major Incident
 *        (major_incident_state = 'accepted'), self-heal by re-parenting any
 *        other ungrouped siblings to it, and attach current as a child.
 *   A lone incident (no duplicate in the window) is left untouched — we never
 *   create a Major Incident from a single report.
 *
 * Prerequisites
 *   - Major Incident Management plugin (com.snc.incident.mim) must be ACTIVE.
 *     It supplies the `major_incident_state` field. Confirmed active on
 *     dev392282 (2026-06-24): choices proposed/accepted/rejected/canceled.
 *
 * Tunables: WINDOW_MIN (window length), and whether to elevate priority.
 */
(function executeRule(current, previous /*null when async*/) {

    var WINDOW_MIN = 10;          // grouping window, minutes
    var MI_STATE_ACCEPTED = 'accepted';

    var desc = ('' + current.short_description).trim();

    // --- guards: nothing to do --------------------------------------------
    if (!desc) return;                                 // no short description
    if (!current.parent_incident.nil()) return;        // already a child
    if (current.major_incident_state == MI_STATE_ACCEPTED) return; // already an MI

    // Window lower bound (now - WINDOW_MIN minutes)
    var cutoff = new GlideDateTime();
    cutoff.subtract(WINDOW_MIN * 60 * 1000);

    // 1) Existing major-incident parent for this short_description?
    var parentId = findExistingMajor(desc, cutoff);

    // 2) Else, if siblings exist, promote the earliest into the parent.
    if (!parentId)
        parentId = promoteFromSiblings(desc, cutoff);

    // 3) No parent and no siblings -> ordinary incident, leave it alone.
    if (!parentId) return;

    // Link current as a child. before/insert => simple assignment, no update().
    current.parent_incident = parentId;

    // ----------------------------------------------------------------------

    function findExistingMajor(d, cut) {
        var gr = new GlideRecord('incident');
        gr.addActiveQuery();
        gr.addQuery('short_description', d);
        gr.addQuery('major_incident_state', MI_STATE_ACCEPTED);
        gr.addQuery('sys_created_on', '>=', cut);
        gr.orderBy('sys_created_on');            // oldest accepted MI wins
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr.getUniqueValue() : null;
    }

    function promoteFromSiblings(d, cut) {
        // Collect ungrouped, non-MI siblings in the window, oldest first.
        var ids = [];
        var gr = new GlideRecord('incident');
        gr.addActiveQuery();
        gr.addQuery('short_description', d);
        gr.addQuery('sys_created_on', '>=', cut);
        gr.addNullQuery('parent_incident');
        // NB: do NOT add `major_incident_state != accepted` here. ServiceNow's
        // `!=` operator excludes rows where the field is EMPTY, which is every
        // freshly-created incident — it would filter out all real siblings. We
        // don't need it anyway: findExistingMajor already ran first, so no
        // accepted Major Incident exists in this window when we get here.
        gr.orderBy('sys_created_on');
        gr.query();
        while (gr.next())
            ids.push(gr.getUniqueValue());

        if (ids.length === 0) return null;       // current is the only one (so far)

        var parentSysId = ids.shift();           // earliest sibling -> the MI parent

        // Promote the parent into a Major Incident.
        var mi = new GlideRecord('incident');
        if (!mi.get(parentSysId)) return null;
        mi.major_incident_state = MI_STATE_ACCEPTED;
        // Elevate severity. impact+urgency drive priority via the lookup rules;
        // setting them avoids fighting the priority-calculation engine.
        mi.impact = 1;                           // High
        mi.urgency = 1;                           // High
        mi.work_notes = 'Auto-promoted to Major Incident: ' + ids.length +
            ' duplicate-or-more incident(s) with the same short description ' +
            'within ' + WINDOW_MIN + ' minutes.';
        mi.update();

        // Self-heal: re-parent any other already-existing ungrouped siblings.
        for (var i = 0; i < ids.length; i++) {
            var child = new GlideRecord('incident');
            if (child.get(ids[i])) {
                child.parent_incident = parentSysId;
                child.update();
            }
        }
        return parentSysId;
    }

})(current, previous);

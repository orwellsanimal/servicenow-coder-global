/**
 * MajorIncidentGrouper — core logic for duplicate-incident grouping.
 * ---------------------------------------------------------------------------
 * Detects incidents that share a match field (default short_description) within
 * a trailing window and groups them under a single Major Incident "lead". Per
 * ADR-0012 this Script Include is the home for the logic; the thin Business
 * Rules (before/insert + async/insert) are parameterised wrappers that call it.
 *
 * Promotion model (ADR-0013, propose + human-approve): turning an incident into
 * an ACCEPTED major incident requires the major_incident_manager role, which the
 * inserting user / async BR does not have. So this code only does the
 * UNPRIVILEGED steps — propose the earliest sibling as a Major Incident
 * Candidate, and parent the rest under it — and leaves the ACCEPT step to a
 * major incident manager in the MIM Workbench. Both steps go through the
 * supported MIM API (sn_major_inc_mgmt.MajorIncidentTriggerRules), so MIM
 * side-effects engage; we never write major_incident_state directly.
 *
 * Decide (reads, side-effect-free): groupKey, findLead, findUngroupedSiblings.
 * Act (writes): proposeLead, attachChild.
 * Entry points: attachOnInsert (sync, O(1)) and formGroup (async).
 *
 * Config is injected by the wrapper; defaults live here so the before-BR, the
 * async-BR, and any future scheduled backstop don't drift.
 */
var MajorIncidentGrouper = Class.create();
MajorIncidentGrouper.prototype = {

    DEFAULTS: {
        windowMinutes: 10,         // grouping window
        matchField: 'short_description',
        scopeQuery: '',            // optional encoded query AND'd onto every lookup (domain/company/service)
        debug: false
    },

    MI_STATE_PROPOSED: 'proposed',
    MI_STATE_ACCEPTED: 'accepted',
    SOURCE: 'MajorIncidentGrouper',

    initialize: function (params) {
        params = params || {};
        this.cfg = {};
        for (var k in this.DEFAULTS) {
            this.cfg[k] = (params[k] !== undefined && params[k] !== null) ? params[k] : this.DEFAULTS[k];
        }
    },

    // -- decide (reads) ----------------------------------------------------

    groupKey: function (gr) {
        return ('' + (gr.getValue(this.cfg.matchField) || '')).trim();
    },

    _cutoff: function () {
        var c = new GlideDateTime();
        c.subtract(this.cfg.windowMinutes * 60 * 1000);
        return c;
    },

    _baseQuery: function (key) {
        var gr = new GlideRecord('incident');
        gr.addActiveQuery();
        gr.addQuery(this.cfg.matchField, key);
        gr.addQuery('sys_created_on', '>=', this._cutoff());
        if (this.cfg.scopeQuery) {
            gr.addEncodedQuery(this.cfg.scopeQuery);
        }
        return gr;
    },

    // The cluster "lead": earliest incident in the window already proposed as a
    // candidate OR accepted as a major incident. Children attach to it.
    findLead: function (key) {
        if (!key) {
            return null;
        }
        var gr = this._baseQuery(key);
        gr.addQuery('major_incident_state', 'IN', this.MI_STATE_PROPOSED + ',' + this.MI_STATE_ACCEPTED);
        gr.orderBy('sys_created_on');
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr.getUniqueValue() : null;
    },

    // Plain, ungrouped siblings in the window (no parent, blank MI state),
    // earliest first. NB: filter blank state with addNullQuery, NOT
    // `!= accepted` — the != operator drops empty rows (the v1 bug).
    findUngroupedSiblings: function (key) {
        var ids = [];
        if (!key) {
            return ids;
        }
        var gr = this._baseQuery(key);
        gr.addNullQuery('parent_incident');
        gr.addNullQuery('major_incident_state');
        gr.orderBy('sys_created_on');
        gr.query();
        while (gr.next()) {
            ids.push(gr.getUniqueValue());
        }
        return ids;
    },

    // -- act (writes, via supported MIM API) -------------------------------

    // Propose an incident as a Major Incident Candidate. Unprivileged
    // (proposeMIC has no role gate; canProposeMIC checks itil/incident_write).
    proposeLead: function (sysId) {
        var gr = new GlideRecord('incident');
        if (!gr.get(sysId)) {
            return false;
        }
        var mim = new sn_major_inc_mgmt.MajorIncidentTriggerRules(gr);
        if (mim.isMajorIncident() || mim.isMIC()) {
            return true; // already a lead
        }
        if (typeof mim.canProposeMIC === 'function' && !mim.canProposeMIC()) {
            this._log('cannot propose ' + sysId + ' (canProposeMIC=false)');
            return false;
        }
        mim.proposeMIC();
        this._log('proposed candidate ' + sysId);
        return true;
    },

    // Parent a child incident under the lead via the supported API
    // (addAsChildToMajorIncident sets parent_incident + clears MI state).
    attachChild: function (childSysId, leadSysId) {
        if (childSysId === leadSysId) {
            return false;
        }
        var child = new GlideRecord('incident');
        if (!child.get(childSysId)) {
            return false;
        }
        if (!child.parent_incident.nil()) {
            return true; // already parented
        }
        var lead = new GlideRecord('incident');
        if (!lead.get(leadSysId)) {
            return false;
        }
        var mim = new sn_major_inc_mgmt.MajorIncidentTriggerRules(child);
        mim.addAsChildToMajorIncident(lead);
        this._log('attached ' + childSysId + ' -> lead ' + leadSysId);
        return true;
    },

    // -- entry points ------------------------------------------------------

    // before/insert: O(1). Link the incident being inserted to an existing
    // lead, if one is already in the window. No writes to other records.
    attachOnInsert: function (current) {
        var key = this.groupKey(current);
        if (!key) {
            return;
        }
        if (!current.parent_incident.nil()) {
            return; // already a child
        }
        var st = current.getValue('major_incident_state');
        if (st === this.MI_STATE_ACCEPTED || st === this.MI_STATE_PROPOSED) {
            return; // already a lead itself
        }
        var leadId = this.findLead(key);
        if (leadId) {
            current.parent_incident = leadId; // before/insert: assignment only, no update()
            this._log('attachOnInsert: "' + key + '" -> lead ' + leadId);
        }
    },

    // async/insert: form the group. If a lead now exists, attach strays; else,
    // when a cluster has formed (>= 2 ungrouped), propose the earliest as a
    // candidate and parent the rest. A lone incident is left untouched.
    formGroup: function (sysId) {
        var current = new GlideRecord('incident');
        if (!current.get(sysId)) {
            return;
        }
        var key = this.groupKey(current);
        if (!key) {
            return;
        }

        var leadId = this.findLead(key);
        if (leadId) {
            this.attachChild(sysId, leadId);
            this._healSiblings(key, leadId);
            return;
        }

        var sibs = this.findUngroupedSiblings(key);
        if (sibs.length < 2) {
            return; // never spin up a major incident from a single report
        }

        var newLead = sibs[0];
        if (!this.proposeLead(newLead)) {
            return;
        }
        for (var i = 1; i < sibs.length; i++) {
            this.attachChild(sibs[i], newLead);
        }
        this._log('formGroup: proposed ' + newLead + ' + ' + (sibs.length - 1) + ' child(ren) for "' + key + '"');
    },

    // Re-parent any other ungrouped strays onto an existing lead. Callable on
    // its own (async heal, or a future scheduled backstop) — never run inline
    // on the before/insert hot path.
    _healSiblings: function (key, leadId) {
        var sibs = this.findUngroupedSiblings(key);
        for (var i = 0; i < sibs.length; i++) {
            this.attachChild(sibs[i], leadId);
        }
    },

    // -- infra -------------------------------------------------------------

    _log: function (msg) {
        if (this.cfg.debug) {
            gs.info('[' + this.SOURCE + '] ' + msg);
        }
    },

    type: 'MajorIncidentGrouper'
};

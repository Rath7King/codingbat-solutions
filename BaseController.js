sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    var BASE_URL = "/api/cib/FinancialDashboard";

    return Controller.extend("project1.controller.BaseController", {

        // ── OData fetch ───────────────────────────────────────
        _oDataFetch: function (sFilter, sOrderBy) {
            var sUrl = BASE_URL
                + "?$filter=" + encodeURIComponent(sFilter)
                + (sOrderBy ? "&$orderby=" + encodeURIComponent(sOrderBy) : "");

            return fetch(sUrl, { headers: { "Accept": "application/json" } })
                .then(function (r) {
                    if (!r.ok) throw new Error("OData " + r.status + ": " + r.statusText);
                    return r.json();
                })
                .then(function (d) { return d.value || []; });
        },

        // ── Build $filter from current state ─────────────────
        _getStateFilter: function (sRecordType) {
            var s = this._getStore().getProperty("/state");
            return [
                "recordType eq '"   + sRecordType  + "'",
                "topGroup eq '"     + s.selectedTop + "'",
                "pageView eq '"     + s.selectedSub + "'",
                "displayUnit eq '"  + s.unit        + "'",
                "currencyType eq '" + s.currency    + "'"
            ].join(" and ");
        },

        // ── Set data-activeItem on a toggle control ───────────
        _setToggleActive: function (sId, bActive) {
            var oCtrl = this.byId(sId);
            if (!oCtrl) return;
            var oDom = oCtrl.getDomRef();
            if (oDom) oDom.setAttribute("data-activeItem", bActive ? "true" : "false");
        },

        // ── Apply a map of { id: boolean } to toggles ────────
        _applyToggles: function (oMap) {
            Object.keys(oMap).forEach(function (sId) {
                this._setToggleActive(sId, oMap[sId]);
            }, this);
        },

        // ════════════════════════════════════════════════════
        //  SHARED STORE MODEL HELPERS
        //
        //  THE FIX IS HERE.
        //
        //  Before the fix:
        //    Every controller did: this.getView().setModel(oStore, "store")
        //    This sets the model on the VIEW. Each view (View1, Trends)
        //    got its OWN separate store model. So:
        //      - View1's store had selectedTop = "WRB"
        //      - Trends's store had selectedTop = "Group" (reset on init)
        //    They never shared state. Navigating between pages lost the selection.
        //
        //  After the fix:
        //    We use: this.getOwnerComponent().setModel(oStore, "store")
        //    This sets the model on the COMPONENT — the single shared parent
        //    of every view in the app. Both View1 and Trends read from and
        //    write to the exact same model object.
        //    When View1 sets selectedTop = "WRB", Trends sees "WRB".
        //    When Trends sets selectedTop = "CIB", View1 sees "CIB".
        //    State is preserved across every navigation.
        //
        //  Why this.getView().getModel("store") still works:
        //    SAP UI5 model propagation — when a view looks for a named model
        //    it first checks the view itself, then walks UP to the component.
        //    Since we no longer set the model on the view, the lookup reaches
        //    the component and finds the shared model. No change needed in
        //    any XML binding — {store>/state/selectedTop} still works.
        // ════════════════════════════════════════════════════

        // Returns the shared store model (creates it once if needed)
        _getStore: function () {
            var oComponent = this.getOwnerComponent();
            var oStore     = oComponent.getModel("store");
            if (!oStore) {
                // First ever call — create the model on the component
                oStore = new sap.ui.model.json.JSONModel({
                    state: {
                        selectedTop: "Group",
                        selectedSub: "Overview",
                        unit:        "$m",
                        currency:    "RFX",
                        period:      "quarterly"
                    }
                });
                // Set on COMPONENT so ALL views share the exact same instance
                oComponent.setModel(oStore, "store");
            }
            return oStore;
        },

        // Convenience: read the full state object
        _getState: function () {
            return this._getStore().getProperty("/state");
        }
    });
});

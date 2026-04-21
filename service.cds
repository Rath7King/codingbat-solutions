using { nrfp.financials as db } from '../db/schema';

service NRFPFinancialsService @(path: '/api/nrfp') {

    @readonly
    entity ReportingMaster as projection on db.ReportingMaster;


    // ── getWidgetData ─────────────────────────────────────────────────────
    // Single call — returns all 12 KPI widget results.
    // All 12 HANA queries run in parallel via hdb pool inside service.js.
    action getWidgetData(
        topGroup     : String,
        displayUnit  : String,
        currencyType : String
    ) returns array of {
        widget     : String;
        status     : String;
        durationMs : Integer;
        data       : LargeString;
    };


    // ── getWidgetNames ────────────────────────────────────────────────────
    // Returns ordered widget name list from memory.
    action getWidgetNames()
        returns array of String;


    // ── getWidgetDataSingle (for testing/debugging only) ──────────────────
    action getWidgetDataSingle(
        topGroup     : String,
        displayUnit  : String,
        currencyType : String,
        widgetName   : String
    ) returns {
        widget     : String;
        status     : String;
        durationMs : Integer;
        data       : LargeString;
    };

}

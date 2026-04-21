using { nrfp.financials as db } from '../db/schema';

service NRFPFinancialsService @(path: '/api/nrfp') {

    @readonly
    entity ReportingMaster as projection on db.ReportingMaster;


    // ── getWidgetData ─────────────────────────────────────────────────────
    // Returns all 12 KPI widget results in one call.
    // All 12 queries run in parallel via hdb pool inside service.js.
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
    // Returns ordered widget name list from memory (used for skeleton cards).
    action getWidgetNames()
        returns array of String;


    // ── getIncomeByProduct ────────────────────────────────────────────────
    // Returns income breakdown by product for bar chart.
    // Returns multiple rows — one per M_PRODUCT_CONCAT value.
    // JSON shape per row:
    //   { product, ytdCfx, fyOutlookCfx, fyBudgetCfx, fyOutlookBudgetCfx, yoyPctCfx,
    //               ytdRfx, fyOutlookRfx, fyBudgetRfx, fyOutlookBudgetRfx, yoyPctRfx }
    action getIncomeByProduct(
        topGroup     : String,
        displayUnit  : String,
        currencyType : String
    ) returns array of {
        product            : String;
        ytdCfx             : Decimal(28,4);
        fyOutlookCfx       : Decimal(28,4);
        fyBudgetCfx        : Decimal(28,4);
        fyOutlookBudgetCfx : Decimal(28,4);
        yoyPctCfx          : Decimal(10,2);
        ytdRfx             : Decimal(28,4);
        fyOutlookRfx       : Decimal(28,4);
        fyBudgetRfx        : Decimal(28,4);
        fyOutlookBudgetRfx : Decimal(28,4);
        yoyPctRfx          : Decimal(10,2);
    };


    // ── getIncomeByCluster ────────────────────────────────────────────────
    // Returns income breakdown by cluster for bar chart.
    // Returns multiple rows — one per M_PRODUCT_CONCAT value.
    // JSON shape per row:
    //   { cluster, ytdActualsCfx, fyOutlookCfx, q3OutlookCfx, yoyPctCfx,
    //              ytdActualsRfx, fyOutlookRfx, q3OutlookRfx, yoyPctRfx }
    action getIncomeByCluster(
        topGroup     : String,
        displayUnit  : String,
        currencyType : String
    ) returns array of {
        cluster        : String;
        ytdActualsCfx  : Decimal(28,4);
        fyOutlookCfx   : Decimal(28,4);
        q3OutlookCfx   : Decimal(28,4);
        yoyPctCfx      : Decimal(10,2);
        ytdActualsRfx  : Decimal(28,4);
        fyOutlookRfx   : Decimal(28,4);
        q3OutlookRfx   : Decimal(28,4);
        yoyPctRfx      : Decimal(10,2);
    };


    // ── getWidgetDataSingle (kept for testing/debugging) ──────────────────
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

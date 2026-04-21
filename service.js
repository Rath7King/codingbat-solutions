'use strict';

// ============================================================
//  service.js
//
//  CHANGES IN THIS VERSION:
//
//  1. COLUMN_MAP updated — all 12 widget column names updated
//     to match the new queries (percentage variances, new column
//     name patterns like VS_BUDGET_RFX_VARIANCE, PY_PQ_RFX_VARIANCE,
//     YTD_ACTUAL_RFX_FPNA, VARIANCE_PYPQ_Actuals_RFX_FPNA etc.)
//
//  2. Two new endpoints added for chart widgets:
//       getIncomeByProduct  → returns array of rows by product
//       getIncomeByCluster  → returns array of rows by cluster
//     These queries are stored directly here (not in ReportingMaster)
//     because they return MULTIPLE rows per call, unlike the 12 KPI
//     widgets that each return exactly 1 row.
//
//  3. hdb + generic-pool for parallel HANA execution (unchanged)
//  4. oQueryMap pre-load at startup (unchanged)
//  5. getWidgetData — 1 call returns all 12 KPI widgets (unchanged)
//
//  INSTALL:
//    npm install generic-pool
// ============================================================

const cds         = require('@sap/cds');
const hdb         = require('hdb');
const genericPool = require('generic-pool');


// ── HANA connection options ────────────────────────────────────────────
var oCreds = cds.env.requires.db.credentials;

var oConnOptions = {
    host:     oCreds.host,
    port:     parseInt(oCreds.port, 10),
    user:     oCreds.user,
    password: oCreds.password
};

if (oCreds.certificate) {
    oConnOptions.ca     = oCreds.certificate;
    oConnOptions.useTLS = true;
}
if (oCreds.schema) {
    oConnOptions.currentSchema = oCreds.schema;
}


// ── Connection pool ────────────────────────────────────────────────────
var oFactory = {
    create: function () {
        return new Promise(function (resolve, reject) {
            var oClient = hdb.createClient(oConnOptions);
            oClient.connect(function (err) {
                if (err) { reject(err); return; }
                resolve(oClient);
            });
        });
    },
    destroy:  function (oClient) { oClient.end(); return Promise.resolve(); },
    validate: function (oClient) { return oClient.readyState !== 'disconnected'; }
};

var oPool = genericPool.createPool(oFactory, {
    min: 12, max: 20,
    acquireTimeoutMillis: 10000,
    idleTimeoutMillis:    60000,
    testOnBorrow:         true
});

oPool.on('factoryCreateError', function (err) {
    console.error('[POOL] Error: ' + err.message);
});


// ── runWithPool(sQuery) ────────────────────────────────────────────────
async function runWithPool(sQuery) {
    var oClient = await oPool.acquire();
    try {
        return await new Promise(function (resolve, reject) {
            oClient.exec(sQuery, function (err, aRows) {
                if (err) reject(err);
                else     resolve(aRows || []);
            });
        });
    } finally {
        oPool.release(oClient);
    }
}


// ── ReportingMaster in-memory map ─────────────────────────────────────
// { "Income": "SELECT ...", "Impairments": "SELECT ...", ... }
// Loaded once at startup — zero DB reads per user request.
var oQueryMap = {};


// ── T_REPORTING replacement helper ────────────────────────────────────
function applyReporting(sQuery, sReporting) {
    return sQuery.replace(
        /T_REPORTING\s*=\s*'[^']+'/g,
        "T_REPORTING = '" + sReporting + "'"
    );
}


// ============================================================
//  COLUMN_MAP — UPDATED for new query column names
//
//  All 12 KPI widgets now return percentage variances.
//  Column names updated accordingly across all widgets.
//
//  PATTERN: Store 7 RFX column names per widget.
//  CFX auto-derived: colName.replace('_RFX', '_CFX')
//  This works for all 12 widgets because HANA SQL uses that
//  exact pattern in every query output column.
// ============================================================
var COLUMN_MAP = {

    // ── Income ────────────────────────────────────────────────────────────
    // Variance columns now return % — column names unchanged
    'Income': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_PYFY_OUTLOOK_RFX_FPNA',
        'PYPQTD_ACTUALS_RFX_FPNA',
        'PY_YTD_ACTUALS_RFX_FPNA'
    ],

    // ── Impairments ───────────────────────────────────────────────────────
    // VS_BUDGET now _PCT suffix; YoY columns renamed to _VARIANCE pattern
    'Impairments': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_PCT',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'PY_PQ_RFX_VARIANCE',
        'YTD_ACTUAL_PY_RFX_VARIANCE',
        'FY_OUTLOOK_PY_RFX_VARIANCE'
    ],

    // ── Underlying Profit ─────────────────────────────────────────────────
    // All variance columns renamed to _VARIANCE suffix
    'Underlying Profit': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_VARIANCE',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'PY_PQ_RFX_VARIANCE',
        'YTD_ACTUAL_PY_RFX_VARIANCE',
        'FY_OUTLOOK_PY_RFX_VARIANCE'
    ],

    // ── Funded Assets ─────────────────────────────────────────────────────
    'Funded Assets': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_VARIANCE',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'PY_PQ_RFX_VARIANCE',
        'YTD_ACTUAL_PY_RFX_VARIANCE',
        'FY_OUTLOOK_PY_RFX_VARIANCE'
    ],

    // ── RoTE ──────────────────────────────────────────────────────────────
    // All variance/YoY columns now have _VARIANCE suffix
    'RoTE': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_VARIANCE',
        'PQTR_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'FY_ACTPY_RFX_VARIANCE',
        'PY_PQTR_RFX_VARIANCE',
        'PYYTD_RFX_VARIANCE'
    ],

    // ── Costs ─────────────────────────────────────────────────────────────
    // CY_PQ → PQTD, PY_PQ → VARIANCE_PYPQ_Actuals, YTD_ACTUAL_PY → YTD_ACTUAL,
    // YTD_ACTUAL_PY2 → YTD_ACTUAL_2 (all now percentages)
    'Costs': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_PYPQ_Actuals_RFX_FPNA',
        'YTD_ACTUAL_RFX_FPNA',
        'YTD_ACTUAL_2_RFX_FPNA'
    ],

    // ── NII ───────────────────────────────────────────────────────────────
    // VARIANCE_YTD_ACTUAL renamed; PYPQ_ACTUALS renamed; PY_YTD same name
    'NII': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_YTD_Actual_RFX_FPNA',
        'PYPQ_ACTUALS_RFX_FPNA',
        'PY_YTD_ACTUALS_RFX_FPNA'
    ],

    // ── First RWA ─────────────────────────────────────────────────────────
    // Same pattern as Costs
    'First RWA': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_PYPQ_Actuals_RFX_FPNA',
        'YTD_ACTUAL_RFX_FPNA',
        'YTD_ACTUAL_2_RFX_FPNA'
    ],

    // ── JAWS ──────────────────────────────────────────────────────────────
    // _PCT suffix added to all variance columns
    'JAWS': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX',
        'PQTR_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'VAR_FY_ACTPY_PCT_RFX',
        'VAR_PYPQTR_PCT_RFX',
        'VAR_PYYTD_PCT_RFX'
    ],

    // ── CIR ───────────────────────────────────────────────────────────────
    // Same pattern as JAWS (uses CFX_N/RFX_N from ALLRATIOS)
    'CIR': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX',
        'PQTR_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'VAR_FY_ACTPY_PCT_RFX',
        'VAR_PYPQTR_PCT_RFX',
        'VAR_PYYTD_PCT_RFX'
    ],

    // ── Controllable Headcount ────────────────────────────────────────────
    // _YOY_PCT suffix added to all variance columns
    'Controllable Headcount': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'VAR_PY_PQ_YOY_PCT_RFX',
        'VAR_YTD_PY_YOY_PCT_RFX',
        'VAR_FY_VS_PY_YOY_PCT_RFX'
    ],

    // ── Second RWA ────────────────────────────────────────────────────────
    'Second RWA': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'VAR_PY_PQ_YOY_PCT_RFX',
        'VAR_YTD_PY_YOY_PCT_RFX',
        'VAR_FY_VS_PY_YOY_PCT_RFX'
    ]

};


// ── buildJson(sWidget, aRows) ──────────────────────────────────────────
// Universal — 0 if blocks. Works for all 12 KPI widgets.
// readGroup(suffix) reads 7 fields by replacing _RFX with suffix.
function buildJson(sWidget, aRows) {

    if (!aRows || aRows.length === 0) {
        return { widget: sWidget, error: 'No data from HANA' };
    }

    var aCols = COLUMN_MAP[sWidget];
    if (!aCols) {
        return { widget: sWidget, error: 'No column map for: ' + sWidget };
    }

    var r = aRows[0];

    function fmt(v) {
        var n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }

    function readGroup(suffix) {
        return {
            ytdActuals: fmt(r[aCols[0].replace('_RFX', suffix)]),
            vsBudget:   fmt(r[aCols[1].replace('_RFX', suffix)]),
            pqActuals:  fmt(r[aCols[2].replace('_RFX', suffix)]),
            fyOutlook:  fmt(r[aCols[3].replace('_RFX', suffix)]),
            ytdYoy:     fmt(r[aCols[4].replace('_RFX', suffix)]),
            pqYoy:      fmt(r[aCols[5].replace('_RFX', suffix)]),
            fyYoy:      fmt(r[aCols[6].replace('_RFX', suffix)])
        };
    }

    return {
        widget: sWidget,
        rfx:    readGroup('_RFX'),
        cfx:    readGroup('_CFX')
    };
}


// ============================================================
//  CHART WIDGET QUERIES
//
//  These are NOT stored in ReportingMaster because they return
//  multiple rows (one per product/cluster), unlike KPI widgets.
//  Stored as constants here — change and restart cds watch.
// ============================================================

var INCOME_BY_PRODUCT_SQL = `WITH PERIODS AS (
    SELECT DISTINCT E_PERIOD_DATE
    FROM   T1NFRP_PHY."TBL_NFRP_DATE_CONFIG"
    WHERE  FILTER_DATE = 'CURRENT_MONTH' AND FILTER_TYPE = 'PYR+CYR'
),
FILTERED_DATA AS (
    SELECT A.M_PRODUCT_CONCAT, A.DATA_TYPE, A.T_VERSION, A.MONTH_ABR, A.CFX, A.RFX
    FROM T1NFRP_PHY."CV_UP_NFRP_ALLDATA" A
    INNER JOIN PERIODS P ON A.E_PERIOD_DATE = P.E_PERIOD_DATE
    WHERE A.T_REPORTING = 'FPNA' AND A.M_ACCOUNT_0 = 'Income'
    AND A.M_PRODUCT_0 IN ('Banking', 'Markets', 'Transaction services')
    AND A.DATA_TYPE IN ('Actuals', 'Outlook_PM', 'Budget') AND A.T_VERSION IN ('YTD', 'MTD')
),
ALL_MEASURES AS (
    SELECT F.M_PRODUCT_CONCAT,
        SUM(CASE WHEN F.DATA_TYPE = 'Actuals' AND F.T_VERSION = 'YTD' THEN F.CFX ELSE 0 END) AS YTD_CFX,
        SUM(CASE WHEN F.DATA_TYPE = 'Actuals' AND F.T_VERSION = 'MTD' THEN F.CFX ELSE 0 END) AS PY_YTD_CFX,
        SUM(CASE WHEN F.DATA_TYPE = 'Outlook_PM' AND F.T_VERSION = 'YTD' AND F.MONTH_ABR = 'FY' THEN F.CFX ELSE 0 END) AS FY_OUTLOOK_CFX,
        SUM(CASE WHEN F.DATA_TYPE = 'Budget' AND F.MONTH_ABR = 'FY' THEN F.CFX ELSE 0 END) AS FY_BUDGET_CFX,
        SUM(CASE WHEN F.DATA_TYPE = 'Actuals' AND F.T_VERSION = 'YTD' THEN F.RFX ELSE 0 END) AS YTD_RFX,
        SUM(CASE WHEN F.DATA_TYPE = 'Actuals' AND F.T_VERSION = 'MTD' THEN F.RFX ELSE 0 END) AS PY_YTD_RFX,
        SUM(CASE WHEN F.DATA_TYPE = 'Outlook_PM' AND F.T_VERSION = 'YTD' AND F.MONTH_ABR = 'FY' THEN F.RFX ELSE 0 END) AS FY_OUTLOOK_RFX,
        SUM(CASE WHEN F.DATA_TYPE = 'Budget' AND F.MONTH_ABR = 'FY' THEN F.RFX ELSE 0 END) AS FY_BUDGET_RFX
    FROM FILTERED_DATA F GROUP BY F.M_PRODUCT_CONCAT
)
SELECT M.M_PRODUCT_CONCAT,
    M.YTD_CFX, M.FY_OUTLOOK_CFX, M.FY_BUDGET_CFX,
    CASE WHEN M.FY_OUTLOOK_CFX < 0 THEN LEAST(M.FY_OUTLOOK_CFX, M.FY_BUDGET_CFX) ELSE GREATEST(M.FY_OUTLOOK_CFX, M.FY_BUDGET_CFX) END AS FY_OUTLOOK_BUDGET_CFX,
    CASE WHEN M.PY_YTD_CFX != 0 THEN ROUND((M.YTD_CFX - M.PY_YTD_CFX) * 100.0 / ABS(M.PY_YTD_CFX), 2) END AS YOY_PCT_CFX,
    M.YTD_RFX, M.FY_OUTLOOK_RFX, M.FY_BUDGET_RFX,
    CASE WHEN M.FY_OUTLOOK_RFX < 0 THEN LEAST(M.FY_OUTLOOK_RFX, M.FY_BUDGET_RFX) ELSE GREATEST(M.FY_OUTLOOK_RFX, M.FY_BUDGET_RFX) END AS FY_OUTLOOK_BUDGET_RFX,
    CASE WHEN M.PY_YTD_RFX != 0 THEN ROUND((M.YTD_RFX - M.PY_YTD_RFX) * 100.0 / ABS(M.PY_YTD_RFX), 2) END AS YOY_PCT_RFX
FROM ALL_MEASURES M ORDER BY M.M_PRODUCT_CONCAT`;

var INCOME_BY_CLUSTER_SQL = `WITH PERIODS AS (
    SELECT
        MAX(CASE WHEN D.ADD16 = '0' THEN D.E_PERIOD_DATE END) AS CURRENT_YTD_PERIOD,
        MAX(CASE WHEN D.ADD6 = 'PY_YTD' THEN D.E_PERIOD_DATE END) AS YTD_PY_PERIOD,
        MAX(CASE WHEN D.ADD19 = 'CY' THEN D.E_PERIOD_DATE END) AS FY_OUTLOOK_PERIOD,
        MAX(CASE WHEN D.ADD17 = '1' THEN D.E_PERIOD_DATE END) AS Q3_OUTLOOK_PERIOD
    FROM T1NFRP_PHY."TBL_NFRP_DATE_CONFIG" D
    WHERE D.FILTER_DATE = 'CURRENT_MONTH' AND D.FILTER_TYPE = 'PYR+CYR'
),
ALL_MEASURES AS (
    SELECT A.M_PRODUCT_CONCAT,
        SUM(CASE WHEN A.DATA_TYPE = 'Actuals' AND A.T_VERSION = 'YTD' AND A.E_PERIOD_DATE = P.CURRENT_YTD_PERIOD THEN A.CFX ELSE 0 END) AS YTD_ACTUALS_CFX,
        SUM(CASE WHEN A.DATA_TYPE = 'Actuals' AND A.T_VERSION = 'MTD' AND A.E_PERIOD_DATE = P.YTD_PY_PERIOD THEN A.CFX ELSE 0 END) AS PY_YTD_ACTUALS_CFX,
        SUM(CASE WHEN A.E_PERIOD_DATE = P.FY_OUTLOOK_PERIOD AND MONTH_ABR = 'FY' THEN A.CFX ELSE 0 END) AS FY_OUTLOOK_CFX,
        SUM(CASE WHEN A.DATA_TYPE = 'Outlook_PM' AND A.T_VERSION = 'QTD' AND A.E_PERIOD_DATE = P.Q3_OUTLOOK_PERIOD THEN A.CFX ELSE 0 END) AS Q3_OUTLOOK_CFX,
        SUM(CASE WHEN A.DATA_TYPE = 'Actuals' AND A.T_VERSION = 'YTD' AND A.E_PERIOD_DATE = P.CURRENT_YTD_PERIOD THEN A.RFX ELSE 0 END) AS YTD_ACTUALS_RFX,
        SUM(CASE WHEN A.DATA_TYPE = 'Actuals' AND A.T_VERSION = 'MTD' AND A.E_PERIOD_DATE = P.YTD_PY_PERIOD THEN A.RFX ELSE 0 END) AS PY_YTD_ACTUALS_RFX,
        SUM(CASE WHEN A.E_PERIOD_DATE = P.FY_OUTLOOK_PERIOD AND MONTH_ABR = 'FY' THEN A.RFX ELSE 0 END) AS FY_OUTLOOK_RFX,
        SUM(CASE WHEN A.DATA_TYPE = 'Outlook_PM' AND A.T_VERSION = 'QTD' AND A.E_PERIOD_DATE = P.Q3_OUTLOOK_PERIOD THEN A.RFX ELSE 0 END) AS Q3_OUTLOOK_RFX
    FROM T1NFRP_PHY."CV_UP_NFRP_ALLDATA" A
    INNER JOIN PERIODS P ON A.E_PERIOD_DATE IN (P.CURRENT_YTD_PERIOD, P.YTD_PY_PERIOD, P.FY_OUTLOOK_PERIOD, P.Q3_OUTLOOK_PERIOD)
    WHERE A.T_REPORTING = 'FPNA' AND A.M_ACCOUNT_0 = 'Income'
    GROUP BY A.M_PRODUCT_CONCAT
)
SELECT M.M_PRODUCT_CONCAT,
    M.YTD_ACTUALS_CFX, M.FY_OUTLOOK_CFX, M.Q3_OUTLOOK_CFX,
    CASE WHEN M.PY_YTD_ACTUALS_CFX != 0 THEN ROUND((M.YTD_ACTUALS_CFX - M.PY_YTD_ACTUALS_CFX) * 100.0 / ABS(M.PY_YTD_ACTUALS_CFX), 2) END AS YOY_PCT_CFX,
    M.YTD_ACTUALS_RFX, M.FY_OUTLOOK_RFX, M.Q3_OUTLOOK_RFX,
    CASE WHEN M.PY_YTD_ACTUALS_RFX != 0 THEN ROUND((M.YTD_ACTUALS_RFX - M.PY_YTD_ACTUALS_RFX) * 100.0 / ABS(M.PY_YTD_ACTUALS_RFX), 2) END AS YOY_PCT_RFX
FROM ALL_MEASURES M ORDER BY M.M_PRODUCT_CONCAT`;


// ============================================================
//  SERVICE HANDLER
// ============================================================
module.exports = cds.service.impl(async function (srv) {


    // ── Startup: pre-load ReportingMaster ───────────────────────────────
    cds.on('served', async function () {
        console.log('[STARTUP] Loading ReportingMaster...');
        try {
            const aWidgets = await cds.db.run(
                SELECT.from('nrfp.financials.ReportingMaster')
                      .columns('widget', 'query')
                      .orderBy('ID asc')
            );
            aWidgets.forEach(function (oRow) {
                oQueryMap[oRow.widget] = oRow.query;
            });
            // Only KPI widgets (IDs 1-12) go into oQueryMap
            // Chart widgets (Income by Product, Income by Cluster) use
            // their SQL constants defined above
            console.log('[STARTUP] Loaded ' + aWidgets.length + ' widgets into memory');
        } catch (e) {
            console.error('[STARTUP] Failed: ' + e.message);
        }
    });


    // ── getWidgetNames ────────────────────────────────────────────────────
    srv.on('getWidgetNames', async () => {
        var aKeys = Object.keys(oQueryMap).filter(function (k) {
            // Only return the 12 KPI widgets, not the chart widgets
            return !['Income by Product', 'Income by Cluster'].includes(k);
        });
        if (aKeys.length > 0) return aKeys;
        var aWidgets = await cds.db.run(
            SELECT.from('nrfp.financials.ReportingMaster')
                  .columns('widget').orderBy('ID asc')
        );
        return aWidgets
            .map(function (w) { return w.widget; })
            .filter(function (n) { return !['Income by Product','Income by Cluster'].includes(n); });
    });


    // ── getWidgetData ─────────────────────────────────────────────────────
    // Single call — returns all 12 KPI widgets in parallel via hdb pool.
    srv.on('getWidgetData', async (req) => {

        const topGroup     = req.data.topGroup     || 'Group';
        const displayUnit  = req.data.displayUnit  || '$m';
        const currencyType = req.data.currencyType || 'RFX';
        const sReporting   = (topGroup === 'Group') ? 'FPNA' : topGroup;

        const aKpiWidgets = Object.keys(oQueryMap).filter(function (k) {
            return !['Income by Product', 'Income by Cluster'].includes(k);
        });

        if (aKpiWidgets.length === 0) {
            console.warn('[getWidgetData] oQueryMap empty — not loaded yet');
            return [];
        }

        const tStart = Date.now();

        const aResults = await Promise.all(
            aKpiWidgets.map(async function (sWidget) {
                const sQuery = applyReporting(oQueryMap[sWidget], sReporting);
                const tW     = Date.now();
                try {
                    const aData = await runWithPool(sQuery);
                    return {
                        widget:     sWidget,
                        status:     'ok',
                        durationMs: Date.now() - tW,
                        data:       JSON.stringify(buildJson(sWidget, aData))
                    };
                } catch (e) {
                    console.error('[getWidgetData] Error: ' + sWidget + ' — ' + e.message);
                    return {
                        widget:     sWidget,
                        status:     'error: ' + e.message,
                        durationMs: Date.now() - tW,
                        data:       JSON.stringify({ error: e.message })
                    };
                }
            })
        );

        console.log('[getWidgetData] Done in ' + (Date.now() - tStart) + 'ms');
        return aResults;
    });


    // ── getIncomeByProduct ────────────────────────────────────────────────
    //
    //  Returns income broken down by product (Banking, Markets, etc.)
    //  for rendering a grouped bar chart.
    //
    //  Response JSON shape per row:
    //  {
    //    product:            "Banking",
    //    ytdCfx:             12500000,
    //    fyOutlookCfx:       15000000,
    //    fyBudgetCfx:        14000000,
    //    fyOutlookBudgetCfx: 15000000,   ← max(FY Outlook, FY Budget)
    //    yoyPctCfx:          8.5,        ← YTD vs PY YTD %
    //    ytdRfx:             ...,
    //    fyOutlookRfx:       ...,
    //    fyBudgetRfx:        ...,
    //    fyOutlookBudgetRfx: ...,
    //    yoyPctRfx:          ...
    //  }
    srv.on('getIncomeByProduct', async (req) => {

        const topGroup   = req.data.topGroup   || 'Group';
        const sReporting = (topGroup === 'Group') ? 'FPNA' : topGroup;

        const sQuery = applyReporting(INCOME_BY_PRODUCT_SQL, sReporting);
        const tStart = Date.now();

        try {
            const aRows = await runWithPool(sQuery);

            const aResult = (aRows || []).map(function (r) {
                return {
                    product:            r.M_PRODUCT_CONCAT   || '',
                    ytdCfx:             parseFloat(r.YTD_CFX)              || 0,
                    fyOutlookCfx:       parseFloat(r.FY_OUTLOOK_CFX)       || 0,
                    fyBudgetCfx:        parseFloat(r.FY_BUDGET_CFX)        || 0,
                    fyOutlookBudgetCfx: parseFloat(r.FY_OUTLOOK_BUDGET_CFX)|| 0,
                    yoyPctCfx:          r.YOY_PCT_CFX != null ? parseFloat(r.YOY_PCT_CFX) : null,
                    ytdRfx:             parseFloat(r.YTD_RFX)              || 0,
                    fyOutlookRfx:       parseFloat(r.FY_OUTLOOK_RFX)       || 0,
                    fyBudgetRfx:        parseFloat(r.FY_BUDGET_RFX)        || 0,
                    fyOutlookBudgetRfx: parseFloat(r.FY_OUTLOOK_BUDGET_RFX)|| 0,
                    yoyPctRfx:          r.YOY_PCT_RFX != null ? parseFloat(r.YOY_PCT_RFX) : null
                };
            });

            console.log('[getIncomeByProduct] ' + aResult.length + ' rows in ' + (Date.now() - tStart) + 'ms');
            return aResult;

        } catch (e) {
            console.error('[getIncomeByProduct] Error: ' + e.message);
            return [];
        }
    });


    // ── getIncomeByCluster ────────────────────────────────────────────────
    //
    //  Returns income broken down by cluster (M_PRODUCT_CONCAT)
    //  for rendering a grouped bar chart.
    //
    //  Response JSON shape per row:
    //  {
    //    cluster:       "CIB - Banking",
    //    ytdActualsCfx: 8500000,
    //    fyOutlookCfx:  10000000,
    //    q3OutlookCfx:  9200000,
    //    yoyPctCfx:     6.2,        ← YTD vs PY YTD %
    //    ytdActualsRfx: ...,
    //    fyOutlookRfx:  ...,
    //    q3OutlookRfx:  ...,
    //    yoyPctRfx:     ...
    //  }
    srv.on('getIncomeByCluster', async (req) => {

        const topGroup   = req.data.topGroup   || 'Group';
        const sReporting = (topGroup === 'Group') ? 'FPNA' : topGroup;

        const sQuery = applyReporting(INCOME_BY_CLUSTER_SQL, sReporting);
        const tStart = Date.now();

        try {
            const aRows = await runWithPool(sQuery);

            const aResult = (aRows || []).map(function (r) {
                return {
                    cluster:       r.M_PRODUCT_CONCAT        || '',
                    ytdActualsCfx: parseFloat(r.YTD_ACTUALS_CFX)     || 0,
                    fyOutlookCfx:  parseFloat(r.FY_OUTLOOK_CFX)      || 0,
                    q3OutlookCfx:  parseFloat(r.Q3_OUTLOOK_CFX)      || 0,
                    yoyPctCfx:     r.YOY_PCT_CFX != null ? parseFloat(r.YOY_PCT_CFX) : null,
                    ytdActualsRfx: parseFloat(r.YTD_ACTUALS_RFX)     || 0,
                    fyOutlookRfx:  parseFloat(r.FY_OUTLOOK_RFX)      || 0,
                    q3OutlookRfx:  parseFloat(r.Q3_OUTLOOK_RFX)      || 0,
                    yoyPctRfx:     r.YOY_PCT_RFX != null ? parseFloat(r.YOY_PCT_RFX) : null
                };
            });

            console.log('[getIncomeByCluster] ' + aResult.length + ' rows in ' + (Date.now() - tStart) + 'ms');
            return aResult;

        } catch (e) {
            console.error('[getIncomeByCluster] Error: ' + e.message);
            return [];
        }
    });


    // ── getWidgetDataSingle (testing/debug only) ──────────────────────────
    srv.on('getWidgetDataSingle', async (req) => {

        const widgetName   = req.data.widgetName;
        const topGroup     = req.data.topGroup     || 'Group';
        const sReporting   = (topGroup === 'Group') ? 'FPNA' : topGroup;
        const sStoredQuery = oQueryMap[widgetName];

        if (!sStoredQuery) {
            return { widget: widgetName, status: 'error: not found', durationMs: 0, data: '{}' };
        }

        const sQuery = applyReporting(sStoredQuery, sReporting);
        const tStart = Date.now();

        try {
            const aData = await runWithPool(sQuery);
            return {
                widget:     widgetName,
                status:     'ok',
                durationMs: Date.now() - tStart,
                data:       JSON.stringify(buildJson(widgetName, aData))
            };
        } catch (e) {
            return {
                widget:     widgetName,
                status:     'error: ' + e.message,
                durationMs: Date.now() - tStart,
                data:       JSON.stringify({ error: e.message })
            };
        }
    });


});

'use strict';

// ============================================================
//  service.js
//
//  Endpoints:
//    POST /api/nrfp/getWidgetData       — all 12 KPI widgets, 1 call
//    POST /api/nrfp/getWidgetNames      — widget name list (memory)
//    POST /api/nrfp/getWidgetDataSingle — single widget (debug only)
//
//  Architecture:
//  - hdb + generic-pool: 12 dedicated HANA connections, true parallelism
//  - oQueryMap: all 12 SQL strings loaded at startup from ReportingMaster
//  - buildJson + COLUMN_MAP: universal response builder, 0 if-blocks
//  - getWidgetData: Promise.all fires all 12 queries simultaneously
//
//  INSTALL (run once):
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
// min:12 — one permanent connection per widget so all 12 queries
// run simultaneously inside HANA without queuing.
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
    min:                  12,
    max:                  20,
    acquireTimeoutMillis: 10000,
    idleTimeoutMillis:    60000,
    testOnBorrow:         true
});

oPool.on('factoryCreateError', function (err) {
    console.error('[POOL] Error: ' + err.message);
});


// ── runWithPool(sQuery) ────────────────────────────────────────────────
// Borrows one connection, runs query, returns connection to pool.
// try/finally guarantees release even on error.
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
//  COLUMN_MAP
//
//  7 RFX column names per widget, matching the SELECT aliases
//  in each widget's SQL query stored in ReportingMaster.
//
//  CFX auto-derived: colName.replace('_RFX', '_CFX')
//  Works for all 12 widgets — every SQL query follows this pattern.
//
//  Fields map to KpiCard display:
//    [0] ytdActuals  — main large value at top of card
//    [1] vsBudget    — sub-row (no YoY arrow)
//    [2] pqActuals   — sub-row
//    [3] fyOutlook   — sub-row
//    [4] ytdYoy      — % shown next to main value
//    [5] pqYoy       — % on PQ Actuals sub-row
//    [6] fyYoy       — % on FY Outlook sub-row
// ============================================================
var COLUMN_MAP = {

    'Income': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_PYFY_OUTLOOK_RFX_FPNA',
        'PYPQTD_ACTUALS_RFX_FPNA',
        'PY_YTD_ACTUALS_RFX_FPNA'
    ],

    'Impairments': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_PCT',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'PY_PQ_RFX_VARIANCE',
        'YTD_ACTUAL_PY_RFX_VARIANCE',
        'FY_OUTLOOK_PY_RFX_VARIANCE'
    ],

    'Underlying Profit': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_VARIANCE',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'PY_PQ_RFX_VARIANCE',
        'YTD_ACTUAL_PY_RFX_VARIANCE',
        'FY_OUTLOOK_PY_RFX_VARIANCE'
    ],

    'Funded Assets': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_VARIANCE',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'PY_PQ_RFX_VARIANCE',
        'YTD_ACTUAL_PY_RFX_VARIANCE',
        'FY_OUTLOOK_PY_RFX_VARIANCE'
    ],

    'RoTE': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX_VARIANCE',
        'PQTR_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'FY_ACTPY_RFX_VARIANCE',
        'PY_PQTR_RFX_VARIANCE',
        'PYYTD_RFX_VARIANCE'
    ],

    'Costs': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_PYPQ_Actuals_RFX_FPNA',
        'YTD_ACTUAL_RFX_FPNA',
        'YTD_ACTUAL_2_RFX_FPNA'
    ],

    'NII': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_YTD_Actual_RFX_FPNA',
        'PYPQ_ACTUALS_RFX_FPNA',
        'PY_YTD_ACTUALS_RFX_FPNA'
    ],

    'First RWA': [
        'YTD_ACTUALS_RFX_FPNA',
        'VS_BUDGET_RFX_FPNA',
        'PQTD_ACTUALS_RFX_FPNA',
        'FY_OUTLOOK_RFX_FPNA',
        'VARIANCE_PYPQ_Actuals_RFX_FPNA',
        'YTD_ACTUAL_RFX_FPNA',
        'YTD_ACTUAL_2_RFX_FPNA'
    ],

    'JAWS': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX',
        'PQTR_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'VAR_FY_ACTPY_PCT_RFX',
        'VAR_PYPQTR_PCT_RFX',
        'VAR_PYYTD_PCT_RFX'
    ],

    'CIR': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX',
        'PQTR_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'VAR_FY_ACTPY_PCT_RFX',
        'VAR_PYPQTR_PCT_RFX',
        'VAR_PYYTD_PCT_RFX'
    ],

    'Controllable Headcount': [
        'YTD_ACTUALS_RFX',
        'VS_BUDGET_RFX',
        'CY_PQ_ACTUALS_RFX',
        'FY_OUTLOOK_RFX',
        'VAR_PY_PQ_YOY_PCT_RFX',
        'VAR_YTD_PY_YOY_PCT_RFX',
        'VAR_FY_VS_PY_YOY_PCT_RFX'
    ],

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


// ── buildJson ──────────────────────────────────────────────────────────
// Universal builder — works for all 12 KPI widgets, zero if-blocks.
// readGroup(suffix) reads all 7 fields, replacing _RFX with suffix.
function buildJson(sWidget, aRows) {

    if (!aRows || aRows.length === 0) {
        return { widget: sWidget, error: 'No data from HANA' };
    }

    var aCols = COLUMN_MAP[sWidget];
    if (!aCols) {
        console.error('[buildJson] No COLUMN_MAP entry for: ' + sWidget);
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
//  SERVICE HANDLER
// ============================================================
module.exports = cds.service.impl(async function (srv) {


    // ── Startup: load ReportingMaster into memory ───────────────────────
    // Reads all 12 widget SQL strings once into oQueryMap.
    // Every getWidgetData call reads from memory — zero DB cost.
    // If you change a query in ReportingMaster, restart cds watch.
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
            console.log('[STARTUP] Loaded ' + Object.keys(oQueryMap).length + ' widgets: ' +
                Object.keys(oQueryMap).join(', '));
        } catch (e) {
            console.error('[STARTUP] Failed to load ReportingMaster: ' + e.message);
        }
    });


    // ── getWidgetNames ────────────────────────────────────────────────────
    // Returns widget names from oQueryMap (memory — no DB query).
    // Order follows ReportingMaster ID order from startup load.
    srv.on('getWidgetNames', async () => {

        var aKeys = Object.keys(oQueryMap);
        if (aKeys.length > 0) return aKeys;

        // Fallback if called before 'served' fires (edge case)
        var aWidgets = await cds.db.run(
            SELECT.from('nrfp.financials.ReportingMaster')
                  .columns('widget').orderBy('ID asc')
        );
        return aWidgets.map(function (w) { return w.widget; });
    });


    // ── getWidgetData ─────────────────────────────────────────────────────
    //
    //  THE MAIN ENDPOINT — single call replaces 12+ individual calls.
    //
    //  Flow:
    //  1. Read all widget SQL strings from oQueryMap (memory)
    //  2. Replace T_REPORTING in each SQL with correct value
    //  3. Fire all 12 queries simultaneously via Promise.all + hdb pool
    //     Each query gets its own dedicated pool connection — true parallelism
    //  4. Return array of 12 results, each containing rfx and cfx data
    //
    //  Response shape per item:
    //  {
    //    widget:     "Income",
    //    status:     "ok",
    //    durationMs: 843,
    //    data:       '{"widget":"Income","rfx":{...},"cfx":{...}}'
    //  }
    //
    //  data field JSON shape (from buildJson):
    //  {
    //    widget: "Income",
    //    rfx: { ytdActuals, vsBudget, pqActuals, fyOutlook, ytdYoy, pqYoy, fyYoy },
    //    cfx: { ytdActuals, vsBudget, pqActuals, fyOutlook, ytdYoy, pqYoy, fyYoy }
    //  }
    //
    srv.on('getWidgetData', async (req) => {

        const topGroup     = req.data.topGroup     || 'Group';
        const displayUnit  = req.data.displayUnit  || '$m';
        const currencyType = req.data.currencyType || 'RFX';
        const sReporting   = (topGroup === 'Group') ? 'FPNA' : topGroup;

        const aWidgetNames = Object.keys(oQueryMap);

        if (aWidgetNames.length === 0) {
            console.warn('[getWidgetData] oQueryMap is empty — ReportingMaster not loaded yet');
            return [];
        }

        const tStart = Date.now();

        const aResults = await Promise.all(
            aWidgetNames.map(async function (sWidget) {

                const sQuery = applyReporting(oQueryMap[sWidget], sReporting);
                const tWidget = Date.now();

                try {
                    const aData = await runWithPool(sQuery);
                    return {
                        widget:     sWidget,
                        status:     'ok',
                        durationMs: Date.now() - tWidget,
                        data:       JSON.stringify(buildJson(sWidget, aData))
                    };
                } catch (e) {
                    console.error('[getWidgetData] Error for ' + sWidget + ': ' + e.message);
                    return {
                        widget:     sWidget,
                        status:     'error: ' + e.message,
                        durationMs: Date.now() - tWidget,
                        data:       JSON.stringify({ error: e.message })
                    };
                }
            })
        );

        console.log('[getWidgetData] All ' + aResults.length + ' widgets done in ' +
            (Date.now() - tStart) + 'ms (' + topGroup + ')');

        return aResults;
    });


    // ── getWidgetDataSingle ───────────────────────────────────────────────
    // For debugging/testing individual widgets only.
    // Not called by the React frontend in production.
    srv.on('getWidgetDataSingle', async (req) => {

        const widgetName   = req.data.widgetName;
        const topGroup     = req.data.topGroup     || 'Group';
        const sReporting   = (topGroup === 'Group') ? 'FPNA' : topGroup;
        const sStoredQuery = oQueryMap[widgetName];

        if (!sStoredQuery) {
            return {
                widget:     widgetName,
                status:     'error: widget not found in ReportingMaster',
                durationMs: 0,
                data:       '{}'
            };
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

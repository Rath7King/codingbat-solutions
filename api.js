// ============================================================
//  src/services/api.js
//
//  getWidgetData    — 1 POST call, all 12 KPI widgets in parallel
//  getWidgetNames   — memory hit, no HANA
//  getIncomeByProduct / getIncomeByCluster — mock data (IDs 13/14
//  removed from ReportingMaster for now; re-wire when added back)
// ============================================================

const API_BASE = '/api/nrfp';

// ── Low-level POST helper ──────────────────────────────────────────────
// CAP wraps every action result in { "value": <data> }
async function post(endpoint, payload = {}) {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(`[API] ${endpoint} failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json.value ?? json;
}


// ── getWidgetNames ─────────────────────────────────────────────────────
// Returns ordered widget name list from memory in service.js.
// Effectively free — no HANA query, just reads oQueryMap keys.
export async function getWidgetNames() {
    return post('getWidgetNames');
}


// ── getWidgetData ──────────────────────────────────────────────────────
//
//  THE MAIN FUNCTION — 1 HTTP call returns all 12 KPI widgets.
//  Called by Dashboard.js with just the group string.
//
//  Backend runs all 12 HANA queries in parallel via hdb pool and
//  returns both rfx and cfx for every widget in one response.
//
//  Returns array of objects:
//  [{
//    name:   "Income",
//    status: "ok",
//    rfx:    { ytdActuals, vsBudget, pqActuals, fyOutlook, ytdYoy, pqYoy, fyYoy },
//    cfx:    { same 7 fields }
//  }, ...]
//
//  Dashboard.useMemo picks rfx or cfx based on currency toggle — no re-fetch.
//  KpiCard.formatVal() divides by unit on render — no re-fetch.
//
export async function getWidgetData(group) {
    const raw = await post('getWidgetData', {
        topGroup:     group || 'Group',
        displayUnit:  '$m',   // ignored by backend — raw numbers always returned
        currencyType: 'RFX',  // ignored by backend — always returns both rfx + cfx
    });

    if (!Array.isArray(raw) || raw.length === 0) {
        console.warn('[API] getWidgetData returned empty');
        return [];
    }

    return raw.map(item => {
        // item.data is a JSON string: { widget, rfx:{7 fields}, cfx:{7 fields} }
        let parsed = {};
        try {
            parsed = JSON.parse(item.data || '{}');
        } catch (e) {
            console.error('[API] JSON parse error for widget:', item.widget, e);
        }

        return {
            name:   item.widget,
            status: item.status,
            rfx:    parsed.rfx || {},
            cfx:    parsed.cfx || {},
        };
    });
}


// ── getWidgetDataSingle ────────────────────────────────────────────────
// Kept for debugging — not called by the Dashboard in production.
// Use in browser console to inspect a single widget's raw response.
export async function getWidgetDataSingle(name, filters) {
    const actionData = await post('getWidgetDataSingle', {
        widgetName:   name,
        topGroup:     filters.group    || 'Group',
        displayUnit:  filters.unit     || '$m',
        currencyType: filters.currency || 'RFX',
    });

    if (actionData.status && actionData.status.startsWith('error')) {
        throw new Error(actionData.status);
    }

    let parsedData = {};
    try { parsedData = JSON.parse(actionData.data); } catch (e) { /* ignore */ }

    const isCFX  = filters.currency === 'CFX';
    const dataSet = isCFX ? parsedData.cfx : parsedData.rfx;

    if (!dataSet) {
        return { name: parsedData.widget || name, value: 0, yoy: null, label: 'YTD Actuals', subRows: [] };
    }

    return {
        name:    parsedData.widget || name,
        value:   dataSet.ytdActuals,
        yoy:     dataSet.ytdYoy,
        label:   'YTD Actuals',
        subRows: [
            { label: 'vs Budget',  value: dataSet.vsBudget,  yoy: null            },
            { label: 'PQ Actuals', value: dataSet.pqActuals, yoy: dataSet.pqYoy  },
            { label: 'FY Outlook', value: dataSet.fyOutlook, yoy: dataSet.fyYoy  },
        ],
    };
}


// ── getIncomeByProduct ─────────────────────────────────────────────────
// IDs 13/14 removed from ReportingMaster — using mock data for now.
// When you add the queries back, replace this with a real post() call.
export async function getIncomeByProduct(filters) {
    return {
        categories: ['Banking', 'Markets', 'Transaction services'],
        series: [
            { name: 'FY Outlook', color: '#1565C0', data: [2.8,  4.0,  10.8] },
            { name: 'YTD',        color: '#1E88E5', data: [2.1, -3.2,  10.1] },
            { name: 'FY Budget',  color: '#90CAF9', data: [2.5,  3.5,  10.5] },
        ],
    };
}


// ── getIncomeByCluster ─────────────────────────────────────────────────
// IDs 13/14 removed from ReportingMaster — using mock data for now.
// When you add the queries back, replace this with a real post() call.
export async function getIncomeByCluster(filters) {
    return [
        {
            id:        'all',
            label:     '(all)',
            ytd:       9009164724.23,
            yoyPct:    1.46,
            q3Outlook: 2713863131.93,
            fyOutlook: 9175025425.30,
        },
    ];
}

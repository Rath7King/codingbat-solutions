// ============================================================
//  FILE: db/schema.cds
//
//  What this file does:
//  This is where you define your DATABASE TABLES.
//  Each "entity" here = one table in HANA.
//  The DB team will use these definitions to create
//  the actual tables in HANA Database Explorer.
// ============================================================

namespace cib.financials;


// ─────────────────────────────────────────────────────────────
//  MASTER / LOOKUP TABLES
//  These are simple reference tables.
//  Think of them like dropdown options.
// ─────────────────────────────────────────────────────────────

// Table 1: Clusters (AU, AM, AVE, Asia, EU, Unmapped)
// Seen in the "Income By Cluster" section of the dashboard
entity ClusterMaster {
    key clusterCode : String(20);   // short code  e.g. 'AU'
        clusterName : String(100);  // full name   e.g. 'Australia'
        region      : String(50);   // e.g. 'Asia Pacific'
        sortOrder   : Integer;      // controls row order in the table
}

// Table 2: Products (Transaction Services, Markets, Lending etc.)
// Seen in the "Income By Product" bar chart
entity ProductMaster {
    key productCode : String(20);   // e.g. 'TXSV'
        productName : String(100);  // e.g. 'Transaction Services'
        category    : String(50);   // e.g. 'Banking'
        sortOrder   : Integer;
}

// Table 3: Segments (Sm, Sin, Sen, GTX)
// These are the tabs/filters at the top of the dashboard
entity SegmentMaster {
    key segmentCode : String(20);   // e.g. 'Sm'
        segmentName : String(100);  // e.g. 'Small'
        description : String(200);
}

// Table 4: Reporting Periods (Q1 2025, Q2 2025 etc.)
// Used by the "Reporting Period" dropdown filter
entity ReportingPeriodMaster {
    key periodKey  : String(20);    // e.g. '2025-Q3'
        periodName : String(100);   // e.g. 'Q3 2025'
        fiscalYear : String(4);     // e.g. '2025'
        quarter    : String(2);     // e.g. 'Q3'
        startDate  : Date;
        endDate    : Date;
        isCurrent  : Boolean;       // true = the period shown by default
}


// ─────────────────────────────────────────────────────────────
//  FACT TABLES
//  These hold the actual financial numbers.
// ─────────────────────────────────────────────────────────────

// Table 5: KPI Snapshot
// Powers the header tiles on the dashboard:
// Income | NII | CIR | JAWS% | Costs | Head Count
// ROTE%  | RWA | Underlying Profit | Impairments | Funded Assets
//
// One row = one set of KPIs for a specific period + segment
// e.g. "Q3 2025, segment = Sm"
entity KPISnapshot {
    key ID   : Integer;
        periodKey   : String(20);  // links to ReportingPeriodMaster
        segmentCode : String(20);  // links to SegmentMaster

        // INCOME tile
        income_ytd            : Decimal(18, 2);  // Year-to-Date actual
        income_fyBudget       : Decimal(18, 2);  // Full Year Budget
        income_fyOutlook      : Decimal(18, 2);  // Full Year Outlook
        income_pctVsBudget    : Decimal(8, 2);   // % diff vs budget
        income_pctVsPriorYear : Decimal(8, 2);   // % diff vs last year

        // NII tile (Net Interest Income)
        nii_ytd            : Decimal(18, 2);
        nii_fyBudget       : Decimal(18, 2);
        nii_fyOutlook      : Decimal(18, 2);
        nii_pctVsBudget    : Decimal(8, 2);
        nii_pctVsPriorYear : Decimal(8, 2);

        // CIR tile (Cost-to-Income Ratio — shown as a %)
        cir_ytd        : Decimal(8, 2);   // e.g. 47.01
        cir_fyBudget   : Decimal(8, 2);
        cir_fyOutlook  : Decimal(8, 2);
        cir_pctChange  : Decimal(8, 2);   // e.g. -15.83

        // JAWS % tile
        jaws_ytd       : Decimal(8, 2);
        jaws_fyBudget  : Decimal(8, 2);
        jaws_fyOutlook : Decimal(8, 2);

        // COSTS tile
        costs_ytd            : Decimal(18, 2);
        costs_fyBudget       : Decimal(18, 2);
        costs_fyOutlook      : Decimal(18, 2);
        costs_pctVsBudget    : Decimal(8, 2);
        costs_pctVsPriorYear : Decimal(8, 2);

        // CONTROLLABLE HEAD COUNT tile
        headCount_actual    : Decimal(10, 2);
        headCount_budget    : Decimal(10, 2);
        headCount_pctChange : Decimal(8, 2);

        // ROTE % tile (Return on Tangible Equity)
        rote_ytd       : Decimal(8, 2);   // e.g. 25.55
        rote_fyBudget  : Decimal(8, 2);
        rote_fyOutlook : Decimal(8, 2);
        rote_pctChange : Decimal(8, 2);   // e.g. +131.04

        // RWA tile (Risk Weighted Assets)
        rwa_actual     : Decimal(18, 2);  // e.g. 183.00
        rwa_budget     : Decimal(18, 2);
        rwa_outlook    : Decimal(18, 2);
        rwa_pctChange  : Decimal(8, 2);   // e.g. +87.72

        // UNDERLYING PROFIT tile
        underlyingProfit_ytd     : Decimal(18, 2);  // e.g. 4.64
        underlyingProfit_budget  : Decimal(18, 2);
        underlyingProfit_outlook : Decimal(18, 2);
        underlyingProfit_pctChg  : Decimal(8, 2);   // e.g. +2.08

        // IMPAIRMENTS tile
        impairments_ytd     : Decimal(18, 2);  // e.g. -0.01
        impairments_budget  : Decimal(18, 2);
        impairments_outlook : Decimal(18, 2);
        impairments_pctChg  : Decimal(8, 2);   // e.g. +166.16

        // FUNDED ASSETS tile
        fundedAssets_actual  : Decimal(18, 2);  // e.g. 423.87
        fundedAssets_budget  : Decimal(18, 2);
        fundedAssets_outlook : Decimal(18, 2);
        fundedAssets_pctChg  : Decimal(8, 2);   // e.g. +85.48
}

// Table 6: Income By Cluster
// Powers the "Income By Cluster" table on the dashboard
// One row = one cluster's numbers for a specific period + segment
// e.g. "AU cluster, Q3 2025, segment Sm"
entity IncomeByCluster {
    key ID          : Integer;
        periodKey   : String(20);  // links to ReportingPeriodMaster
        segmentCode : String(20);  // links to SegmentMaster
        clusterCode : String(20);  // links to ClusterMaster

        fyBudget       : Decimal(18, 2);  // Full Year Budget
        ytdActual      : Decimal(18, 2);  // Year-to-Date Actual
        q3q4Outlook    : Decimal(18, 2);  // Q3/Q4 Outlook value
        fyOutlook      : Decimal(18, 2);  // Full Year Outlook
        wowPct         : Decimal(8, 2);   // Week-over-Week %
        ytdVsBudgetPct : Decimal(8, 2);   // YTD vs Budget %
}

// Table 7: Income By Product
// Powers the "Income By Product" bar chart
// One row = one product's numbers for a specific period + segment
entity IncomeByProduct {
    key ID          : Integer;
        periodKey   : String(20);
        segmentCode : String(20);
        productCode : String(20);  // links to ProductMaster

        fyBudget    : Decimal(18, 2);
        ytdActual   : Decimal(18, 2);
        q3q4Outlook : Decimal(18, 2);
        fyOutlook   : Decimal(18, 2);
        wowPct      : Decimal(8, 2);
}

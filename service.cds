// ============================================================
//  FILE: srv/service.cds
//
//  What this file does:
//  This takes your DB entities from schema.cds and
//  EXPOSES them as OData API endpoints.
//
//  Once you run "cds watch", CAP automatically creates
//  REST URLs that the UI team can call.
//
//  All endpoints start with: /api/cib/
// ============================================================

using cib.financials as db from '../db/schema';

service CIBFinancialsService @(path: '/api/cib') {

    // ─────────────────────────────────────────────────────────
    //  MASTER DATA ENDPOINTS
    //  UI uses these to populate dropdowns and filters
    // ─────────────────────────────────────────────────────────

    // GET /api/cib/Clusters
    // Returns: AU, AM, AVE, Asia, EU, Unmapped
    @readonly
    entity Clusters as projection on db.ClusterMaster;

    // GET /api/cib/Products
    // Returns: TXSV, MKTS, LEND, TRFI, CASH, CORP
    @readonly
    entity Products as projection on db.ProductMaster;

    // GET /api/cib/Segments
    // Returns: Sm, Sin, Sen, GTX
    @readonly
    entity Segments as projection on db.SegmentMaster;

    // GET /api/cib/ReportingPeriods
    // Returns: Q1 2025, Q2 2025, Q3 2025, Q4 2025 ...
    @readonly
    entity ReportingPeriods as projection on db.ReportingPeriodMaster;


    // ─────────────────────────────────────────────────────────
    //  FINANCIAL DATA ENDPOINTS
    //  UI uses these to populate charts and KPI tiles
    // ─────────────────────────────────────────────────────────

    // GET /api/cib/KPISnapshots
    // Returns all KPI tile data (Income, NII, CIR, ROTE etc.)
    //
    // UI team can filter like this:
    //   /api/cib/KPISnapshots?$filter=periodKey eq '2025-Q3' and segmentCode eq 'Sm'
    @readonly
    entity KPISnapshots as projection on db.KPISnapshot;

    // GET /api/cib/IncomeByCluster
    // Returns the Income By Cluster table data
    //
    // UI team can filter like this:
    //   /api/cib/IncomeByCluster?$filter=periodKey eq '2025-Q3' and segmentCode eq 'Sm'
    // UI team can sort like this:
    //   /api/cib/IncomeByCluster?$orderby=clusterCode asc
    @readonly
    entity IncomeByCluster as projection on db.IncomeByCluster;

    // GET /api/cib/IncomeByProduct
    // Returns the Income By Product bar chart data
    //
    // UI team can filter like this:
    //   /api/cib/IncomeByProduct?$filter=periodKey eq '2025-Q3' and segmentCode eq 'Sm'
    @readonly
    entity IncomeByProduct as projection on db.IncomeByProduct;
}

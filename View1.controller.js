sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    // ─── Chart colour palettes ───────────────────────────────────────────────
    const PALETTE = {
        module:   ["#1f3d7a", "#4db8a4", "#7ec8a0"],
        pie:      ["#2196a8", "#4db8a4", "#7ec8c8", "#1a5276", "#34495e"],
        month:    ["#2196a8", "#4db8a4", "#7ec8c8"],
        quarter:  ["#1f3d7a", "#4db8a4", "#7ec8c8"],
        year:     ["#4db8a4", "#2196a8", "#1f3d7a"]
    };

    // ─── Shared VizFrame property sets ──────────────────────────────────────
    const BASE_AXIS = {
        categoryAxis: { title: { visible: false } },
        valueAxis:    { title: { visible: false } },
        legend:       { visible: false },
        title:        { visible: false }
    };

    return Controller.extend("project1.controller.View1", {

        onInit() {
            this.getView().setModel(new JSONModel(this._buildData()));
            this._configureCharts();
        },

        // ── Model data ────────────────────────────────────────────────────────
        _buildData() {
            return {
                // KPI cards — add/remove cards here without touching the view
                kpiCards: [
                    { line1: "Total MFU",    line2: "Uploaded",   value: "71"  },
                    { line1: "Total MFU",    line2: "Approved",   value: "60"  },
                    { line1: "MFU Template", line2: "Onboarded",  value: "114" },
                    { line1: "Total MFU",    line2: "Rejected",   value: "11"  }
                ],

                moduleData: [
                    { module: "ESG",      approved: 25, pending: 5, uploaded: 1 },
                    { module: "FINCOST",  approved: 2,  pending: 2, uploaded: 0 },
                    { module: "ICON",     approved: 6,  pending: 1, uploaded: 1 },
                    { module: "NFRP",     approved: 22, pending: 2, uploaded: 0 },
                    { module: "TREASURY", approved: 5,  pending: 0, uploaded: 0 }
                ],

                pieData: [
                    { module: "ESG",      count: 33.86 },
                    { module: "FINCOST",  count: 5.63  },
                    { module: "ICON",     count: 5.43  },
                    { module: "NFRP",     count: 6.40  },
                    { module: "TREASURY", count: 33.89 }
                ],

                topMonthData:   [
                    { template: "NFRP", usage: 23 },
                    { template: "ESG",  usage: 17 },
                    { template: "ICON", usage: 2  }
                ],
                topQuarterData: [
                    { template: "ESG",      usage: 31 },
                    { template: "NFRP",     usage: 24 },
                    { template: "TREASURY", usage: 6  }
                ],
                topYearData: [
                    { template: "ESG",      usage: 31 },
                    { template: "NFRP",     usage: 24 },
                    { template: "TREASURY", usage: 6  }
                ],

                tableData: [
                    { moduleName: "ESG", subModuleName: "MAPPING MASTER", loadType: "TRUNCATE", loadTemplate: "MFU BOOKING ENTITY XLATE", loadCount: "17,655"  },
                    { moduleName: "",    subModuleName: "",                loadType: "",         loadTemplate: "MFU BUSINESS INPUT",        loadCount: "223,375" },
                    { moduleName: "",    subModuleName: "",                loadType: "",         loadTemplate: "MFU CREDITNATE LIMIT",       loadCount: "18,200"  },
                    { moduleName: "",    subModuleName: "",                loadType: "",         loadTemplate: "MFU DEAL PIPELINE",          loadCount: "114,454" },
                    { moduleName: "",    subModuleName: "",                loadType: "",         loadTemplate: "MFU ENTITY XLATE",           loadCount: "303,321" },
                    { moduleName: "",    subModuleName: "",                loadType: "",         loadTemplate: "MFU INTEGRATED SF",          loadCount: "13,241"  },
                    { moduleName: "",    subModuleName: "",                loadType: "",         loadTemplate: "",                           loadCount: "12,988"  }
                ]
            };
        },

        // ── Chart configuration ───────────────────────────────────────────────
        _configureCharts() {
            // Stacked bar — modules
            this._applyProps("moduleBarChart", {
                ...BASE_AXIS,
                plotArea: {
                    colorPalette: PALETTE.module,
                    dataLabel: { visible: true, formatString: "#" }
                }
            });

            // Donut — by count
            this._applyProps("pieChart", {
                legend: { visible: false },
                title:  { visible: false },
                plotArea: {
                    colorPalette: PALETTE.pie,
                    dataLabel: { visible: true, type: "percentage" }
                }
            });

            // Bar charts — top 3 usage (shared helper, different palettes)
            [
                ["monthChart",   PALETTE.month],
                ["quarterChart", PALETTE.quarter],
                ["yearChart",    PALETTE.year]
            ].forEach(([id, palette]) => {
                this._applyProps(id, {
                    ...BASE_AXIS,
                    plotArea: {
                        colorPalette: palette,
                        dataLabel: { visible: true }
                    }
                });
            });
        },

        // ── Utility: safely set VizProperties by view-local id ───────────────
        _applyProps(sId, oProps) {
            const oFrame = this.byId(sId);
            if (oFrame) {
                oFrame.setVizProperties(oProps);
            }
        }
    });
});

sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {

        onInit() {
            // Initialize the MFU Dashboard data
            this._initDashboardData();
        },

        _initDashboardData() {
            const oModel = new sap.ui.model.json.JSONModel({
                kpis: {
                    totalUploaded: 71,
                    totalApproved: 60,
                    templateOnboarded: 114,
                    totalRejected: 18
                },
                modules: [
                    { name: "VNA",      approved: 33, pending: 25, uploaded: 8  },
                    { name: "FINCORE",  approved: 4,  pending: 2,  uploaded: 4  },
                    { name: "ICON",     approved: 8,  pending: 4,  uploaded: 4  },
                    { name: "ICRP",     approved: 25, pending: 22, uploaded: 3  },
                    { name: "TREASURY", approved: 5,  pending: 5,  uploaded: 3  }
                ]
            });
            this.getView().setModel(oModel, "dashboard");
        },

        onDateChange(oEvent) {
            const sDate = oEvent.getParameter("value");
            sap.m.MessageToast.show("Date changed to: " + sDate);
        }

    });
});

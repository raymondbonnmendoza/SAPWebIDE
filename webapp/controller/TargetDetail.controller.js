sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function(Controller, History) {
	"use strict";

	return Controller.extend("com.sap.interview_summary.controller.TargetDetail", {
		
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("targetDetail").attachPatternMatched(this._onObjectMatched, this);
		},
		
		_onObjectMatched: function(oEvent) {
			this.getView().bindElement({path: "/TargetSet('" + oEvent.getParameter("arguments").targetId + "')"});
		},
		
		onNavBack: function() {
	        var oHistory = History.getInstance();
	        var sPreviousHash = oHistory.getPreviousHash();
	        if (sPreviousHash !== undefined) {
		        window.history.go(-1);
	        } else {
		        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		        oRouter.navTo("object", true);
	        }
        }

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.sap.interview_summary.view.TargetDetail
		 */
		//	onInit: function() {
		//
		//	},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.sap.interview_summary.view.TargetDetail
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.sap.interview_summary.view.TargetDetail
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.sap.interview_summary.view.TargetDetail
		 */
		//	onExit: function() {
		//
		//	}

	});

});
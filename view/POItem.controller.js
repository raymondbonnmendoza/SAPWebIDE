sap.ui.controller("subcon_stock_tracking_ns.view.POItem", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf subcon_stock_tracking_ns.view.POItem
*/
    onInit: function() {
        var view = this.getView();
        this.getRouter().attachRouteMatched(function(oEvent) {
        var sContextPath = new sap.ui.model.Context(view.getModel(),"/" +
        oEvent.getParameter("arguments").item);
        view.setBindingContext(sContextPath);
        },this);
    },
        
    getRouter : function () {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },

    onNavBack: function(){
        this.getRouter().myNavBack("Detail");
    }

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf subcon_stock_tracking_ns.view.POItem
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf subcon_stock_tracking_ns.view.POItem
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf subcon_stock_tracking_ns.view.POItem
*/
//	onExit: function() {
//
//	}

});
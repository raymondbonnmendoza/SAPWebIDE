sap.ui.controller("nw.epm.refapps.ext.po.apv.view.EmptyPage", {
	// Handler for the nav button of the page. It is attached declaratively. Note that it is only available on phone.
	onNavButtonPressed: function() {
		sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this.getView())).getRouter().navTo("PurchaseOrders", {}, true);
	}
});
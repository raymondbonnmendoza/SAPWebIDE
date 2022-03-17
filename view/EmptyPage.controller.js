sap.ui.controller("nw.epm.refapps.ext.prod.manage.view.EmptyPage", {
	// Handler for the nav button of the page. It is attached declaratively. Note that it is only available on phone.
	onNavButtonPress: function() {
		sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this.getView())).navBackToMasterPageInPhone();
	}
});
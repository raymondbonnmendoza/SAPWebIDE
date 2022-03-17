sap.ui.controller("nw.epm.refapps.ext.prod.manage.view.Main", {

	onInit: function() {
		if (sap.ui.Device.system.desktop) {
			this.getView().addStyleClass("sapUiSizeCompact");
		}
	}
});
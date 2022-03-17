jQuery.sap.declare("nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForShare");

// Creates a sub-controller to be used by the detail controller to handle the share dialog
sap.ui.base.Object.extend("nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForShare", {
	_oShareDialog: null,
	_oParentView: null,
	_oResourceBundle: null,

	constructor: function(oParentView, oResourceBundle) {
		this._oParentView = oParentView;
		this._oResourceBundle = oResourceBundle;
	},

	// Opens the share dialog
	openDialog: function(oEvent) {
		var oShareButton = oEvent.getSource();
		if (!this._oShareDialog) {
			this._oShareDialog = sap.ui.xmlfragment("nw.epm.refapps.ext.po.apv.view.fragment.ShareSheet", this);
			// Switch the dialog to compact mode if the hosting view has compact mode
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oParentView, this._oShareDialog);
			this._oParentView.addDependent(this._oShareDialog);
		}
		this._oShareDialog.openBy(oShareButton);
	}
});
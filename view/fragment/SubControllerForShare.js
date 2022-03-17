jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForShare.js");

// Creates a sub-controller to be used by the master controller to handle specifically filtering, grouping, and sorting
// dialogs
sap.ui.base.Object.extend("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForShare", {
	_oShareDialog: null,
	_oParentView: null,
	_oResourceBundle: null,
	_oProduct: null,

	constructor: function(oParentView, oResourceBundle) {
		this._oParentView = oParentView;
		this._oResourceBundle = oResourceBundle;
	},

	// Opens the requested filter, grouping, and sorting dialogs
	openDialog: function(oEvent) {
		var oShareButton = oEvent.getSource();
		this._oProduct = this._oParentView.getBindingContext().getObject();
		if (!this._oShareDialog) {
			this._oShareDialog = sap.ui.xmlfragment("nw.epm.refapps.ext.prod.manage.view.fragment.ShareSheet", this);
			// Switch the dialog to compact mode if the hosting view has compact mode
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oParentView, this._oShareDialog);
			this._oParentView.addDependent(this._oShareDialog);
		}
		this._oShareDialog.openBy(oShareButton);
	},

	onEmailPressed: function() {
		this._triggerEmail();
	},

	_triggerEmail: function() {
		sap.m.URLHelper.triggerEmail(null, this._getEmailSubject(), this._getEmailContent());
	},

	_getEmailSubject: function() {
		return this._oResourceBundle.getText("xtit.emailSubject", [this._oProduct.Name]);
	},

	_getEmailContent: function() {
		return this._oResourceBundle.getText("xtit.emailContent", [this._oProduct.Id, this._oProduct.Description,
                this._oProduct.SupplierName]);
	}

});
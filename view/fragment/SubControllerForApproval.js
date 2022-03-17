jQuery.sap.declare("nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForApproval");
jQuery.sap.require("nw.epm.refapps.ext.po.apv.util.approver");

// Creates a sub-controller to be used by the detail controllers to handle the approval dialog
sap.ui.base.Object.extend("nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForApproval", {
	_oApprovalDialog: null,
	_oParentView: null,
	_oResourceBundle: null,
	_oApprovalProperties: null,
	_aPurchaseOrders: null, // Purchase Orders to be processed
	_bApprove: false, // Indicates whether the POs to be processed are to be approved or rejected

	constructor: function(oParentView, oResourceBundle) {
		this._oParentView = oParentView;
		this._oResourceBundle = oResourceBundle;
		this._oApprovalProperties = new sap.ui.model.json.JSONModel();
		this._oParentView.setModel(this._oApprovalProperties, "approvalProperties");
	},

	// Opens the approval dialog
	openDialog: function(oEvent, aPurchaseOrders) {
		if (!this._oApprovalDialog) {
			this._initializeApprovalDialog();
		}
		this._bApprove = (oEvent.getSource().getType() === "Accept");
		this._aPurchaseOrders = aPurchaseOrders;
		var sApprovalText, sTitle;
		if (aPurchaseOrders.length === 1) {
			sApprovalText = this._oResourceBundle.getText(this._bApprove ? "xfld.approvalTextWithSupplier" : "xfld.rejectionTextWithSupplier", [
				aPurchaseOrders[0].SupplierName]);
			sTitle = this._oResourceBundle.getText(this._bApprove ? "xtit.approvalTitleForDialog" : "xtit.rejectionTitleForDialog");
		} else {
			sApprovalText = this._oResourceBundle.getText(this._bApprove ? "xfld.approvalTextDifferentSuppliers" : "xfld.rejectionTextDifferentSuppliers");
			sTitle = this._oResourceBundle.getText(this._bApprove ? "xtit.massApprovalTitleForDialog" : "xtit.massRejectionTitleForDialog", [
				aPurchaseOrders.length]);
		}
		this._oApprovalProperties.setProperty("/approvalText", sApprovalText);
		this._oApprovalProperties.setProperty("/approvalTitle", sTitle);
		this._oApprovalProperties.setProperty("/approvalNote", "");
		this._oApprovalDialog.open();
	},

	// Initialization of the approval dialog. This method will only be called once.
	_initializeApprovalDialog: function() {
		this._oApprovalDialog = sap.ui.xmlfragment("nw.epm.refapps.ext.po.apv.view.fragment.ApprovalDialog", this);
		// Switch the dialog to compact mode if the hosting view is in compact mode
		jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oParentView, this._oApprovalDialog);
		this._oParentView.addDependent(this._oApprovalDialog);
	},

	// Event handler for the confirm action of the approval dialog. Note that this event handler is attached declaratively
	// in the definition of fragment nw.epm.refapps.ext.po.apv.view.fragment.ApprovalDialog.
	onConfirmAction: function() {
		sap.ui.core.BusyIndicator.show(100); // using the BusyIndicator avoids multiple confirmation clicks of the user
		this._oApprovalDialog.close();
		var i, aPOIds = [],
			oController = this._oParentView.getController(),
			sApprovalNote = this._oApprovalProperties.getProperty("/approvalNote");
		for (i = 0; i < this._aPurchaseOrders.length; i++) {
			aPOIds.push(this._aPurchaseOrders[i].POId);
		}
		// The approval action itself is delegated to a utility function. Note that this function is also responsible for hiding the busy indicator.
		nw.epm.refapps.ext.po.apv.util.approver.approve(this._bApprove, this._oParentView, aPOIds, sApprovalNote, jQuery.proxy(
			oController.onApprovalSuccess, oController));
	},

	// Event handler for the cancel action of the approval dialog. Note that this event handler is attached declaratively
	// in the definition of fragment nw.epm.refapps.ext.po.apv.view.fragment.ApprovalDialog.
	onCancelAction: function() {
		this._oApprovalDialog.close();
	}
});
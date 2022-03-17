jQuery.sap.declare("nw.epm.refapps.ext.po.apv.util.approver");

// Utility for performing an approve/reject action
nw.epm.refapps.ext.po.apv.util.approver = {
	// This method performs approve/reject action on an array of PO IDs which of course might also contain only a single PO ID.
	// More precisely, it offers the following services
	// - Perform the function import for approving/rejecting in the backend
	// - Generic error handling
	// - Generic hiding of BusyIndicator
	// - Generic success message
	// Parameters:
	// - bApprove      - flag whether this is an approve or a reject action
	// - oView         - the view using this service (actually only used for retrieving models)
	// - aPOIds        - array of IDs of the POs to be approved/rejected
	// - sApprovalNote - note for this approval/rejection
	// - fnSuccess     - optional custom success handler
	/* eslint-disable */ // using more then 4 parameters for a function is justified here
	approve: function(bApprove, oView, aPOIds, sApprovalNote, fnSuccess) {
		var sFunction = bApprove ? "/ApprovePurchaseOrder" : "/RejectPurchaseOrder",
			oModel = oView.getModel();
		var fnOnError = function(oResponse) {
			sap.ui.core.BusyIndicator.hide();
			jQuery.sap.require("nw.epm.refapps.ext.po.apv.util.messages");
			nw.epm.refapps.ext.po.apv.util.messages.showErrorMessage(oResponse);
		};
		var fnOk = function() {
			sap.ui.core.BusyIndicator.hide();
			if (fnSuccess) {
				fnSuccess();
			}
			var oResourceBundle = oView.getModel("i18n").getResourceBundle(),
				sSuccessMessage = "";
			if (aPOIds.length === 1) {
				var sSupplier = oModel.getProperty("/PurchaseOrders('" + aPOIds[0] + "')").SupplierName;
				sSuccessMessage = oResourceBundle.getText(bApprove ? "ymsg.approvalMessageToast" : "ymsg.rejectionMessageToast", [sSupplier]);
			} else {
				sSuccessMessage = oResourceBundle.getText(bApprove ? "ymsg.massApprovalMessageToast" : "ymsg.massRejectionMessageToast");
			}
			sap.m.MessageToast.show(sSuccessMessage);
		};
		if (aPOIds.length === 1) {
			oModel.callFunction(sFunction, {
				method: "POST",
				urlParameters: {
					POId: aPOIds[0],
					Note: sApprovalNote
				},
				success: fnOk,
				error: fnOnError
			});
		} else {
			for (var i = 0; i < aPOIds.length; i++) {
				oModel.callFunction(sFunction, {
					method: "POST",
					urlParameters: {
						POId: aPOIds[i],
						Note: sApprovalNote
					},
					batchGroupId: "POMassApproval",
					changeSetId: i
				});
			}
			oModel.submitChanges({
				batchGroupId: "POMassApproval",
				success: fnOk,
				error: fnOnError,
			});
		}
	}
};
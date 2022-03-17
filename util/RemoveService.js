jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.util.RemoveService");

// Helper class for nw.epm.refapps.products.manage.util.Products. It provides generic handling when the UI5 oData
// DELETE service is called. The public functions in this class should give business semantics for the application (such
// as DELETE product(s), DELETE product draft, DELETE product image, with or without user confirmation). Currently the
// Products class uses this class by creating a transient instance on demand in order to execute exactly one (public)
// method of this class. However, this class is agnostic about this pattern. Note that instances of this class are
// created on demand (that is, immediately before the required public method of this class is executed) and garbage
// collected.
//
// Note that the entities to be deleted are always specified by paths (strings) in the oData model. For convenience,
// this class is tolerant on whether the path starts with "/" or not. See method _getPathWithSlash.
// Note that this class also handles busy dialogs.

sap.ui.base.Object.extend("nw.epm.refapps.ext.prod.manage.util.RemoveService", {
	// The following arguments are required for all public methods of this class, therefore they are modeled as instance
	// variables that must be provided in the constructor.
	_oDataModel: null, // Data model in which the Delete service is to be executed
	_oResourceBundle: null, // Application resource bundle (i18n) for showing texts used in the confirmation dialog
	_fnShowErrorMessage: null, // Generic error handling if the oData Delete call is unsuccessful
	/* eslint-disable */ // using more then 4 parameters for a function is justified here
	constructor: function(oDataModel, oResourceBundle, oAppModel, fnShowErrorMessage, fnDeleteListener, bWithBusyDialog) {
		this._oDataModel = oDataModel;
		this._oResourceBundle = oResourceBundle;
		this._oAppModel = oAppModel;
		this._fnShowErrorMessage = fnShowErrorMessage;
		this._fnDeleteListener = fnDeleteListener;
		this._bWithBusyDialog = bWithBusyDialog;
	},

	// Deletes multiple products - First, the user is asked to confirm the deletion. If he/she does, the products are
	// deleted. Otherwise, nothing happens.
	// aProductPaths - Array of strings representing the context paths to each product to be deleted. Note that the data
	// for these products must already be loaded into the oData model (this._oDataModel).
	// fnAfterDeleted - Function that is to be called if the deletion is successful. Note that there
	// is no callback for the case that no deletion takes place (be it because the user cancelled the deletion, be it
	// because an error occurred, be it because aProductPaths is empty). fnAfterDeleted can contain a single Boolean
	// parameter. This parameter is set to true if all specified products have been deleted successfully. The parameter
	// is set to false if the mass deletion operation returned the information that at least one delete operation
	// was unsuccessful.
	deleteProducts: function(aProductPaths) {
		if (aProductPaths.length === 0) {
			return;
		}
		var sQuestion, sSuccessMessage; // The question that is presented to the user in the confirmation dialog
		if (aProductPaths.length === 1) {
			var sProductName = this._oDataModel.getProperty(this._getPathWithSlash(aProductPaths[0]) + "/Name");
			sQuestion = this._oResourceBundle.getText("ymsg.deleteText", sProductName);
			sSuccessMessage = this._oResourceBundle.getText("ymsg.deleteSuccess", sProductName);
		} else {
			sQuestion = this._oResourceBundle.getText("ymsg.deleteProducts", aProductPaths.length);
			sSuccessMessage = this._oResourceBundle.getText("ymsg.deleteMultipleSuccess", aProductPaths.length);
		}
		var fnAfterDeleted = function(bTotalSuccess) {
			if (bTotalSuccess) {
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(sSuccessMessage);
			} else {
				// TODO    
			}
		};
		this._confirmDeletionByUser({
		    bDraft : false,
			question: sQuestion
		}, aProductPaths, fnAfterDeleted);
	},

	// Convenience method for deleting exactly one product. For more information, see method deleteProducts. Note that
	// fnAfterDeleted is always called with the parameter value true (if it is called at all).
	deleteProduct: function(sPath) {
		this.deleteProducts([sPath]);
	},

	// Deletes one product draft (with confirmation dialog). Parameters sPath and fnAfterDeleted are the same as in
	// method deleteEntityWithoutConfirmationDialog. fnDeleteCanceled is called if the user does not want to delete the
	// draft (presumably it triggers navigation to the edit screen of this draft).
	deleteProductDraft: function(sPath, fnDeleteConfirmed, fnDeleteCanceled) {
		var sQuestion = this._oResourceBundle.getText("ymsg.warningConfirm");
		// Confirmation dialog needs to have the title "Warning" instead of Delete
		var sTitle = this._oResourceBundle.getText("xtit.warning");
		// Product draft is deleted once the user confirms the deletion
		var fnConfirmed = function(oPromise){
		   if (fnDeleteConfirmed){
		    fnDeleteConfirmed(oPromise);    
		   } 
		};
		this._confirmDeletionByUser({
		    bDraft : true,
			title: sTitle,
			question: sQuestion,
			icon: sap.m.MessageBox.Icon.WARNING
		}, [sPath], null, fnDeleteCanceled, fnConfirmed);
	},

	// Deletes an entity (such as a product, product draft, or image draft) without sending a confirmation dialog.
	// The parameters are identical to method deleteProducts.
	deleteEntityWithoutConfirmationDialog: function(sPath, fnAfterDeleted) {
		return this._callDeleteService([sPath], fnAfterDeleted);
	},

	// Opens a dialog letting the user either confirm or cancel the deletion of a list of entities. If the user
	// confirms, all the entities are deleted.
	// oConfirmation - Configuration of the confirmation dialog. Possesses up to two attributes:
	// (i) question (obligatory) is a string providing the statement presented to the user
	// (ii) title (optional) may be a string defining the title of the popup.
	// The default title is 'Delete'.
	// aPaths - Array of strings representing the context paths to the entities to be deleted. Note that it is currently
	// assumed that the specified entities are all products if there is more than one entity.
	// fnAfterDeleted (optional) - works as in method deleteProducts
	// fnDeleteCanceled (optional) - called when the user decides not to perform the deletion
	/* eslint-disable */ // using more then 4 parameters for a function is justified here
	_confirmDeletionByUser: function(oConfirmation, aPaths, fnAfterDeleted, fnDeleteCanceled, fnDeleteConfirmed) {
		// Callback function for when the user decides to perform the deletion
		var fnDelete = jQuery.proxy(function() {
			// Calls the oData Delete service
			var oPromise = this._callDeleteService(aPaths, fnAfterDeleted);
			if (fnDeleteConfirmed){
			  fnDeleteConfirmed(oPromise);
			}
		}, this);

		// Opens the confirmation dialog
		jQuery.sap.require("sap.m.MessageBox");
		var sLeavePage = this._oResourceBundle.getText("xbut.leavePage");
		var sAction = (oConfirmation.bDraft) ? sLeavePage : sap.m.MessageBox.Action.OK;
		sap.m.MessageBox.show(oConfirmation.question, {
			icon: oConfirmation.icon || sap.m.MessageBox.Icon.WARNING,
			title: oConfirmation.title || this._oResourceBundle.getText("xtit.delete"),
			actions: [sAction, sap.m.MessageBox.Action.CANCEL],
			onClose: function(oAction) {
				if (oAction === sAction) {
					fnDelete();
				} else if (oAction === sap.m.MessageBox.Action.CANCEL && fnDeleteCanceled &&
					typeof fnDeleteCanceled === "function") {
					fnDeleteCanceled();
				}
			},
			styleClass: (!sap.ui.Device.support.touch ? "sapUiSizeCompact" : "")
		});
	},

	// Performs the deletion of a list of entities. For more information about the parameters, see method
	// _confirmDeletionByUser.
	_callDeleteService: function(aPaths, fnAfterDeleted) {
		// Requests the busy dialog first
		var oBusyDialog = null;
		if (this._bWithBusyDialog) {
			oBusyDialog = new sap.m.BusyDialog({});
			oBusyDialog.open();
		}
		if (this._fnDeleteListener) {
			this._fnDeleteListener(true, aPaths);
		}
		// Creates an error handler and a success handler. Both of them release the busy dialog and forward to the
		// appropriate handlers.
		var fnFailed = jQuery.proxy(function(oError) {
			if (this._bWithBusyDialog) {
				oBusyDialog.close();
			}
			jQuery.sap.log.error("EPM Refapp Products", "Failed to delete product while calling backend service");
			// Calls the error message handler
			this._fnShowErrorMessage(oError);
		}, this);
		// Note that for the success handler, there are two slightly different cases (batch versus direct call of the
		// Delete service)
		var fnSuccess = jQuery.proxy(function(bSuccessful) {
			if (this._bWithBusyDialog) {
				oBusyDialog.close();
			}
			// Note that parameter bSuccessful can only be expected for batch processing. If the deletion is
			// performed directly, this success handler is only called when the success was complete (because only
			// one item was to be deleted)            
			var bTotalSuccess = aPaths.length === 1 || bSuccessful;
			// Executes the callback function for successful deletion
			if (fnAfterDeleted && typeof fnAfterDeleted === "function") {
				// Note that parameter bSuccessful can only be expected for batch processing. If the deletion is
				// performed directly, this success handler is only called when the success was complete (because only
				// one item was to be deleted).
				fnAfterDeleted(bTotalSuccess);
			}
			if (this._fnDeleteListener) {
				this._fnDeleteListener(false, aPaths, bTotalSuccess);
			}
		}, this);
		// Calls the remote Delete service if exactly one entity has been specified, otherwise try the
		// batch deletion
		return aPaths.length === 1 ? this._deleteOneEntity(aPaths[0], fnSuccess, fnFailed) : this._deleteProducts(aPaths, fnSuccess, fnFailed);
	},

	// Deletes one entity (such as a product, product draft, or image draft) specified by sPath. Then calls the
	// specified success or error handler.
	_deleteOneEntity: function(sPath, fnSuccess, fnFailed) {
		var oDeferred = new jQuery.Deferred();
		var oPromise = oDeferred.promise();
		if (fnSuccess) {
			oPromise.done(fnSuccess);
		}
		if (fnFailed) {
			oPromise.fail(fnFailed);
		}
		this._oDataModel.remove(this._getPathWithSlash(sPath), {
			success: oDeferred.resolve,
			error: oDeferred.reject,
			async: true
		});
		return oPromise;
	},

	// Deletes products specified by a list of paths using batch processing. Calls the corresponding handlers depending
	// on success or error.
	// Note that success handler fnAfterDeleted still contains parameter bSuccess to specify whether all specified
	// entities were able to be deleted successfully or not.
	_deleteProducts: function(aPaths, fnAfterDeleted, fnFailed) {
		var oDeferred = new jQuery.Deferred();
		var oPromise = oDeferred.promise();
		if (fnFailed) {
			oPromise.fail(fnFailed);
		}
		var sDeferredBatchGroupId = "BatchDelete",
			iNotDeleted = 0;
		var fnSingleRemoveFailed = function() {
			iNotDeleted++;
		};
		var fnSuccess = function() {
			if (iNotDeleted) {
				// A message box appears to inform the user that not all items were deleted.
				this._showMessageForPartiallyFailedDeletes(iNotDeleted);
			}
			fnAfterDeleted(!iNotDeleted);
		};
		oPromise.done(jQuery.proxy(fnSuccess, this));
		this._oDataModel.setDeferredBatchGroups([sDeferredBatchGroupId]);
		jQuery.each(aPaths, jQuery.proxy(function(iIndex, sPath) {
			this._oDataModel.remove(this._getPathWithSlash(sPath), {
				error: fnSingleRemoveFailed,
				batchGroupId: sDeferredBatchGroupId,
				changeSetId: iIndex.toString()
			});
		}, this));
		this._oDataModel.submitChanges({
			batchGroupId: sDeferredBatchGroupId,
			success: oDeferred.resolve,
			error: oDeferred.reject
		});
		return oPromise;
	},

	// Shows error message for the partially-unsuccessful removals
	_showMessageForPartiallyFailedDeletes: function(iFailedRemoves) {
		sap.m.MessageBox.show(this._oResourceBundle.getText("ymsg.deleteNProductsFailed", iFailedRemoves), {
			icon: sap.m.MessageBox.Icon.ERROR,
			title: this._oResourceBundle.getText("xtit.error"),
			styleClass: (!sap.ui.Device.support.touch ? "sapUiSizeCompact" : "")
		});
	},

	// Normalization of oData-paths (puts a "/" in front of the path if it is not already there)
	_getPathWithSlash: function(sPath) {
		return (sPath.indexOf("/") === 0 ? "" : "/") + sPath;
	}
});
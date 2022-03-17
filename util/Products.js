jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.util.Products");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.RemoveService");

// Helper class for centrally handling oData CRUD and function import services. The interface provides the business
// meanings for the application and can be reused in different places where the UI-specific actions after the call
// could still be different and will be handled in the corresponding controller of the view.
// Note that this class also handles busy dialogs.
// Every (main) view of this app has an instance of this class as an attribute so that it can forward all explicit
// backend calls to it.
// Note that this class forwards all delete operations to helper class
// nw.epm.refapps.products.manage.util.RemoveService,
// which is instantiated on demand. Thereby, nw.epm.refapps.lib.reuse.util.messages.showErrorMessage is used to
// display error messages.

sap.ui.base.Object.extend("nw.epm.refapps.ext.prod.manage.util.Products", {
	_oResourceBundle: null,
	_oDataModel: null,
	constructor: function(oComponent, fnDeleteListener, oMainView) {
		this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		this._oDataModel = oComponent.getModel();
		this._oAppModel = oComponent.getModel("appProperties");
		this._fnDeleteListener = fnDeleteListener;
		this._oMainView = oMainView;
		var oDeferred = new jQuery.Deferred();
		this._oDraftDeletedPromise = oDeferred.promise();
		oDeferred.resolve();
	},

	getPathForProductId: function(sProductId) {
		return "/Products('" + sProductId + "')";
	},

	getPathForDraftId: function(sDraftId) {
		return "/ProductDrafts('" + sDraftId + "')";
	},

	// Delete methods are forwarded to RemoveService. The specification of these methods can be found there.

	deleteProducts: function(aPaths) {
		var oDeleteHelper = this._getDeleteHelper(true, true);
		oDeleteHelper.deleteProducts(aPaths);
	},

	deleteProduct: function(sPath, fnAfterDeleted, bWithoutConfirmationDialog) {
		var oDeleteHelper = this._getDeleteHelper(true, true);
		if (bWithoutConfirmationDialog) {
			oDeleteHelper.deleteEntityWithoutConfirmationDialog(sPath, fnAfterDeleted, true);
		} else {
			oDeleteHelper.deleteProduct(sPath, fnAfterDeleted);
		}
	},

	deleteProductDraft: function(sPath, fnAfterDeleted, fnDeleteCanceled) {
		var oDeleteHelper = this._getDeleteHelper(false, false);
		if (this._oAppModel.getProperty("/isDirty")) {
			// User needs to confirm the deletion
			var fnDeleteConfirmed = function(oPromise) {
				this._oDraftDeletedPromise = oPromise;
				if (fnAfterDeleted) {
					fnAfterDeleted();
				}
			};
			oDeleteHelper.deleteProductDraft(sPath, jQuery.proxy(fnDeleteConfirmed, this), fnDeleteCanceled);
		} else {
			this._oDraftDeletedPromise = oDeleteHelper.deleteEntityWithoutConfirmationDialog(sPath, null, false);
			if (fnAfterDeleted) {
				fnAfterDeleted();
			}
		}
	},

	deleteImageDraft: function(sPath, fnAfterDeleted) {
		var oDeleteHelper = this._getDeleteHelper(false, true);
		oDeleteHelper.deleteEntityWithoutConfirmationDialog(sPath, fnAfterDeleted, false);
	},

	// Additional methods for working with products

	// Creates a product draft. Note that there is only one product draft for the user, the ID of which is defined
	// in the backend when the draft is created.
	// Returns a promise object which can be chained with .done function to execute the actions when the creation
	// is successful
	createProductDraft: function() {
		var oDeferred = new jQuery.Deferred();
		var fnCreateDraft = function() {
			// At least one attribute must be filled in the object passed to the create call (requirement of the oData
			// service)
			var oNewProduct = {
				ProductId: ""
			};
			this._createDraftBusyDialog();
			this._oDataModel.create("/ProductDrafts", oNewProduct, {
				success: oDeferred.resolve,
				error: jQuery.proxy(this._onError, this)
			});
		};
		this._oDraftDeletedPromise.done(jQuery.proxy(fnCreateDraft, this));
		return oDeferred.promise();
	},

	readProductDraft: function(fnHandleDraftId, fnError) {
		var fnSuccess = function(oResponseContent) {
			var oProductDraft = oResponseContent.results[0];
			var sDraftId = oProductDraft && oProductDraft.Id;
			fnHandleDraftId(sDraftId, oProductDraft);
		};
		this._oDataModel.read("/ProductDrafts", {
			success: fnSuccess,
			error: fnError
		});
	},

	deleteDraft: function(sDraftId, fnAfterDeleted) {
		this._oAppModel.setProperty("/isDirty", false);
		var sProductDraftPath = this._oDataModel.createKey("ProductDrafts", {
			Id: sDraftId
		});
		this.deleteProductDraft(sProductDraftPath, fnAfterDeleted, null);
	},

	// Creates product draft from a specified product ID for CopyProduct
	copyProductToDraft: function(sProductId, fnNavToDraft) {
		// Calls function import CopyProduct
		this._createDraftBusyDialog();
		this._callFunctionAndNavToProductDraft("/CopyProduct", sProductId, fnNavToDraft);
	},

	// Gets product draft from a specified product ID for EditProduct
	getProductDraftFromProductId: function(sProductId, fnNavToDraft) {
		// Calls function import EditProduct
		this._createDraftBusyDialog();
		this._callFunctionAndNavToProductDraft("/EditProduct", sProductId, fnNavToDraft);
	},

	_callFunctionAndNavToProductDraft: function(sFunctionName, sProductId, fnNavToDraft) {
		// Calls function import EditProduct or CopyProduct
		this._callFunctionImport(sFunctionName, {
			ProductId: sProductId
		}, function(oResponseContent) {
			if (oResponseContent && oResponseContent.Id) {
				fnNavToDraft(oResponseContent.Id);
			}
		});
	},

	// Convenience method for calling function imports. Provides error handling and the busy indicator.
	_callFunctionImport: function(sFunctionName, oURLParameters, fnAfterFunctionExecuted) {
		// Uses UI5 success callback interface
		var fnSuccess = function(oResponseContent, oResponse) {
			fnAfterFunctionExecuted(oResponseContent, oResponse);
		};
		this._oDataModel.callFunction(sFunctionName, {
			method: "POST",
			urlParameters: oURLParameters,
			success: fnSuccess,
			error: jQuery.proxy(this._onError, this)
		});
	},

	// Turns ProductDraft into Product and deletes ProductDraft
	activateProduct: function(fnDraftSaved, fnAfterActivation) {
		this.oDraftToActivate = {
			sDraftId: this._oAppModel.getProperty("/productId"),
			fnAfterActivation: fnAfterActivation
		};
		this._submitChanges(null, fnDraftSaved);

	},

	// Saves ProductDraft each time a user edits a field
	saveProductDraft: function(fnSaveFailed, fnAfterSaved) {
		this._submitChanges(fnSaveFailed, fnAfterSaved);
	},

	_submitChanges: function(fnSaveFailed, fnAfterSaved) {
		if (this.bIsChanging) {
			return;
		}
		this.sMessage = "";
		var fnSuccess = function(oResponseData) {
			this.bIsChanging = false;
			if (!this._oDataModel.hasPendingChanges() || !this.sMessage) {
				var i;
				for (i = 0; i < oResponseData.__batchResponses.length; i++) {
					var oEntry = oResponseData.__batchResponses[i];
					if (oEntry.response) {
						if (jQuery.sap.startsWith(oEntry.response.body, "{\"error\":")) {
							var oErrModel = new sap.ui.model.json.JSONModel();
							oErrModel.setJSON(oEntry.response.body);
							this.sMessage = oErrModel.getProperty("/error/message/value") || "Error";
							fnAfterSaved(this.sMessage);
							break;
						}
					}
				}
			}
			if (this.sMessage === "") {
				this._submitChanges(fnSaveFailed, fnAfterSaved);
			}
		};
		if (this._oDataModel.hasPendingChanges()) {
			this.bIsChanging = true;
			var mParameters = {};
			mParameters.success = jQuery.proxy(fnSuccess, this);
			mParameters.error = fnSaveFailed;
			mParameters.batchGroupId = "editproduct";

			this._oDataModel.submitChanges(mParameters);
		} else {
			if (this.oDraftToActivate && !this.sMessage) {
				this._callFunctionImport("/ActivateProduct", {
					ProductDraftId: this.oDraftToActivate.sDraftId
				}, this.oDraftToActivate.fnAfterActivation);

			}
			this.oDraftToActivate = null;
		}
	},

	saveSelectProductDraft: function() {
		this._oDataModel.submitChanges(null, this.onSubmitDraftErrorSelect);
	},

	onSubmitDraftErrorSelect: function(oError) {
		// Currently no valueStateText for Select Control, but will be delivered by UI5 in v 26
		nw.epm.refapps.ext.prod.manage.util.messages.showErrorMessage(oError, this._oMainView);
	},

	// Error handler (that also removes the busy dialog)
	_onError: function(oError) {
		this.stopDraftBusyDialog();
		nw.epm.refapps.ext.prod.manage.util.messages.showErrorMessage(oError, this._oMainView);
	},

	// Convenience method for retrieving an instance of the RemoveService
	_getDeleteHelper: function(bCallDeleteListener, bWithBusyDialog) {
		return new nw.epm.refapps.ext.prod.manage.util.RemoveService(this._oDataModel, this._oResourceBundle, this._oAppModel,
			jQuery.proxy(this._onError, this), bCallDeleteListener && this._fnDeleteListener, bWithBusyDialog);
	},

	_createDraftBusyDialog: function() {
		if (!this._oDraftBusyDialog) {
			this._oDraftBusyDialog = new sap.m.BusyDialog();
			this._oDraftBusyDialog.open();
		}
	},

	stopDraftBusyDialog: function() {
		if (this._oDraftBusyDialog) {
			this._oDraftBusyDialog.close();
			this._oDraftBusyDialog = null;
		}
	}
});
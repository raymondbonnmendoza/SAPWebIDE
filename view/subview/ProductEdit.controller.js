jQuery.sap.require("sap.ui.comp.odata.MetadataAnalyser");
jQuery.sap.require("sap.ui.comp.providers.ValueHelpProvider");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.Products");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.messages");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForShare");

// Note that this view is hosted by nw.epm.refapps.ext.prod.manage.view.S3_ProductDetail. Thus, it implements the lifecycle methods show and leave
// defined by this view.
sap.ui.core.mvc.Controller.extend("nw.epm.refapps.ext.prod.manage.view.subview.ProductEdit", {
	// --- Helper attributes that are initialized during onInit and never changed afterwards

	_oViewProperties: null, // json model used to manipulate declarative attributes of the controls used in this view. Initialized in _initViewPropertiesModel.
	// Contains the attribute emailEnabled which is set to true, as soon as the product is loaded
	_oView: null, // this view
	_aInputFields: null,
	_aMandatoryFields: null,
	_oApplicationController: null, // the controller of the App
	_oAppModel: null, // json model containing the App state
	_oResourceBundle: null, // the resource bundle to retrieve texts from
	_oHelper: null, // singleton instance of nw.epm.refapps.ext.prod.manage.util.Products used to call backend services
	_oSubControllerForShare: null, // helper for the share dialog
	_oShareDialog: null, // dialog for the share button. Initialized on demand.

	// --- attributes describing the current state	
	_sContextPath: null,

	// --- Initialization

	onInit: function() {
		// Gets the application component and the data operation helper instance
		this._oView = this.getView();
		this._initViewPropertiesModel();
		var oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
		this._oApplicationController = oComponent.getProductApplicationController();
		this._oAppModel = oComponent.getModel("appProperties");
		this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		this._oHelper = this._oApplicationController.getODataHelper();
		this._oSubControllerForShare = new nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForShare(this._oView, this._oResourceBundle);
		var oModel = oComponent.getModel();
		// Gets and stores array of input fields and mandatory fields
		this._aInputFields = this._getInputFields();
		this._aMandatoryFields = this._getMandatoryFields();

		// Initialize the Sub-View which included the sap.m.UploadCollection control to handle uploading and removing
		// images
		this._initSubViewImageUpload();

		// This facilitates the value help generated from annotations only
		var oInput = this.byId("supplier");
		var oMetadataAnalyzer = new sap.ui.comp.odata.MetadataAnalyser(oModel);
		var sField = "SupplierName";
		var sAnnotationPath = "EPM_REF_APPS_PROD_MAN_SRV.ProductDraft/" + sField;
		var oValueListAnnotations = oMetadataAnalyzer.getValueListAnnotation(sAnnotationPath);

		// This is created for side effects Search Help Dialog
		/* eslint-disable */
		new sap.ui.comp.providers.ValueHelpProvider({
			annotation: oValueListAnnotations.primaryValueListAnnotation,
			additionalAnnotations: oValueListAnnotations.additionalAnnotations,
			control: oInput,
			model: oModel,
			preventInitialDataFetchInValueHelpDialog: true,
			supportMultiSelect: false,
			supportRanges: false,
			fieldName: sField,
			title: sField
		});
		/* eslint-enable */
		oInput.setShowValueHelp(true);
	},

	_initViewPropertiesModel: function() {
		// The model created here is used to set values or view element properties that cannot be bound
		// directly to the OData service. Setting view element attributes by binding them to a model is preferable to the
		// alternative of getting each view element by its ID and setting the values directly because a JSon model is more
		// robust if the customer removes view elements (see extensibility).	    	    
		this._oViewProperties = new sap.ui.model.json.JSONModel({
			emailEnabled: false
		});
		this._oView.setModel(this._oViewProperties, "viewProperties");
	},

	_getMandatoryFields: function() {
		return [this.byId("productNameInput"), this.byId("price"), this.byId("currency"),
		    this.byId("category"), this.byId("subcategory"), this.byId("description"),
            this.byId("supplier"), this.byId("unitOfMeasure")];
	},

	_getInputFields: function() {
		return [this.byId("productNameInput"), this.byId("price"), this.byId("currency"),
		this.byId("category"), this.byId("subcategory"), this.byId("description"),
		this.byId("supplier"), this.byId("unitOfMeasure"), this.byId("length"), this.byId("width"),
        this.byId("height"), this.byId("weight")];
	},

	// helper method to set image upload control
	_initSubViewImageUpload: function() {
		var oSubViewImagesUpload = this.byId("View_ImageUpload");
		oSubViewImagesUpload.getController().setInitData({
			oResourceBundle: this._oResourceBundle,
			oDataHelper: this._oHelper,
			fnDirty: jQuery.proxy(this._setDirty, this)
		});
	},

	// --- Lifecycle methods used by the hosting view

	show: function() {
		var sProductDraftID = this._oAppModel.getProperty("/productId");
		this._oViewProperties.setProperty("/emailEnabled", false);
		this._resetValueStates();

		this._sContextPath = this._oHelper.getPathForDraftId(sProductDraftID);
		// Binds the (newly generated) product draft to the view and expands the Images part for the subview
		// ProductDraftUploadImages
		this._oView.bindElement(this._sContextPath, {
			expand: "Images"
		});

		// Checks if the binding context is already available locally. If so, refreshes the binding and retrieves the
		// data from backend again.
		var oBindingContext = this._oView.getBindingContext();
		if (oBindingContext && oBindingContext.getPath() === this._sContextPath) {
			this._oView.getElementBinding().refresh();
		}
		// Removes any existing filters on Subcategories first
		// this.byId("subcategory").getBinding("items").filter([]);

		// Updates header and footer after the product draft is retrieved
		this._oView.getElementBinding().attachEventOnce(
			"dataReceived",
			jQuery.proxy(function() {
				oBindingContext = this._oView.getBindingContext();
				if (oBindingContext) {
					// Sets the draft dirty flag based on the backend information
					this._oAppModel.setProperty("/isDirty", oBindingContext.getProperty("IsDirty"));

					this._oViewProperties.setProperty("/emailEnabled", true);
					// Sets Main Category as a filter on subcategory so that only relevant subcategories are shown
					// in ComboBox
					this._setCategoryFilter(oBindingContext);
				} else {
					// Handle the case if the product draft cannot be retrieved remotely (e.g. it's deleted already)
					// show the corresponding product detail page, since in this app the draft id is supposed to be
					// same as the product id
					this._oApplicationController.showProductDetailPage(sProductDraftID);
				}
				this._oHelper.stopDraftBusyDialog();
			}, this));
		// Ensure that subcategories are sorted alphabetically
        var oSorterSubCat = new sap.ui.model.Sorter("Name", false, null);
        var oSubCategory = this.byId("subcategory");
        oSubCategory.getBinding("items").sort(oSorterSubCat);
        
        // Ensure that units of measure are sorted alphabetically
        var oSorterUnits = new sap.ui.model.Sorter("Shorttext", false, null);
        var oUnitOfMeasure = this.byId("unitOfMeasure");
        oUnitOfMeasure.getBinding("items").sort(oSorterUnits);
	},

	leave: function() {
		this._oView.unbindElement();
	},

	// --- Event handlers attached declaratively

	onSavePressed: function() {

		var fnOnSuccess = function(oProductData) {

			this._resetValueStates();
			this._oApplicationController.showProductDetailPage(oProductData.Id, true);

			jQuery.sap.require("sap.m.MessageToast");
			sap.m.MessageToast.show(this._oResourceBundle.getText("ymsg.saveText", oProductData.Name));

		};

		// If the user chooses SAVE and there was no focus change out of a field that had
		// been changed, the system must check again for missing mandatory fields
		if (!this._checkAndMarkEmptyMandatoryFields(true) && !this._fieldWithErrorState()) {
			this._oHelper.activateProduct(jQuery.proxy(this._submitDraftSuccess, this), jQuery.proxy(fnOnSuccess, this));

		}
	},

	onCancelPressed: function() {
		var oDraft = this._oView.getBindingContext().getObject();
		var fnNavToProductDetail = function() {
			this._resetValueStates();
			// The system must distinguish between CANCEL chosen in EDIT mode and CANCEL chosen in ADD mode
			// because Cancel Edit navigates to display of that product and Cancel Add to the previously
			// selected product
			var bIsNew = oDraft.IsNewProduct;
			var sProductId = bIsNew ? (!sap.ui.Device.system.phone && this._oAppModel.getProperty("/lastDisplay")) : oDraft.ProductId;
			if (sProductId) {
				this._oApplicationController.showProductDetailPage(sProductId);
			} else {
				this._oApplicationController.navToMaster();
			}
		};
		this._deleteProductDraft(jQuery.proxy(fnNavToProductDetail, this));
	},

	onSharePressed: function(oEvent) {
		this._oSubControllerForShare.openDialog(oEvent);
	},

	onNavButtonPress: function() {
		this._deleteProductDraft(jQuery.proxy(this._oApplicationController.navBackToMasterPageInPhone, this._oApplicationController));
	},
	
	// deleteProductDraft is used in this controller to cancel editing and when
	// the active product has been updated or created.
	_deleteProductDraft: function(fnAfterDeleted, fnDeleteCanceled) {
		this._oHelper.deleteProductDraft(this._sContextPath, fnAfterDeleted, fnDeleteCanceled);
	},

	// --- Input fields

	onNumberChange: function(oEvent) {
		// If a number field is empty, an error occurs in the backend.
		// So this sets a missing number to "0".
		var oField = oEvent.getSource();
		var sNumber = oField.getValue();
		if (sNumber === "") {
			oField.setValue("0");
		}
		this._fieldChange(oField);
	},

	onCategoryChange: function() {
		// Do not use submitChanges because the subcategory determines the category and both
		// end up being blank. Only use submitChanges after the subcategory has been changed.
		this._setCategoryFilter(this._oView.getBindingContext());
		this.byId("subcategory").setValue(" ");
	},

	onInputChange: function(oEvent) {
		// Whenever the value of an input field is changed, the system must
		// update the product draft. For most of the fields, no specific
		// processing is required on the update of the product draft. onInputChange is the
		// change event defined in the XML view for such fields.
		var oField = oEvent.getSource();
		/* eslint-disable */
		// Workaround to ensure that both the supplier Id and Name are updated in the model before the
		// draft is updated, otherwise only the Supplier Name is saved to the draft and Supplier Id is lost
		setTimeout(jQuery.proxy(function() {
			this._fieldChange(oField);
		}, this), 0);
		/* eslint-enable */

	},

	onSelectChange: function() {
		// Collect input controls.
		// Additional method for change event on SelectChanges because there is currently
		// no value status for a select field.
		this._setDirty();
		this._oHelper.saveSelectProductDraft();
	},

	// This method has been defined in the XML view and is required by UI5 to call
	// the Suggestions "type ahead" function
	suggestMethod: function(oEvent) {
		sap.m.InputODataSuggestProvider.suggest(oEvent);
	},

	// Values states if set are not automatically removed from the view.  For example, if there 
	// are missing mandatory fields and the user presses "save", these fields are set to value state
	// error.  If the user then presses "cancel" and selects another product to edit, the values states
	// must be removed, otherwise the value states appear on the next product edit.
	_resetValueStates: function() {

		jQuery.each(this._aInputFields, function(i, input) {
			input.setValueState(sap.ui.core.ValueState.None);
		});
	},

	_fieldWithErrorState: function() {
		jQuery.each(this._aInputFields, function(i, input) {
			if (input.getValueState() === sap.ui.core.ValueState.Error) {
				return true;
			}
		});
		return false;
	},

	_fieldChange: function(oControl) {
		// Handler for a changed field that needs to be written to the draft.  This allows
		// specific processing for the "Change" event on the input fields, such as for numbers
		// to set empty to "0".
		var oFilter;
		var oSubCategory = this.byId("subcategory");
		this._setDirty();
		// If the category is changed and no new subcategory is selected, after
		// the next submitChanges, the backend sets the category to empty.
		// If this happens, the filter on the subcategory is removed.
		if (oSubCategory) {
			if (oSubCategory.getValue() === " " || oSubCategory.getValue() === "") {
				oFilter = [];
				oFilter.length = 0;
				oSubCategory.getBinding("items").filter([], sap.ui.model.FilterType.Application);
			}
		}
		// Removes previous error state
		oControl.setValueState(sap.ui.core.ValueState.None);

		// Callback function in the event that saving draft is unsuccessful
		var fnSubmitDraftError = function(oError) {
			// Note that with oData V2 requests are bundled into batches. Errors at the
			// batch level are picked up by the function defined in the mParameters.error
			// of the submitChanges call. These errors are at the batch level only.
			nw.epm.refapps.lib.reuse.util.messages.getErrorContent(oError);

		};
		var fnSubmitDraftSuccess = function(sMessage) {
			if (sMessage && oControl) {
				oControl.setValueState("Error");
				oControl.setValueStateText(sMessage);
			}
		};
		this._oHelper.saveProductDraft(jQuery.proxy(fnSubmitDraftError, this), fnSubmitDraftSuccess);
	},

	// Set the empty mandatory fields to Value State Error
	_checkAndMarkEmptyMandatoryFields: function() {
		var bErrors = false;
		// Check that inputs are not empty or space.
		// This does not happen during data binding because this is only triggered by changes.
		jQuery.each(this._aMandatoryFields, function(i, input) {
			if (!input.getValue() || input.getValue().trim() === "") {
				bErrors = true;
				input.setValueState(sap.ui.core.ValueState.Error);
			}
		});

		return bErrors;
	},

	_setCategoryFilter: function(oBindingContext) {

		var oSubCategory = this.byId("subcategory");
		var sMainCatgId = oBindingContext.getProperty("MainCategoryId");

		var oFilter = new sap.ui.model.Filter("MainCategoryName",
			sap.ui.model.FilterOperator.StartsWith, sMainCatgId);
		oSubCategory.getBinding("items").filter([oFilter], sap.ui.model.FilterType.Application);
	},

	_submitDraftSuccess: function(oControl, oResponse) {
		// When the batch of requests in oData V2 is successfully sent to the backend,
		// the mParameters.success in submitChanges is called. Errors relating to the
		// requests within the batch are not indicated separately and therefore the system must
		// check the requests contained in the batch for errors based on the request response.
		// Makes the assumption that the error returned relates to the field that has been
		// changed. This is not always the case and errors are shown in valueStateText
		// for the field that triggered the save of the draft.

		var i;
		for (i = 0; i < oResponse.__batchResponses.length; i++) {
			// jQuery.each(oData.__batchResponses, function(i, request) {
			if (oResponse.__batchResponses[i].response) {
				if (jQuery.sap.startsWith(oResponse.__batchResponses[i].response.body, "{\"error\":")) {
					var oErrModel = new sap.ui.model.json.JSONModel();
					oErrModel.setJSON(oResponse.__batchResponses[i].response.body);
					var sMessage = oErrModel.getProperty("/error/message/value");
					if (oControl) {
						oControl.setValueState("Error");
						oControl.setValueStateText(sMessage);
					}
					// Just take the first error message found
					return false;

				}
			}
		}
		return true;
	},

	_setDirty: function() {
		this._oAppModel.setProperty("/isDirty", true);
	}
});
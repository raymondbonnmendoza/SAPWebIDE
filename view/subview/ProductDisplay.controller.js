jQuery.sap.require("sap.ca.ui.model.type.Date");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ca.ui.model.format.AmountFormat");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.formatter");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.control.RatingAndCount");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForShare");

// Note that this view is hosted by nw.epm.refapps.ext.prod.manage.view.S3_ProductDetail. Thus, it implements the lifecycle methods show and leave
// defined by this view.
sap.ui.core.mvc.Controller.extend("nw.epm.refapps.ext.prod.manage.view.subview.ProductDisplay", {

	// --- Helper attributes that are initialized during onInit and never changed afterwards

	_oViewProperties: null, // json model used to manipulate declarative attributes of the controls used in this view. Initialized in _initViewPropertiesModel.
	// Contains the attribute emailEnabled which is set to true, as soon as the product is loaded
	_oView: null, // this view
	_oApplicationController: null, // the controller of the App
	_oAppModel: null, // json model containing the App state
	_oResourceBundle: null, // the resource bundle to retrieve texts from
	_oHelper: null, // singleton instance of nw.epm.refapps.ext.prod.manage.util.Products used to call backend services
	_oSubControllerForShare: null, // helper for the share dialog
	_oShareDialog: null, // dialog for the share button. Initialized on demand.

	// --- attributes describing the current state
	_sContextPath: "", // Stores the currently requested context path
	_oProduct: null, // product currently bound to the view, it could be null if the requested product cannot be found any more or we are in the process of loading it	
    _sOldId: null,  // Store last retrieved supplier id.  Needed in cases when supplier is shown in display mode, then new supplier in edit mode

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

	// --- Lifecycle methods used by the hosting view

	show: function() {
		var sProductId = this._oAppModel.getProperty("/productId");
		if (!sProductId) {
			return;
		}
		this._sContextPath = this._oHelper.getPathForProductId(sProductId);
		this._oView.bindElement(this._sContextPath);
		this._sOldId = null;

		// 1. Check whether data is already available locally in the model
		var bProductDataAlreadyRead = this._extractProduct();
		this._oViewProperties.setProperty("/emailEnabled", bProductDataAlreadyRead);
		// 2. If the binding is not set yet, register for the data for the binding are loaded asynchronously.
		if (!bProductDataAlreadyRead) {
			this._oView.getElementBinding().attachEventOnce("dataReceived", this._getBindingDataReceivedHandler(sProductId), this);
		}
	},

	_extractProduct: function() {
		// Helper function for reading the product from the binding context and making sure it is the requested one.
		// Return the information whether a binding context was available.
		var oBindingContext = this._oView.getBindingContext();
		this._oProduct = null;
		if (oBindingContext) {
			if (oBindingContext.getPath() === this._sContextPath) {
				this._oProduct = oBindingContext.getObject();
				this._oAppModel.setProperty("/lastDisplay", this._oProduct.Id);
			}
			return true;
		} else {
			return false; // The requested product is not available in backend
		}
	},

	_getBindingDataReceivedHandler: function(sProductID) {
		return function() {
			if (sProductID !== this._oAppModel.getProperty("/productId") || !this._oView.getElementBinding()) {
				return;
			}
			var bProductDataAlreadyRead = this._extractProduct();
			this._oViewProperties.setProperty("/emailEnabled", true);
			if (!bProductDataAlreadyRead) {
				// Handles the case that the product cannot be retrieved remotely (such as it was already deleted).
				var sText = this._oResourceBundle.getText("ymsg.productUnavailable", [sProductID]);
				this._oApplicationController.navToEmptyPage(sText);
			}
		};
	},

	leave: function() {
		this._oView.unbindElement();
	},

	// --- Event handlers attached declaratively
	// User wants to open the business card of the product supplier
	onSupplierPressed: function(oEvent) {

		jQuery.sap.require("sap.ca.ui.quickoverview.CompanyLaunch");
		var oSupplierData, oSupplierConfig;
		var oSource = oEvent.getSource();
		var oProduct = this._oView.getBindingContext().getObject();
		var sSupplierId = oProduct.SupplierId;
		var sProductName = oProduct.Name;

		// Data was not yet received via read of Supplier or Supplier was changed in edit screen
		if (this._sOldId !== sSupplierId) {
			var oModel = this._oView.getModel();
			var sSupplierPath = this._getSupplierPath(sSupplierId);
			// Store last read Supplier Id because if product is edited, suggestions for Supplier may load
			// incomplete new suppler Id
			this._sOldId = sSupplierId;
			oModel.read(sSupplierPath, {
				success: jQuery.proxy(this.onSuccessSupplier, this, oSource, sSupplierId, sProductName) ,
				error: jQuery.proxy(this.onErrorSupplier, this)
			});
		}
		// Supplier data already received via Expand, that is user has already selected the business card for 
		// this  product
		else {
			oSupplierData = this._getSupplierData(sSupplierId);
			oSupplierConfig = this._setSupplierConfig(oSupplierData, sProductName);
			// Set data for the business card
			new sap.ca.ui.quickoverview.CompanyLaunch(oSupplierConfig).openBy(oSource);
		}
	},

	// Supplier was read successfully from the backend
	onSuccessSupplier: function(oSource, sSupplierId, sProductName)  {
		var oSupplierData = this._getSupplierData(sSupplierId);
		var oSupplierConfig = this._setSupplierConfig(oSupplierData, sProductName);
		new sap.ca.ui.quickoverview.CompanyLaunch(oSupplierConfig).openBy(oSource);
	},

	onErrorSupplier: function(oError) {
		nw.epm.refapps.lib.reuse.util.messages.showErrorMessage(oError);
	},

	_getSupplierPath: function(sSupplierId) {
		return "/Suppliers('" + sSupplierId + "')";
	},

	_getSupplierData: function(sSupplier)  {
		var oModel = this._oView.getModel();
		var sSupplierPath = this._getSupplierPath(sSupplier);
		var oSupplierData = oModel.getObject(sSupplierPath);
		return oSupplierData;
	},

	_setSupplierConfig: function(oSupplierData, sProductName)  {
		// Callback for the cross-navigation in the business card
		var fnCallbackNavPara = function() {
			var oNavConfig = {};
			oNavConfig.target = {};
			oNavConfig.target.semanticObject = "EPMSupplier";
			oNavConfig.target.action = "displayFactSheet";
			oNavConfig.params = {
				EPMSupplierExternalId: oSupplierData.Id
			};
			return oNavConfig;
		};

		return {
			title: this._oResourceBundle.getText("xtit.supplier"),
			companyname: oSupplierData.Name,
			companyphone: oSupplierData.Phone,
			companyaddress: oSupplierData.FormattedAddress,
			maincontactname: oSupplierData.FormattedContactName,
			maincontactphone: oSupplierData.ContactPhone1,
			maincontactmobile: oSupplierData.ContactPhone2,
			maincontactemail: oSupplierData.ContactEmail,
			maincontactemailsubj: this._getEmailSubject(sProductName),
			beforeExtNav: fnCallbackNavPara

		};
	},

    _getEmailSubject : function(sProductName)  {
        return this._oResourceBundle.getText("xtit.emailSubject", [ sProductName ]);
    },

	onCopyPressed: function() {
		this._oHelper.copyProductToDraft(this._oAppModel.getProperty("/productId"), jQuery.proxy(this._oApplicationController.navToProductEditPage, this._oApplicationController));
	},

	onEditPressed: function() {
		this._oHelper.getProductDraftFromProductId(this._oAppModel.getProperty("/productId"), jQuery.proxy(this._oApplicationController.navToProductEditPage,
			this._oApplicationController));
	},

	onDeletePressed: function() {
		this._oHelper.deleteProduct(this._sContextPath);
	},

	onSharePressed: function(oEvent) {
		this._oSubControllerForShare.openDialog(oEvent);
	},

	onNavButtonPress: function() {
		// Handler for the nav button of the page. It is attached declaratively. Note that it is only available on phone	    
		this._oApplicationController.navBackToMasterPageInPhone();
		this._oView.unbindElement();
	}
});
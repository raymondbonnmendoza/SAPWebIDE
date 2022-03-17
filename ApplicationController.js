jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.ApplicationController");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.Products");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.messages");

sap.ui.base.Object.extend("nw.epm.refapps.ext.prod.manage.ApplicationController", {
	// This class serves as controller for the whole App. It is a singleton object which is initialized by the Component.
	// Since the Component exposes a reference to this singleton object all controllers have access to it and can use its public methods.
	// On the other hand the S2 and the S3 view register at this singelton on startup, such that it can call public methods of these controllers
	// if necessary.

	// --- the following attributes are initialized during startup and not changed afterwards
	_oComponent: null, // the Component (nw.epm.refapps.ext.prod.manage.Component)
	_mRoutes: null, // Access the routenames (see Component)
	_oResourceBundle: null, // the resource bundle used by this app
	_oModel: null, // the oData model used by this App
	_oAppModel: null, // a JSON model used to share global state between the classes used in this App
	// it possesses the following attributes:
	// isMultiSelect    - is the App in multi select mode
	// isSingleSelect   - is the App in single select mode
	// Note that both attributes are initialized as false. They will become complementary as soon as the meta data are loaded.
	// noEditMode       - is the App in display mode,
	// returned (successfull or not)
	// isLostDraftKnown - info whether the lost draft info has been read successfully
	// isEditAllowed    - information whether editing is currently allowed
	// productId        - if this attribute is truthy it contains the id of the product to be displayed currently
	// preferredIds    - this attribute is only evaluated when productId is faulty. In this case it contains an
	//                   array of product ids. The first of these ids corresponding to an item in the master list
	//                   will be displayed
	// isDirty         - flag indicating whether the current draft is dirty. Only relevant in edit scenarios.
	// lastDisplay     - id of the last product that was shown in display screen
	// emptyText       - text to be shown on the empty page

	_oDataHelper: null, // instance of nw.epm.refapps.ext.prod.manage.util.Products used to perform explicit backend calls
	_oRouter: null, // the router for this App. Used to perform navigation
	_routeMatchedHandler: null, // the route matched handler for this App. Only needed, as it must be destroyed
	// when exiting the App
	_oMainView: null, // instance of nw.epm.refapps.ext.prod.manage.view.Main hosting the split app
	_oMasterController: null, // controller of nw.epm.refapps.ext.prod.manage.view.S2_ProductMaster
	_oDetailController: null, // controller of nw.epm.refapps.ext.prod.manage.view.S3_ProductDetail

	// --- Attributes that are needed to handle the startup process

	_oInitBusyDialog: null, // this busy dialog is opened when the singleton instance is created
	// (i.e. when the App is started). It is destroyed when the first call for lost drafts has returned (successfull or not).
	// In case of a failure in metadata request the busy dialog is closed. In this case it will be reopened when the
	// metadata are requested once more.
	_oMetaDataLoadedDeferred: null, // deferred object to be resolved when the metadata of the oData service are loaded and rejected if it fails
	// This property will be faulty if the last call for metadata has failed and no new call for metadata has been triggered, yet

	// --- Navigation
	
	_bNavigationByManualHashChange: null, // this attribute is used to distinguish between hash changes performed
	// programmatically (via method _executeNavigation) and hash changes performed by the user.
	// Only hash changes performed by the user need to be handled by onRoutePatternMatched. For changes performed
	// programmatically the internal state of the App is updated by the ApplicationController itself.
	// Note that there is one exception from this case: When the hash is changed programmatically before the
	// detail controller has been instantiated the state of the detail controller cannot be adjusted at this point
	// in time. Hence, in this case the update is postponed until onRoutePatternMatched is called.

	// --- Lifecycle methods

	// - Methods called during application startup. Note that the methods will be called in the following
	//   order: constructor, createContent, init, registerMaster, onRoutePatternMatched, onMetadataLoaded.
	//   The point in time when registerDetail is called depends on the route which is used to start the App.

	constructor: function(oComponent, mRoutes) {
		this._oInitBusyDialog = new sap.m.BusyDialog();
		this._oInitBusyDialog.open();
		this._oComponent = oComponent;
		this._mRoutes = mRoutes;
		this._oMetaDataLoadedDeferred = new jQuery.Deferred();
		this._bNavigationByManualHashChange = true;
	},

	createContent: function() {
		var oViewData = {
			component: this._oComponent
		};
		this._oMainView = sap.ui.view({
			viewName: "nw.epm.refapps.ext.prod.manage.view.Main",
			type: sap.ui.core.mvc.ViewType.XML,
			viewData: oViewData
		});
		return this._oMainView;
	},

	init: function() {
		var oComponentConfig = this._oComponent.getMetadata().getConfig();
		var oServiceConfig = oComponentConfig.serviceConfig;
		var sServiceUrl = oServiceConfig.serviceUrl;

		// always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var sRootPath = jQuery.sap.getModulePath("nw.epm.refapps.ext.prod.manage");

		// set i18n model
		var oI18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: sRootPath + "/" + oComponentConfig.resourceBundle
		});
		this._oComponent.setModel(oI18nModel, "i18n");
		this._oResourceBundle = oI18nModel.getResourceBundle();

		// set data model
		this._oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, {
			json: true,
			defaultBindingMode: "TwoWay",
			useBatch: true,
			defaultCountMode: "Inline",
			loadMetadataAsync: true
		});
		// Note: Batch groups must be defined globally. Therefore, we do it here, although they are only used in the edit view.
		this._oModel.setDeferredBatchGroups(["editproduct"]);
		this._oModel.setChangeBatchGroups({
			"ProductDraft": {
				batchGroupId: "editproduct"
			}
		});

		this._oModel.attachMetadataLoaded(this.onMetadataLoaded, this);
		this._oModel.attachMetadataFailed(this.onMetadataRequestFailed, this);

		this._oComponent.setModel(this._oModel);

		// The device model enables the views used in this application to access
		// the information about the current device in declarative view definition
		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isDesktop: sap.ui.Device.system.desktop,
			isNoDesktop: !sap.ui.Device.system.desktop,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
		});
		oDeviceModel.setDefaultBindingMode("OneWay");
		this._oComponent.setModel(oDeviceModel, "device");

		this._oAppModel = new sap.ui.model.json.JSONModel({
			isMultiSelect: false,
			isSingleSelect: false,
			noEditMode: true,
			isLostDraftKnown: false,
			isEditAllowed: false,
			preferredIds: [],
			isDirty: false,
			lastDisplay: null
		});
		this._oComponent.setModel(this._oAppModel, "appProperties");
		this._oDataHelper = new nw.epm.refapps.ext.prod.manage.util.Products(this._oComponent, jQuery.proxy(this.deleteListener, this), this._oMainView);

		this._oRouter = this._oComponent.getRouter();
		this._extractStartupParameters();
		this._routeMatchedHandler = new sap.m.routing.RouteMatchedHandler(this._oRouter);
		this._routeMatchedHandler.setCloseDialogs(false);
		this._oRouter.attachRoutePatternMatched(this.onRoutePatternMatched, this);
		// Router is initialized at the end, since this triggers the instantiation of the views.
		// In onInit of the views we want to rely on the component being correctly initialized.
		this._oRouter.initialize();
	},

	_extractStartupParameters: function() {
		var oComponentData = this._oComponent.getComponentData();
		if (oComponentData && oComponentData.startupParameters && jQuery.isArray(oComponentData.startupParameters.productID) && oComponentData.startupParameters
			.productID.length > 0) {
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			var sUrl = this._oRouter.getURL(this._mRoutes.DETAIL, {
				productID: oComponentData.startupParameters.productID[0]
			});
			if (sUrl) {
				oHashChanger.setHash(sUrl);
			}
		}
	},

	registerMaster: function(oMasterController) {
		// This method is called in onInit() of the S2-view		    
		this._oMasterController = oMasterController;
	},

	registerDetail: function(oDetailController) {
		// This method is called in onInit() of the S3-view	    
		this._oDetailController = oDetailController;
	},

	onMetadataLoaded: function() {
		// In normal scenarios this method is called at the end of the startup process. However, in cases that initial loading of
		// metadata fails, this method may be called later. It is registered in init().	    
		this._oAppModel.setProperty("/isSingleSelect", true);
		this._checkForLostDraft();
		this._oMetaDataLoadedDeferred.resolve();
	},

	// - cleanup called when the App is exited

	exit: function() {
		this._routeMatchedHandler.destroy();
	},

	// - Navigation methods

	onRoutePatternMatched: function(oEvent) {
		// This method is registered at the router. It will be called whenever the url-hash changes. Note that there may be two reasons
		// for this. The hash may be set by the browser (e.g. if the user follows a link leading to this App) or by the router itself.
		// The second case applies when the App calls a navigation method of the router itself. This case is ignored by this method.
		if (!this._bNavigationByManualHashChange) {
			return;
		}
		var sRoute = oEvent.getParameter("name");
		if (sRoute === this._mRoutes.CATCHALL){
		    this._oAppModel.setProperty("/emptyText", this._oResourceBundle.getText("ymsg.pageNotFound"));
		}
		var sProductId = (sRoute === this._mRoutes.DETAIL) && decodeURIComponent(oEvent.getParameter("arguments").productID);
		this._oAppModel.setProperty("/productId", sProductId);
		if (sProductId) {
			this._newProductId();
		}
	},

	_newProductId: function() {
		// helper method, that informs master and detail controller that a new product id has been selected
		// Moreover detail controller needs to check whether it has to change between display and edit mode.
		if (this._oDetailController && !this._oDetailController.editModeChanged()) {
			this._oDetailController.productChanged();
		}
		if (this._oMasterController) {
			this._oMasterController.setItem();
		}
	},

	navBackToMasterPageInPhone: function() {
		// Navigates back to the master page on phone, return true for the phone case, return false for other cases	    
		if (sap.ui.Device.system.phone) {
			this.navToMaster();
			return true;
		}
		return false;
	},

	showProductDetailPage: function(sProductId, bListRefresh) {
		// This method navigates to the display page for the specified product id. Note that this method must only
		// be called when either no draft exists (for the current user), or the deletion of this draft has been triggered already,
		// or the lookup for lost draft has failed.
		this._oAppModel.setProperty("/productId", sProductId);
		this._changeEditMode(false);
		if (bListRefresh) {
			this._oMasterController.listRefresh();
		} else {
			this._oMasterController.setItem(true);
		}
		if (this._oDetailController) {
			this._oDetailController.productChanged();
		}
		this._executeNavigation(this._mRoutes.DETAIL, {
			productID: encodeURIComponent(sProductId)
		}, true); // true: hash should not be stored in the history
	},

	navToMaster: function(sPrefereredId) {
		// This method navigates to the master route. sPreferredId is an optional parameter that may contain the id of a
		// product that (on non-phone devices) is preferably shown (provided it is in the master list). Prerequisites for
		// calling this method are as for showProductDetailPage.
		this._executeNavigation(this._mRoutes.MASTER, {}, true);
		this._oAppModel.setProperty("/preferredIds", sPrefereredId ? [sPrefereredId] : []);
		this._oAppModel.setProperty("/productId", null);
		this._changeEditMode(false);
		this._oMasterController.setItem();
	},

	navToProductEditPage: function(sDraftId) {
		// This method navigates to the edit page for the (only existing) draft for this user. Note that this method must only
		// be called when this draft exists and its id is either passed as parameter sDraftId or is already contained in attribute
		// productId of the AppModel.
		if (sDraftId) {
			this._oAppModel.setProperty("/productId", sDraftId);
		} else {
			sDraftId = this._oAppModel.getProperty("/productId");
		}
		this._changeEditMode(true);
		this._executeNavigation(this._mRoutes.DETAIL, {
			productID: encodeURIComponent(sDraftId)
		}, true);
		this._oMasterController.setItem(true);
	},

	_changeEditMode: function(bIsEdit) {
		// This method sets the edit mode of the App as specified by parameter bIsEdit
		if (this._oAppModel.getProperty("/noEditMode") !== bIsEdit) {
			return;
		}
		this._oAppModel.setProperty("/noEditMode", !bIsEdit);
		// reset the property which contains the information whether we may change to edit mode.
		// This is true if we are (i) not already in edit mode, (ii) information about lost draft has been determined, and
		// (iii) we are in single select mode.
		// Note that (ii) and (iii) are automatically true when we are actually changing the edit mode.
		this._oAppModel.setProperty("/isEditAllowed", !bIsEdit);
		if (this._oDetailController) {
			this._oDetailController.editModeChanged();
		}
	},

	navToEmptyPage: function(sText, bResetUrl) {
		// This method navigates to the empty page in detail area. Prerequisites for
		// calling this method are as for showProductDetailPage.
		// sText is the text to be shown on the empty page
		// bResetUrl defines whether the route should be set back to the master route
		this._oAppModel.setProperty("/emptyText", sText);
		var oSplitApp = this._oMainView.byId("fioriContent");
		var oEmptyPage = this._oRouter.getView("nw.epm.refapps.ext.prod.manage.view.EmptyPage", sap.ui.core.mvc.ViewType.XML);
		oSplitApp.addDetailPage(oEmptyPage);
		oSplitApp.toDetail(oEmptyPage);
		if (bResetUrl) {
			// Set back the route to the generic one
			this._executeNavigation(this._mRoutes.MASTER);
		}
	},

	_executeNavigation: function(sName, oParameters, bReplace) {
		// wrapper for the navigation method of the router.
		this._bNavigationByManualHashChange = !this._oDetailController;
		this._oRouter.navTo(sName, oParameters, bReplace);
		this._bNavigationByManualHashChange = true;
	},

	// --- Methods dealing with lost drafts

	_checkForLostDraft: function() {
		// This method triggers the check for a lost draft. It is called directly after the metadata have been loaded.
		// If the backend call fails, this method will be called on every list refresh until it succeeds the first time.
		// Note that performing this logic in onMetaDataLoaded has two advantages:
		// - the types of the oData response for the lost draft are set correctly
		// - the call will implicitly be batched with the first call to determine the master list
		var fnError = function(oResponse) {
			this._callForLostDraftEnded();
			nw.epm.refapps.ext.prod.manage.util.messages.showErrorMessage(oResponse, this._oMainView);
		};
		// delegate oData call to the helper object
		this._oDataHelper.readProductDraft(jQuery.proxy(this.handleLostDraft, this), jQuery.proxy(fnError, this));
	},

	_callForLostDraftEnded: function() {
		// This method is called when the call for lost draft ends (be it successfull or not). When this happens for the first time the initial
		// busy dialog is removed. In case the call for lost drafts must be repeated (because of failure) it will run without busy dialog.
		if (this._oInitBusyDialog) {
			this._oAppModel.setProperty("/noEditMode", true);
			this._oInitBusyDialog.destroy();
			this._oInitBusyDialog = null;
		}
	},

	handleLostDraft: function(sDraftId, oProductDraft) {
		// This method will be called when we have successfully retrieved the information on lost drafts.
		// If a lost draft exists its id is passed in parameter sDraftId and the full object is passed in oProductDraft.
		// Otherwise both parameters are faulty.
		// Note that onRoutePatternMatched has been executed at this point in time.		    
		this._callForLostDraftEnded();
		this._oAppModel.setProperty("/isLostDraftKnown", true); // from now on editing is allowed in single mode
		this._oAppModel.setProperty("/isEditAllowed", this._oAppModel.getProperty("/isSingleSelect"));
		if (sDraftId) { // a lost draft exists
			var sLastId = this._oAppModel.getProperty("/productId"); // store the id of the product currently displayed (if there is one)
			if (sLastId !== sDraftId && !oProductDraft.IsDirty) { // if the lost draft is not dirty and it is not the current one
				this._oDataHelper.deleteDraft(sDraftId); // delete it without notice
				return;
			}
			this.navToProductEditPage(sDraftId); // the lost draft is either dirty or belonging to the product currently displayed -> go to its edit page
			if (sLastId === sDraftId) { // if the user was working on this product anyway we are done
				this._oAppModel.setProperty("/isDirty", oProductDraft.IsDirty); // but update the global isDirty-property first
				return;
			}
			// User has a lost (dirty) draft belonging to another object than he is currently looking at.
			// -> he must either edit this draft or revert it
			var fnCancelled = jQuery.proxy(function() { // this method is called when the user decides to revert the draft
				this._oDataHelper.deleteDraft(sDraftId); // delete the draft
				if (sLastId) { // preferably go back to the product we were working on before
					this.showProductDetailPage(sLastId);
				} else { // Otherwise we prefer to display the product we had in edit screen, if possible
					this.navToMaster(!oProductDraft.IsNew && sDraftId);
				}
			}, this);
			var oDateFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
				style: "short"
			});
			var sDate = oDateFormatter.format(oProductDraft.CreatedAt);
			// The message presented to the user depends on whether the draft is for a new product or an already existing
			// product
			var sQuestion = oProductDraft.IsNewProduct ? this._oResourceBundle.getText("ymsg.editNewDraft", [sDate]) :
				this._oResourceBundle.getText("ymsg.editDraft", [oProductDraft.Name, sDate]);

			// This dialog is specifically built for this app because a new standard message box is
			// not yet available
			var oDialog = new sap.m.Dialog({
				title: this._oResourceBundle.getText("xtit.unsavedDraft"),
				content: [new sap.m.Text({
					text: sQuestion
				}).addStyleClass("sapUiSmallMargin")],
				contentWidth: "400px",
				buttons: [new sap.m.Button({
					text: this._oResourceBundle.getText("xbut.resume"),
					press: jQuery.proxy(function() {
						this._oAppModel.setProperty("/isDirty", true); // the draft is already dirty
						oDialog.close(); // when the user wants to resume the draft, we are already on the right screen
					}, this)
				}), new sap.m.Button({
					text: this._oResourceBundle.getText("xbut.discard"),
					press: function() {
						oDialog.close();
						fnCancelled();
					}
				})]
			});
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oMainView, oDialog);
			this._oMainView.addDependent(oDialog);
			oDialog.open();
		}
	},

	// --- Methods dealing with deletion of products

	deleteListener: function(bBeforeDelete, aPaths) {
		// This function is passed to the constructor of this._oDataHelper.
		// It will be called twice for every delete operations performed on products (not for other entities like product drafts).
		// The first time it is called is before the delete operation is performed.
		// The second time is, after the delete operation has been performed successfully (at least partially)
		// -bBeforeDelete denotes the information which case applies
		// -aPaths is the array of product ids to be deleted	    
		if (bBeforeDelete) {
			this._beforeDelete(aPaths);
		} else {
			this._afterDelete();
		}
	},

	_beforeDelete: function(aPaths) {
		// called immediately before products are deleted.
		// The task of this method is to predefine the object which should be displayed after the deletion process.
		// This is done by setting the attributes productId and preferredIds ain the AppModel.
		// Thereby, the logic is as follows: If the item that is currently displayed is not to be deleted it should stay the the seletced one.
		// Otherwise, we build a list of preferred entries. Thereby, we prefer to take the list items being currently behind the current item.
		// As a second preference we take those items in front of the present one (starting with the last).
		// Note that we also consider items which shall be deleted, as the deletion may fail partially. 	    
		var aPreferredIds = [];
		var sCurrentId = this._oAppModel.getProperty("/productId");
		this._oAppModel.setProperty("/productId", null);
		if (sCurrentId && !sap.ui.Device.system.phone) {
			var bCurrentWillBeDeleted = false;
			var sCurrentPath = this._oDataHelper.getPathForProductId(sCurrentId);
			for (var i = 0; !bCurrentWillBeDeleted && i < aPaths.length; i++) {
				bCurrentWillBeDeleted = sCurrentPath === aPaths[i];
			}
			if (!bCurrentWillBeDeleted) {
				this._oAppModel.setProperty("/productId", sCurrentId);
				this._oAppModel.setProperty("/preferredIds", [sCurrentId, sCurrentId]); // to prevent scrolling
				return;
			}
			var bFound = false;
			var aListItems = this._oMasterController.getListItems();
			var aTail = [];
			for (i = 0; i < aListItems.length; i++) {
				var oItem = aListItems[i];
				if (!(oItem instanceof sap.m.GroupHeaderListItem)) {
					var oCtx = oItem.getBindingContext();
					var sId = oCtx.getProperty("Id");
					bFound = bFound || sId === sCurrentId;
					(bFound ? aPreferredIds : aTail).push(sId);
				}
			}
			if (bFound) {
				aTail.reverse();
				aPreferredIds = aPreferredIds.concat(aTail);
			}
		}
		this._oAppModel.setProperty("/preferredIds", aPreferredIds);
	},

	// Called immediately after a successfull deletion of products has taken place.
	_afterDelete: function() {
		this.navBackToMasterPageInPhone();
	},

	// --- error handler

	onMetadataRequestFailed: function(oResponse) {
		this._oMetaDataLoadedDeferred.reject();
		this._oMetaDataLoadedDeferred = null;
		this._oInitBusyDialog.close();
		nw.epm.refapps.ext.prod.manage.util.messages.showErrorMessage(oResponse, this._oMainView);
	},

	// --- Methods to be called by the controllers

	getODataHelper: function() {
		// Returns the (singleton) helper for handling oData operations in this application
		return this._oDataHelper;
	},

	refresh: function() {
		// This method triggers reading of metadata and of lost drafts, if not already performed successfully.
		// It returns a promise object that is done when the meta data have been loaded successfully and fails if loading of meta data fails once more.
		if (!this._oMetaDataLoadedDeferred) {
			this._oInitBusyDialog.open();
			this._oMetaDataLoadedDeferred = new jQuery.Deferred();
			this._oModel.refreshMetadata();
		} else if (!this._oAppModel.getProperty("/isLostDraftKnown")) {
			this._checkForLostDraft();
		}
		return this._oMetaDataLoadedDeferred.promise();
	}
});
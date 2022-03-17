jQuery.sap.require("nw.epm.refapps.ext.po.apv.util.formatter");
jQuery.sap.require("nw.epm.refapps.ext.po.apv.util.approver");
sap.ui.controller("nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension.view.S2_PurchaseOrdersCustom", {

pending: function() {
alert("Hi, you clicked the pending button");
}

//
//	_sIdentity: "nw.epm.refapps.ext.po.apv",
//	_sCurrentSearchTerm: "", // the search term that is currently used to filter the result list
//	_sPreselectedContextPath: null, // Context path of a list item that should be preselected.
//	_oSummaryPage: null, // detail view in case of multi select mode. Initialized on demand.
//	_bIsMultiselect: false,
//	_bFirstCall: true, // is set to false when the first PO is displayed on the detail screen
//	_bNavigationByManualHashChange: true, // is set to false if the navigation is done programatically
//	_bHasMetadataError: false, // set to true as soon as metadata call of then oData model fails. Reset when metadata are read successfully.
//	// Note that user can trigger a retry of reading metadata by pressing refresh or search in the search field.
//	// If this attribute is faulty or the specified PO is not in the list, the first PO in the list will be preseletced
//	// The following attributes are used to provide easy access to some global resources. They are 'more or less constant' because they are
//	// initialized in onInit and not changed afterwards.
//	_oEventBus: null, // the local event bus
//	_oResourceBundle: null, // the application resource bundle
//	_oRouter: null, // the router object
//	_oView: null, // this view
//	_oModel: null, // the oData model
//	_oDeviceModel: null, // the device model
//	_oAppModel: null, // the app model with global data
//	_oViewModel: null, // Json model to bind local data to the view
//	_oSearchField: null, // the search field at the master list
//	_oList: null, // the master list
//	_oListBinding: null, // binding of the master list
//
//	onInit: function() {
//		this._oView = this.getView();
//		this._oSearchField = this.byId("searchField");
//		this._oList = this.byId("list");
//		var oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
//		this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
//		// Subscribe to event that is triggered by other screens when a PO was approved or rejected
//		var fnOnApprovalExecuted = function() {
//			this.onApprovalExecuted("");
//		};
//		this._oEventBus = oComponent.getEventBus();
//		this._oEventBus.subscribe(this._sIdentity, "approvalExecuted", jQuery.proxy(fnOnApprovalExecuted, this));
//		this._oEventBus.subscribe(this._sIdentity, "requestEmptyPage", jQuery.proxy(this.onEmptyPageRequested, this));
//		// Register for error events on the oData model
//		this._oModel = oComponent.getModel();
//		this._oModel.attachMetadataFailed(this.onMetadataRequestFailed, this);
//		this._oDeviceModel = oComponent.getModel("device");
//		this._oAppModel = oComponent.getModel("appProperties");
//		this._initializeViewModel();
//		// Register for routes
//		this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
//		this._oRouter.attachRoutePatternMatched(this.onRoutePatternMatched, this);
//	},
//
//	_initializeViewModel: function() {
//		this._oViewModel = new sap.ui.model.json.JSONModel({
//			listMode: this._oDeviceModel.getProperty("/listMode"),
//			pageTitle: this._oResourceBundle.getText("xtit.masterTitle", [0]),
//			multiselectIcon: "sap-icon://multi-select",
//			processButtonVisible: false,
//			processButtonEnabled: false
//		});
//		this._oView.setModel(this._oViewModel, "viewProperties");
//	},
//
//	_doProcessButtonEnabling: function() {
//		this._oViewModel.setProperty("/processButtonEnabled", this._oList.getSelectedItems().length !== 0);
//	},
//
//	// --- Methods dealing with list selection and refresh
//
//	// Event handler for the multi-selection button in the page header. It is attached declaratively.
//	onMultiSelectPressed: function() {
//		this._bIsMultiselect = this._oViewModel.getProperty("/listMode") !== sap.m.ListMode.MultiSelect;
//		var oListMode = this._bIsMultiselect ? sap.m.ListMode.MultiSelect : this._oDeviceModel.getProperty("/listMode"),
//			sIcon = "sap-icon://" + (!this._bIsMultiselect ? "multi-select" : "sys-cancel");
//		this._oViewModel.setProperty("/listMode", oListMode);
//		this._oViewModel.setProperty("/multiselectIcon", sIcon);
//		this._oViewModel.setProperty("/processButtonVisible", sap.ui.Device.system.phone && this._bIsMultiselect);
//
//		if (this._bIsMultiselect) {
//			// Multi select mode was switched on
//			if (!this._oSummaryPage) {
//				this._initializeSummaryPage();
//			}
//			var oSelectedItem = this._oList.getSelectedItem();
//			if (oSelectedItem) {
//				var sPOId = oSelectedItem.getBindingContext().getProperty("POId");
//				this._sPreselectedContextPath = "/PurchaseOrders('" + sPOId + "')";
//			}
//			this._oList.removeSelections(true);
//			if (sap.ui.Device.system.phone) {
//				this._doProcessButtonEnabling();
//			} else {
//				this._showSummaryPage();
//			}
//		} else if (!sap.ui.Device.system.phone) {
//			this._oList.removeSelections(true); // Work around for UI5 1.26. With 1.27 this is no longer necessary.
//			// Single select mode.was switched on. In case of phone no change of the detail screen is necessary.
//			this._bNavigationByManualHashChange = false;
//			this._setItem();
//		}
//	},
//
//	// Event handler for the case that the user selects one item in the master list.
//	// Note: This method is referred twice in the declarative definition of this view.
//	// The first reference is event 'selectionChange' of the master list; the second one is 'press' on the list item.
//	// The second reference is needed in case the list mode is 'None' (which is true on phone).
//	onItemSelect: function(oEvent) {
//		// Determine the list item that was selected. Note that the techique to retrieve this from the event depends
//		// on the list mode (in other words, the event we are currently listening to).
//		var oListMode = this._oViewModel.getProperty("/listMode");
//		var oListItem = oListMode === sap.m.ListMode.None ? oEvent.getSource() : oEvent.getParameter("listItem");
//		if (this._bIsMultiselect) {
//			// In multi select mode inform S3_PurchaseOrderSummary about the selection
//			this._oSummaryPage.getController().itemSelected(oEvent.getParameters());
//			// On phone handle the enabling of the process button
//			if (sap.ui.Device.system.phone) {
//				this._doProcessButtonEnabling();
//			}
//		} else {
//			// In single select mode navigate to S3_PurchaseOrderDetails
//			this._bNavigationByManualHashChange = false;
//			this._navToListItem(oListItem);
//			// Note: this only applies when device is in portrait mode.
//			// In this case master should be hidden after selection each selection, but only in single select mode.
//			this._oView.getParent().getParent().hideMaster();
//		}
//	},
//
//	// Event handler for the master list. It is attached declaratively.
//	onUpdateStarted: function() {
//		// According to the UI guideline search input from the user has to be replaced
//		// with the last search term if the search was not triggered and the list was updated due to another action.
//		this._oSearchField.setValue(this._sCurrentSearchTerm);
//	},
//
//	// Event handler for the master list. It is attached declaratively.
//	onUpdateFinished: function() {
//		// Change count in title when list is updated
//		var sMasterPageTitle = this._oResourceBundle.getText("xtit.masterTitle", [this._oListBinding.getLength()]);
//		this._oViewModel.setProperty("/pageTitle", sMasterPageTitle);
//		// If not on the phone, make sure that a PO is selected (if available)
//		if (!sap.ui.Device.system.phone && !this._bIsMultiselect) {
//			this._setItem();
//		}
//		if (sap.ui.Device.system.phone && this._bIsMultiselect) {
//			this._doProcessButtonEnabling();
//		}
//	},
//
//	// This method ensures that a PO is selected. This is either the PO specified by attribute _sPreselectedContextPath
//	// or the first PO in the master list.
//	_setItem: function(bNoFallback) {
//		var aItems = this._oList.getItems();
//		if (aItems.length === 0) {
//			// If there are no POs show the empty page, except when search is responsible for the empty list 
//			// and we do not return from the summary detail view. In the latter case stay on the last displayed detail view.
//			var sDetailViewName = this._oView.getParent().getParent().getCurrentDetailPage().getViewName();
//			if (this._sCurrentSearchTerm === "" || !this._bIsMultiselect && sDetailViewName ===
//				"nw.epm.refapps.ext.po.apv.view.S3_PurchaseOrderSummary") {
//				this._showEmptyPage(this._oResourceBundle.getText("ymsg.noPurchaseOrders"), true);
//			}
//		} else { // If there are POs in the list, display one
//			var oItemToSelect = bNoFallback ? null : aItems[0]; // Fallback: Display the first PO in the list
//			// But if another PO is required: Try to select this one
//			if (this._sPreselectedContextPath) {
//				for (var i = 0; i < aItems.length; i++) {
//					if (aItems[i].getBindingContext().getPath() === this._sPreselectedContextPath) {
//						oItemToSelect = aItems[i];
//						break;
//					}
//				}
//			}
//			// If the app was started via a saved tile for a purchase order ID which is no longer valid,
//			// an empty page is already displayed. Therefore nothing has to be done in this method.
//			if (this._bFirstCall && this._sPreselectedContextPath && oItemToSelect.getBindingContext().getPath() !== this._sPreselectedContextPath) {
//				this._bFirstCall = false;
//				return;
//			}
//			if (oItemToSelect === null) {
//				return;
//			}
//
//			// Now we know which item to select
//			this._oList.setSelectedItem(oItemToSelect); // Mark it as selected in the master list
//			// When the App is started the scroll position should be set to the item to be selected.
//			// Note that this is only relevant when the App has been started with a route specifying the
//			// PO to be displayed, because otherwise the first PO in the list will be the selected one anyway.
//			if (this._bFirstCall || this._bNavigationByManualHashChange) {
//				this._bFirstCall = false;
//				var oDomRef = oItemToSelect.getDomRef();
//				if (oDomRef) {
//					oDomRef.scrollIntoView();
//				}
//			}
//			this._bNavigationByManualHashChange = true;
//			this._navToListItem(oItemToSelect); // and display the item on the detail page
//		}
//	},
//
//	// Event handler for the pullToRefresh-element of the list. It is attached declaratively.
//	onPullToRefresh: function(oEvent) {
//		var oPullToRefresh = oEvent.getSource();
//		// Hide the pull to refresh when data has been loaded
//		this._oList.attachEventOnce("updateFinished", function() {
//			// Note: Do not use oEvent here, because UI5 might have reinitialized this instance already (instance pooling for performance reasons)
//			oPullToRefresh.hide();
//		});
//		// Refresh list from backend
//		this._listRefresh();
//	},
//
//	// This method is called whenever a refresh is triggered.
//	_listRefresh: function() {
//		// If metadata load has run into an error, this method can only be triggered by the user pressing the
//		// refresh or search button in the search field.
//		// In this case we take this action as a hint to retry to load the metadata.
//		if (this._bHasMetadataError) {
//			this._oModel.refreshMetadata();
//		} else { // metadata are ok. Thus, we refresh the list. Note that this (normally) leads to a call of onUpdateFinished.
//			this._oListBinding.refresh();
//		}
//	},
//
//	// This method is called when an approve/reject action was successfully executed.
//	// This is caused by one of the following two alternatives:
//	// - User has used an Approve/Reject button on the detail page
//	// - User has used swipe action on the master list
//	// As the approved/rejected PO will be removed from the list, the list needs to be refreshed.
//	// Moreover (when the app is not being used on a phone), the PO selection needs to be updated if the removed PO was the selected one.
//	// This is always the case for the first alternative and might or might not be the case for the second alternative.
//	// Parameter sPath is passed for the second reason to indicate the context path of the removed PO.
//	// If the selected PO is indeed the removed one the selection should change to the next list entry
//	// or to the previous one, when we are already at the end of the list.
//	onApprovalExecuted: function(sPath) {
//		if (!sap.ui.Device.system.phone) {
//			var oSelectedItem = this._oList.getSelectedItem(),
//				sCurrentPath = oSelectedItem && oSelectedItem.getBindingContext().getPath();
//			// If sPath is given (that is, swipe case) the currently selected PO should stay selected if it is not the removed one 
//			this._sPreselectedContextPath = sPath && sPath !== sCurrentPath && sCurrentPath;
//			// Now, this._sPreselectedContextPath is truthy exactly when the current selection should not be changed.
//			// Otherwise, the following loop is used to find the currently selected PO in the list of all items and identify the preferred neighbour.
//			var aItems = this._oList.getItems(),
//				i;
//			for (i = 0; i < aItems.length && !this._sPreselectedContextPath; i++) {
//				if (aItems[i].getBindingContext().getPath() === sCurrentPath) {
//					var oNextItem = aItems[i === aItems.length - 1 ? (i - 1) : (i + 1)];
//					this._sPreselectedContextPath = oNextItem && oNextItem.getBindingContext().getPath();
//				}
//			}
//		}
//		// The next line makes sure that the focus is set correctly in order to avoid a movement of the selected item within the list.
//		this._oList.attachEventOnce("updateFinished", this._oList.focus, this._oList);
//		// Now (when the app is not being used on a phone) the PO which should be selected after the list update is specified in this._sPreselectedContextPath.
//		// This will be evaluated by method _setItem after the list has been refreshed, which is triggered now.
//		this._bNavigationByManualHashChange = false;
//		this._listRefresh();
//	},
//
//	// --- Methods dealing with search
//
//	// Event handler for the search field in the master list. It is attached declaratively.
//	// Note that this handler listens to the search button and to the refresh button in the search field
//	onSearch: function(oEvent) {
//		// First handle case that refresh button was pressed. In this case the last search should be repeated.
//		if (oEvent.getParameter("refreshButtonPressed")) {
//			this._listRefresh(); // and refresh the search
//			return;
//		}
//		// Now handle the case that the search button was pressed.
//		var sCurrentSearchTerm = oEvent.getSource().getValue(); // content of the search field
//		// If the content of the search field has not changed, simply perform a refresh
//		if (sCurrentSearchTerm === this._sCurrentSearchTerm) {
//			this._listRefresh();
//			return;
//		}
//		this._sCurrentSearchTerm = sCurrentSearchTerm;
//		if (this._bHasMetadataError) {
//			this._oModel.refreshMetadata(); // If metadata load ended with error, try to read metadata once more now  
//		} else {
//			this._doSearch();
//		}
//	},
//
//	// Execute search with the filter defined by this._sCurrentSearchTerm	
//	_doSearch: function() {
//		// Search is implemented using setting filter(s) on the binding of the master list.
//		// More precisely, either 0 (empty search string) or 1 filter is applied to the binding.
//		var aFilters = []; // list of filters to be applied
//		if (this._sCurrentSearchTerm) {
//			var oFilter = new sap.ui.model.Filter("SupplierName", sap.ui.model.FilterOperator.Contains, this._sCurrentSearchTerm);
//			aFilters.push(oFilter);
//		}
//		// Set filters on list. Note that this replaces existing filters.
//		this._oListBinding.filter(aFilters, sap.ui.model.FilterType.Application);
//	},
//
//	// --- Methods dealing with swipe
//
//	// Event handler for swipe in the list. It is attached declaratively.
//	// Its purpose is to deactivate swipe in case of multi select mode.
//	onSwipe: function(oEvent) {
//		if (this._bIsMultiselect) {
//			oEvent.preventDefault();
//		}
//	},
//
//	// Event handler for the swipe action of a list item. It is attached declaratively.
//	onSwipeApprove: function() {
//		var oBindingContext = this._oList.getSwipedItem().getBindingContext(),
//			sPath = oBindingContext.getPath(),
//			aPOIds = [oBindingContext.getProperty(sPath).POId];
//		nw.epm.refapps.ext.po.apv.util.approver.approve(true, this._oView, aPOIds, "", jQuery.proxy(
//			this.onApprovalExecuted, this, sPath));
//		this._oList.swipeOut();
//	},
//
//	// --- Methods dealing with routing
//
//	// This method is registered with the router in onInit. Therefore, it is called whenever the URL is changed.
//	// Note that there are two possible reasons for such a change:
//	// - The user has entered a URL manually (or using browser facilities, such as a favorite)
//	// - Navigation to a route was triggered programmatically
//	onRoutePatternMatched: function(oEvent) {
//		var sRoute = oEvent.getParameter("name");
//		if (sRoute === "all") {
//			this._oAppModel.setProperty("/emptyPageText", this._oResourceBundle.getText("ymsg.pageNotFound"));
//		}
//		// Initialize attribute _oListBinding.
//		// Note that this initialization cannot be performed in onInit, because the list binding is not accessible
//		// at this point in time due to UI5 performance optimizations.
//		if (!this._oListBinding) {
//			this._oListBinding = this._oList.getBinding("items");
//		}
//		if (sRoute === "PurchaseOrderDetails") {
//			// Route "PurchaseOrderDetails" contains the specification of the PO to be selected
//			var sPOId = decodeURIComponent(oEvent.getParameter("arguments").POId),
//				sOldContextPath = this._sPreselectedContextPath;
//			this._sPreselectedContextPath = "/PurchaseOrders('" + sPOId + "')";
//			if (sOldContextPath && this._sPreselectedContextPath !== sOldContextPath) {
//				this._setItem(true);
//			}
//		}
//	},
//
//	// Handler for the nav button of the page. It is attached declaratively.
//	onNavButtonPress: function() {
//		window.history.go(-1); // behave like browser back button
//	},
//
//	// This method triggers the navigation to the detail page with the specified list item oListItem
//	_navToListItem: function(oListItem) {
//		var oCtx = oListItem.getBindingContext();
//		this._oRouter.navTo("PurchaseOrderDetails", {
//			POId: encodeURIComponent(oCtx.getProperty("POId"))
//		}, true);
//	},
//
//	// This method displays the summary screen
//	// The summary screen does not need to be accessible via URL, therefore there is no route for it.
//	// Therefore, we use UI5 low-level api for navigating to the empty view.
//	_showSummaryPage: function() {
//		if (!sap.ui.Device.system.phone) {
//			this._oSummaryPage.getController().resetSummary();
//		}
//		this._oView.getParent().getParent().toDetail(this._oSummaryPage);
//		// Set back the route to the generic one
//		if (!sap.ui.Device.system.phone) {
//			this._oRouter.navTo("PurchaseOrders", {}, true);
//		}
//	},
//
//	_initializeSummaryPage: function() {
//		this._oSummaryPage = sap.ui.view({
//			viewName: "nw.epm.refapps.ext.po.apv.view.S3_PurchaseOrderSummary",
//			type: sap.ui.core.mvc.ViewType.XML,
//			viewData: {
//				master: this,
//				component: sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView))
//			}
//		});
//		this._oView.getParent().getParent().addDetailPage(this._oSummaryPage);
//	},
//
//	// Event handler for the process button of the page footer. It is attached declaratively.
//	onProcessPressed: function() {
//		this._showSummaryPage();
//	},
//
//	// If no PO is available, we display the empty screen on the detail page.
//	// The empty screen does not need to be accessible via URL, therefore there is no route for it.
//	// Therefore, we use UI5 low-level api for navigating to the empty view.
//	_showEmptyPage: function(sMessageText, bResetRoute) {
//		this._oAppModel.setProperty("/emptyPageText", sMessageText);
//		var oSplitApp = this._oView.getParent().getParent(),
//			oEmptyPage = this._oRouter.getView("nw.epm.refapps.ext.po.apv.view.EmptyPage", sap.ui.core.mvc.ViewType.XML);
//		oSplitApp.addDetailPage(oEmptyPage);
//		oSplitApp.toDetail(oEmptyPage);
//
//		// Set back the route to the generic one
//		if (bResetRoute && !sap.ui.Device.system.phone) {
//			this._oRouter.navTo("PurchaseOrders", {}, true);
//		}
//	},
//
//	// This method is called when the S3 detail view cannot read data for a given purchase order ID, because
//	// the purchase order was deleted, did never exist or is already approved/rejected.
//	onEmptyPageRequested: function() {
//		this._bNavigationByManualHashChange = false;
//		this._oList.removeSelections(true);
//		this._showEmptyPage(this._oResourceBundle.getText("ymsg.poUnavailable"));
//	},
//
//	// --- Methods dealing with error handling
//
//	// This handler is called when the metadata load for the oData model fails. It is attached in onInit.
//	// When this happens for the first time, we register ourselves for a successfull load.
//	onMetadataRequestFailed: function(oResponse) {
//		if (!this._bHasMetadataError) { // first time
//			this._bHasMetadataError = true;
//			this._oModel.attachMetadataLoaded(this.onMetadataLoaded, this);
//		}
//		jQuery.sap.require("nw.epm.refapps.ext.po.apv.util.messages");
//		nw.epm.refapps.ext.po.apv.util.messages.showErrorMessage(oResponse);
//	},
//
//	// Handler for the case that metadata are loaded successfully. It is attached in onMetadataRequestFailed.
//	// Therefore, it is only called when the request has failed before. Note that a new retrieval of metadata
//	// can be triggered by pressing the refresh or search button in the search field.
//	onMetadataLoaded: function() {
//		this._bHasMetadataError = false;
//		this._doSearch();
//	}
//
});
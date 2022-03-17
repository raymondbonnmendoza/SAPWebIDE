jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.formatter");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.TableOperations");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForFGS");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.messages");
jQuery.sap.require("sap.ca.ui.model.format.AmountFormat");

sap.ui.core.mvc.Controller.extend("nw.epm.refapps.ext.prod.manage.view.S2_ProductMaster", {

	// --- Helper attributes that are initialized during onInit and never changed afterwards

	_oViewProperties: null, // json model used to manipulate declarative attributes of the controls used in this view. Initialized in _initViewPropertiesModel.
	// contains the following attributes:
	// title                - the current title of the master list
	// multiselectIcon      - the icon used for the button with pressed-handler onMultiSelectPressed
	// noDataText           - the text shown if the master list is empty
	// markExists           - in multi-select mode: info whether at least one entry is marked
	// listMode             - the current list mode
	// filterToolbarVisible - flag whether the filter toolbar is visible on top of the master list
	// filterInfoText       - text of the filter toolbar
	_oView: null, // this view
	_oList: null, // the master list
	_oItemTemplate: null, // template of one list item. Used for modifying the list binding.
	_oSearchField: null, // the search field
	_oApplicationController: null, // the controller of the App
	_oAppModel: null, // json model containing the App state
	_oResourceBundle: null, // the resource bundle to retrieve texts from
	_oHelper: null, // singleton instance of nw.epm.refapps.ext.prod.manage.util.Products used to call backend services
	_oTableOperations: null, // instance of nw.epm.refapps.ext.prod.manage.util.TableOperations used for backend handling of list operations
	_oSubControllerForFGS: null, // instance of nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForFGS used for frontend handling of list operations 
	_oOverflowSheet: null, // instance of MasterOverflowSheet used for the overflow button (initialized on demand)

	// --- Attributes describing the current state of the master list. They are changed while the App is running.

	_iMarkedCount: 0, // number of items selected in multi-selection mode.
	_sCurrentSearchTerm: "", // the search term that is currently used to filter the result list

	// --- Initialization

	onInit: function() {
		this._oView = this.getView();
		this._oList = this.byId("list");
		this._oItemTemplate = this.byId("objectListItem").clone();
		this._oSearchField = this.byId("SearchField");
		var oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
		this._oApplicationController = oComponent.getProductApplicationController();
		this._oApplicationController.registerMaster(this);
		this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		this._oAppModel = oComponent.getModel("appProperties");
		this._oHelper = this._oApplicationController.getODataHelper();
		this._oTableOperations = new nw.epm.refapps.ext.prod.manage.util.TableOperations(jQuery.proxy(this.rebindMasterTable,
			this));
		this._initViewPropertiesModel(oComponent.getModel("device"));
		this.applyTableOperations(); // Set the initial list binding
		// Initializes the sub-controller for handling filter, grouping, and sorting dialogs
		this._oSubControllerForFGS = new nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForFGS(this._oView,
			this._oTableOperations, jQuery.proxy(this.applyTableOperations, this), this._oResourceBundle);
	},

	_initViewPropertiesModel: function(oDeviceModel) {
		// The model created here is used to set values or view element properties that cannot be bound
		// directly to the OData service. Setting view element attributes by binding them to a model is preferable to the
		// alternative of getting each view element by its ID and setting the values directly because a JSon model is more
		// robust if the customer removes view elements (see extensibility).	    
		this._oViewProperties = new sap.ui.model.json.JSONModel({
			title: this._oResourceBundle.getText("xtit.masterTitleWithoutNumber"),
			multiselectIcon: "sap-icon://multi-select",
			noDataText: "",
			markExists: false,
			listMode: oDeviceModel.getProperty("/listMode"),
			filterToolbarVisible: false,
			filterInfoText: ""
		});
		this._oView.setModel(this._oViewProperties, "viewProperties");
	},

	// --- Methods dealing with refresh of the list

	applyTableOperations: function() {
		// This method is called when a new backend search has to be triggered, due to changed 'search settings'.
		// More precisely the method is called: 
		// - on startup (in onInit)
		// - when the user presses Sort, Filter, or Group button (therefore, it is passed as callback to SubControllerForFGS)
		// - when the user triggers a search after having changed the entry in the search field
		// The method uses attribute _oTableOperations to perform the data retrieval	    
		if (this._isListInMultiSelectMode()) {
			this._removeAllSelections();
		}
		this._oTableOperations.applyTableOperations();
	},

	rebindMasterTable: function(aSorters, oCustomSearch, aFilter) {
		// Callback used by attribute _oTableOperations in order to trigger a data retrieval with changed settings
		var sSelect = "Id,ImageUrl,Name,Price,CurrencyCode,SubCategoryName,MainCategoryName,QuantityUnit,";
		sSelect = sSelect + "StockQuantity";
		this._oList.bindAggregation("items", {
			path: "/Products",
			sorter: aSorters,
			groupHeaderFactory: function(oGroup) {
				return new sap.m.GroupHeaderListItem({
					title: oGroup.text,
					upperCase: false
				});
			},
			parameters: {
				countMode: "Inline",
				select: sSelect,
				custom: oCustomSearch
			},
			template: this._oItemTemplate,
			filters: aFilter
		});
	},

	onUpdateStarted: function() {
		// Event handler called after the the master list has been updated. It is attached declaratively.
		// Resets the displayed content of the search field to the search term that is actually used.
		// There may be a difference, as the user might have changed the content but not triggered the search.		
		this._oSearchField.setValue(this._sCurrentSearchTerm);
	},

	onUpdateFinished: function() {
		// Event handler called after the the master list has been updated. It is attached declaratively.	    
		var iCount = this._getListBinding().getLength(),
			sTitle = this._oResourceBundle.getText("xtit.masterTitleWithNumber", [iCount]);
		this._oViewProperties.setProperty("/title", sTitle);
		if (iCount === 0) {
			var sNoDataId = ((this._oTableOperations.getSearchTerm() || this._oTableOperations.getFilterTable()) ? "ymsg.noDataAfterSerach" :
				"ymsg.noProducts");
			this._oViewProperties.setProperty("/noDataText", this._oResourceBundle.getText(sNoDataId));
		}
		if (this._isListInMultiSelectMode()) {
			this._iMarkedCount = this._oList.getSelectedItems().length;
			this._oViewProperties.setProperty("/markExists", this._iMarkedCount > 0);
		}
		// If not on the phone, make sure that a PO is selected (if possible)
		this.setItem();
	},

	listRefresh: function() {
		this._getListBinding().refresh();
	},

	setItem: function(bOnlyUpdateSelections) {
		// In non-phone case this method ensures that
		// - the 'correct' detail page is navigated to if necessary
		// - the product shown in the detail page is marked as selected if necessary
		// - the master list is scrolled to the product shown in the detail page if necessary
		// As a precondition it is assumed that property productId of the AppModel contains the product id
		// specified by the current hash.
		// Hence, if this property is truthy, this method only needs to update the state of the master list.
		// Otherwise, the product to be displayed is still to be determined. This is done according to the following logic:
		// First the preferredIds in the AppModel are checked whether at least one of them is contained in the current master list.
		// If this is the case, the first of them is displayed in the master list.
		// Otherwise just the first item of the list is displayed.
		// If the list is not empty an item will be determined this way and navigation to this item will be triggered. Note that in
		// this case, this method will be called a second time (but in this case with a specified product id).
		// Finally, if the list is empty, the master list will be displayed.
		if (sap.ui.Device.system.phone) {
			return;
		}
		var sProductId = this._oAppModel.getProperty("/productId"); // the product id specified by the hash (if existing)
		var aItems = this._oList.getItems();
		if (aItems.length > 0) {
			var bIsMultiSelect = this._isListInMultiSelectMode();
			var oItemToSelect = sProductId && this._getListItemForId(sProductId); // if a product id is specified find the item for it
			var aPreferredIds = this._oAppModel.getProperty("/preferredIds");
			if (!sProductId) { // if we still have to determine the product
				for (var i = 0; !oItemToSelect && i < aPreferredIds.length; i++) {
					oItemToSelect = this._getListItemForId(aPreferredIds[i]);
				}
				oItemToSelect = oItemToSelect || this._getFirstRealItem();
			}
			// Now we know, which list item is to be selected (if there is one).
			// However, if we are in single-select mode and the item is already selected, we have come here, because
			// the user triggered a navigation by selecting the item in the master list. In this case no further actions are required.
			if (oItemToSelect) {
				if (aPreferredIds.length < 2 && !bOnlyUpdateSelections) {
					// Note: aPreferredIds has a length of 2 or more only if it was filled by a delete scenario. In this case
					// the master list should not move.
					// Actually it is theoretically also possible that we have a delete scenario with aPreferredIds has length 1.
					// But this can only happen when the list before deletion had exactly one entry. In this case it seems appropriate
					// to scroll to this entry (if it still exists after deletion).
					this._scrollToListItem(oItemToSelect);
				}
				if (!bIsMultiSelect) { // in multi-select mode selection means something different, so do not set selection in this case
					this._setItemSelected(oItemToSelect);
				}
				if (!this._isInEditMode() && !bOnlyUpdateSelections) { // In edit mode leave the detail area untouched. Otherwise navigate to the item
					this._navToListItem(oItemToSelect);
				}
			} else if (!oItemToSelect) {
				this._removeAllSelections();
			}
		} else if (!sProductId) {
			this._oApplicationController.navToEmptyPage(this._oViewProperties.getProperty("/noDataText"), true);
		}
		this._oAppModel.setProperty("/preferredIds", []);
	},

	getListItems: function() {
		// returns the current list items. Used by the application controller.
		return this._oList.getItems();
	},

	_getListBinding: function() {
		return this._oList.getBinding("items");
	},

	// --- Methods dealing with new data retrieval triggered by the user. All event handlers are attached declaratively.

	onSearch: function(oEvent) {
		// Event handler for the search field in the master list.
		// Note that this handler listens to the search button and to the refresh button in the search field	    
		var oSearchField = oEvent.getSource();
		var sCurrentSearchFieldContent = oSearchField.getValue();
		// If the user has pressed 'Refresh' the last search should be repeated
		var sNewSearchContent = oEvent.getParameter("refreshButtonPressed") ? this._sCurrentSearchTerm : sCurrentSearchFieldContent;
		this._explicitRefresh(sNewSearchContent);
	},

	_explicitRefresh: function(sNewSearchContent) {
		// This method is called when the user refreshes the list either via the search field or via the pull-to-refresh element
		// sNewSearchContent is the content of the search field to be applied.
		// Note: In case metadata could not be loaded yet or lost draft information could not be determined yet, it is first triggered
		// to retry this. The list will be refreshed as soon as the metadata are loaded.
		// The method returns a promise object that fails when meta data request failed once more.
		var fnRefresh = function() {
			if (sNewSearchContent === this._sCurrentSearchTerm) {
				this.listRefresh();
			} else {
				this._sCurrentSearchTerm = sNewSearchContent;
				this._oTableOperations.setSearchTerm(sNewSearchContent);
				this.applyTableOperations();
			}
		};
		var oMetadataLoadedPromise = this._oApplicationController.refresh(); // get a promise that metadata are loaded
		oMetadataLoadedPromise.done(jQuery.proxy(fnRefresh, this)); // perform the refresh as soon as the metadata are surely loaded
		return oMetadataLoadedPromise;
	},

	onPullToRefresh: function(oEvent) {
		// Event handler for the pullToRefresh-element of the list.
		var oPullToRefresh = oEvent.getSource();
		var fnHidePullToRefresh = function() { // hide the pull to refresh when list has been refreshed or meta data call fails once more
			// Note: Do not use oEvent here, because UI5 might have reinitialized this instance already (instance pooling for performance reasons)
			oPullToRefresh.hide();
		};
		// Hide the pull to refresh when data has been loaded
		this._oList.attachEventOnce("updateFinished", fnHidePullToRefresh);
		// Refresh list from backend
		var oMetadataLoadedPromise = this._explicitRefresh(this._sCurrentSearchTerm);
		oMetadataLoadedPromise.fail(fnHidePullToRefresh);
	},

	// - Event handlers for the Sort, Filter, and Group buttons. They delegate to attribute _oSubControllerForFGS.

	onSortPressed: function() {
		this._oSubControllerForFGS.openDialog("ProductSortDialog", "Name");
	},

	onFilterPressed: function() {
		this._oSubControllerForFGS.openDialog("ProductFilterDialog");
	},

	onGroupPressed: function() {
		this._oSubControllerForFGS.openDialog("ProductGroupingDialog");
	},

	// --- Event handlers for additional buttons in the footer of the master area. They are attached declaratively.

	onAddPressed: function() {
		this._oAppModel.setProperty("/isDirty", false);
		// Gets a promise object which is creating a product draft in backend, navigates to the new product draft
		// when the draft was created successfully
		this._oHelper.createProductDraft().done(jQuery.proxy(function(oProductDraftData) {
			this._oApplicationController.navToProductEditPage(oProductDraftData.Id);
			this._removeAllSelections();
		}, this));
		this._hideMasterInPortrait();
	},

	onDeletePressed: function() {
		var aItems = this._oList.getSelectedItems();
		if (aItems.length > 1) {
			var aProductsToBeDeleted = [];
			jQuery.each(aItems, function(iIndex, oSelectItem) {
				aProductsToBeDeleted.push(oSelectItem.getBindingContext().getPath());
			});
			this._oHelper.deleteProducts(aProductsToBeDeleted);
		} else { // Deletes one selected product
			this._deleteProduct(this._oList.getSelectedItem());
		}
	},

	onOverflowPressed: function(oEvent) {
		var oOverflowButton = oEvent.getSource();
		if (!this._oOverflowSheet) {
			this._oOverflowSheet = sap.ui.xmlfragment("nw.epm.refapps.ext.prod.manage.view.fragment.MasterOverflowSheet", this);
			this._oView.addDependent(this._oOverflowSheet);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, this._oOverflowSheet);
		}
		this._oOverflowSheet.openBy(oOverflowButton);
	},

	// --- Methods dealing with multi-select

	onMultiSelectPressed: function() {
		// Event handler for the multi-selection button in the page header. It is attached declaratively.
		var bWasMultiSelect = this._isListInMultiSelectMode();
		this._setMultiSelect(!bWasMultiSelect);
	},

	_setMultiSelect: function(bMultiSelect) {
		// set the master list to multi-select or single select as specified by bMultiSelect
		if (bMultiSelect === this._isListInMultiSelectMode()) {
			return;
		}
		var oListMode = bMultiSelect ? sap.m.ListMode.MultiSelect : this._oView.getModel("device").getProperty("/listMode");
		this._oViewProperties.setProperty("/listMode", oListMode);
		var sIcon = "sap-icon://" + (bMultiSelect ? "sys-cancel" : "multi-select");
		this._oViewProperties.setProperty("/multiselectIcon", sIcon);
		this._oAppModel.setProperty("/isMultiSelect", bMultiSelect);
		this._oAppModel.setProperty("/isSingleSelect", !bMultiSelect);
		this._oAppModel.setProperty("/isEditAllowed", !bMultiSelect && this._oAppModel.getProperty("/isLostDraftKnown"));
		this._removeAllSelections();
		if (!bMultiSelect && !sap.ui.Device.system.phone) {
			var oSelectedItem = this._getListItemForId(this._oAppModel.getProperty("/productId"));
			this._setItemSelected(oSelectedItem);
		}
	},

	_isListInMultiSelectMode: function() {
		// helper method to check if the current list is currently in the MultiSelect mode
		return this._oList.getMode() === sap.m.ListMode.MultiSelect;
	},

	_removeAllSelections: function() {
		// set all items as unselected
		this._oList.removeSelections(true);
		this._iMarkedCount = 0;
		this._oViewProperties.setProperty("/markExists", false);
	},

	// --- Event handlers for additional UI elements. All of them are attached declaratively.

	onNavButtonPress: function() {
		// Handler for the nav button of the page.
		var fnLeave = function() {
			window.history.go(-1); // behave like browser back button
		};
		if (this._isInEditMode()) {
			this._leaveEditPage(fnLeave);
		} else {
			fnLeave();
		}
	},

	onSwipe: function(oEvent) {
		// Event handler for swipe in the list.
		// Its purpose is to deactivate swipe in case of multi select and in edit mode.	    
		if (this._isListInMultiSelectMode() || this._isInEditMode()) {
			oEvent.preventDefault();
		}
	},

	onSwipeDeleteItem: function() {
		// user has confirmed the deletion via swipe
		this._deleteProduct(this._oList.getSwipedItem(), true);
		this._oList.swipeOut();
	},

	onItemSelect: function(oEvent) {
		// Event handler for the case that the user selects one item in the master list.
		// Note: This method is referred twice in the declarative definition of this view.
		// The first reference is event 'selectionChange' of the master list; the second one is 'press' on the list item.
		// The second reference is needed in case the list mode is 'None' (which is true on phone).       	    
		// Determine the list item that was selected. Note that the techique to retrieve this from the event depends
		// on the list mode (in other words, the event we are currently listening to).
		var oListItem = this._oList.getMode() === sap.m.ListMode.None ? oEvent.getSource() : oEvent.getParameter("listItem");

		var bMultiSelect = this._isListInMultiSelectMode();
		if (bMultiSelect) { // in multi-select mode select mode selecting the list item inverts the current selection state
			if (oEvent.getParameter("selected")) { // the item turns into selected
				this._iMarkedCount++;
				if (!sap.ui.Device.system.phone) { // in this case the newly selected item should be displayed in the detail area,
					this._navToListItem(oListItem);
				}
			} else { // the item turns into unselected
				this._iMarkedCount--;
			}
			this._oViewProperties.setProperty("/markExists", this._iMarkedCount > 0);
		} else { // in single-select mode the user wants to navigate to the selected item
			if (this._isInEditMode()) { // in edit mode a data-loss popup might be necessary
				var fnLeaveCancelled = function() { // called when user decides to cancel the navigation due to possible data-loss
					this._setItemSelected(this._getListItemForId(this._oAppModel.getProperty("/productId"))); // set back selection to the item being edited (if it is in the list)
				};
				this._leaveEditPage(jQuery.proxy(this._navToListItem, this, oListItem), jQuery.proxy(fnLeaveCancelled, this));
			} else {
				this._navToListItem(oListItem);
			}
			this._hideMasterInPortrait();
		}
	},

	// --- internal helper methods

	_navToListItem: function(oListItem) {
		// This method triggers the navigation to the detail page with the specified list item oListItem
		var oCtx = oListItem.getBindingContext();
		var sProductId = oCtx.getProperty("Id");
		this._oApplicationController.showProductDetailPage(sProductId);
	},

	_setItemSelected: function(oItemToSelect) {
		// Set the specified list item to be selected, resp. remove all selections if the specififed item is faulty
		if (oItemToSelect) {
			this._oList.setSelectedItem(oItemToSelect);
		} else {
			this._removeAllSelections();
		}
	},

	_getListItemForId: function(sId) {
		// Return the list item for the specified product id or a faulty value if the list does not contain the product.
		if (!sId) {
			return null;
		}
		var aItems = this._oList.getItems();
		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			if (!(oItem instanceof sap.m.GroupHeaderListItem)) {
				var oContext = oItem.getBindingContext();
				if (oContext && oContext.getProperty("Id") === sId) {
					return oItem;
				}
			}
		}
	},

	_scrollToListItem: function(oListItem) {
		// Scroll the list to the given list item.
		if (oListItem === this._getFirstRealItem()) {
			// If the item to scroll to is the first, just scroll to top. This ensures that the info toolbar and a top
			// grouping item will be shown if available.
			var oPage = this.byId("masterPage");
			oPage.scrollTo(0);
		} else {
			var oDomRef = oListItem.getDomRef();
			if (oDomRef) {
				oDomRef.scrollIntoView();
			}
		}
	},

	_isInEditMode: function() {
		return !this._oAppModel.getProperty("/noEditMode");
	},

	_deleteProduct: function(oListItem, bWithoutConfirmationDialog) {
		// Handles deletion of one item
		var oBindingContext = oListItem.getBindingContext();
		this._oHelper.deleteProduct(oBindingContext.getPath(), bWithoutConfirmationDialog);
	},

	_leaveEditPage: function(fnLeave, fnLeaveCancelled) {
		// leave the edit page. If the current draft is dirty the user will get a data loss poup.
		// fnLeave is the function that will be called when the edit page is really left
		// fnLeaveCancelled is the function that is called when the user cancels the operation
		var sPath = this._oHelper.getPathForDraftId(this._oAppModel.getProperty("/productId"));
		this._oHelper.deleteProductDraft(sPath, fnLeave, fnLeaveCancelled);
	},

	_hideMasterInPortrait: function() {
		this._oView.getParent().getParent().hideMaster();
	},

	_getFirstRealItem: function() {
		// Returns the first item of the list which is not a grouping item. Returns a faulty value if list is empty. 
		var aItems = this._oList.getItems();
		for (var i = 0; i < aItems.length; i++) {
			if (!(aItems[i] instanceof sap.m.GroupHeaderListItem)) {
				return aItems[i];
			}
		}
	}
});
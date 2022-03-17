jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForFGS");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.formatter");

// Creates a sub-controller to be used by the master controller to handle specifically filtering, grouping, and sorting
// dialogs
sap.ui.base.Object.extend("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForFGS", {
	_aDialogs: null,
	_oParentView: null,
	_oResourceBundle: null,
	_fnApplyTableOperations: null,
	_oPriceGroups: null,

	constructor: function(oParentView, oTableOperations, fnApplyTableOperations, oResourceBundle) {
		this._oParentView = oParentView;
		this._oResourceBundle = oResourceBundle;
		this._oTableOperations = oTableOperations;
		this._fnApplyTableOperations = fnApplyTableOperations;
		this._aDialogs = [];

		var sTextBelow100 = this._getText("xfld.groupPriceBetween", [" 0-100"]),
			sTextBelow500 = this._getText("xfld.groupPriceBetween", [" 100-500"]),
			sTextBelow1000 = this._getText("xfld.groupPriceBetween", [" 500-1000"]),
			sTextAbove1000 = this._getText("xfld.groupPrice", [" 1000"]);

		// Sets the pre-defined price ranges for use in grouping. The texts can only be defined once i18n bundle is
		// available because the text "price between" is defined only once.
		this._oPriceGroups = {
			"LE100": sTextBelow100,
			"BT100-500": sTextBelow500,
			"BT500-1000": sTextBelow1000,
			"GT1000": sTextAbove1000,
			"unknownPrice": "?"
		};
		var oViewPropertiesModel = oParentView.getModel("viewProperties");
		oViewPropertiesModel.setProperty("/LE100", sTextBelow100);
		oViewPropertiesModel.setProperty("/BT100-500", sTextBelow500);
		oViewPropertiesModel.setProperty("/BT500-1000", sTextBelow1000);
		oViewPropertiesModel.setProperty("/GT1000", sTextAbove1000);
	},

	// Opens the requested filter, grouping, and sorting dialogs
	openDialog: function(sDialogFragmentName, sInitialSelection) {
		sDialogFragmentName = "nw.epm.refapps.ext.prod.manage.view.fragment." + sDialogFragmentName;
		var oDialog = this._aDialogs[sDialogFragmentName];
		if (!oDialog) {
			this._aDialogs[sDialogFragmentName] = oDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
			this._oParentView.addDependent(oDialog);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oParentView, oDialog);
			if (sInitialSelection) {
				oDialog.setSelectedSortItem(sInitialSelection);
			}
		}
		return oDialog.open();
	},

	// Handler for the filter criteria, which is set by the user
	onFilterDialogConfirm: function(oEvent) {
		var params = oEvent.getParameters(),
			bPrice = false,
			bStockQuantity = false,
			i = 0,
			sText = "";
		var aFilterItems = params.filterItems; // Array of type ViewSettingsItem
		var iLength = aFilterItems.length;
		// Rebuilds filters every time. Makes it easier if the user has removed filter selections
		this._oTableOperations.setFilterList([]);

		// Determines which filters the user selected according to the predefined price and stock filters
		for (i = 0; i < iLength; i++) {
			// Determines which price filters have been selected using the keys
			var oSelectedFilterExpression = this._oPriceFilters[aFilterItems[i].getKey()];
			if (oSelectedFilterExpression) {
				this._oTableOperations.addFilter(oSelectedFilterExpression);
				bPrice = true;
			} else {
				// Searches for stock filter based on the key specified
				oSelectedFilterExpression = this._oStockFilters[aFilterItems[i].getKey()];
				if (oSelectedFilterExpression) {
					this._oTableOperations.addFilter(oSelectedFilterExpression);
					bStockQuantity = true;
				}
			}
		}
		// Updates table operation settings and updates list binding accordingly
		this._fnApplyTableOperations();

		// Shows/hides infoToolbar in the list
		var oViewPropertiesModel = this._oParentView.getModel("viewProperties");
		var bFilterToolbarVisible = !!this._oTableOperations.getFilterTable();
		oViewPropertiesModel.setProperty("/filterToolbarVisible", bFilterToolbarVisible);
		if (bFilterToolbarVisible) {
			if (bPrice && bStockQuantity) {
				sText = this._getText("xtit.filterBy2", [this._getPriceLabel(),
                                this._getText("xfld.availability")]);
			} else {
				// Sets text if price filter is selected
				sText = bPrice ? this._getText("xtit.filterBy", [this._getPriceLabel()]) : "";
				// Sets text if stock filter is selected
				sText = (!sText && bStockQuantity) ? this._getText("xtit.filterBy", [this
                                ._getText("xfld.availability")]) : sText;
			}
			oViewPropertiesModel.setProperty("/filterInfoText", sText);
		}
	},

	_getPriceLabel: function() {
		return this._oParentView.getModel().getProperty("/#Product/Price/@sap:label");
	},

	// Defines the price filter settings available
	_oPriceFilters: {
		"LE100": new sap.ui.model.Filter("Price", sap.ui.model.FilterOperator.LE, "100"),
		"BT100-500": new sap.ui.model.Filter("Price", sap.ui.model.FilterOperator.BT, "100", "500"),
		"BT500-1000": new sap.ui.model.Filter("Price", sap.ui.model.FilterOperator.BT, "500", "1000"),
		"GT1000": new sap.ui.model.Filter("Price", sap.ui.model.FilterOperator.GE, "1000")
	},

	// Defines the stock availability filter settings available
	_oStockFilters: {
		"outofstock": new sap.ui.model.Filter("StockQuantity", sap.ui.model.FilterOperator.EQ, "0"),
		"restrictedstock": new sap.ui.model.Filter("StockQuantity", sap.ui.model.FilterOperator.BT, "1", "9"),
		"instock": new sap.ui.model.Filter("StockQuantity", sap.ui.model.FilterOperator.GE, "10")
	},

	// Handler for the Confirm button on the sort dialog. Depending on the selections made on the sort
	// dialog, the respective sorters are created and stored in the _oTableOperations object.
	// The actual setting of the sorters on the binding is done in function setSorters
	onSortDialogConfirmed: function(oEvent) {
		var mParams = oEvent.getParameters(),
			sSortPath = mParams.sortItem.getKey();
		this._oTableOperations.addSorter(new sap.ui.model.Sorter(sSortPath, mParams.sortDescending));
		this._fnApplyTableOperations();
	},

	// Handler for the grouping criteria, which are set by the user
	onGroupingDialogConfirmed: function(oEvent) {
		var mParams = oEvent.getParameters(),
			sortPath;
		if (mParams.groupItem) {
			sortPath = mParams.groupItem.getKey();
			this._oTableOperations.setGrouping(new sap.ui.model.Sorter(sortPath, mParams.groupDescending, jQuery.proxy(
				this._oGroupFunctions[sortPath], this)));
		} else {
			this._oTableOperations.removeGrouping();
		}
		this._fnApplyTableOperations();
	},

	_oGroupFunctions: {

		// Assumption is that all prices contain the currency code and that the currency conversion has to be done in
		// the backend system of the app
		Price: function(oListItemContext) {
			var sKey, iPrice = Number(oListItemContext.getProperty("Price"));
			if (iPrice <= 100) {
				sKey = "LE100";
			} else if (iPrice <= 500) {
				sKey = "BT100-500";
			} else if (iPrice <= 1000) {
				sKey = "BT500-1000";
			} else if (iPrice > 1000) {
				sKey = "GT1000";
			} else {
				sKey = "unknownPrice";
			}

			return {
				key: sKey,
				text: this._oPriceGroups[sKey]
			};
		},

		StockQuantity: function(oListItemContext) {
			var iQuantity = Number(oListItemContext.getProperty("StockQuantity"));
			// Sets the default key and text if iQuantity is negative or NaN.
			var sKey = "unknownStockQuantity",
				sText = "?";
			if (iQuantity >= 0) {
				var sLabel = this._getSAPLabel(oListItemContext, "StockQuantity");
				if (iQuantity === 0) {
					sKey = "LE0";
				} else if (iQuantity >= 10) {
					sKey = "GE10";
				} else {
					sKey = "BT1-9";
				}
				var sI18NKey = iQuantity === 0 ? "xfld.outstock" : (iQuantity < 10 ? "xfld.restricted10" : "xfld.instock");
				var sValue = this._oResourceBundle.getText(sI18NKey);
				sText = this._oResourceBundle.getText("xfld.groupingLabel", [sLabel, sValue]);
			}
			return {
				key: sKey,
				text: sText
			};
		},

		MainCategoryName: function(oListItemContext) {
			return this._getCategoryName(oListItemContext, "MainCategoryName");
		},

		SubCategoryName: function(oListItemContext) {
			return this._getCategoryName(oListItemContext, "SubCategoryName");
		}
	},

	// Reads the corresponding category name based on the list-item context
	_getCategoryName: function(oListItemContext, sCategoryType) {
		var sKey = oListItemContext.getProperty(sCategoryType);
		return {
			key: sKey,
			text: this._getText("xfld.groupingLabel", [this._getSAPLabel(oListItemContext, sCategoryType), sKey])
		};
	},

	// Reads the SAP attribute label from the list-item context
	_getSAPLabel: function(oListItemContext, sAttributeName) {
		return oListItemContext.getProperty("/#Product/" + sAttributeName + "/@sap:label");
	},

	// Shortcut to get i18n text
	_getText: function() {
		return this._oResourceBundle.getText.apply(this._oResourceBundle, arguments);
	}
});
jQuery.sap.require("nw.epm.refapps.ext.po.apv.util.formatter");
jQuery.sap.require("nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForApproval");

sap.ui.core.mvc.Controller.extend("nw.epm.refapps.ext.po.apv.view.S3_PurchaseOrderSummary", {

	// The following attributes are used to provide easy access to some global resources. They are 'more or less constant' because they are
	// initialized in onInit and not changed afterwards.
	_oResourceBundle: null, // the application resource bundle
	_oView: null, // this view
	_oViewData: null, // data that was provided from the master during instantiation of the summary view
	_oModel: null, // oData model
	_oViewModel: null, // Json model to bind local data to the view
	_oSubControllerForApproval: null, // helper for the approval dialog

	onInit: function() {
		// Initialize the attributes
		this._oView = this.getView();
		this._oViewData = this._oView.getViewData(); 
		this._oModel = this._oViewData.component.getModel();
		this._oResourceBundle = this._oViewData.component.getModel("i18n").getResourceBundle();
		this._initializeViewModel();
		this._oSubControllerForApproval = new nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForApproval(this._oView, this._oResourceBundle);
	},

	_initializeViewModel: function() {
		this._oViewModel = new sap.ui.model.json.JSONModel({
			selectedPurchaseOrders: [],
			totalSum: 0,
			totalCurrencyCode: "",
			approvalButtonsEnabled: false,
			pageTitle: this._oResourceBundle.getText("xtit.summaryTitle", [0])
		});
		this._oView.setModel(this._oViewModel, "viewProperties");
	},

	// This method is triggered when an item is selected in the master list. It updates the Json model.
	itemSelected: function(mEventParameters) {
		var oListItem = mEventParameters.listItem,
			aPurchaseOrders = this._oViewModel.getProperty("/selectedPurchaseOrders");
		if (mEventParameters.selected) {
			var oPurchaseOrder = this._oModel.getObject(oListItem.getBindingContextPath());
			aPurchaseOrders.push(oPurchaseOrder);
		} else {
			var i, sCurrentPOId = oListItem.getBindingContext().getProperty("POId");
			for (i = 0; i < aPurchaseOrders.length; i++) {
				if (aPurchaseOrders[i].POId === sCurrentPOId) {
					aPurchaseOrders.splice(i, 1);
					break;
				}
			}
		}
		this._updateSumAndModel();
	},

	// This method resets the view content. It is also called from the master.
	resetSummary: function() {
		this._oViewModel.setProperty("/selectedPurchaseOrders", []);
		this._updateSumAndModel();
	},

	// This method calculates the total sum over all selected POs and updates the model.
	// The currency is expected to be the same for all POs, that's why it is taken from the fist one.
	_updateSumAndModel: function() {
		var i, fSum = 0,
			aPurchaseOrders = this._oViewModel.getProperty("/selectedPurchaseOrders"),
			sCurrencyCode = "USD", // default currency code as fallback
			iNumberOfPOs = aPurchaseOrders.length;
		for (i = 0; i < iNumberOfPOs; i++) {
			if (i === 0) {
				sCurrencyCode = aPurchaseOrders[i].CurrencyCode;
			}
			fSum = fSum + parseFloat(aPurchaseOrders[i].GrossAmount, 10);
		}
		this._oViewModel.setProperty("/totalSum", fSum);
		this._oViewModel.setProperty("/totalCurrencyCode", sCurrencyCode);
		this._oViewModel.setProperty("/pageTitle", this._oResourceBundle.getText("xtit.summaryTitle", [iNumberOfPOs]));
		this._oViewModel.setProperty("/approvalButtonsEnabled", iNumberOfPOs !== 0);
	},

	// Event handler for buttons 'Approve All' and 'Reject All' that is attached declaratively
	onOpenApprovalDialog: function(oEvent) {
		this._oSubControllerForApproval.openDialog(oEvent, this._oViewModel.getProperty("/selectedPurchaseOrders"));
	},

	// This event handler is called when an approve/reject action has been performed successfully.
	onApprovalSuccess: function() {
		this._oViewData.master.onApprovalExecuted("");
		this.resetSummary();
		if (sap.ui.Device.system.phone) { // When the app is being used on a phone leave detail screen and go back to master
			this._navToMaster();
		}
	},

	// Handler for the navigation button (only available when the app is being used on a phone) that is attached declaratively.
	onNavButtonPress: function() {
		this._navToMaster();
	},

	_navToMaster: function() {
		this._oView.getParent().getParent().backMaster(); // call backMaster at SplitApp
	}
});
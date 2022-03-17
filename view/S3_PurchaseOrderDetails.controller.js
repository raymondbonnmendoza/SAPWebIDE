jQuery.sap.require("nw.epm.refapps.ext.po.apv.util.formatter");
jQuery.sap.require("nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForApproval");
jQuery.sap.require("nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForShare");

sap.ui.core.mvc.Controller.extend("nw.epm.refapps.ext.po.apv.view.S3_PurchaseOrderDetails", {

	_sIdentity: "nw.epm.refapps.ext.po.apv",
	_sContextPath: null, // context path of the PO currently displayed
	// The following attributes are used to provide easy access to some global resources. They are 'more or less constant' because they are
	// initialized in onInit and not changed afterwards.
	_oView: null, // this view
	_oModel: null, // oData model
	_oResourceBundle: null, // the application resource bundle
	_oViewModel: null, // Json model to bind local data to the view
	_oEventBus: null, // 'Local' event bus of the component. Used for communication between views.
	_oSubControllerForApproval: null, // helper for the approval dialog
	_oSubControllerForShare: null, // helper for the share dialog

	onInit: function() {
		// Initialize the attributes
		this._oView = this.getView();
		var oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
		this._oModel = oComponent.getModel();
		this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		this._initializeViewModel();
		this._oEventBus = oComponent.getEventBus();
		this._oSubControllerForApproval = new nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForApproval(this._oView, this._oResourceBundle);
		this._oSubControllerForShare = new nw.epm.refapps.ext.po.apv.view.fragment.SubControllerForShare(this._oView, this._oResourceBundle);
		// Register for routes
		sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.onRoutePatternMatched, this);
	},

	_initializeViewModel: function() {
		this._oViewModel = new sap.ui.model.json.JSONModel({
			itemTableHeader: ""
		});
		this._oView.setModel(this._oViewModel, "viewProperties");
	},

	// This method is registered with the router in onInit. Therefore, it is called whenever the URL is changed.
	// Note that there are two possible reasons for such a change:
	// - The user has entered a URL manually (or using browser facilities, such as a favorite)
	// - Navigation to a route was triggered programmatically
	onRoutePatternMatched: function(oEvent) {
		if (oEvent.getParameter("name") !== "PurchaseOrderDetails") {
			return; // no need to take action on "master" route
		}
		var sPOId = decodeURIComponent(oEvent.getParameter("arguments").POId),
			sPath = "/PurchaseOrders('" + sPOId + "')";
		if (this._sContextPath !== sPath) {
			this._sContextPath = sPath;
			this._bindView();
		}
	},

	// If PO has changed refresh context path for view and binding for table of PO items.
	// Note that we rely on the fact that all attributes displayed in the object header have already
	// been retrieved with the select defined for the master list.
	_bindView: function() {
		this._oView.bindElement({
			path: this._sContextPath,
			parameters: {
				select: "POId,OrderedByName,SupplierName,GrossAmount,CurrencyCode,ChangedAt,DeliveryDateEarliest,LaterDelivDateExist,DeliveryAddress,ItemCount"
			}
		});
		var fnOnDataReceived = function() {
			if (!this._oModel.getProperty(this._sContextPath)) {
				this._oEventBus.publish(this._sIdentity, "requestEmptyPage");
			}
		};
		this._oView.getElementBinding().attachEventOnce("dataReceived", jQuery.proxy(fnOnDataReceived, this));
	},

	// Event handler for the table of PO items that is attached declaratively
	onUpdateFinished: function(oEvent) {
		var sHeaderText = this._oResourceBundle.getText("xtit.itemListTitle", [oEvent.getParameter("total")]);
		this._oViewModel.setProperty("/itemTableHeader", sHeaderText);
	},

	// Event handler for buttons 'Approve' and 'Reject' that is attached declaratively
	onOpenApprovalDialog: function(oEvent) {
		this._oSubControllerForApproval.openDialog(oEvent, [this._oModel.getProperty(this._sContextPath)]);
	},

	// This event handler is called when an approve/reject action has been performed successfully.
	onApprovalSuccess: function() {
		// Broadcast the information about the successfull approve/reject action. Actually, only master view is listening.
		this._oEventBus.publish(this._sIdentity, "approvalExecuted");
		if (sap.ui.Device.system.phone) { // When the app is being used on a phone leave detail screen and go back to master
			sap.ui.core.UIComponent.getRouterFor(this).navTo("PurchaseOrders", {}, true);
		}
	},

	// Event handler for opening the Share dialog with an action sheet containing the standard "AddBookmark" button. It is attached declaratively.
	onSharePressed: function(oEvent) {
		this._oSubControllerForShare.openDialog(oEvent);
	},

	// Handler for the navigation button (only available when the app is being used on a phone) that is attached declaratively.
	onNavButtonPress: function() {
		sap.ui.core.UIComponent.getRouterFor(this).navTo("PurchaseOrders", {}, true); // return to master page
		this._oView.unbindElement();
	}
});
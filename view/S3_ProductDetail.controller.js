jQuery.sap.require("sap.ca.ui.model.type.Date");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ca.ui.model.format.AmountFormat");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.formatter");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.control.RatingAndCount");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.view.fragment.SubControllerForShare");

// Actually we have two detail views, namely nw.epm.refapps.ext.prod.manage.view.subview.ProductDisplay and
// nw.epm.refapps.ext.prod.manage.view.subview.ProductEdit.
// Since the same route is used for both of them, this view is used as host for both of them.
// The NavContainer with id 'content' will always display the instance which is currently required.
// This view is informed by the ApplicationController via methods editModeChanged and productChanged that it
// should adapt to the current global state.
// This is done by informing the controllers of those subviews via methods leave and show about the new situation.
// Afterwards the view to be displayed in the content is adapted.
sap.ui.core.mvc.Controller.extend("nw.epm.refapps.ext.prod.manage.view.S3_ProductDetail", {
    _oAppModel: null, // the global model of the App
    _oContent: null, // the NavContainer hosting the 'real' view
    _oDisplayView: null, // the view used in display mode
    _oEditView: null, // the view used in edit mode
    _oCurrentView: null, // the view currently used (either _oDisplayView or _oEditView)
    
	onInit: function() {
		var oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this.getView()));
		var oApplicationController = oComponent.getProductApplicationController();
		oApplicationController.registerDetail(this);
		this._oAppModel = oComponent.getModel("appProperties");
		this._oContent = this.byId("content");
		this._oDisplayView = this.byId("display");
		this._oEditView = this.byId("edit");
		this._oCurrentView = this._oDisplayView;
		this._oContent.to(this._oCurrentView);
	},

	editModeChanged: function() {
	    // This method is called by the controller of the App in case the mode has possibly changed.
	    // It returns the information whether it was really necessary to exchange the views.
		var bIsEditMode = !this._oAppModel.getProperty("/noEditMode"); // retrieve the current mode from the global model
		var oView = bIsEditMode ? this._oEditView : this._oDisplayView;
		if (this._oCurrentView === oView) {
			return false;
		}
		this._oCurrentView.getController().leave();
		this._oCurrentView = oView;
		oView.getController().show();
		this._oContent.to(oView);
		return true;
	},

	productChanged: function() {
	    // This method is called when the product to be displayed has possibly been changed
		this._oCurrentView.getController().show(); // Just forward to the current view
	}
});
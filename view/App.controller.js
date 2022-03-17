jQuery.sap.require("com.sap.open.offline.util.Formatter");
jQuery.sap.require("com.sap.open.offline.util.Controller");

com.sap.open.offline.util.Controller.extend("com.sap.open.offline.view.App", {
	/**
	 * initializing controller, subscribe two "OfflineStore" channel event
	 */
	onInit: function() {
		var oEventBus = this.getEventBus();
		oEventBus.subscribe("OfflineStore", "Refreshing", jQuery.proxy(this.onRefreshing, this), this);
		oEventBus.subscribe("OfflineStore", "Synced", jQuery.proxy(this.onDataReady, this), this);
	},

	/**
	 * UI5 OfflineStore channel Refreshing event handler, refreshing the offline store data
	 * @param{String} sChannel event channel name
	 * @param{String}} sEvent event name
	 * @param{Object}} oData event data object
	 */
	onRefreshing: function(sChannel, sEvent, oData) {
		if (com.sap.open.offline.dev.devapp.isOnline) {
			console.log("refreshing oData Model with offline store");
			this.getView().setBusy(true);
			//ask refreshing store after flush
			com.sap.open.offline.dev.devapp.refreshing = true;
			if (com.sap.open.offline.dev.devapp.devLogon) {
				console.log("refreshing offline store");
				com.sap.open.offline.dev.devapp.devLogon.flushAppOfflineStore();
			}
		} else {
			this.getView().getModel().refresh();
		}
	},

	/**
	 * UI5 OfflineStore channel Synced event handler, after refreshing offline store, refresh data model
	 * @param{String} sChannel event channel name
	 * @param{String}} sEvent event name
	 * @param{Object}} oData event data object
	 */
	onDataReady: function(sChannel, sEvent, oData) {
		console.log("refreshed oData Model with offline store");
		this.getView().setBusy(false);
		this.getView().getModel().refresh();
	}
});
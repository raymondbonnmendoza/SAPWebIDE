sap.ui.core.mvc.Controller.extend("subcon_stock_tracking_ns.view.Detail", {

	onInit : function() {
		
//      DATE FIELD INIT CODE - RYBM
		var dateFrom = new Date();
        dateFrom.setUTCDate(1);
        dateFrom.setUTCMonth(0);
        dateFrom.setUTCFullYear(2015);
    
        var dateTo = new Date();
        dateTo.setUTCDate(19);
        dateTo.setUTCMonth(5);
        dateTo.setUTCFullYear(2015);
    
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({
          delimiterDRS1: "to",
          dateValueDRS1: dateFrom,
          secondDateValueDRS1: dateTo,
          dateFormatDRS1: "yyyy/MM/dd"
        });
        this.getView().byId("DRS1").setModel(oModel);

		this.oInitialLoadFinishedDeferred = jQuery.Deferred();

		if(sap.ui.Device.system.phone) {
			//Do not wait for the master when in mobile phone resolution
			this.oInitialLoadFinishedDeferred.resolve();
		} else {
			this.getView().setBusy(true);
			var oEventBus = this.getEventBus(); 
			oEventBus.subscribe("Component", "MetadataFailed", this.onMetadataFailed, this);
			oEventBus.subscribe("Master", "InitialLoadFinished", this.onMasterLoaded, this);
		}

		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
        this._iEvent = 0;
	},
	
//  DATE FIELD HANDLER AND FILTER - RYBM
	handleChange: function (oEvent) {
        var sFrom = oEvent.getParameter("from");
        var sTo = oEvent.getParameter("to");
        var bValid = oEvent.getParameter("valid");
    
        this._iEvent++;
    
        var oFilter = new sap.ui.model.Filter("Date",sap.ui.model.FilterOperator.BT,sFrom,sTo);
        var oTables = this.byId("Components");
        var oBindng = oTables.getBinding("items");
        oBindng.filter(oFilter);

        var oDRS = oEvent.oSource;
        if (bValid) {
          oDRS.setValueState(sap.ui.core.ValueState.None);
        } else {
          oDRS.setValueState(sap.ui.core.ValueState.Error);
        }
    },

	onMasterLoaded :  function (sChannel, sEvent) {
		this.getView().setBusy(false);
		this.oInitialLoadFinishedDeferred.resolve();
	},
	
	onMetadataFailed : function(){
		this.getView().setBusy(false);
		this.oInitialLoadFinishedDeferred.resolve();
        this.showEmptyView();	    
	},
	
	onPOItemPress: function(oEvent) {
        var oSelectedItem = oEvent.getParameters().listItem;
        var sPath = oSelectedItem.getBindingContextPath().substr(1);
        this.getRouter().navTo("POItem",{
        from: "Detail",
        entity: "POItem",
        item: sPath
        },false);
    },

    onAttachmentItemPress: function(oEvent) {
       
    },

	onRouteMatched : function(oEvent) {
		var oParameters = oEvent.getParameters();

		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function () {
			var oView = this.getView();

			// When navigating in the Detail page, update the binding context 
			if (oParameters.name !== "detail") { 
				return;
			}

			var sEntityPath = "/" + oParameters.arguments.entity;
			this.bindView(sEntityPath);

			var oIconTabBar = oView.byId("idIconTabBar");
			oIconTabBar.getItems().forEach(function(oItem) {
			    if(oItem.getKey() !== "selfInfo"){
    				oItem.bindElement(oItem.getKey());
			    }
			});

			// Specify the tab being focused
			var sTabKey = oParameters.arguments.tab;
			this.getEventBus().publish("Detail", "TabChanged", { sTabKey : sTabKey });

			if (oIconTabBar.getSelectedKey() !== sTabKey) {
				oIconTabBar.setSelectedKey(sTabKey);
			}
		}, this));

	},

	bindView : function (sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath); 

		//Check if the data is already on the client
		if(!oView.getModel().getData(sEntityPath)) {

			// Check that the entity specified was found.
			oView.getElementBinding().attachEventOnce("dataReceived", jQuery.proxy(function() {
				var oData = oView.getModel().getData(sEntityPath);
				if (!oData) {
					this.showEmptyView();
					this.fireDetailNotFound();
				} else {
					this.fireDetailChanged(sEntityPath);
				}
			}, this));

		} else {
			this.fireDetailChanged(sEntityPath);
		}

	},

	showEmptyView : function () {
		this.getRouter().myNavToWithoutHash({ 
			currentView : this.getView(),
			targetViewName : "subcon_stock_tracking_ns.view.NotFound",
			targetViewType : "XML"
		});
	},

	fireDetailChanged : function (sEntityPath) {
		this.getEventBus().publish("Detail", "Changed", { sEntityPath : sEntityPath });
	},

	fireDetailNotFound : function () {
		this.getEventBus().publish("Detail", "NotFound");
	},

	onNavBack : function() {
		// This is only relevant when running on phone devices
		this.getRouter().myNavBack("main");
	},

	onDetailSelect : function(oEvent) {
		sap.ui.core.UIComponent.getRouterFor(this).navTo("detail",{
			entity : oEvent.getSource().getBindingContext().getPath().slice(1),
			tab: oEvent.getParameter("selectedKey")
		}, true);
	},

	openActionSheet: function() {

		if (!this._oActionSheet) {
			this._oActionSheet = new sap.m.ActionSheet({
				buttons: new sap.ushell.ui.footerbar.AddBookmarkButton()
			});
			this._oActionSheet.setShowCancelButton(true);
			this._oActionSheet.setPlacement(sap.m.PlacementType.Top);
		}
		
		this._oActionSheet.openBy(this.getView().byId("actionButton"));
	},

	getEventBus : function () {
		return sap.ui.getCore().getEventBus();
	},

	getRouter : function () {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},
	
	onExit : function(oEvent){
	    var oEventBus = this.getEventBus();
    	oEventBus.unsubscribe("Master", "InitialLoadFinished", this.onMasterLoaded, this);
		oEventBus.unsubscribe("Component", "MetadataFailed", this.onMetadataFailed, this);
		if (this._oActionSheet) {
			this._oActionSheet.destroy();
			this._oActionSheet = null;
		}
	}
});
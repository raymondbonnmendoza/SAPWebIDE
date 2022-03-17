jQuery.sap.declare("com.sap.demotest.util.Controller");

sap.ui.core.mvc.Controller.extend("com.sap.demotest.util.Controller", {
	/**
	 * get the event bus of the applciation component
	 * @returns {Object} the event bus
	 */
	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	/**
	 * get the UIComponent router
	 * @param{Object} this either a view or controller
	 * @returns {Object} the event bus
	 */
	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	}
});
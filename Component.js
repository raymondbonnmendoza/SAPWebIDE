jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.Component");
jQuery.sap.require("nw.epm.refapps.ext.prod.manage.ApplicationController");

(function() {
	var mRoutenames = {
		MASTER: "Products",
		DETAIL: "ProductDetails",
		CATCHALL: "all"
	};

	var oApplicationController = null;

	sap.ui.core.UIComponent.extend("nw.epm.refapps.ext.prod.manage.Component", {
		metadata: {
			name: "Manage Products",
			version: "1.0",
			includes: ["css/manageProductStyle.css"],
			dependencies: {
				libs: ["sap.m", "sap.me", "sap.ushell"],
				components: []
			},

			config: {
				resourceBundle: "i18n/i18n.properties",
				titleResource: "xtit.shellTitle",
				icon: "sap-icon://Fiori7/F1373",
				favIcon: "icon/F0865_Manage_Products.ico",
				phone: "icon/launchicon/57_iPhone_Desktop_Launch.png",
				"phone@2": "icon/launchicon/114_iPhone-Retina_Web_Clip.png",
				tablet: "icon/launchicon/72_iPad_Desktop_Launch.png",
				"tablet@2": "icon/launchicon/144_iPad_Retina_Web_Clip.png",
				serviceConfig: {
					name: "EPM_REF_APPS_PROD_MAN",
					serviceUrl: "/sap/opu/odata/sap/EPM_REF_APPS_PROD_MAN_SRV/"
				}
			},

			routing: {
				config: {
					viewType: "XML",
					viewPath: "nw.epm.refapps.ext.prod.manage.view", // common prefix
					targetAggregation: "detailPages",
					clearTarget: false
				},
				routes: [{
					pattern: "",
					name: mRoutenames.MASTER,
					view: "S2_ProductMaster",
					targetAggregation: "masterPages",
					preservePageInSplitContainer: true,
					targetControl: "fioriContent",
					subroutes: [{
						pattern: "Product/{productID}",
						view: "S3_ProductDetail",
						name: mRoutenames.DETAIL // name used for listening or navigating to this route
					}]
				}, {
					"pattern": ":all*:",
					"name": mRoutenames.CATCHALL,
					"view": "EmptyPage",
					targetAggregation: "detailPages",
					preservePageInSplitContainer: true,
					targetControl: "fioriContent"
				}]
			}
		},

		exit: function() {
			oApplicationController.exit();
			oApplicationController = null;
		},

		init: function() {
			sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
			oApplicationController.init();
		},

		// Initialize the application
		createContent: function() {
			oApplicationController = new nw.epm.refapps.ext.prod.manage.ApplicationController(this, mRoutenames);
			return oApplicationController.createContent();
		},

		getProductApplicationController: function() {
			return oApplicationController;
		}
	});
}());

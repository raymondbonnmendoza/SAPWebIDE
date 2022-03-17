jQuery.sap.declare("nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension.Component");

// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "nw.epm.refapps.ext.po.apv",

	// Use the below URL to run the extended application when SAP-delivered application located in a local cloud environment:
	//url: jQuery.sap.getModulePath("nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension") + "/../nw.epm.refapps.ext.po.apv"	
	// Use the below url to run the extended application when SAP-delivered application located in a cloud environment:
	url: jQuery.sap.getModulePath("nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension") +
		"/../orion/file/s0004418509trial$S0004418509-OrionContent/nw.epm.refapps.ext.po.apv"

	// we use a URL relative to our own component
	// extension application is deployed with customer namespace
});

this.nw.epm.refapps.ext.po.apv.Component.extend("nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension.Component", {
  
 
init : function() {
            
       if (nw.epm.refapps.ext.po.apv.Component.prototype.init !== undefined) {
           nw.epm.refapps.ext.po.apv.Component.prototype.init.apply(this, arguments);
       }
        
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl : "./i18n/i18n.properties"
		});
		
		// set new i18n model
		this.setModel(i18nModel, "i18n");  
    }
,
	metadata: {
		version: "1.0",

		config: {},

		customizing: {
			"sap.ui.viewExtensions": {
				"nw.epm.refapps.ext.po.apv.view.S3_PurchaseOrderDetails": {
					"extensionAfterObjectHeader": {
						className: "sap.ui.core.Fragment",
						fragmentName: "nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension.view.S3_PurchaseOrderDetails_extensionAfterObjectHeaderCustom",
						type: "XML"
					},
					"extensionAfterForm": {
						className: "sap.ui.core.Fragment",
						fragmentName: "nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension.view.S3_PurchaseOrderDetails_extensionAfterFormCustom",
						type: "XML"
					}
				}
			},
			"sap.ui.viewModifications": {
				"nw.epm.refapps.ext.po.apv.view.S3_PurchaseOrderDetails": {
					"btnShare": {
						"visible": false
					}
				}
			},
			"sap.ui.viewReplacements": {
				"nw.epm.refapps.ext.po.apv.view.S2_PurchaseOrders": {
					viewName: "nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension.view.S2_PurchaseOrdersCustom",
					type: "XML"
				}
			},
			"sap.ui.controllerExtensions": {
				"nw.epm.refapps.ext.po.apv.view.S2_PurchaseOrders": {
					controllerName: "nw.epm.refapps.ext.po.apv.nw.epm.refapps.ext.po.apvExtension.view.S2_PurchaseOrdersCustom"
				}
			}
		}
	}
});
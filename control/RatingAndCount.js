jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.control.RatingAndCount");
sap.ui.core.Control.extend("nw.epm.refapps.ext.prod.manage.control.RatingAndCount", {

	// The rating indicator and the rating count are combined in one control in order to be able to put
	// them in one table column instead of having to let them occupy one column each.                                 

	// API:
	metadata: {
		properties: {
			"maxRatingValue": "int",
			"value": "float",
			"enabled": "boolean",
			"iconSize": "string",
			"ratingCount": "string",
			"verticalAlignContent": "boolean",
			"verticalAdjustment": "int"
		},
		events: {
			"press": {}
		},
		aggregations: {
			"_ratingCountLabel": {
				type: "sap.m.Label",
				multiple: false,
				visibility: "hidden"
			},
			"_ratingIndicator": {
				type: "sap.m.RatingIndicator",
				multiple: false,
				visibility: "hidden"
			}
		}
	},

	init: function() {
		// Make sure the CSS file is included for all themes
		if (sap.ui.getCore().getConfiguration().getTheme() !== "sap_bluecrystal") {
			// Get module patch for library / reuse component
			var sModulePath = jQuery.sap.getModulePath("nw.epm.refapps.lib.reuse");
			// Get RTL mode flag
			var bRTL = sap.ui.getCore().getConfiguration().getRTL();
			// Build library.css / libraryRTL.css URL
			var sUrl = bRTL ? sModulePath + "/themes/base/libraryRTL.css" : sModulePath + "/themes/base/library.css";
			// Include stylesheet in HEAD of document, using URL and ID
			jQuery.sap.includeStyleSheet(sUrl, "sap-ui-theme-" + "nw.epm.refapps.lib.reuse");
		}

		this._oRating = new sap.m.RatingIndicator(this.getId() + "-rating");
		this._oRating.setEnabled(false);
		this.setAggregation("_ratingIndicator", this._oRating, true);
		this._oRatingCountLabel = new sap.m.Label(this.getId() + "-ratingCountLabel");
		this._oRatingCountLabel.addStyleClass("noColonLabelInForm");
		this.setAggregation("_ratingCountLabel", this._oRatingCountLabel, true);
	},

	// Overwriting the setter method is done in order to hand down the values to the
	// inner control in this. The setter method is used by the binding to update the
	// controls value.
	setValue: function(sValue) {
		var fvalue = parseFloat(sValue);
		this._oRating.setValue(fvalue);
		return this.setProperty("value", fvalue, true);
	},

	// Overwriting the setter method is done in order to hand down the values to the
	// inner control in this. The setter method is used by the binding to update the
	// controls value.
	setMaxRatingValue: function(sMaxRatingValue) {
		this._oRating.setMaxValue(sMaxRatingValue);
		return this.setProperty("maxRatingValue", sMaxRatingValue, true);
	},

	// Overwriting the setter method is done in order to hand down the values to the
	// inner control in this. The setter method is used by the binding to update the
	// controls value.
	setIconSize: function(sIconSize) {
		this._oRating.setIconSize(sIconSize);
		return this.setProperty("iconSize", sIconSize, true);
	},

	// Overwriting the setter method is done in order to hand down the values to the
	// inner control. The setter method is used by the binding to update the
	// controls value.
	// Note that in this case potentially two controls may be affected.
	setRatingCount: function(sRatingCount) {
	    this._oRatingCountLabel.setVisible(sRatingCount !== null);   // supress display of string null
		this._oRatingCountLabel.setText("(" + sRatingCount + ")");
		return this.setProperty("ratingCount", sRatingCount, true);
	},

	renderer: function(oRm, oControl) {
		var oRatingCount =  oControl.getAggregation("_ratingCountLabel");
		if (oControl.getVerticalAdjustment() && oControl.getVerticalAdjustment() !== 0) {
			oRm.addStyle("-ms-transform", "translateY(" + oControl.getVerticalAdjustment() + "%)");
			oRm.addStyle("-webkit-transform", "translateY(" + oControl.getVerticalAdjustment() + "%)");
			oRm.addStyle("transform", "translateY(" + oControl.getVerticalAdjustment() + "%)");
		}
		if (oControl.getVerticalAlignContent()) {
			oRm.addStyle("line-height", oControl.getIconSize());
			oRatingCount.addStyleClass("nwEpmRefappsExtProdManageRatingAndCountVAlign");
		}

		oRm.write("<div");
		oRm.writeControlData(oControl); // write the Control ID and enable event
		// handling
		oRm.writeStyles();
		oRm.writeClasses();
		oRm.write(">");
		oRm.renderControl(oControl.getAggregation("_ratingIndicator"));
		oRm.renderControl(oRatingCount);
		oRm.write("</div>");
	}
});
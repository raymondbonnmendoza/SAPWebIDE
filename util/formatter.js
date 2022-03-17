jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.util.formatter");
jQuery.sap.require("sap.ca.ui.model.format.DateFormat");
jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");

nw.epm.refapps.ext.prod.manage.util.formatter = {

	dateAgoFormatter: sap.ca.ui.model.format.DateFormat.getDateInstance({
		style: "daysAgo"
	}),

	daysAgo: function(dDate) {
		if (!dDate) {
			return "";
		}
		return this.dateAgoFormatter.format(dDate);
	},

	amountFormatter: sap.ui.core.format.NumberFormat.getCurrencyInstance(),

	amountWithCurrency: function(iAmount, sCurrency) {
		if (!iAmount || !sCurrency) {
			return "";
		}
		var oBundle = this.getModel("i18n").getResourceBundle();
		var _iAmount = this.amountFormatter.format(iAmount);
		return oBundle.getText("xfld.amount", [_iAmount, sCurrency]);
	},

	amountWithOutCurrency: function(iAmount) {
		if (!iAmount) {
			return "";
		}
		return this.amountFormatter.format(iAmount);
	},

	items: function(iItems) {

		var oBundle = this.getModel("i18n").getResourceBundle();

		if (isNaN(iItems)) {
			return "";
		}

		if (iItems === 1) {
			return oBundle.getText("xfld.item");
		}

		return oBundle.getText("xfld.items", [iItems]);
	},

	formatAvailabilityText: function(iAvailability) {
		var oBundle = this.getModel("i18n").getResourceBundle();
		if (isNaN(iAvailability) || iAvailability < 1) {
			return oBundle.getText("xfld.outstock");
		}
		if (iAvailability < 10) {
			return oBundle.getText("xfld.restricted10", [iAvailability]);
		}
		return oBundle.getText("xfld.instock");
	},

	/**
	 * Formatter for Availability - Displays Text in red (error) or green (success)
	 *
	 * @param {integer}
	 *            iAvailability The number of products on stock
	 * @returns {state} sap.ui.core.ValueState A color representation of the
	 *          availability
	 * @public
	 */
	formatAvailabilityStatus: function(iAvailability) {
		return (isNaN(iAvailability) || Number(iAvailability) < 1) ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.Success;
	},

	/**
	 * Formatter for Measures - Returns concatenated string with Measure and Unit
	 *
	 * @param {float}
	 *            fMeasure A measure
	 * @param {string}
	 *            sUnit A unit
	 * @returns {string} A combined textual representation of measure and unit
	 * @public
	 */
	formatMeasure: function(fMeasure, sUnit) {
		jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");
		return (isNaN(fMeasure) || fMeasure === "" || fMeasure === null) ? "" : sap.ca.ui.model.format.QuantityFormat
			.FormatQuantityStandard(fMeasure, sUnit) + " " + sUnit;
	},

	_SERVICEURL: "/sap/opu/odata/sap/EPM_REF_APPS_PROD_MAN_SRV",

	// Forms the image URL for the image GUID specified.
	// sDraftId -- Product draft ID that the new image is uploaded to.
	// Returns the relative path of the image URL.
	formatImageURL: function(sId) {
		var sPath = "";
		if (sId && typeof sId === "string") {
			sPath = nw.epm.refapps.ext.prod.manage.util.formatter._SERVICEURL + "/ImageDrafts(guid'" + sId +
				"')/$value";
		}
		return sPath;
	},

	// Gets the image upload URL for the product draft specified.
	// sDraftId -- Product draft ID that the new image is uploaded to.
	// Returns the relative path of the image upload path for the product draft specified.
	getImageUploadURL: function(sDraftId) {
		var sUploadPath = "";
		if (sDraftId && typeof sDraftId === "string") {
			sUploadPath = nw.epm.refapps.ext.prod.manage.util.formatter._SERVICEURL + "/ProductDrafts('" + sDraftId +
				"')/Images";
		}
		return sUploadPath;
	},
	
	formatEditTitle: function(bIsNewObject){
	    if (bIsNewObject !== !!bIsNewObject){ // check whether bIsNewObject is boolean
	        return "";   // do not set a title when no data are available
	    }
        var oBundle = this.getModel("i18n").getResourceBundle();
        return oBundle.getText(bIsNewObject ? "xtit.productNew" : "xtit.productEdit");
	},
	
	appDataForTile: function(sName) {
    return {
        title : sName 
    };
	}

};
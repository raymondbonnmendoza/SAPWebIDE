jQuery.sap.declare("nw.epm.refapps.ext.po.apv.util.formatter");
jQuery.sap.require("sap.ca.ui.model.format.DateFormat");
jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");

nw.epm.refapps.ext.po.apv.util.formatter = {
	getBundle: function(oControl) {
		return oControl.getModel("i18n").getResourceBundle();
	},

	dateAgoFormatter: sap.ca.ui.model.format.DateFormat.getDateInstance({
		style: "daysAgo"
	}),

	daysAgo: function(dDate) {
		if (!dDate) {
			return "";
		}
		return nw.epm.refapps.ext.po.apv.util.formatter.dateAgoFormatter.format(dDate);
	},

	amountFormatter: sap.ui.core.format.NumberFormat.getCurrencyInstance(),

	amountWithCurrency: function(fAmount, sCurrency) {
		if (!fAmount || !sCurrency) {
			return "";
		}
		var oBundle = nw.epm.refapps.ext.po.apv.util.formatter.getBundle(this);
		var sAmount = nw.epm.refapps.ext.po.apv.util.formatter.amountFormatter.format(fAmount);
		return oBundle.getText("xfld.amount", [sAmount, sCurrency]);
	},

	amountWithOutCurrency: function(fAmount) {
		if (!fAmount) {
			return "";
		}
		return nw.epm.refapps.ext.po.apv.util.formatter.amountFormatter.format(fAmount);
	},

	items: function(iItems) {
		if (isNaN(iItems)) {
			return "";
		}
		var oBundle = nw.epm.refapps.ext.po.apv.util.formatter.getBundle(this);
		return (iItems === 1) ? oBundle.getText("xfld.item") : oBundle.getText("xfld.items", [iItems]);
	},

	deliveryDateFormatter: sap.ca.ui.model.format.DateFormat.getDateInstance({
		style: "medium"
	}),

	deliveryDate: function(dDate) {
		if (!dDate) {
			return "";
		}
		return nw.epm.refapps.ext.po.apv.util.formatter.deliveryDateFormatter.format(dDate);
	},

	orderedBy: function(sOrderedByName) {
		var oBundle = nw.epm.refapps.ext.po.apv.util.formatter.getBundle(this);
		return sOrderedByName ? oBundle.getText("xfld.orderedBy", [sOrderedByName]) : "";
	},

	deliveryDateAndLater: function(dDate, bLater) {
		if (!dDate) {
			return "";
		}
		var oBundle = nw.epm.refapps.ext.po.apv.util.formatter.getBundle(this);
		var sDelDate = nw.epm.refapps.ext.po.apv.util.formatter.deliveryDateFormatter.format(dDate);
		return bLater ? oBundle.getText("xfld.andLater", [sDelDate]) : sDelDate;
	},

	appDataForTile: function(sPOId) {
		var oBundle = nw.epm.refapps.ext.po.apv.util.formatter.getBundle(this);
		return {
			title: oBundle.getText("xtit.saveAsTileTitle", [sPOId])
		};
	}
};
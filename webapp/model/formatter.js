sap.ui.define([], function() {
	"use strict";

	return {
		delivery: function(sMeasure, iWeight) {
			var oResourceBundle = this.getView().getModel("i18n").getResourceBundle(),
				sResult = "";

			if(sMeasure === "G") {
				iWeight = iWeight / 1000;
			}
			if (iWeight < 0.5) {
				sResult = oResourceBundle.getText("formatterMailDelivery");
			} else if (iWeight < 5) {
				sResult = oResourceBundle.getText("formatterParcelDelivery");
			} else {
				sResult = oResourceBundle.getText("formatterCarrierDelivery");
			}

			return sResult;
		},
		
		formatMapUrl: function(sCity, sCountry, sNr, sStreet) {
			var sURL;
			sURL="https://maps.googleapis.com/maps/api/staticmap?center="
			    +sCity
			    +","
			    +sCountry
			    +"&markers=color:red|"
			    +sNr
			    +","
			    +sStreet
			    +"&zoom=14&size=640x640&key=AIzaSyCbUFdYued6UcIIxeqoYgdG9mHVyq3GWeY";
			return sURL;
		}
	};
});
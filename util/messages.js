jQuery.sap.declare("nw.epm.refapps.ext.prod.manage.util.messages");
jQuery.sap.require("sap.ca.ui.message.message");

nw.epm.refapps.ext.prod.manage.util.messages = {

	// Show an error dialog with information from the oData response object.
	// oParameter - The object containing error information
	showErrorMessage: function(oParameter, oView) {
		var oErrorDetails = nw.epm.refapps.ext.prod.manage.util.messages._parseError(oParameter);
		var oMsgBox = sap.ca.ui.message.showMessageBox({
			type: sap.ca.ui.message.Type.ERROR,
			message: oErrorDetails.sMessage,
			details: oErrorDetails.sDetails
		});
		oView.addDependent(oMsgBox);
		jQuery.sap.syncStyleClass("sapUiSizeCompact", oView, oMsgBox);

	},

	_parseError: function(oParameter) {
		var sMessage = "",
			sDetails = "",
			oParameters = null,
			oResponse = null,
			oError = {};

		// "getParameters": for the case of catching oDataModel "requestFailed" event
		oParameters = oParameter.getParameters ? oParameter.getParameters() : null;
		// "oParameters.response": V2 interface, response object is under the getParameters()
		// "oParameters": V1 interface, response is directly in the getParameters()
		// "oParameter" for the case of catching request "onError" event
		oResponse = oParameters ? (oParameters.response || oParameters) : oParameter;
		sMessage = oResponse.message || (oParameters && oParameters.message);
		sDetails = oResponse.responseText || oResponse.body || oResponse.response.body; //"onError" Event: V1 uses response and response.body

		if (jQuery.sap.startsWith(sDetails || "", "{\"error\":")) {
			var oErrModel = new sap.ui.model.json.JSONModel();
			oErrModel.setJSON(sDetails);
			sMessage = oErrModel.getProperty("/error/message/value");
		}

		oError.sDetails = sDetails;
		oError.sMessage = sMessage;
		return oError;
	}
};
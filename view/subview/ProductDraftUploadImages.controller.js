jQuery.sap.require("nw.epm.refapps.ext.prod.manage.util.formatter");
jQuery.sap.require("sap.m.MessageBox");

sap.ui.controller("nw.epm.refapps.ext.prod.manage.view.subview.ProductDraftUploadImages", {
    _oControlUploadImage : null,
    _oDataHelper : null,
    _oResourceBundle : null,
    _fnSetDraftDirty : null,

    onInit : function() {
        this._oControlUploadImage = this.byId("Upload_Images");
    },

    // new: This handler is called if the file mismatches the given file type
    onFileTypeMismatch : function(oEvent) {
        var ofileType = oEvent.getParameters().getParameter("fileType");
        sap.m.MessageBox.alert(this._oResourceBundle.getText("ymsg.fileTypeMismatch", ofileType));
    },

    // This handler is called after the upload request is completed
    onUploadCompleted : function(oEvent) {
        var oResponse = oEvent.getParameters();
        // Status code 201: image is created/uploaded
        if (oResponse.getParameter("status") === 201) {
            this._fnSetDraftDirty();
        } else {
            sap.m.MessageBox.alert(oResponse.getParameter("responseRaw"));
        }
        this._oControlUploadImage.getBinding("items").refresh();
    },

    // User chooses the Delete icon
    onImageDelete : function(oEvent) {
        var sImageId = oEvent.getParameters().documentId;
        var sPath = "/ImageDrafts(guid'" + sImageId + "')";
        this._oDataHelper.deleteImageDraft(sPath, jQuery.proxy(function() {
            this._fnSetDraftDirty();
            this._oControlUploadImage.getBinding("items").refresh();
        }, this));
    },

    // This Handler is called after the user selects the image to be uploaded and still before the image is sent
    // to the backend. For a successful file uploading, the security (XSRF) token needs to be provided for the Gateway,
    // currently it needs to set (or updated if the upload has been done once) manually by the application.
    // Note: the token is set usually automatically by the oDataModel for the native oData operations, such as CRUD and
    // function import operations.
    // More information can be found in:
    // https://wiki.wdf.sap.corp/wiki/display/fiorisec/Security+Background+for+Fiori+Development#SecurityBackgroundforFioriDevelopment-FileHandling
    onChange : function() {
        // new: Gets the latest token form the oDataModel
        this._getSecurityToken().done(jQuery.proxy(function() {
            var sCSRFToken = this.getView().getModel().getSecurityToken();

            var bFound = false, aHeaderParameters = this._oControlUploadImage.getHeaderParameters();
            // Finds the HTTP request header with "x-csrf-token", if found, updates the value to the latest one.
            if (aHeaderParameters) {
                for ( var i = 0; i < aHeaderParameters.length; i++) {
                    if (aHeaderParameters[i].getName() === "x-csrf-token") {
                        bFound = true;
                        aHeaderParameters[i].setValue(sCSRFToken);
                        break;
                    }
                }
            }
            // If the HTTP request header with "x-csrf-token" has not yet been set, the corresponding new header has to
            // be included.
            if (!bFound) {
                this._oControlUploadImage.addHeaderParameter(new sap.m.UploadCollectionParameter({
                    name : "x-csrf-token",
                    value : sCSRFToken
                }));
            }
        }, this));
    },

    // new: Sets the data provided by the parent controller
    setInitData : function(oSettings) {
        this._oDataHelper = oSettings.oDataHelper;
        this._fnSetDraftDirty = oSettings.fnDirty;
        this._oResourceBundle = oSettings.oResourceBundle;
    },

    // new: Gets the latest security token from the server and returns a promise object
    _getSecurityToken : function() {
        var oDeferred = new jQuery.Deferred();
        this.getView().getModel().refreshSecurityToken(oDeferred.resolve, function() {
            sap.m.MessageBox.alert(this._oResourceBundle.getText("ymsg.securityTokenNotRetrieved"));
        });
        return oDeferred.promise();
    }
});

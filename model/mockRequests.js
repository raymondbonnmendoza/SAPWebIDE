jQuery.sap.declare("webide.mock.ext.mockRequests");
// In mock mode, the mock server intercepts HTTP calls and provides fake output to the
// client without involving a backend system. But special backend logic, such as that 
// performed by function imports, is not automatically known to the mock server. To handle
// such cases, the app needs to define specific mock requests that simulate the backend 
// logic using standard HTTP requests (that are again interpreted by the mock server) as 
// shown below. 

// Please note:
// The usage of synchronous calls is only allowed in this context because the requests are
// handled by a latency-free client-side mock server. In production coding, asynchronous
// calls are mandatory.

// The mock requests object caontains three attributes. 
// method -     This is the http method (e.g. POST, PUT, DELETE,...) to which the mock request refers.
//              It is one of two criterions used by the mock server to decide if a request is handled
//              by a certain mock request object.
// path -       This is a regular expression that is matched against the url of the current request. 
//              It is the second criterion used by the mock server to decide if a request is handled
//              by a certain mock request object. Please note that using the (.*) for the url parameter
//              section in the pattern causes the mock server to extract the url parameters from the
//              URL and provide them as separate import parameters to the handler function.
// response -   This is the handler function that is called when a http request matches the "method" 
//              and "path" attributes of the mock request. A XML http request object (oXhr) for the
//              matched request is provided as an import parameter and optionally there can be import 
//              parameters for url parameters
//              Please note that handler function needs to create the same response object as the 
//              life service would.

webide.mock.ext.mockRequests = {
	_srvUrl: "/sap/opu/odata/sap/EPM_REF_APPS_PROD_MAN_SRV/", //service url
	_iLastId: 0,
	_bError: false, //true if a jQuery.sap.sjax request failed
	_sErrorTxt: "", //error text for the oXhr error response

	getRequests: function() {
		// This method is called by the webIDE if the app is started in mock mode with the 
		// option "AddCusom Mock Requests". It returns the list of app specific mock requests.
		// The list is added to the mock server's own list of requests
		return [
            this._mockActivateProduct(),
            this._mockEditProduct(),
            this._mockCopyProduct()];
	},

	_mockEditProduct: function() {
		return {
			// This mock request simulates the function import "EditProduct", which is triggered when the user chooses the
			// "Edit" button.
			method: "POST",
			path: new RegExp("EditProduct\\?ProductId=(.*)"),
			response: jQuery.proxy(function(oXhr, sUrlParams) {
				/* eslint-disable */
				alert("Limitation: The upload control is not supported in demo mode with mock data.");
				/* eslint-enable */
				this._createDraft(oXhr,
					this._getProdIdFromUrlParam(
						sUrlParams), false);
			}, this)
		};
	},

	_mockCopyProduct: function() {
		return {
			// This mock request simulates the function import "CopyProduct", which is triggered when the user chooses the
			// "Copy" button.
			method: "POST",
			path: new RegExp("CopyProduct\\?ProductId=(.*)"),
			response: jQuery.proxy(function(oXhr, sUrlParams) {
				/* eslint-disable */
				alert("Limitation: The upload control is not supported in demo mode with mock data.");
				/* eslint-enable */
				this._createDraft(oXhr, this._getProdIdFromUrlParam(
					sUrlParams), true);
			}, this)
		};
	},

	_mockActivateProduct: function() {
		return {
			// This mock request simulates the function import "ActivateProduct", which is triggered when the user chooses
			// the "Save" button.
			// Here the draft's data is used to update an existing product (if the draft was created by editing a product) 
			// or the draft is used to created a new product (if the draft was created by copying a product) 
			method: "POST",
			path: new RegExp("ActivateProduct\\?ProductDraftId=(.*)"),
			response: jQuery.proxy(function(oXhr, sUrlParams) {
					var sDraftId = this._getProdIdFromUrlParam(sUrlParams),
						oProduct = {},
						oResponseGetProdDraft = {},
						oResponseGetProduct = {},
						bIsNewProduct = false,
						sRequestType = "";

					//get the draft
					oResponseGetProdDraft = this._sjax({
						url: "ProductDrafts('" + sDraftId + "')",
						errorText: "Error while reading product draft" + sDraftId
					});

					if (!this._bError) {
						bIsNewProduct = oResponseGetProdDraft.data.d.IsNewProduct;
						if (bIsNewProduct || bIsNewProduct === undefined) {
							sRequestType = "POST";
						} else {
							sRequestType = "PATCH";
						}
						// create/update the product
						oProduct = this._buildProductFromDraft(oResponseGetProdDraft.data.d);
					}

					if (!this._bError) {
						this._sjax({
							url: "Products('" + oProduct.Id + "')",
							type: sRequestType,
							data: oProduct,
							errorText: "Error while updating product " + oProduct.Id
						});
					}

					//get the changed/created product in order to get the correct metadata for the response data
					//object.
					oResponseGetProduct = this._sjax({
						url: "Products('" + oProduct.Id + "')",
						errorText: "Error while reading product" + sDraftId
					});

					if (this._bError) {
						oXhr.respond(400, null, this._sErrorTxt);
					} else {
						oXhr.respondJSON(200, {}, JSON.stringify({
							d: oResponseGetProduct.data.d
						}));
					}
				},
				this)
		};
	},

	_buildProductFromDraft: function(oDraft) {
		// create a product object based on a draft
		var
			oProduct = {},
			oResponseGetMainCategory = {},
			bIsNewProduct = false;

		if (!this._bError) {
			oProduct = oDraft;
			//store the information if it is a new product for later 
			bIsNewProduct = oDraft.IsNewProduct;
			// bIsNewProduct is 'undefined' if the draft was created with the "+" button of the master list
			if (bIsNewProduct === undefined) {
				bIsNewProduct = true;
			}
			delete oProduct.__metadata;
			//remove the draft specific fields from the product
			delete oProduct.SubCategory;
			delete oProduct.Images;
			delete oProduct.IsNewProduct;
			delete oProduct.ExpiresAt;
			delete oProduct.ProductId;
			delete oProduct.IsDirty;

			//delete draft - it is not needed anymore when the product is created/updated
			this._sjax({
				url: "ProductDrafts('" + oDraft.Id + "')",
				type: "DELETE",
				errorText: "Error: Product draft could not be removed from mock data"
			});
		}
		// if a new product is created using the "Add" button on the S2 screen then the category names are not yeet known
		if (!oProduct.SubCategoryName) {
			var oResponseGetSubCategory = this._sjax({
				url: "SubCategories('" + oProduct.SubCategoryId + "')",
				errorText: "Error while reading sub category " + oProduct.SubCategoryId
			});
			if (!this._bError) {
				oProduct.SubCategoryName = oResponseGetSubCategory.data.d.Name;
			}
		}
		if (!oProduct.MainCategoryName & !this._bError) {
			oResponseGetMainCategory = this._sjax({
				url: "MainCategories('" + oProduct.MainCategoryId + "')",
				errorText: "Error while reading main category " + oProduct.MainCategoryId
			});
			if (!this._bError) {
				oProduct.MainCategoryName = oResponseGetMainCategory.data.d.Name;
			}
		}
		if (bIsNewProduct) {
			oProduct.RatingCount = 0;
			oProduct.AverageRating = 0;
			oProduct.StockQuantity = 0;
			if (!oProduct.ImageUrl) {
				oProduct.ImageUrl = "";
			}
		}
		return oProduct;
	},

	_checkForError: function(bSuccess, sErrorTxt) {
		// Setter for the global error flag and error text.
		// bsuccess contains the success flag of the jQuery.sap.sjax request.
		// sErrorTxt contains the text for the specific problem
		// Possible reasons for a jQuery.sap.sjax request are:
		// - incorrect mock data 
		// - incorrect binding in the application (e.g. binding t0 a deleted element)
		// - a problem in the mock server
		if (!bSuccess) {
			this._bError = true;
			this._sErrorTxt = sErrorTxt;
			jQuery.sap.log.error(sErrorTxt);
		}
	},

	_getProdIdFromUrlParam: function(sUrlParams) {
		// Extracts product ID from the URL parameters
		var sParams = decodeURIComponent(sUrlParams);
		return sParams.substring(1, sParams.length - 1);
	},

	_getNewId: function() {
		this._iLastId++;
		return this._iLastId;
	},

	_createDraft: function(oXhr, sProductId, bNewProduct) {
		var oResponseGetProduct = null,
			oResponseGetDraft = null,
			oDraft = {};

		// Gets product details - the data is used to pre-fill the draft fields
		oResponseGetProduct = this._sjax({
			url: "Products('" + sProductId + "')",
			errorText: "Error while reading product" + sProductId
		});

		if (!this._bError) {
			// Writes the product data to the draft
			// Most of the values for the draft can be copied from the product
			jQuery.extend(oDraft, oResponseGetProduct.data.d);
			// Delete the product's properties that are not contained in the draft
			delete oDraft.HasReviewOfCurrentUser;
			delete oDraft.RatingCount;
			delete oDraft.IsFavoriteOfCurrentUser;
			delete oDraft.StockQuantity;
			delete oDraft.AverageRating;
			delete oDraft.__metadata;

			// oDraft.CreatedAt = new Date();
			oDraft.CreatedBy = "Test User";
			// oDraft.ExpiresAt = new Date(oDraft.CreatedAt.getTime() + 1800000);
			oDraft.IsNewProduct = bNewProduct;
			oDraft.IsDirty = false;
			if (bNewProduct) {
				// A new product is created as a copy of an existing one
				oDraft.Id = "EPM-" + this._getNewId();
				oDraft.ProductId = oDraft.Id;
			} else {
				// A product is edited
				oDraft.Id = sProductId;
				oDraft.ProductId = sProductId;
			}

			// Creates draft
			this._sjax({
				url: "ProductDrafts('" + oDraft.Id + "')",
				type: "POST",
				data: oDraft,
				errorText: "Error while creating draft"
			});
		}

		// Creates image for the draft
		if (!this._bError) {
			var sId = "aaaaaaaa-bbbb-cccc-dddd-" + this._getNewId();
			this._sjax({
				url: "ImageDrafts(guid'" + sId + "')",
				type: "POST",
				data: {
					// CreatedAt: oDraft.CreatedAt,
					CreatedBy: oDraft.CreatedBy,
					// Id: "aaaaaaaa-bbbb-cccc-dddd-" + this._getNewId(),
					MimeType: "image/jpeg",
					ProductId: oDraft.ProductId
				},
				errorText: "Error while adding image to draft"
			});
		}

		//read the just created draft again in order to get the correct draft structure (including metadata) for the response.
		if (!this._bError) {
			oResponseGetDraft = this._sjax({
				url: "ProductDrafts('" + oDraft.Id + "')",
				errorText: "Error while reading newly created draft " + oDraft.Id
			});
		}
		if (this._bError) {
			oXhr.respond(400, null, this._sErrorTxt);
		} else {
			oXhr.respondJSON(200, {}, JSON.stringify({
				d: oResponseGetDraft.data.d
			}));
		}
	},

	_resetErrorIndicator: function() {
		this._bError = false; //true if a this._sjax request failed
		this._sErrorTxt = ""; //error text for the oXhr error response
	},
	_sjax: function(oParam) {
		// Wrapper for synchrounous aja calls. 
		// The ajax call is only done if the global error indicator is not set.
		// The following paramters of the import object oParam are evaluated:
		//  url - the service url relative to the base url given in _srvUrl
		//  type (optional) -  the http request type - default is "GET"
		//  data (optional) - the data object that is transfered in changing requests (PT, POST, etc)
		//  errorText (optional) - this txt is written to the console in case of an error
		// Returns the respose object oof the ajax call or null if the global error indicator is true
		var sType = "",
			sUrl = "",
			oResponse = null;
		if (!this._bError) {
			sType = (!oParam.type) ? "GET" : oParam.type;
			sUrl = this._srvUrl + oParam.url;
			if (!oParam.data) {
				oResponse = jQuery.sap.sjax({
					url: sUrl,
					type: sType
				});
			} else {
				oResponse = jQuery.sap.sjax({
					url: sUrl,
					type: sType,
					data: JSON.stringify(oParam.data)
				});
			}
			this._checkForError(oResponse.success, oParam.errorText);
		}
		return oResponse;
	}

};
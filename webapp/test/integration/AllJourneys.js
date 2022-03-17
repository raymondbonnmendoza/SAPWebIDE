jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 SalesOrderSet in the list
// * All 3 SalesOrderSet have at least one ToLineItems

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/so/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/so/test/integration/pages/App",
	"com/so/test/integration/pages/Browser",
	"com/so/test/integration/pages/Master",
	"com/so/test/integration/pages/Detail",
	"com/so/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.so.view."
	});

	sap.ui.require([
		"com/so/test/integration/MasterJourney",
		"com/so/test/integration/NavigationJourney",
		"com/so/test/integration/NotFoundJourney",
		"com/so/test/integration/BusyJourney",
		"com/so/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});
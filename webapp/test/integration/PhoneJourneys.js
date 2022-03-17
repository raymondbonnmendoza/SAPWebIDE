jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"com/so/test/integration/NavigationJourneyPhone",
		"com/so/test/integration/NotFoundJourneyPhone",
		"com/so/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});


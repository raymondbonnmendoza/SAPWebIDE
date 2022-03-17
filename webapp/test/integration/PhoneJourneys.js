jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/sap/interview_summary/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/sap/interview_summary/test/integration/pages/App",
	"com/sap/interview_summary/test/integration/pages/Browser",
	"com/sap/interview_summary/test/integration/pages/Master",
	"com/sap/interview_summary/test/integration/pages/Detail",
	"com/sap/interview_summary/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.sap.interview_summary.view."
	});

	sap.ui.require([
		"com/sap/interview_summary/test/integration/NavigationJourneyPhone",
		"com/sap/interview_summary/test/integration/NotFoundJourneyPhone",
		"com/sap/interview_summary/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});


jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 CandidateSet in the list
// * All 3 CandidateSet have at least one AttachmentSet

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
		"com/sap/interview_summary/test/integration/MasterJourney",
		"com/sap/interview_summary/test/integration/NavigationJourney",
		"com/sap/interview_summary/test/integration/NotFoundJourney",
		"com/sap/interview_summary/test/integration/BusyJourney",
		"com/sap/interview_summary/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});
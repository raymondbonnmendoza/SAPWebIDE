/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"com/test/CloudConnector/CloudConnectorTest/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});
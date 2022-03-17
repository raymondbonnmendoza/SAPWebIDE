sap.ui.define([
		"com/sap/interview_summary/model/GroupSortState",
		"sap/ui/model/json/JSONModel",
		"sap/ui/thirdparty/sinon",
		"sap/ui/thirdparty/sinon-qunit"
	], function (GroupSortState, JSONModel) {
	"use strict";

	QUnit.module("GroupSortState - grouping and sorting", {
		beforeEach: function () {
			this.oModel = new JSONModel({});
			// System under test
			this.oGroupSortState = new GroupSortState(this.oModel, function() {});
		}
	});

	QUnit.test("Should always return a sorter when sorting", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.sort("TotalPoints").length, 1, "The sorting by TotalPoints returned a sorter");
		assert.strictEqual(this.oGroupSortState.sort("CandidateName").length, 1, "The sorting by CandidateName returned a sorter");
	});

	QUnit.test("Should return a grouper when grouping", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.group("TotalPoints").length, 1, "The group by TotalPoints returned a sorter");
		assert.strictEqual(this.oGroupSortState.group("None").length, 0, "The sorting by None returned no sorter");
	});


	QUnit.test("Should set the sorting to TotalPoints if the user groupes by TotalPoints", function (assert) {
		// Act + Assert
		this.oGroupSortState.group("TotalPoints");
		assert.strictEqual(this.oModel.getProperty("/sortBy"), "TotalPoints", "The sorting is the same as the grouping");
	});

	QUnit.test("Should set the grouping to None if the user sorts by CandidateName and there was a grouping before", function (assert) {
		// Arrange
		this.oModel.setProperty("/groupBy", "TotalPoints");

		this.oGroupSortState.sort("CandidateName");

		// Assert
		assert.strictEqual(this.oModel.getProperty("/groupBy"), "None", "The grouping got reset");
	});
});
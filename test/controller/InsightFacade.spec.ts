import {
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";

use(chaiAsPromised);
//
// describe("InsightFacade", function () {
// 	let facade: IInsightFacade;
//
// 	// Declare datasets used in tests. You should add more datasets like this!
// 	let sections: string;
//
// 	before(function () {
// 		// This block runs once and loads the datasets.
// 		sections = getContentFromArchives("pair.zip");
//
// 		// Just in case there is anything hanging around from a previous run of the test suite
// 		clearDisk();
// 	});
//
// 	describe("Add/Remove/List Dataset", function () {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
// 		});
//
// 		beforeEach(function () {
// 			// This section resets the insightFacade instance
// 			// This runs before each test
// 			console.info(`BeforeTest: ${this.currentTest?.title}`);
// 			facade = new InsightFacade();
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 		});
//
// 		afterEach(function () {
// 			// This section resets the data directory (removing any cached data)
// 			// This runs after each test, which should make each test independent of the previous one
// 			console.info(`AfterTest: ${this.currentTest?.title}`);
// 			clearDisk();
// 		});
//
// 		// This is a unit test. You should create more like this!
// 		it ("should reject with  an empty dataset id", function() {
// 			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
// 			return expect(result).to.eventually.be.rejectedWith(InsightError);
// 		});
// 	});
//
// 	/*
// 	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
// 	 * You should not need to modify it; instead, add additional files to the queries directory.
// 	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
// 	 */
// 	describe("PerformQuery", () => {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
//
// 			facade = new InsightFacade();
//
// 			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
// 			// Will *fail* if there is a problem reading ANY dataset.
// 			const loadDatasetPromises = [
// 				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
// 			];
//
// 			return Promise.all(loadDatasetPromises);
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 			clearDisk();
// 		});
//
// 		type PQErrorKind = "ResultTooLargeError" | "InsightError";
//
// 		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 			"Dynamic InsightFacade PerformQuery tests",
// 			(input) => facade.performQuery(input),
// 			"./test/resources/queries",
// 			{
// 				assertOnResult: (actual, expected) => {
// 					// TODO add an assertion!
// 				},
// 				errorValidator: (error): error is PQErrorKind =>
// 					error === "ResultTooLargeError" || error === "InsightError",
// 				assertOnError: (actual, expected) => {
// 					// TODO add an assertion!
// 				},
// 			}
// 		);
// 	});
// });

// import {
// 	InsightDataset,
// 	InsightDatasetKind,
// 	InsightError,
// 	InsightResult,
// 	NotFoundError,
// 	ResultTooLargeError
// } from "../../src/controller/IInsightFacade";
// import InsightFacade from "../../src/controller/InsightFacade";
// import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
// import {folderTest} from "@ubccpsc310/folder-test";

// const chai = require("chai");
// const chaiAsPromised = require("chai-as-promised");

// chai.use(chaiAsPromised);

type Input = unknown;
type Output = InsightResult[];
type Error = "InsightError" | "ResultTooLargeError";


// Then either:
// const expect = chai.expect;

describe("InsightFacade",function() {

	let pairSections: string;
	let oneCourseSections: string;
	let twoCourseSections: string;
	let emptyCourseSections: string;
	let wrongFolderNameSections: string;
	let invalidJSONSections: string;
	let invalidCourseSections: string;
	let invalidSections: string;
	let wrongFieldSections: string;
	let campusRooms: string;
	let originalCampusRooms: string;
	let onlyIndexRooms: string;
	let oneBuildingNoRoom: string;
	let sixZeroThreeRooms: string;
	let noIndex: string;
	let emptyTbody: string;
	let buildingInADiffFolder: string;
	let anguDiffFolder: string;
	let indexDiffFolder: string;
	let allInSameFolder: string;
	let facade: InsightFacade;

	before(function() {
		pairSections = getContentFromArchives("pair.zip");
		oneCourseSections = getContentFromArchives("oneCourse.zip");
		twoCourseSections = getContentFromArchives("twoCourses.zip");
		wrongFolderNameSections = getContentFromArchives("departments.zip");
		invalidJSONSections = getContentFromArchives("invalidJSONFile.zip");
		invalidCourseSections = getContentFromArchives("invalidCourses.zip");
		emptyCourseSections = getContentFromArchives("emptyCourse.zip");
		invalidSections = getContentFromArchives("invalidSections.zip");
		wrongFieldSections = getContentFromArchives("wrongSectionFields.zip");
		campusRooms = getContentFromArchives("campus.zip");
		originalCampusRooms = getContentFromArchives("originalCampus.zip");
		onlyIndexRooms = getContentFromArchives("onlyIndex.zip");
		oneBuildingNoRoom = getContentFromArchives("oneBuildingNoRoom.zip");
		sixZeroThreeRooms = getContentFromArchives("SixZeroThreeRooms.zip");
		noIndex = getContentFromArchives("noIndex.zip");
		emptyTbody = getContentFromArchives("emptyTbody.zip");
		buildingInADiffFolder = getContentFromArchives("buildingInADiffFolder.zip");
		anguDiffFolder = getContentFromArchives("AnguDiffFolder.zip");
		indexDiffFolder = getContentFromArchives("indexDiffFolder.zip");
		allInSameFolder = getContentFromArchives("AllInSameFolder.zip");
	});

	describe("addRooms", function() {

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});
		it ("add R - accept a valid id with campus dataset", function() {
			const id: string = "campus";
			const result: Promise<string[]> = facade.addDataset(id, campusRooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.deep.equal([id]);
		});
		it ("add R - accept a valid id with original campus dataset", function() {
			const id: string = "campus1";
			const result: Promise<string[]> = facade.addDataset(id, originalCampusRooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.deep.equal([id]);
		});
		it ("add R - reject a valid id with some room dataset", function() {
			const id: string = "someRooms";
			const result: Promise<string[]> = facade.addDataset(id, sixZeroThreeRooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject ANGU in a different folder but correct link", function() {
			const id: string = "angu";
			const result: Promise<string[]> = facade.addDataset(id, anguDiffFolder, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject all files in one folder", function() {
			const id: string = "oneFolder";
			const result: Promise<string[]> = facade.addDataset(id, allInSameFolder, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject index in a different folder", function() {
			const id: string = "indexFolder";
			const result: Promise<string[]> = facade.addDataset(id, indexDiffFolder, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject only index file", function() {
			const id: string = "onlyIndex";
			const result: Promise<string[]> = facade.addDataset(id, onlyIndexRooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject no index file", function() {
			const id: string = "noIndex";
			const result: Promise<string[]> = facade.addDataset(id, noIndex, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject empty tbody index file", function() {
			const id: string = "emptyTbody";
			const result: Promise<string[]> = facade.addDataset(id, emptyTbody, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject building not linked", function() {
			const id: string = "diffFolder";
			const result: Promise<string[]> = facade.addDataset(id, buildingInADiffFolder, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it ("add R - reject one building but no room file", function() {
			const id: string = "BuildingNoRoom";
			const result: Promise<string[]> = facade.addDataset(id, oneBuildingNoRoom, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("removeRoomDataset", function() {

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("remove R - reject with an non-existent id", function () {
			const addRoomsID: string = "APBI416";
			return facade
				.addDataset(addRoomsID, campusRooms, InsightDatasetKind.Rooms)
				.then(function (res: any) {
					expect(res).to.deep.equal([addRoomsID]);
					const result: Promise<string> = facade.removeDataset("chwenotchew");
					return expect(result).to.eventually.be.rejectedWith(NotFoundError);
				});
		});
	});

	describe("listRoomsDatasets", function() {

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("list R - accept to list one dataset", function () {
			const id: string = "someRooms";
			const insightDatasetList: InsightDataset[] = [
				{id: id, kind: InsightDatasetKind.Rooms, numRows: 364},
			];
			return facade.addDataset(id, campusRooms, InsightDatasetKind.Rooms)
				.then((res: any) => {
					expect(res).to.deep.equal([id]);
					const result: Promise<InsightDataset[]> = facade.listDatasets();
					return expect(result).to.eventually.deep.equal(insightDatasetList);
				})
				.catch((err: any) => {
					return expect.fail("should not reject");
				});
		});
	});

	describe("addDataset", function() {

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it ("handling crash", function() {
			const id: string = "sections";
			facade.addDataset(id, pairSections, InsightDatasetKind.Sections);
			let newFacade = new InsightFacade();
			let query = {WHERE:{AND:[{LT:{sections_avg:60}},{IS:{sections_dept:"lfs"}},{EQ:{sections_year:2009}}]}
				,OPTIONS:{COLUMNS:["sections_dept","sections_year","sections_avg"],ORDER:"sections_avg"}};
			let expected = [{sections_dept:"lfs",sections_year:2009,sections_avg:0}];
			return newFacade
				.performQuery(query)
				.then((result: any) => {
					return expect(result).to.have.deep.members(expected);
				})
				.catch((err: any) => {
					return expect.fail("should not reject");
				});
		});

		it ("add - reject with an empty dataset id", function() {
			const result: Promise<string[]> = facade.addDataset("", pairSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("add - reject with an invalid whitespace-only dataset id", function() {
			const result: Promise<string[]> = facade.addDataset("    ", pairSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});


		it ("add - reject with an underscored dataset id", function() {
			const result: Promise<string[]> = facade.addDataset("ds_001", pairSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("add - reject with an empty dataset", function() {
			const result: Promise<string[]> =
				facade.addDataset("emptyCourse", emptyCourseSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("add - reject a dataset with a wrong folder name", function () {
			const result: Promise<string[]> =
				facade.addDataset("folderNameNotCourse", wrongFolderNameSections, InsightDatasetKind.Sections,);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("add - reject a dataset with an invalid JSON file", function () {
			const result: Promise<string[]> =
				facade.addDataset("invalidJSONFile", wrongFolderNameSections, InsightDatasetKind.Sections,);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("add - reject invalid course files", function () {
			const result: Promise<string[]> =
				facade.addDataset("allInvalidFiles", invalidCourseSections,InsightDatasetKind.Sections,);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("add - reject with an invalid section dataset", function() {
			const result: Promise<string[]> =
				facade.addDataset("invalidSections", invalidSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("add - reject with an wrong field section dataset", function() {
			const result: Promise<string[]> =
				facade.addDataset("wrongSectionField", wrongFieldSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("add - reject a duplicated id", function () {
			const addCourseID: string = "APBI416";
			return facade
				.addDataset(addCourseID, oneCourseSections, InsightDatasetKind.Sections)
				.then(function (res: any) {
					expect(res).to.deep.equal([addCourseID]);
					const result: Promise<string[]> =
						facade.addDataset(addCourseID, oneCourseSections, InsightDatasetKind.Sections);
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});
		});


		it ("add - accept a valid dataset id", function() {
			const id: string = "ds001";
			const result: Promise<string[]> = facade.addDataset(id, pairSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.deep.equal([id]);
		});

		it ("add - accept a valid id with one course dataset", function() {
			const id: string = "oneCourse";
			const result: Promise<string[]> = facade.addDataset(id, oneCourseSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.deep.equal([id]);
		});

		it ("add - accept a valid dataset id with whitespace", function() {
			const id: string = "ds  001";
			const result: Promise<string[]> = facade.addDataset(id, pairSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.deep.equal([id]);
		});

		it ("add - accept a valid id with whitespace one course dataset", function() {
			const id: string = "one course";
			const result: Promise<string[]> = facade.addDataset(id, oneCourseSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.deep.equal([id]);
		});

		it("add - accept same ids with difference cases", function () {
			const lowerCaseCourse: string = "case sensitive";
			const biggerCaseCourse: string = "Case Sensitive";
			return facade
				.addDataset(lowerCaseCourse, twoCourseSections, InsightDatasetKind.Sections)
				.then((res: any) => {
					expect(res).to.deep.equal([lowerCaseCourse]);
					const result: Promise<string[]> =
						facade.addDataset(biggerCaseCourse, twoCourseSections, InsightDatasetKind.Sections,);
					return expect(result).to.eventually.deep.equal([lowerCaseCourse, biggerCaseCourse]);
				});
		});

	});

	describe("removeDataset", function() {

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("remove - reject with an non-existent id", function () {
			const addCourseID: string = "APBI416";
			return facade
				.addDataset(addCourseID, oneCourseSections, InsightDatasetKind.Sections)
				.then(function (res: any) {
					expect(res).to.deep.equal([addCourseID]);
					const result: Promise<string> = facade.removeDataset("chwenotchew");
					return expect(result).to.eventually.be.rejectedWith(NotFoundError);
				});
		});

		it("remove - reject with an empty dataset id", function () {
			const addCourseID: string = "APBI416";
			return facade
				.addDataset(addCourseID, oneCourseSections, InsightDatasetKind.Sections)
				.then((res: any) => {
					expect(res).to.deep.equal([addCourseID]);
					const result: Promise<string> = facade.removeDataset("");
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});
		});

		it("remove - reject with an invalid whitespace-only id", function () {
			const addCourseID: string = "APBI416";
			return facade
				.addDataset(addCourseID, oneCourseSections, InsightDatasetKind.Sections)
				.then((res: any) => {
					expect(res).to.deep.equal([addCourseID]);
					const result: Promise<string> = facade.removeDataset("   ");
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});
		});

		it("remove - reject with an invalid underscored id", function () {
			const addCourseID: string = "APBI416";
			return facade
				.addDataset(addCourseID, oneCourseSections, InsightDatasetKind.Sections)
				.then((res: any) => {
					expect(res).to.deep.equal([addCourseID]);
					const result: Promise<string> = facade.removeDataset("ds_001");
					return expect(result).to.eventually.be.rejectedWith(InsightError);
				});
		});

		it("remove - remove a valid id one course dataset", function () {
			const id: string = "APBI416";
			return facade
				.addDataset(id, oneCourseSections, InsightDatasetKind.Sections)
				.then((res: any) => {
					expect(res).to.deep.equal([id]);
					const result: Promise<string> = facade.removeDataset(id);
					return expect(result).to.eventually.deep.equal(id);
				})
				.catch((err: any) => {
					return expect.fail("should not reject");
				});
		});
	});

	describe("listDatasets", function() {

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("list - empty if no data in datasets", function () {
			return facade
				.listDatasets()
				.then((result: any) => {
					return expect(result).to.has.lengthOf(0);
				})
				.catch((err: any) => {
					return expect.fail("should not reject");
				});
		});

		it("list - accept to list one dataset", function () {
			const id: string = "oneCourse";
			const insightDatasetList: InsightDataset[] = [
				{id: "oneCourse", kind: InsightDatasetKind.Sections, numRows: 2},
			];
			return facade.addDataset(id, oneCourseSections, InsightDatasetKind.Sections)
				.then((res: any) => {
					expect(res).to.deep.equal([id]);
					const result: Promise<InsightDataset[]> = facade.listDatasets();
					return expect(result).to.eventually.deep.equal(insightDatasetList);
				})
				.catch((err: any) => {
					return expect.fail("should not reject");
				});
		});

		it("list - accept to list two datasets", function () {
			const firstCourse: string = "oneCourse";
			const secondCourse: string = "twoCourse";
			const datasetList: InsightDataset[] = [
				{id: firstCourse, kind: InsightDatasetKind.Sections, numRows: 2},
				{id: secondCourse, kind: InsightDatasetKind.Sections, numRows: 64612}
			];
			return facade.addDataset(firstCourse, oneCourseSections, InsightDatasetKind.Sections)
				.then((firstRes: any) => {
					expect(firstRes).to.deep.equal([firstCourse]);
					return facade.addDataset(secondCourse, pairSections, InsightDatasetKind.Sections)
						.then((secondRes: any) => {
							expect(secondRes).to.deep.equal([firstCourse, secondCourse]);
							const result: Promise<InsightDataset[]> = facade.listDatasets();
							return expect(result).to.eventually.deep.equal(datasetList);
						})
						.catch((err: any) => {
							return expect.fail("should not reject");
						});
				})
				.catch((err: any) => {
					return expect.fail("should not reject");
				});
		});

	});

	describe("performQuery", function() {

		before(async function() {
			clearDisk();
			facade = new InsightFacade();
			let promise1 = facade.addDataset("sections", pairSections, InsightDatasetKind.Sections);
			// let promise2 = facade.addDataset("rooms", campusRooms, InsightDatasetKind.Rooms);
			let result = await promise1;
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				// this should be unreachable
				expect.fail("UNEXPECTED ERROR");
			}
		}

		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.members(expected);
			// if (actual instanceof Array) {
			// 	expected.then((value) => expect(actual.length).to.equal(value.length));
			// }
		}

		function target(input: Input): Promise<Output> {
			return facade.performQuery(input);
		}

		folderTest<Input, Output, Error>(
			"Perform Query Dynamic",
			target,
			"./test/resources/queries",
			{
				errorValidator,
				assertOnError,
				assertOnResult
			}
		);
	});

	describe("performQueryBoth", function() {
		let promises = [];

		before(async function() {
			clearDisk();
			facade = new InsightFacade();
			let promise1 = await facade.addDataset("sections", pairSections, InsightDatasetKind.Sections);
			let promise2 = await facade.addDataset("rooms", campusRooms, InsightDatasetKind.Rooms);
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				// this should be unreachable
				expect.fail("UNEXPECTED ERROR");
			}
		}

		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.members(expected);
			// if (actual instanceof Array) {
			// 	expected.then((value) => expect(actual.length).to.equal(value.length));
			// }
		}

		function target(input: Input): Promise<Output> {
			return facade.performQuery(input);
		}

		folderTest<Input, Output, Error>(
			"Perform Query Dynamic",
			target,
			"./test/resources/queries",
			{
				errorValidator,
				assertOnError,
				assertOnResult
			}
		);
	});


});

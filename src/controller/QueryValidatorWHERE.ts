import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export default class QueryValidatorWHERE {
	private readonly userQuery: any;
	private readonly datasetID: string;
	private readonly datasetKind: InsightDatasetKind;
	private static sectionsMField = ["avg", "pass", "fail", "audit", "year"];
	private static sectionsSField = ["dept", "id", "instructor", "title", "uuid"];
	private static roomsMField = ["lat", "lon", "seats"];
	private static roomsSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];

	constructor(userQuery: any, datasetID: string, datasetKind: InsightDatasetKind) {
		this.userQuery = userQuery;
		this.datasetID = datasetID;
		this.datasetKind = datasetKind;
	}

	public validateWHERE() {
		/*
		complex example: {
			"WHERE":{ "OR":[
				{ "AND":[{ "GT":{ "ubc_avg":90 } }, { "IS":{ "ubc_dept":"adhe" } } ] },
				{ "EQ":{ "ubc_avg":95 } } ] },		}
		*/
		let valueQueryWHERE = this.userQuery["WHERE"];
		// check valueQueryWHERE is object
		if (typeof valueQueryWHERE !== "object") {
			throw new InsightError("WHERE is not a JSON object");
		}
		// check valueQueryWHERE is not null or undefined
		if (valueQueryWHERE === null || valueQueryWHERE === undefined) {
			throw new InsightError("WHERE is null or undefined");
		}
		if (Object.keys(valueQueryWHERE).length === 0) { // e.g. "WHERE": {}
			return;
		} else if (Object.keys(valueQueryWHERE).length > 1) {
			throw new InsightError("WHERE has more than one value");
		}
		this.validKey(valueQueryWHERE); // query performs validation on keys: AND, OR, NOT, LT, GT, EQ, IS
	}

	private validKey(queryObject: any) { // queryObject should be "any" data type. e.g. {"OR": [{...},{...}]}
		let filter = Object.keys(queryObject)[0]; // get key of WHERE. e.g. "OR"
		if (filter === "AND" || filter === "OR" || filter === "NOT") {
			this.validKeyComplex(queryObject, filter);
		} else if (filter === "LT" || filter === "GT" || filter === "EQ" || filter === "IS") {
			this.validKeySimple(queryObject, filter);
		} else {
			throw new InsightError("Invalid filter key");
		}
	}

	// cases to validate for AND, OR, NOT
	private validKeyComplex(queryObject: any, filter: string) { // e.g queryObject = {"AND":[{...},{...}]}, filter = "AND"
		/*
		{
			"WHERE":{ "OR":[
				{ "AND":[{ "GT":{ "ubc_avg":90 } }, { "IS":{ "ubc_dept":"adhe" } } ] },
				{ "EQ":{ "ubc_avg":95 } } ] },
		}
		*/
		let valueOfFilter = queryObject[filter]; // get value of filter. e.g. [{...},{...}]
		// check if valueOfFilter is null or undefined
		if (valueOfFilter === null || valueOfFilter === undefined) { // e.g. [{...},{...}] is not null or undefined
			throw new InsightError("Value of key is null or undefined");
		}
		// check if valueOfFilter is a query object
		if (typeof valueOfFilter !== "object") { // e.g. [{...},{...}] is an object
			throw new InsightError("Value of key is not a JSON object");
		}
		if (filter === "AND" || filter === "OR") {
			// check if AND or OR is an array or not
			if (!Array.isArray(valueOfFilter)) {
				throw new InsightError("Value of key is not an array");	// e.g. {"AND":{}} is invalid
			}
			// check if AND or OR has at least one query objects
			if (valueOfFilter.length === 0) {
				throw new InsightError("Value of key has no object");	// e.g. {"AND":[]} is invalid
			}
			for (let object of valueOfFilter) {
				// e.g. {"GT":{ "ubc_avg":90 }}

				// check if obj is a query object
				if (typeof object !== "object") {
					throw new InsightError("Value of key is not a JSON object");
				}
				// check if obj is null or undefined
				if (object === null || object === undefined) {
					throw new InsightError("Value of key is null or undefined");
				}
				// check if obj has only one key
				if (Object.keys(object).length !== 1) {
					throw new InsightError("Value of key has more than one key");
				}
				// RECURSION
				this.validKey(object);
			}
		} else if (filter === "NOT") {
			let keyLength = Object.keys(queryObject[filter]).length; // get length of key of NOT
			if (keyLength > 1 || keyLength === 0) {
				throw new InsightError("NOT has no key or more than one key");
			}
			this.validKey(valueOfFilter);
		}
	}

	// 	cases to validate for LT, GT, EQ, IS query
	private validKeySimple(queryObject: any, filter: string) { // e.g queryObject = {"GT":{ "ubc_avg":90 }}, filter = "GT"
		if (queryObject[filter] === null || queryObject[filter] === undefined) {
			throw new InsightError("Query content null or undefined");
		}
		// check length of value of queryObject is 1
		if (Object.keys(queryObject[filter]).length !== 1) { // check length of "ubc_avg", should be 1
			throw new InsightError("Filter has more than one key");
		}
		let keyOfValue = Object.keys(queryObject[filter])[0]; // get key of { "ubc_avg":90}, result: "ubc_avg"
		// check cases for value of key has more than 1 "_"
		let stringPartsExcludeUnderScore = keyOfValue.split("_"); // split "ubc_avg" into ["ubc", "avg"]
		if (stringPartsExcludeUnderScore.length > 2) { // check if there is more than 1 "_"
			throw new InsightError("Has more than one underscore");
		}

		// check key ID is valid (equal to datasetID)
		if (stringPartsExcludeUnderScore[0] !== this.datasetID) {
			throw new InsightError("Invalid key ID");
		}

		// check value of LT, GT, EQ
		if (filter === "LT" || filter === "GT" || filter === "EQ") {
			// check value of LT, GT, EQ is number
			if (typeof queryObject[filter][keyOfValue] !== "number") {
				throw new InsightError("Value of LT, GT, EQ is not number");
			}

			// check field of LT, GT, EQ of "sections", "rooms" dataset is included in sectionsMField, roomsMField respectively
			if (this.datasetKind === InsightDatasetKind.Sections &&
				!QueryValidatorWHERE.sectionsMField.includes(stringPartsExcludeUnderScore[1])) {
				throw new InsightError("Field of LT, GT, EQ is not included in courseMKeys");
			} else if (this.datasetKind === InsightDatasetKind.Rooms &&
				!QueryValidatorWHERE.roomsMField.includes(stringPartsExcludeUnderScore[1])) {
				throw new InsightError("Field of LT, GT, EQ is not included in roomMKeys");
			}

		} else {
			// check value of IS is string
			if (typeof queryObject[filter][keyOfValue] !== "string") {
				throw new InsightError("Value of IS is not string");
			}
			// check value of IS is valid wildcard format
			if (!(/^(\*|)([^*]*)(\*|)$/.test(queryObject[filter][keyOfValue]))) {
				throw new InsightError("Invalid wildcard format");
			}

			if (this.datasetKind === InsightDatasetKind.Sections &&
				!QueryValidatorWHERE.sectionsSField.includes(stringPartsExcludeUnderScore[1])) {
				throw new InsightError("Field of LT, GT, EQ is not included in courseMKey");
			} else if (this.datasetKind === InsightDatasetKind.Rooms &&
				!QueryValidatorWHERE.roomsSField.includes(stringPartsExcludeUnderScore[1])) {
				throw new InsightError("Field of LT, GT, EQ is not included in roomMKey");
			}
		}
	}
}

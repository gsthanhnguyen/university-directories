import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export default class QueryValidatorOPTIONS {
	private readonly userQuery: any;
	private readonly datasetID: string;
	private static coursesMField = ["avg", "pass", "fail", "audit", "year"];
	private static coursesSField = ["dept", "id", "instructor", "title", "uuid"];
	private static roomsMField = ["lat", "lon", "seats"];
	private static roomsSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
	private applyKeyList: string[];
	private transformed: boolean;
	private columnsKeyList: string[];
	private datasetKind: InsightDatasetKind;
	constructor(userQuery: any, datasetID: string, columnsKeyList: string[], applyKeyList: string[],
		transformed: boolean, datasetKind: InsightDatasetKind) {
		this.userQuery = userQuery;
		this.datasetID = datasetID;
		this.applyKeyList = applyKeyList;
		this.transformed = transformed;
		this.columnsKeyList = columnsKeyList;
		this.datasetKind = datasetKind;
	}

	public validateOPTIONS() {
		/*
		example of OPTIONS:
		"OPTIONS":{ "COLUMNS":[ "ubc_dept", "ubc_id", "ubc_avg" ], "ORDER":"ubc_avg" }
		*/
		let valueQueryOPTIONS = this.userQuery["OPTIONS"]; // get value of OPTIONS. e.g. { "COLUMNS":[ "ubc_dept", "ubc_id", "ubc_avg" ], "ORDER":"ubc_avg" }
		let keysQueryOPTIONS = Object.keys(valueQueryOPTIONS); // get all keys of OPTIONS. e.g. ["COLUMNS", "ORDER"]
		// call helper function to validate COLUMNS
		this.validateCOLUMN(valueQueryOPTIONS, keysQueryOPTIONS);
		// in some query, OPTIONS has only COLUMNS, so we need to check if ORDER is in OPTIONS
		if (keysQueryOPTIONS.includes("ORDER")) { // check if ORDER is in OPTIONS
			// call helper function to validate ORDER
			this.validateORDER(valueQueryOPTIONS);
		}
	}

	public validateCOLUMN(valueQueryOPTIONS: any, keysQueryOPTIONS: any) {
		// example of COLUMNS: "COLUMNS":[ "ubc_dept", "ubc_id", "ubc_avg" ]
		// check OPTIONS and ORDER are simultaneously exist in keysQueryOPTIONS and no other keys
		if (keysQueryOPTIONS.includes("COLUMNS")) {	// check if both COLUMNS and ORDER are in OPTIONS
			if (keysQueryOPTIONS.length > 2) {
				throw new InsightError("OPTIONS has more than two keys"); // validated with CampusExplorer
			}
		} else {
			throw new InsightError("OPTIONS has no COLUMNS"); // validated with CampusExplorer
		}

		// check keysQueryOPTIONS has at least one key is COLUMNS and COLUMNS value is not empty
		if (valueQueryOPTIONS["COLUMNS"].length === 0) {
			throw new InsightError("COLUMNS value is empty"); // validated with CampusExplorer
		}
		// check datasetID is valid and fields in COLUMNS are valid
		this.columnsKeyList = valueQueryOPTIONS["COLUMNS"]; // get value of COLUMNS. e.g. ["ubc_dept", "ubc_id", "ubc_avg", maxSeats]
		// requirement from Checkpoint 2: If GROUP is present, all COLUMNS keys must correspond to one of the GROUP keys or to applykeys defined in the APPLY block.
		for (let field of this.columnsKeyList) {
			// Requirement in C2: check if COLUMNS key is in GROUP or APPLY. Because Column value has only 2 sort of string. e.g, "rooms_shortname","maxSeats"
			if (this.transformed) { // if query is transformed, check if COLUMNS key is in GROUP or APPLY
				if (!this.applyKeyList.includes(field)) {
					throw new InsightError("COLUMNS key is not in GROUP or APPLY"); // validated with CampusExplorer
				}
			} else { // if query is not transformed, check if COLUMNS key is valid. this case apply for query "sections" without GROUP and APPLY
				let stringPartsExcludeUnderScore = field.split("_"); // split "ubc_avg" into ["ubc", "avg"]
				// check if there is more than 1 "_"
				if (stringPartsExcludeUnderScore.length > 2) {
					throw new InsightError("Has more than one underscore"); // validated with CampusExplorer
				}
				// check if field of COURSEs is valid
				this.validateIDandMFieldAndSField(stringPartsExcludeUnderScore);
			}
		}
	}

	// check valid datasetID and valid field
	public validateIDandMFieldAndSField(stringPartsExcludeUnderScore: string[]) {
		if (stringPartsExcludeUnderScore[0] !== this.datasetID) { // check if datasetID is valid
			throw new InsightError("Invalid datasetID in COLUMNS"); // validated with CampusExplorer
		}

		if (this.datasetKind === InsightDatasetKind.Sections &&
			!QueryValidatorOPTIONS.coursesMField.includes(stringPartsExcludeUnderScore[1]) &&
			!QueryValidatorOPTIONS.coursesSField.includes(stringPartsExcludeUnderScore[1])) {
			throw new InsightError("Invalid field in COLUMNS"); // validated with CampusExplorer
		}
		// check if field of ROOMs is valid
		if (this.datasetKind === InsightDatasetKind.Rooms &&
			!QueryValidatorOPTIONS.roomsMField.includes(stringPartsExcludeUnderScore[1]) &&
			!QueryValidatorOPTIONS.roomsSField.includes(stringPartsExcludeUnderScore[1])) {
			throw new InsightError("Invalid field in COLUMNS"); // validated with CampusExplorer
		}
	}

	// check valid ORDER
	private validateORDER(valueQueryOPTIONS: any) { // e.g. { "COLUMNS":[ "ubc_dept", "ubc_id", "ubc_avg" ], "ORDER":"ubc_avg",... }
		let valueQueryORDER = valueQueryOPTIONS["ORDER"]; // get value of ORDER.
		// check ORDER is not null or undefined
		if (valueQueryORDER === null || valueQueryORDER === undefined) {
			throw new InsightError("ORDER is null or undefined"); // validated with CampusExplorer
		}
		/*
			In short, ORDER can be cases:
			1. ORDER is a string: "rooms_shortname"/"courses_avg"/"courses_dept"/"maxSeats"
			2. ORDER is an object: {"dir": "UP", "keys": ["courses_avg","courses_dept","maxSeats"]}
			 */
		// check if ORDER is string
		if (typeof valueQueryORDER !== "string") { // complex order: {"dir": "UP", "keys": ["courses_avg"]}. Falling in C2 requirement
			if (valueQueryORDER["dir"] === null || valueQueryORDER["dir"] === undefined) {
				throw new InsightError("DIR is null or undefined"); // validated with CampusExplorer
			}
			// check if ORDER's dir is a string
			if (typeof valueQueryORDER["dir"] !== "string") {
				throw new InsightError("ORDER's dir is not a string"); // validated with CampusExplorer
			}
			// check if ORDER's dir is either UP or DOWN
			if (valueQueryORDER["dir"] !== "UP" && valueQueryORDER["dir"] !== "DOWN") {
				throw new InsightError("ORDER's dir is not UP or DOWN"); // validated with CampusExplorer
			}
			if (valueQueryORDER["keys"] === null || valueQueryORDER["keys"] === undefined) {
				throw new InsightError("KEYS is null or undefined"); // validated with CampusExplorer
			}
			// check if ORDER's keys is an array
			if (!Array.isArray(valueQueryORDER["keys"])) {
				throw new InsightError("ORDER's keys is not an array"); // validated with CampusExplorer
			}
			// check if ORDER's keys is not empty
			if (valueQueryORDER["keys"].length === 0) { // e.g. "keys": []
				throw new InsightError("ORDER's keys is empty"); // validated with CampusExplorer
			}
			// check if ORDER's keys is an array of two sorts of strings. e.g, ["courses_avg", "courses_dept"] or ["maxSeats"]
			for (let key of valueQueryORDER["keys"]) {
				if (key === null || key === undefined) {
					throw new InsightError("Value in Keys array is null or undefined"); // validated with CampusExplorer
				}
				// check if ORDER's key is a string
				if (typeof key !== "string") {
					throw new InsightError("ORDER's key is not a string"); // validated with CampusExplorer
				}
				// check if ORDER's key is valid
				this.validateORDERKey(key); // e.g. "courses_avg"
			}
		} else { // valueQueryORDER is a string, e.g. "rooms_shortname"/"courses_avg"/"courses_dept"/"maxSeats"
			// to check if ORDER's key is in COLUMNS

			this.validateORDERKey(valueQueryORDER);
		}
	}

	// check ORDER's key is valid
	private validateORDERKey(valueQueryORDER: string) {
		if (!this.columnsKeyList.includes(valueQueryORDER)) {
			throw new InsightError("ORDER's key is not found in COLUMNS"); // validated with CampusExplorer
		}
		if (valueQueryORDER.includes("_")) {
			// check ORDER's key must be a key found in the COLUMNS 's KEY_LIST array. requirement in C2: All SORT keys must also be in the COLUMNS.
			let stringPartsExcludeUnderScore = valueQueryORDER.split("_"); // split "ubc_avg" into ["ubc", "avg"]
			if (stringPartsExcludeUnderScore.length > 2) { // check if there is more than 1 "_"
				throw new InsightError("Has more than one underscore"); // validated with CampusExplorer
			}
			// check key ID and field are valid
			this.validateIDandMFieldAndSField(stringPartsExcludeUnderScore);
		}
	}
}

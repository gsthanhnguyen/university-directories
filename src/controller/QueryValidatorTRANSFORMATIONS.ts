import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export default class QueryValidatorTRANSFORMATIONS {
	private readonly userQuery: any;
	private readonly datasetID: string;
	private static coursesMField = ["avg", "pass", "fail", "audit", "year"];
	private static coursesSField = ["dept", "id", "instructor", "title", "uuid"];
	private static roomsMField = ["lat", "lon", "seats"];
	private static roomsSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
	private static applyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
	private applyKeyList: string[];
	private readonly datasetKind: InsightDatasetKind;
	constructor(userQuery: any, datasetID: string, applyKeyList: string[], datasetKind: InsightDatasetKind) {
		this.userQuery = userQuery;
		this.datasetID = datasetID;
		this.applyKeyList = applyKeyList;
		this.datasetKind = datasetKind;
	}

	public validTransformations() {
		let transformationObject = this.userQuery["TRANSFORMATIONS"]; // e.g. {"GROUP": ["courses_dept", "courses_avg"], "APPLY": [{"maxAvg": {"MAX": "courses_avg"}}, {"minAvg": {"MIN": "courses_avg"}}]}
		// check if TRANSFORMATIONS is an object
		if (typeof transformationObject !== "object") {
			throw new InsightError("TRANSFORMATIONS is not an object"); // validated with CampusExplorer
		}
		let transformationKeys = Object.keys(transformationObject); // e.g. ["GROUP", "APPLY"]
		// check if Transformation has only GROUP and APPLY (length = 2)
		// if (transformationKeys.length !== 2) {
		// 	throw new InsightError("Invalid number of keys in TRANSFORMATIONS"); // validated with CampusExplorer
		// }
		// check if GROUP is an array
		if (!Array.isArray(transformationObject["GROUP"])) {
			throw new InsightError("GROUP is not an array"); // validated with CampusExplorer
		}
		// check if GROUP is empty
		if (transformationObject["GROUP"].length === 0) {
			throw new InsightError("GROUP is empty"); // validated with CampusExplorer
		}
		// check if any key is not GROUP or APPLY
		for (let key of transformationKeys) {
			if (key !== "GROUP" && key !== "APPLY") {
				throw new InsightError("Invalid key in TRANSFORMATIONS");
			}
		}
		// check validity fields in GROUP
		let groupFields = transformationObject["GROUP"]; // e.g. ["courses_dept", "courses_avg"]
		this.validateGroup(groupFields);
		// check validity of APPLY
		let applyObject = transformationObject["APPLY"]; // e.g. [{"maxAvg": {"MAX": "courses_avg"}}, {"minAvg": {"MIN": "courses_avg"}}]
		this.validateApply(applyObject);
	}

	// check if GROUP is valid
	private validateGroup(groupFields: string[]) {
		for (let field of groupFields) { // e.g. "courses_dept"
			// check if field is a string
			if (typeof field !== "string") {
				throw new InsightError("Fields in GROUP is not a string"); // validated with CampusExplorer
			}
			// check if field is a valid which contains "_"
			if (!field.includes("_")) {
				// check ORDER's key must be a key found in the COLUMNS 's KEY_LIST array
				throw new InsightError("Field in GROUP does not have an underscore"); // validated with CampusExplorer
			}
			let stringPartsExcludeUnderScore = field.split("_"); // e.g. ["sections", "dept"]
			if (stringPartsExcludeUnderScore.length > 2) { // check if there is more than 1 "_"
				throw new InsightError("Has more than one underscore");
			}
			this.validField(stringPartsExcludeUnderScore); 	// check if field is a valid. e.g. "courses_avg"
			/*
			example of valid query:
			{"WHERE": {},
			"OPTIONS": {
				"COLUMNS": ["sections_title", "overallAvg"]},
			"TRANSFORMATIONS": {
				"GROUP": ["sections_title"],
				"APPLY": [{"overallAvg": {"AVG": "sections_avg"}}]}
				Apply key: "overallAvg"
			Group key: "sections_title"
			 */
			// If GROUP is present, all COLUMNS keys must correspond TO ONE OF the GROUP keys or to applykeys (e.g "overallAvg") defined in the APPLY block.
			this.applyKeyList.push(field); // add field to applyKeyList to use after in Columns of OPTIONS
		}
	}

	// check if APPLY is valid
	private validateApply(applyObject: any) { // e.g. [{"maxAvg": {"MAX": "courses_avg"}}, {"minAvg": {"MIN": "courses_avg"}}]
		if (!Array.isArray(applyObject)) { 		// check if APPLY is an array
			throw new InsightError("APPLY is not an array"); // validated with CampusExplorer
		}
		for (let applyRule of applyObject) { // e.g. applyRule = {"maxAvg": {"MAX": "courses_avg"}}
			if (applyRule === null || applyRule === undefined) {
				throw new InsightError("null or undefined applyRule"); // validated with CampusExplorer
			}
			let applyRuleKeys = Object.keys(applyRule); // e.g. ["maxAvg"]
			if (applyRuleKeys === null || applyRuleKeys === undefined) { // check if applyRule has only one key
				throw new InsightError("null or undefined applyRuleKeys"); // validated with CampusExplorer
			}
			if (applyRuleKeys.length !== 1) { // e.g. ["maxAvg"]
				throw new InsightError("Invalid number of keys in APPLY");
			}
			let applyRuleKey = applyRuleKeys[0]; // e.g. "maxAvg"
			if (applyRuleKey.includes("_")) {
				throw new InsightError("apply contains underscore"); // validated with CampusExplorer
			}
			if (this.applyKeyList.includes(applyRuleKey)) {
				throw new InsightError("Duplicated key"); // validated with CampusExplorer
			}
			this.applyKeyList.push(applyRuleKey);
			// add applyRuleKeys to applyKeyList to use after in Columns of OPTIONS
			this.validateApplyRuleKeys(applyRule, applyRuleKeys);
		}
	}

	private validateApplyRuleKeys(applyRule: any, applyRuleKeys: string[]) {
		let applyToken = applyRule[applyRuleKeys[0]]; // check if applyRule has only one key e.g. {"MAX": "courses_avg"}
		if (applyToken === null || applyToken === undefined) {
			throw new InsightError("null or undefined applyToken"); // validated with CampusExplorer
		}
		let applyTokenKeys = Object.keys(applyToken); // e.g. ["MAX"]
		if (applyTokenKeys.length !== 1) { // e.g. ["MAX"]
			throw new InsightError("Invalid number of keys in APPLY"); // validated with CampusExplorer
		}
		if (!QueryValidatorTRANSFORMATIONS.applyTokens.includes(applyTokenKeys[0])) {
			// check if applyToken is a valid token which is MAX, MIN, AVG, COUNT, SUM e.g. ["MAX"]
			throw new InsightError("Invalid applyToken"); // validated with CampusExplorer
		}
		let applyTokenValue = applyToken[applyTokenKeys[0]]; // e.g. "courses_avg"
		if (typeof applyTokenValue !== "string") { // check if applyTokenValue is a string
			throw new InsightError("Invalid applyTokenValue"); // validated with CampusExplorer
		}
		if (!applyTokenValue.includes("_")) { // check if applyTokenValue is a valid
			throw new InsightError("Field in APPLY does not have an underscore"); // validated with CampusExplorer
		}
		let stringPartsExcludeUnderScore = applyTokenValue.split("_"); // e.g. ["courses", "avg"]
		this.validField(stringPartsExcludeUnderScore);
		this.validFiedldForNumber(stringPartsExcludeUnderScore, applyTokenKeys[0]);
	}

// check if ID, MField, SField of the field are valid
	private validField(stringPartsExcludeUnderScore: string[]) { // e.g. ["courses", "avg"]
		// check datasetID is valid (equal to datasetID)
		if (stringPartsExcludeUnderScore[0] !== this.datasetID) { // e.g. "courses"
			throw new InsightError("Invalid key ID");
		}

		// check valid datasetKind and MField, SField are matched. e.g. "courses_avg"
		if (this.datasetKind === InsightDatasetKind.Sections &&
			!QueryValidatorTRANSFORMATIONS.coursesMField.includes(stringPartsExcludeUnderScore[1]) &&
			!QueryValidatorTRANSFORMATIONS.coursesSField.includes(stringPartsExcludeUnderScore[1])) {
			throw new InsightError("Invalid field in APPLY or GROUP"); // validated with CampusExplorer
		} else if (this.datasetKind === InsightDatasetKind.Rooms &&
			!QueryValidatorTRANSFORMATIONS.roomsMField.includes(stringPartsExcludeUnderScore[1]) &&
			!QueryValidatorTRANSFORMATIONS.roomsSField.includes(stringPartsExcludeUnderScore[1])) {
			throw new InsightError("Invalid field in APPLY or GROUP"); // validated with CampusExplorer
		}
	}

	private validFiedldForNumber(stringPartsExcludeUnderScore: string[], applyTokenKey: string) {
		if (applyTokenKey !== "COUNT") {
			if (this.datasetKind === InsightDatasetKind.Sections &&
				!QueryValidatorTRANSFORMATIONS.coursesMField.includes(stringPartsExcludeUnderScore[1])) {
				throw new InsightError("Invalid field in APPLY or GROUP"); // validated with CampusExplorer
			} else if (this.datasetKind === InsightDatasetKind.Rooms &&
				!QueryValidatorTRANSFORMATIONS.roomsMField.includes(stringPartsExcludeUnderScore[1])) {
				throw new InsightError("Invalid field in APPLY or GROUP"); // validated with CampusExplorer
			}
		}
	}

	// get applyKeyList
	public getApplyKeyList() {
		return this.applyKeyList;
	}
}

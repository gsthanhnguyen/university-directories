import QueryValidatorTRANSFORMATIONS from "./QueryValidatorTRANSFORMATIONS";
import QueryValidatorWHERE from "./QueryValidatorWHERE";
import QueryValidatorOPTIONS from "./QueryValidatorOPTIONS";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export default class QueryValidatorMain {
	private readonly userQuery: any;
	private readonly datasetID: string;
	private columnsKeyList: string[] = []; // e.g. ["ubc_dept", "ubc_id", "ubc_avg"]
	private applyKeyList: string[]; // e.g. ["maxSeats", "avgSeats"] which names is given by user
	private transformed: boolean;
	private readonly datasetKind: InsightDatasetKind;

	constructor(userQuery: any, datasetID: string, datasetKind: InsightDatasetKind) {
		this.userQuery = userQuery;
		this.datasetID = datasetID;
		this.datasetKind = datasetKind;
		this.transformed = false; // default value
		this.applyKeyList = []; // this is a list to store all apply keys which obtained from TRANSFORMATIONS
	}

	// validates the query syntax and semantics
	public validateQuery() {
		this.validateQuerySyntax(); // check if query is valid
		/*
			check valid WHERE. e.g. "WHERE": { "GT": { "courses_avg": 90 } }
		 */
		let QueryWHEREObject = new QueryValidatorWHERE(this.userQuery, this.datasetID, this.datasetKind);
		QueryWHEREObject.validateWHERE();
		/*
			check valid TRANSFORMATIONS
		 */
		if (Object.keys(this.userQuery).includes("TRANSFORMATIONS")) { // Checkpoint 2: to check if Transformation is existed
			this.transformed = true;
			let QueryTransformationsObject = new QueryValidatorTRANSFORMATIONS(this.userQuery, this.datasetID,
				this.applyKeyList, this.datasetKind);
			QueryTransformationsObject.validTransformations();
			this.applyKeyList = QueryTransformationsObject.getApplyKeyList(); // get the applyKeyList from QueryTransformationsObject
		}
		// check valid OPTIONS
		let QueryOPTIONSObject = new QueryValidatorOPTIONS(this.userQuery, this.datasetID, this.columnsKeyList,
			this.applyKeyList, this.transformed, this.datasetKind);
		QueryOPTIONSObject.validateOPTIONS();
	}

	// check if query is valid
	private validateQuerySyntax() {
		if (typeof this.userQuery !== "object") {
			throw new InsightError("Query is not a JSON object");
		}
		if (this.userQuery === null || this.userQuery === undefined) {
			throw new InsightError("Query is null or undefined");
		}
		if (Object.keys(this.userQuery).length === 0) {
			throw new InsightError("Query is empty");
		}
		if (!("WHERE" in this.userQuery)) {
			throw new InsightError("Query does not have WHERE grammar");
		}
		if (!("OPTIONS" in this.userQuery)) {
			throw new InsightError("Query does not have OPTIONS grammar");
		}
	}
}

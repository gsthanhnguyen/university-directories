import {ResultTooLargeError} from "./IInsightFacade";
import SortHelper from "./SortHelper";
import TransformationHelper from "./TransformationHelper";

interface OutputSectionObject { // source from https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
	[key: string]: string | number
}
export default class DataCollector {
	public Logic: string[] = ["AND", "OR"];
	public MComparator: string[]  = ["GT", "EQ", "LT"];
	public Negation: string[] = ["NOT"];

	public matchedDataset: any;
	private transformed: boolean;
	private resultSoFar: any[];
	private query: any;
	private sortHelper: SortHelper;
	private transformationHelper: TransformationHelper;
	constructor(datasetMatchedUserID: any) {
		this.matchedDataset = datasetMatchedUserID;
		this.transformed = false;
		this.resultSoFar = [];
		this.sortHelper = new SortHelper(); // to store the final output so far
		this.transformationHelper = new TransformationHelper();
	}

	public collectData(query: any): any[] {
		this.query = query;
		if (Object.keys(query["WHERE"]).length === 0) { // e.g. "WHERE": {}
			this.resultSoFar = this.matchedDataset; // if where clause is empty, we include all the sections
		} else {
			for (let section of this.matchedDataset) {
				if ( this.performWhere(query["WHERE"], section) ) { // on a single section. e.g. {"AND":[{"GT":{"sections_avg":98}},{"IS":{"sections_id":"500"}}]}
					this.resultSoFar.push(section);
				}
			}
		}
		// case 1: no Transformations, so no GROUP and APPLY
		if (this.resultSoFar.length > 1 && this.query["TRANSFORMATIONS"] !== undefined) {
			this.performTRANSFORMATIONS();
		}
		if (this.resultSoFar.length > 5000) {
			throw new ResultTooLargeError("Results more than 5000 rows");
		}
		if (this.resultSoFar.length > 1) {
			const order = query["OPTIONS"]["ORDER"];
			if (order !== undefined && order !== null) {
				this.resultSoFar = this.sortHelper.performOrder(this.resultSoFar, order);
			}
		}
		const columns = query["OPTIONS"]["COLUMNS"];
		this.resultSoFar = this.performColumns(this.resultSoFar, columns);
		return this.resultSoFar; // return the final output and end performQuery
	}

	public performWhere(whereClause: any, section: any): boolean { // e.g. {"AND":[{"GT":{"sections_avg":98}},{"IS":{"sections_id":"500"}}]}
		let filterKey = Object.keys(whereClause)[0]; // e.g. "AND"
		if (this.Logic.includes(filterKey)) { // logic = "AND" or "OR"
			return this.performLogic(whereClause[filterKey], filterKey, section);
		} else if (this.Negation.includes(filterKey)) { // negation = "NOT"
			return this.performNegation(whereClause[filterKey], section);
		} else if (this.MComparator.includes(filterKey)) { // MComparator = "GT", "EQ", "LT"
			return this.performMComparison(whereClause[filterKey], filterKey, section);
		} else if (filterKey === "IS") {
			return this.performSComparison(whereClause[filterKey], section);
		}
		return false;
	}

	private performLogic(whereClauseElement: any, filterKey: string, section: any) { // e.g. whereClauseElement = [{"GT":{"sections_avg":98}},{"IS":{"sections_id":"500"}}]
		if (filterKey === "AND") {
			for (let innerQuery of whereClauseElement) {
				if (!this.performWhere(innerQuery, section)) {
					return false;
				}
			}
			return true;
		} else {
			for (let innerQuery of whereClauseElement) {
				if (this.performWhere(innerQuery, section)) {
					return true;
				}
			}
			return false;
		}
	}

	private performNegation(whereClauseElement: any,  section: any) {
		return !this.performWhere(whereClauseElement, section);
	}

	private performMComparison(whereClauseElement: any, filterKey: string, section: any) { // e.g. whereClauseElement = {"GT":{"sections_avg":98}}
		let key: any = Object.keys(whereClauseElement)[0]; // e.g. "GT"
		let queryValue: any = Object.values(whereClauseElement)[0]; // e.g. 90
		let sectionValue = this.sortHelper.getFieldValue(section, key); // get field's value from section
		if (filterKey === "GT") {
			return sectionValue > queryValue;
		} else if (filterKey === "LT") {
			return sectionValue < queryValue;
		} else if (filterKey === "EQ") {
			return sectionValue === queryValue;
		}
		return false;
	}

	private performSComparison(whereClauseElement: any, section: any) { // e.g. whereClauseElement = {"IS":{"sections_id":"500"}}
		let key: any = Object.keys(whereClauseElement)[0];
		let queryString: any = Object.values(whereClauseElement)[0];
		let sectionString = this.sortHelper.getFieldValue(section, key);
		// let mField = key.split("_")[1];
		// let sectionString: any = section[mField];
		let length: number = queryString.length;
		let lengthMinusOne: number = length - 1;
		if (!queryString.includes("*")) {
			return (queryString === sectionString);
		}
		if ((queryString[0] === "*") && (queryString[lengthMinusOne] === "*")) {
			let slicedValue: string = queryString.slice(1, lengthMinusOne);
			return sectionString.includes(slicedValue);
		}
		if (queryString[0] === "*") {
			let slicedValue: string = queryString.slice(1, length);
			let slicedLength = slicedValue.length;
			let sectionStringLength: number = sectionString.length;
			return (sectionString.slice(sectionStringLength - slicedLength, sectionStringLength) === slicedValue);
		}
		if (queryString[lengthMinusOne] === "*") {
			let slicedValue: string = queryString.slice(0, lengthMinusOne);
			let slicedLength = slicedValue.length;
			return (sectionString.slice(0, slicedLength) === slicedValue);
		}
	}

	private performColumns(results: any[], columns: any): any[] {
		let outputs: any[] = [];
		let keys: any[] = [];
		let idString = columns[0].split("_")[0]; // ubc
		for (let col of columns) {
			if (col.includes("_")) {
				col = col.split("_")[1]; // avg <- ubc_avg
			}
			keys.push(col);
		}
		for (let section of results) {
			let outputSection: OutputSectionObject = {};
			// get all the columns from section
			const sectionColumns: string[] = Object.keys(section);
			for (let secCol of sectionColumns) { // avg
				if (keys.includes(secCol)) {
					let outputKey = idString + "_" + secCol;
					if (columns.includes(outputKey)) {
						outputSection[outputKey] = section[secCol];
					} else {
						outputSection[secCol] = section[secCol];
					}
				}
			}
			outputs.push(outputSection);
		}
		return outputs;
	}

	private performTRANSFORMATIONS() {
		// case 2: Transformations exist
		this.transformed = true;
		let arrayOfGROUP = this.query["TRANSFORMATIONS"]["GROUP"]; // e.g. ["courses_dept", "courses_id"]
		let arrayOfAPPLY = this.query["TRANSFORMATIONS"]["APPLY"]; // e.g. [{"maxSeats": {"MAX": "rooms_seats"}}, {"avgSeats": {"AVG": "rooms_seats"}}]
		// let resultOfTranformations: any[] = [];
		// GROUP
		this.resultSoFar = this.transformationHelper.parseGROUP(arrayOfGROUP, this.resultSoFar);
		// APPLY
		this.resultSoFar = this.transformationHelper.parseAPPLY(arrayOfAPPLY, this.resultSoFar);
	}
}

import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import * as fs from "fs-extra";
import Query from"./QueryValidatorMain";
import DataCollector from "./DataCollector";
import {RoomManager} from "./RoomManager";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private dataManager = new RoomManager();
	private datasetKind = InsightDatasetKind.Sections;

	constructor() {
		console.log("InsightFacadeImpl::init()");
		// TODO: read back from the disk
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (this.isInvalid(id)) {
			return Promise.reject(new InsightError("The id is invalid!"));
		}
		// duplicated id
		if (this.dataManager.datasets.has(id)) {
			return Promise.reject(new InsightError("The id is duplicated!"));
		}
		if (kind === InsightDatasetKind.Sections) {
			return this.dataManager.addDatasetSection(id, content);
		} else if (kind === InsightDatasetKind.Rooms) {
			return this.dataManager.addDatasetRoom(id, content);
		} else {
			return Promise.reject(new InsightError("Invalid kind of dataset"));
		}
	}

	public isInvalid(id: string): boolean {
		// id only contains whitespace
		if (id.trim().length === 0) {
			return true;
		}
		// shouldn't include underscore in id
		return id.includes("_");
	}

	public removeDataset(id: string): Promise<string> {
		if (this.isInvalid(id)) {
			return Promise.reject(new InsightError("The id is invalid!"));
		}
		if (!this.dataManager.datasets.has(id)) {
			return Promise.reject(new NotFoundError("The id is not found in the dataset!"));
		}
		return new Promise ((resolve, reject) => {
			this.dataManager.datasets.delete(id);
			this.dataManager.insightDatasets.delete(id);
			fs.remove(__dirname + "/data" + id + ".json").then(() => {
				return resolve(id);
			}).catch((error) => {
				return reject(new NotFoundError("unable to remove dataset"));
			});
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise<any[]>((resolve, reject) => {
			try {
				// this part is to validate Query
				let validatedID = this.validateAndGetID(query); // get the validated ID. e.g. "courses"
				let dataset = this.dataManager.insightDatasets.get(validatedID); // get the dataset
				if (dataset !== undefined) { // if the dataset is not undefined, get the kind of the dataset
					this.datasetKind = dataset.kind;
				} else {
					return reject(new NotFoundError("The id is not found in the dataset!"));
				}
				let queryObject: Query = new Query(query, validatedID, this.datasetKind);
				queryObject.validateQuery();
				// DataCollector is to collect data from the dataset
				let datasetMatchedUserID = this.dataManager.datasets.get(validatedID); // get the dataset according to the id
				let dataCollector = new DataCollector(datasetMatchedUserID);
				let output = dataCollector.collectData(query);
				return resolve(output);
			} catch (error) {
				return reject(error);
			}
		});
	}

	// this helper function is to validate ID from query and return the validated ID
	public validateAndGetID(query: any): string {
		// "OPTIONS":{ "COLUMNS":[ "ubc_dept", "ubc_id", "ubc_avg" ], "ORDER":"ubc_avg"

		if (query === null || query === undefined || Object.keys(query).length === 0 && typeof query !== "object") {
			throw new InsightError("The query is not an object!");
		}
		// check if the query has the key "OPTIONS"
		if (!("OPTIONS" in query)) {
			throw new InsightError("OPTIONS property is missing in the query object");
		}
		let keysOfColumns = query["OPTIONS"]["COLUMNS"];
		if (keysOfColumns === null || keysOfColumns === undefined) {
			throw new InsightError("COLUMNS is null or undefined");
		}
		let allIDsInColumns: Set<string> = new Set(); // to store all the UNIQUE ids in the columns
		let id: string = "";
		for (let key of keysOfColumns) {
			if (!key.includes("_")) {
				continue;
			} else {
				id = key.split("_")[0];
			}

			// if the id is not in the dataset, throw error
			if (!this.dataManager.datasets.has(id)) {
				throw new InsightError("The id is not in the dataset!");
			}

			allIDsInColumns.add(id);
		}

		// if there are no or more than one id in the columns, throw error
		if (allIDsInColumns.size > 1 || allIDsInColumns.size === 0) {
			throw new InsightError("There are no or more than one id in the columns!");
		}

		return Array.from(allIDsInColumns)[0];
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(Array.from(this.dataManager.insightDatasets.values()));
	}
}

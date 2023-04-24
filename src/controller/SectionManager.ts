import JSZip from "jszip";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";

export class SectionManager {
	public datasets: Map<string, any> = new Map();
	public insightDatasets: Map<string, InsightDataset> = new Map();
	public addDatasetSection(id: string, content: string): Promise<string[]> {
		let zip = JSZip();
		return new Promise<string[]> ((resolve, reject) => {
			zip.loadAsync(content, {base64: true})
				.then((result) => {
					// fileArray contains string (equal to each course in courses file)
					let fileArray = this.processZipFile(result, "courses");
					let sectionList: any = [];
					Promise.all(fileArray)
						.then((promises) => {
							for (const promise of promises) {
								try {
									const parsedPromise = JSON.parse(promise);
									// parse sections in each file & push them in sectionList
									sectionList = this.processSections(parsedPromise.result, sectionList);
								} catch {
									reject(new InsightError("invalid section"));
								}
							}
							// create InsightDataset
							if (sectionList.length !== 0) {
								let insightDataset: InsightDataset =
									{id, kind: InsightDatasetKind.Sections, numRows: sectionList.length};
								// add to dataset map and array
								this.insightDatasets.set(id, insightDataset);
								this.datasets.set(id, sectionList);
								// save to disk
								fs.writeFileSync(__dirname + "/data" + id + ".json", JSON.stringify(sectionList));
								resolve(Array.from(this.datasets.keys()));
							} else {
								reject(new InsightError("no valid section in the given dataset"));
							}
						});
				}).catch((error) => {
					reject(new InsightError("invalid file"));
				});
		});
	}

	public processSections(parsedPromise: any[], sectionList: any[]): any[] {
		// parsedPromise contains all the sections within one course
		if (parsedPromise === null || parsedPromise === undefined) {
			return sectionList;
		}
		let datasetKeys = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];
		for (let parsedSingleSection of parsedPromise) {
			let sectionData: any = {};
			let sectionKeys: string[] = Object.keys(parsedSingleSection);
			if (this.validateKeyValues(datasetKeys, sectionKeys, parsedSingleSection)) {
				sectionData["uuid"] = parsedSingleSection["id"].toString();
				sectionData["id"] = parsedSingleSection["Course"];
				sectionData["title"] = parsedSingleSection["Title"];
				sectionData["instructor"] = parsedSingleSection["Professor"];
				sectionData["dept"] = parsedSingleSection["Subject"];
				if (parsedSingleSection["Section"] === "overall") {
					sectionData["year"] = 1900;
				} else {
					sectionData["year"] = Number(parsedSingleSection["Year"]);
				}
				sectionData["avg"] = parsedSingleSection["Avg"];
				sectionData["pass"] = parsedSingleSection["Pass"];
				sectionData["fail"] = parsedSingleSection["Fail"];
				sectionData["audit"] = parsedSingleSection["Audit"];
			}
			sectionList.push(sectionData);
		}
		return sectionList;
	}

	public validateKeyValues(datasetKeys: string[], sectionKeys: string[], parsedSection: any): boolean {
		const year = Number(parsedSection["Year"]);
		return (datasetKeys.every((key) => {
			return sectionKeys.includes(key);
		})) && (typeof parsedSection["id"] === "number")
			&& (typeof parsedSection["Course"] === "string")
			&& (typeof parsedSection["Title"] === "string")
			&& (typeof parsedSection["Professor"] === "string")
			&& (typeof parsedSection["Subject"] === "string")
			&& (typeof parsedSection["Year"] === "string")
			&& (!isNaN(year)) && (Number.isInteger(year))
			&& (typeof parsedSection["Avg"] === "number")
			&& (typeof parsedSection["Pass"] === "number")
			&& (typeof parsedSection["Fail"] === "number")
			&& (typeof parsedSection["Audit"] === "number");
	}

	public processZipFile(jsZip: JSZip, folderName: string): Array<Promise<string>> {
		let fileArray: Array<Promise<string>> = [];
		jsZip.folder(folderName)?.forEach((relativePath, file) => {
			if (folderName === "courses") {
				let resultFile: Promise<any> = file.async("string");
				fileArray.push(resultFile);
			}
		});
		return fileArray;
	}
}

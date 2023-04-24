import Decimal from "decimal.js";

interface IPair {
	[applyRule: string]: number;
}

interface IGroup {
	[gkey: string]: [IPair];
}
export default class TransformationHelper {
	private static coursesMField = ["avg", "pass", "fail", "audit", "year"];
	private static coursesSField = ["dept", "id", "instructor", "title", "uuid"];
	private static roomsMField = ["lat", "lon", "seats"];
	private static roomsSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];

	public parseGROUP(arrayOfGROUP: any[], resultSoFar: any[]) {
		if (arrayOfGROUP.length === 0) {
			return resultSoFar;
		}
		let tempResults: any = {};
		this.createGroups(resultSoFar, arrayOfGROUP, tempResults);
		return tempResults; // e.g. tempResults = [{"adhe": [{"courses_dept": "adhe", "courses_id": "101", "courses_avg": 90},...],....},...]
	}

	private createGroups(resultSoFar: any[], arrayOfGROUP: any[], tempResults: any) {
		for (let section of resultSoFar) {
			let groupName: string = "";

			for (let idField of arrayOfGROUP) {
				groupName += "|";
				let fieldName = idField.split("_")[1];
				groupName += fieldName + "%" + section[fieldName]; // |shortname%BUCH|seat%32
			}
			groupName = groupName.slice(1); // shortname%BUCH|seat%32
			if (tempResults[groupName] === null || tempResults[groupName] === undefined) {
				tempResults[groupName] = [];
			}
			tempResults[groupName].push(section);
		}
	}

	public parseAPPLY(applyQuery: any[], resultSoFar: any) {
		let tempResult: any[] = [];
		if (!applyQuery.length) {
			let groupNames = Object.keys(resultSoFar);
			for (let groupName of groupNames) {
				let output = resultSoFar[groupName]; // groupName: shortname%BUCH|seat%32
				this.parseGroupKeys(groupName, output);
				tempResult.push(output);
			}
			return tempResult;
		}
		let parsedApplyRules: any[] = [];
		this.parseApplyRules(applyQuery, parsedApplyRules);
		let applyResults: any[] = [];
		for (let [name, token, field] of parsedApplyRules) {
			applyResults.push([name, this.parseSingleApplyRule(resultSoFar, [token, field])]);
		}
		let groupedResults: IGroup = {} ;
		this.formatApplyResult(applyResults, groupedResults);
		return this.formOutputData(groupedResults);
	}

	private parseApplyRules(applyQuery: any[], parsedApplyRules: any[]) {
		for (let singleApply of applyQuery) {
			let name: string = Object.keys(singleApply)[0]; // "maxSeats"
			let token: string = Object.keys(singleApply[name])[0]; // "MAX"
			let field: string = singleApply[name][token].split("_")[1]; // "rooms_seats"
			parsedApplyRules.push([name, token, field]);
		}
	}

	private formatApplyResult(applyResults: any[], groupedResults: IGroup) {
		for (let ruleResultPair of applyResults) {
			let singleApplyName: string = ruleResultPair[0]; // "maxSeats"
			let groupsWithResult: any = ruleResultPair[1]; // [groupKey, value]
			let groupKeys = Object.keys(groupsWithResult);
			for (let groupKey of groupKeys) {
				let pairedData: IPair = {};
				pairedData[singleApplyName] = groupsWithResult[groupKey];
				if (!groupedResults[groupKey]) {
					groupedResults[groupKey] = [pairedData];
				} else {
					groupedResults[groupKey].push(pairedData);
				}
			}
		}
	}

	public parseGroupKeys(str: string, result: any) {
		if (str.includes("|")) { // str: shortname%BUCH`seat%32
			for (let key of str.split("|")) { // key: shortname%BUCH
				let groupItem = key.split("%");
				// add [shortname: BUCH] to result
				this.parseSingleContent(groupItem, result);
			}
		} else {
			let groupItem = str.split("%");
			this.parseSingleContent(groupItem, result);
		}
	}

	public parseSingleContent(item: string[], result: any) {
		if (TransformationHelper.coursesSField.includes(item[0]) ||
			TransformationHelper.roomsSField.includes(item[0])) {
			result[item[0]] = item[1];
		} else {
			result[item[0]] = Number(item[1]);
		}
	}

	private parseSingleApplyRule (resultSoFar: any, [rule, field]: any) {
		let temp: any = {};
		Object.keys(resultSoFar).forEach((mapkey: string) => {
			let data = resultSoFar[mapkey];
			if (rule === "MAX") {
				temp[mapkey] = this.performMax(data, field);
			} else if (rule === "MIN") {
				temp[mapkey] = this.performMin(data, field);
			} else if (rule === "AVG") {
				temp[mapkey] = this.performAvg(data, field);
			} else if (rule === "COUNT") {
				temp[mapkey] = this.performCount(data, field);
			} else if (rule === "SUM") {
				temp[mapkey] = this.performSum(data, field);
			}
		});
		return temp;
	}

	private performMax (group: any[], field: string) {
		let numbers: number[] = group.map((item: any) => item[field]);
		return Math.max(...numbers);
	}

	private performMin (group: any[], field: string) {
		let numbers: number[] = group.map((item: any) => item[field]);
		return Math.min(...numbers);
	}

	private performAvg (group: any[], field: string) {
		let sum: Decimal = new Decimal(0);
		for (let elem of group) {
			sum = new Decimal(sum.add(new Decimal(elem[field])));
		}
		let avg = sum.toNumber() / group.length;
		return Number(avg.toFixed(2));
		// group.forEach((data) => {
		// 	total = new Decimal(total.add(new Decimal(data[field])));
		// });
		// let total = 0;
		// for (let elem of group) {
		// 	total += elem;
		// }
		// return total / group.length;
	}

	private performCount (group: any[], field: string) {
		let set = new Set();
		for (let data of group) {
			set.add(data[field]);
		}
		return set.size;
	}

	private performSum (group: any[], field: string) {
		let sum = 0;
		for (let data of group) {
			sum += data[field];
		}
		return Number(sum.toFixed(2));
	}

	public formOutputData(data: IGroup) {
		let outputs: any[] = [];
		let dataKeys = Object.keys(data);
		for (let dataKey of dataKeys) {
			let output: any = {};
			this.parseGroupKeys(dataKey, output);
			let groupedData = data[dataKey];
			for (let pairData of groupedData) {
				let key = Object.keys(pairData)[0];
				output[key] = pairData[key];
				if (!outputs.includes(output)) {
					outputs.push(output);
				}
			}
		}
		return outputs;
	}
}

export default class SortHelper {
	public performOrder(results: any[], orderClause: any): any[] {
		// assume orderKey here is either mkey or skey
		if (typeof orderClause === "string") {
			results.sort((a,b) => {
				// a and b are the elements being compared
				return this.processDirAndValue([orderClause], a, b, "UP");
			});
		} else {
			let dir = orderClause["dir"];
			let orderKey = orderClause["keys"];
			results.sort((a, b) => {
				// a and b are the elements being compared
				return this.processDirAndValue(orderKey, a, b, dir);
			});
		}
		return results;
	}

	private processDirAndValue(orderKeys: string[], a: any, b: any, dir: string): number {
		let sign: number = dir === "UP" ? 1 : -1;
		let orderKey = orderKeys[0];
		let aValue = this.getFieldValue(a, orderKey);
		let bValue = this.getFieldValue(b, orderKey);
		if (aValue !== bValue) {
			let compareIndicator: number = aValue > bValue ? 1 : -1;
			return (compareIndicator * sign);
		} else if (orderKeys.slice(1).length) { // left == right && has other keys ==> keep sorting
			return this.processDirAndValue(orderKeys.slice(1), dir, a, b);
		}
		return 0;
	}

	public getFieldValue(entry: any, fieldKey: any) {
		let field: string;
		if (fieldKey.includes("_")) {
			field = fieldKey.split("_")[1];
		} else {
			field = fieldKey;
		}
		return entry[field];
	}
}

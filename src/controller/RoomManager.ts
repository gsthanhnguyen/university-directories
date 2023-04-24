import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import JSZip from "jszip";
import {SectionManager} from "./SectionManager";
import * as parse5 from "parse5";
import {buildingField, roomField} from "./ParserHelper";
import http from "http";

interface Room {
	fullname: string;
	shortname: string;
	number: string;
	name: string;
	address: string;
	lat: number;
	lon: number;
	seats: number;
	type: string;
	furniture: string;
	href: string;
}

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

const baseURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team142/";

export class RoomManager extends SectionManager {
	private buildings: any;
	private hasCampusFolder: boolean;
	private relativePaths: string[] = [];
	constructor() {
		super();
		this.hasCampusFolder = false;
		this.buildings = {};
	}

	public async addDatasetRoom(id: string, content: string): Promise<string[]> {
		let zip = JSZip();
		let result = await zip.loadAsync(content, {base64: true});
		let r = await this.processZipFileRooms(result);
		return this.parseHTML(id, r, result);
	}

	public async processZipFileRooms(jsZip: JSZip): Promise<string> {
		return new Promise<string> ((resolve, reject) => {
			if (jsZip.file(/index.htm/).length > 0) {
				try {
					resolve(jsZip.files["index.htm"].async("text"));
				} catch (error) {
					reject (new InsightError("no matching index.htm file"));
				}
			}
			reject(new InsightError("no matching index.htm file"));
		});
	}

	public parseHTML(id: string, indexFile: any, result: JSZip) {
		return new Promise<any>((resolve, reject) => {
			const indexTree = parse5.parse(indexFile);
			this.parseBuildings(indexTree).then((r) => {
				this.buildings = r;
				if (this.buildings.size === 0) {
					reject(new InsightError("no valid Buildings in the given datasets"));
				}
				let buildingFiles: any[] = [];
				this.filterAndLoadValidBuildingFiles(result, buildingFiles);
				resolve(this.parseRoomsFromBuildings(id, buildingFiles));
			}).catch((err) => {
				reject(err);
			});
		});
	}

	private async parseRoomsFromBuildings(id: string, buildingFilePromises: any[]) {
		let buildingFiles = await Promise.all(buildingFilePromises);
		let parsedRooms: Room[] = [];
		for (let i: number = 0; i < this.relativePaths.length; i++) {
			let relativePath = this.relativePaths[i];
			this.parseRooms(this.buildings[relativePath], buildingFiles[i], parsedRooms);
		}
		if (parsedRooms.length !== 0) {
			let insightDataset: InsightDataset =
				{id: id, kind: InsightDatasetKind.Rooms, numRows: parsedRooms.length};
			this.insightDatasets.set(id, insightDataset);
			this.datasets.set(id, parsedRooms);
			return Array.from(this.datasets.keys());
		} else {
			throw new InsightError("No valid room in the given dataset");
		}
	}

	public parseRooms(buildingData: any, buildingFile: any, parsedRooms: Room[]) {
		let parsedBuilding = parse5.parse(buildingFile);
		let tbody = this.getTbody(parsedBuilding);
		if (!tbody || tbody === "") {
			return null;
		}
		if (tbody.childNodes === null || tbody.childNodes === undefined) {
			return null;
		}
		let roomArray = tbody.childNodes.filter((node: any) => {
			return node.nodeName === "tr";
		});
		for (let tr of roomArray) {
			let parsedRoom = this.parseSingleRoom(tr, buildingData);
			if (parsedRoom != null) {
				parsedRooms.push(parsedRoom);
			}
		}
	}

	public filterAndLoadValidBuildingFiles(result: JSZip, buildingFiles: any[]) {
		// let folderName: string = hasCampusFolder? "campus"
		result.folder("campus")?.forEach((relativePath, file) => {
			if (!this.hasCampusFolder) {
				relativePath = "campus/" + relativePath;
			}
			if (this.buildings[relativePath]) {
				this.relativePaths.push(relativePath);
				buildingFiles.push(file.async("text"));
			}
		});
	}

	// recurse down the nodes to find tbody
	public async parseBuildings(indexTree: any): Promise<any> {
		let tbody = this.getTbody(indexTree);
		if (!tbody) {
			throw new InsightError("Not a valid index.htm file - no valid buildings");
		}
		let buildingResults: {[href: string]: any} = {};
		if (tbody.childNodes === null || tbody.childNodes === undefined) {
			return null;
		}
		let buildingArray = tbody.childNodes.filter((node: any) => {
			return node.nodeName === "tr";
		});
		let promises: Array<Promise<any>> = [];
		for (let building of buildingArray) {
			let parsedBuilding: any = this.parseSingleBuilding(building);
			promises.push(parsedBuilding);
		}
		let buildings = await Promise.all(promises);
		for (let building of buildings) {
			if (building != null) {
				buildingResults[building.buildingHref] = building;
			}
		}
		return buildingResults;
	}

	public getTbody(indexTree: any): any {
		if (indexTree.nodeName === "tbody") {
			return indexTree;
		}
		if (indexTree.childNodes !== null && indexTree.childNodes !== undefined && indexTree.childNodes.length > 0) {
			for (let child of indexTree.childNodes) {
				let result = this.getTbody(child);
				if (result !== "") {
					return result;
				}
			}
		}
		return "";
	}

	public parseSingleBuilding(tr: any): Promise<any> {
		let fieldBuildingCodeNode = this.getElementByClass(tr, buildingField[0]);
		let titleNode = this.getElementByClass(tr, buildingField[1]);
		let fieldBuildingAddressNode = this.getElementByClass(tr, buildingField[2]);
		if (!fieldBuildingAddressNode || !titleNode || !fieldBuildingCodeNode) {
			return Promise.reject("invalid node");
		}
		if (titleNode.childNodes === null || titleNode.childNodes === undefined) {
			return Promise.reject("invalid node");
		}
		titleNode = titleNode.childNodes.find((node: any) => node.tagName === "a");
		let buildingAddress = this.trimText(fieldBuildingAddressNode);
		let buildingShortName = this.trimText(fieldBuildingCodeNode);
		let buildingFullName = this.trimText(titleNode);
		let buildingLink = titleNode.attrs.find((attr: any) => attr.name === "href").value.split("./")[1];
		// if (!hasCampusFolder) {
		// 	buildingLink = buildingLink.split("/")[1];
		// }
		return this.getLonAndLat(buildingAddress).then((result) => {
			if (result.error) {
				return null;
			}
			if (result.lon !== undefined && result.lat !== undefined) {
				let resLon = result.lon;
				let resLat = result.lat;
				return {
					fullname: buildingFullName,
					shortname: buildingShortName,
					address: buildingAddress,
					lon: resLon,
					lat: resLat,
					buildingHref: buildingLink
				};
			}
			return null;
		});
	}

	public parseSingleRoom(tr: any, buildingData: any): Room | null {
		let roomNumberNode = this.getElementByClass(tr, roomField[0]);
		let roomCapacityNode = this.getElementByClass(tr, roomField[1]);
		let roomFurnitureNode = this.getElementByClass(tr, roomField[2]);
		let roomTypeNode = this.getElementByClass(tr, roomField[3]);
		let nothingNode = this.getElementByClass(tr, roomField[4]);
		if (!roomNumberNode || !roomCapacityNode || !roomFurnitureNode || !roomTypeNode || !nothingNode) {
			return null;
		}
		if (roomNumberNode.childNodes === null || roomNumberNode.childNodes === undefined ||
			nothingNode.childNodes === null || nothingNode.childNodes === undefined) {
			return null;
		}
		roomNumberNode = roomNumberNode.childNodes.find((node: any) => node.tagName === "a");
		nothingNode = nothingNode.childNodes.find((node: any) => node.tagName === "a");
		let roomShortname = buildingData.shortname;
		let roomNumber = this.trimText(roomNumberNode);
		let roomLink = nothingNode.attrs.find((attr: any) => attr.name === "href").value;
		return {
			fullname: buildingData.fullname,
			shortname: roomShortname,
			number: roomNumber,
			name: roomShortname + "_" + roomNumber,
			address: buildingData.address,
			lat: buildingData.lat,
			lon: buildingData.lon,
			seats: Number(this.trimText(roomCapacityNode)),
			type: this.trimText(roomTypeNode),
			furniture: this.trimText(roomFurnitureNode),
			href: roomLink
		};
	}

	public trimText(node: any) {
		let text = node.childNodes.find((currNode: any) => currNode.nodeName === "#text");
		// call trim to handle all the empty strings
		return text.value.trim();
	}

	public getElementByClass(tr: any, classString: any) {
		if (!tr.childNodes) {
			return null;
		}
		return this.filterNodesWithClassName(tr.childNodes, classString);
	}

	public filterNodesWithClassName(nodes: any, classString: any) {
		for (let childNode of nodes) {
			if (childNode && childNode.attrs) {
				for (let attr of childNode.attrs) {
					// if (attr.name === "class" && attr.value === classString) {
					// 	return childNode;
					// }
					if (attr.name === "class") {
						let attrValues = attr.value.split(" ");
						if (attrValues.includes("views-field")) {
							if (attrValues.includes(classString)) {
								return childNode;
							}
						}
					}
				}
			}
		}
		return undefined;
	}

	// reference from https://nodejs.org/api/http.html#httprequesturl-options-callback
	public getLonAndLat(address: any) {
		let url = baseURL + encodeURIComponent(address);
		return new Promise<GeoResponse>((res, rej) => {
			http.get(url, (result) => {
				// console.log("start to get lon and lat");
				result.setEncoding("utf8");
				// reference from http request and response
				let rawData = "";
				result.on("data", (chunk) => {
					rawData += chunk;
				});
				result.on("end", () => {
					// All data has been received, so process it now
					const {lat, lon, error} = JSON.parse(rawData);
					if (error) {
						rej({error});
					} else {
						res({lat, lon});
					}
				});
			});
		});
	}
}

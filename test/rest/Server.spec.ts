import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs";

const SERVER_URL = "http://localhost:4321";

describe("Server", () => {

	let facade: InsightFacade;
	let server: Server;
	const validQuery = {WHERE:{AND:[{GT:{sections_avg:97}},{IS:{sections_title:"d*"}}]},OPTIONS:{COLUMNS:
				["sections_title","overallAvg"],ORDER:{dir:"UP",keys:["sections_title"]}},TRANSFORMATIONS:
			{GROUP:["sections_title"],APPLY:[{overallAvg:{AVG:"sections_avg"}}]}};
	const validQueryResult = [{sections_title:"dev el sk df&hrd",overallAvg:98.45},
		{sections_title:"diff geometry i",overallAvg:97.25}];

	let courses = fs.readFileSync("./test/resources/archives/pair.zip");
	let rooms = fs.readFileSync("./test/resources/archives/campus.zip");

	before(async () => {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		return server.start().catch((error) => {
			expect.fail("fail to start with" + error.message);
		});
	});

	after(async () => {
		// TODO: stop server here once!
		return server.stop();
	});

	beforeEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	afterEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	// Sample on how to format PUT requests

	it("PUT test for courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("PUT test for rooms dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/rooms/rooms")
				.send(rooms)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("Reject with invalid id - PUT courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/ds_001/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("Reject with wrong kind - PUT courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/sections/rooms")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("Reject with wrong path - PUT courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/datasetss/sections/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(404);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("delete test for courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					request(SERVER_URL)
						.delete("/dataset/sections")
						.then((result: Response) => {
							expect(result.status).to.be.equal(200);
						});
				})
				.catch((err) => {
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("Reject with not found error - delete courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					request(SERVER_URL)
						.delete("/dataset/mysections")
						.then((result: Response) => {
							expect(result.status).to.be.equal(404);
						});
				})
				.catch((err) => {
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("Reject with wrong id - delete courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					request(SERVER_URL)
						.delete("/dataset/my_sections")
						.then((result: Response) => {
							expect(result.status).to.be.equal(400);
						});
				})
				.catch((err) => {
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("Reject with wrong path - delete courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					request(SERVER_URL)
						.delete("/datasetss/my_sections")
						.then((result: Response) => {
							expect(result.status).to.be.equal(404);
						});
				})
				.catch((err) => {
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("Query courses dataset", async () => {
		try {
			return request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(courses)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					request(SERVER_URL)
						.post("/query")
						.send(validQuery)
						.then((result: Response) => {
							expect(result.status).to.be.equal(200);
							expect(result).to.deep.equal(validQueryResult);
						});
				})
				.catch((err) => {
					expect.fail(err.message);
				});
		} catch (err) {
			// and some more logging here!
		}
	});
});

import Server from "./rest/Server";
import fs from "fs";
import request from "supertest";

/**
 * Main app class that is run with the node command. Starts the server.
 */
const SERVER_URL = "http://localhost:4321";
let sections = fs.readFileSync("./test/resources/archives/pair.zip");
let rooms = fs.readFileSync("./test/resources/archives/campus.zip");

export class App {
	public initServer(port: number) {
		console.info(`App::initServer( ${port} ) - start`);

		const server = new Server(port);
		return server.start().then(() => {
			console.info("App::initServer() - started");
			return request(SERVER_URL)
				.put("/dataset/sections/sections")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed").then(() => {
					return request(SERVER_URL)
						.put("/dataset/rooms/rooms")
						.send(rooms)
						.set("Content-Type", "application/x-zip-compressed");
				});
		}).catch((err: Error) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
	}
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
console.info("App - starting");
const app = new App();
(async () => {
	await app.initServer(4321);
})();

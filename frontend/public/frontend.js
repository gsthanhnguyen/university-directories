/*
Ethan's explanation for fetch function
fetch takes 2 argument: http request and "method"
"method": POST means fetch() to use the POST method to send data to the server
"headers" is property specifies the HTTP headers to be included in the request
"body" is property specifies the body of the request
e.g: the JSON object data is converted to a string using JSON.stringify()
and included in the request body with the Content-Type header set to application/json.
 */
// async function performQueryOnServer() {
// 	let queryFromTextBox = document.getElementById("inputBox").value;
// 	// let jsonObject = JSON.parse(queryFromTextBox);
//
// 	let rawResponse = await fetch(serverPerformQuery, {
// 		method: "POST",
// 		headers: {
// 			'Accept': 'application/json',
// 			'Content-Type': 'application/json'
// 		},
// 		body: JSON.stringify(queryFromTextBox)
// 	})
// 		.then(function (response) { // The first .then() block checks the response status code
// 			if (response.status !== 200) {
// 				document.getElementById("display-results").innerText = "Invalid Query input or result not found";
// 				return response;
// 			}
// 			return response.json();
// 		})
// 		.then(function (result) { // The second .then() block processes the JSON data returned from the server
// 			// if(result.result.length === 0){ // when hitting button without input
// 			// 	alert("Invalid Query input");
// 			// }
// 			data = result.result;
// 			showTable();
// 			Promise.resolve((result));
// 		})
// 		.catch(function (err) {
// 			document.getElementById("table").innerText = err;
// 		});
// }

async function performQueryOnServer() {
	clearField();
	const serverQueryPath = "http://localhost:4321/query";
	try {
		let inputBox = document.getElementById("inputBox");
		let queryFromTextBox = inputBox.value;
		let jsonObject = JSON.parse(queryFromTextBox);

		let rawResponse = await fetch(serverQueryPath, {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonObject)
		});

		if (rawResponse.status !== 200) {
			throw new Error("Invalid query input");
		}

		let result = await rawResponse.json();

		if (result.result.length === 0) { // when hitting button without input
			throw new Error("Result not found");
		}

		let data = result.result;
		showTable(data);
		return result;
	} catch (error) {
		// throw error;
		document.getElementById("display-results").innerText = error + "! Please try again";
	}
}

// show the table
function showTable(data) {
	let firstObject = data[0]; // get the first object in the array
	let headerTitles = Object.keys(firstObject); // get the keys of the first object in the array. e.g ["sections_dept", "sections_uuid",...]
	let table = document.getElementById("table")
	let tableHead = table.tHead
	let headerRow = document.createElement("tr");
	for (let title of headerTitles) {
		let cell = document.createElement("th");
		cell.textContent = title;
		headerRow.appendChild(cell);
	}

	tableHead.appendChild(headerRow);

	// add rows to table
	for (let object of data) {
		let allValues = Object.values(object);
		let row = table.insertRow();
		for (let value of allValues) {
			let cell = row.insertCell();
			let text = document.createTextNode(value.toString());
			cell.appendChild(text);
		}
	}
}

// clear the table
function clearField() {
	document.getElementById("display-results").innerText = "Query results will be displayed here";
	document.getElementById("inputBox").innerText = "";
	const table = document.getElementById("table");
	while (table.tHead.firstChild) {
		table.tHead.removeChild(table.tHead.firstChild);
	}
	while (table.tBodies[0].firstChild) { // remove all rows
		table.tBodies[0].removeChild(table.tBodies[0].firstChild);
	}
}





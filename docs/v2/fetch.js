function http_reject(request, response) {
	console.error(request.method + " " + request.url + " " + response.status + " " + response.statusText);
    return Promise.reject({error:"http_error",url:response.url,status:response.status});
}

function log_fetch(request, response) {
	if(response.ok) {
		console.log(request.method + " " + request.url + " " + response.status + " " + response.statusText);
	} else {
		console.error(request.method + " " + request.url + " " + response.status + " " + response.statusText);
	}
	return response;
}

function as_json(response) {
	const contentType = response.headers.get("Content-Type");
	const isJson = contentType.match(/^application\/json(;|$)/);
	return isJson
		? response.json()
		: Promise.resolve(null);
}

function http_get_json(uri) {
	const init = {
		"method":"GET", 
		"headers": {
			"Accept": "application/json"
		},
	};
	const request = new Request(uri, init);
	return fetch(request)
		.then(response => log_fetch(request, response))
		.then(response => response.ok ? as_json(response) : http_reject(request, response));
}

function http_post_json(uri, body) {
	const init = {
		"method":"POST", 
		"headers": {
			"Accept": "application/json"
		},
		"body": ((typeof body) === "string" ? body : (body && JSON.stringify(body)))
	};
	if(body) { 
		init.headers["Content-Type"] = "application/json"; 
	}
	const request = new Request(uri, init);
	return fetch(request)
		.then(response => log_fetch(request, response))
		.then(response => response.ok ? as_json(response) : http_reject(request, response));
}


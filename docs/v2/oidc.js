// depends on fetch.js
// depends on encoders.js

function OpenIDConnectClient(get_provider, get_client) {
    if(typeof get_provider !== "function") throw "illegal argument";
    if(typeof get_client !== "function") throw "illegal argument";
    const self = this;
    function issue_token_request(code) {
        console.log("issue_token_request(" + code + ")");    
        var token_response_promise = Promise.all([self.get_client(), self.get_provider()])
            .then(all => {
                var client = all[0];
                var provider = all[1];
                var headers = { "Content-Type": "application/x-www-form-urlencoded" };
                var body = "grant_type=authorization_code"
                    + "&code=" + encodeURIComponent(code)        
                    + "&client_id=" + encodeURIComponent(client.client_id)
                    + "&client_secret=" + encodeURIComponent(client.client_secret)
                    + "&redirect_uri=" + encodeURIComponent(location.origin + location.pathname);
                var request = new Request(provider.token_endpoint, {"method":"POST", "headers":headers, "body":body});
                return window.fetch(request)
                    .then(response => log_fetch(request, response))
                    .then(response => response.ok ? as_json(response) : http_reject(request, response));
            });
        token_response_promise.then(json => console.log(encodeJson(json)));
        return token_response_promise;
    };
    this._get_provider = get_provider;
    this._get_client = get_client;
    this.fetch = () => Promise.reject("not ready");
    this.ready = new Promise((resolve, reject) => {
        window.addEventListener(
            "authorization_code", 
            (e) => {
                console.log("authorization_code e.detail=" + e.detail.code);
                var token_response_promise = issue_token_request(e.detail.code);
                self.fetch = (input, init) => {
                    var request = new Request(input, init);
                    return token_response_promise
                        .then(token_response => {
                            console.log("OpenIDConnectClient.fetch(" + request.method + " " + request.url + ") Bearer=" + token_response.access_token);
                            request.headers.set("Authorization", "Bearer " + token_response.access_token);
                            return window.fetch(request)
                                .then(response => log_fetch(request, response));
                        });
                };
                token_response_promise.then(() => resolve(true));
            }, 
            {once: true}
        );
    });
}

OpenIDConnectClient.CreateMock = function() {
	var client = new OpenIDConnectClient(() => Promise.reject(), () => Promise.reject());
	client.process_location = () => {};
	client.ready = Promise.resolve(true);
	client.fetch = (input, init) => {
		var request = new Request(input, init);
		request.headers.set("Authorization", "Bearer test");
		return window.fetch(request)
			.then(response => log_fetch(request, response));
	};
	return client;
}

OpenIDConnectClient.prototype.get_provider = function() {
	return this.provider_promise = this.provider_promise || this._get_provider();
}

OpenIDConnectClient.prototype.get_client = function() {
	return this.client_promise = this.client_promise || this._get_client();
}

OpenIDConnectClient.prototype.authorization_code = function(code) {
    window.dispatchEvent(new CustomEvent("authorization_code", {"detail": {"code": code}}));
}

OpenIDConnectClient.prototype.send_authentication_request = function() {
    Promise.all([this.get_client(), this.get_provider()])
        .then(all => {
            var client = all[0];
            var provider = all[1];
            var request = "client_id=" + encodeURIComponent(client.client_id)
                + "&redirect_uri=" + encodeURIComponent(location.origin + location.pathname)
                + "&response_type=code"
                + "&scope=" + encodeURIComponent(client.scope || "openid")
                + "&login_hint=" + encodeURIComponent("hello@example.com");
            location.assign(provider.authorization_endpoint + "?" + request);
        });
}

OpenIDConnectClient.prototype.process_authentication_response = function() {
	if(location.search.startsWith("?")) {
		window.stop();
		location.replace(location.pathname + "#" + location.search.substr(1));
		return new Promise(() => {});
	} else if(/(#|&)code=([^&]*)(&|$)/.test(location.hash)) {
		var code = RegExp.$2;
		location.hash = "";
		// pass authorization_code to client
		this.authorization_code(code);
		return Promise.resolve(true);
	}
	return Promise.resolve(false);
}

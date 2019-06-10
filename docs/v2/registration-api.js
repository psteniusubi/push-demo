function RegistrationAPI(uri, client) {
    if(typeof uri !== "string") throw "illegal argument";
	if(typeof client !== "object") throw "illegal argument";
	if(client.constructor !== OpenIDConnectClient) throw "illegal argument";
    const self = this;
	this.uri = uri;
	this.client = client;
}

RegistrationAPI.prototype.createChallenge = function() {
    return this.client.ready.then(() => {
        var request = http_post_json_request(this.uri + "/v2/registration/challenge");
        var promise = this.client.fetch(request)
            .then(response => response.ok ? as_json(response) : http_reject(request, response));
        promise
            .then(json => console.log("RegistrationChallenge " + encodeJson(json)))
            .catch(e => console.error("registration_challenge " + e));
//        Promise.all([promise,DOMContentLoaded])
//            .then(all => $("#username").val(all[0].publicKey.user.name));
        return promise;
    });
}

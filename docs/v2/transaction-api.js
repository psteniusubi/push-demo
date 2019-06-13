function TransactionAPI(uri) {
    if(typeof uri !== "string") throw "illegal argument";
    const self = this;
	this.uri = uri;
    // service worker
    this.serviceWorker_promise = navigator.serviceWorker.register("/push-demo/v2/worker.js", { scope: "/push-demo/v2/" })
        .then(reg => console.log("register worker.js " + reg) || reg)
        .catch(error => log_and_reject("navigator.serviceWorker.register(worker.js)", error));
    if(this.getClientId()) {
        // application key        
        this.keyPair_promise = getKey();
        // ready?
        this.ready = this.keyPair_promise
            .then(() => Promise.resolve(true))
            .catch(() => Promise.resolve(false));
    } else {
        this.ready = Promise.resolve(false);
    }
}

TransactionAPI.prototype.getClientId = function() {
    return localStorage.getItem("client_id");
}

TransactionAPI.prototype.getList = function() {
    const clientId = this.getClientId();
    if(!clientId) return Promise.reject();
    return http_get_json(this.uri + "/v2/transaction/client/" + encodeURIComponent(clientId))
        .catch(() => Promise.reject());
}

TransactionAPI.prototype.createChallenge = function(push_id) {
	console.log("TransactionAPI.createChallenge()");
    const clientId = this.getClientId();
    if(!clientId) return Promise.reject();
	return http_get_json(this.uri + "/v2/transaction/id/" + encodeURIComponent(push_id))
		.then(json => console.log("TransactionChallenge " + encodeJson(json)) || json)
        .catch(() => Promise.reject());
}

TransactionAPI.prototype.confirmChallenge = function(push_id, transaction_challenge) {
	console.log("TransactionAPI.confirmChallenge()");
    if(transaction_challenge.publicKey) {
        return navigator.credentials.get(TransactionAPI.translatePublicKeyCredentialRequestOptions(transaction_challenge))
            .then(credentials => console.log("PublicKeyCredential(get) " + encodeJson(credentials)) || credentials)
            .then(credentials => {
                var transactionConfirmRequest = {
                    publicKeyCredential: credentials
                };
                return http_post_json(this.uri + "/v2/transaction/id/" + encodeURIComponent(push_id), encodeJson(transactionConfirmRequest))
                    .then(json => console.log("TransactionConfirmResponse " + encodeJson(json)) || json)
            });
    } else {
        var transactionConfirmRequest = {
            publicKeyCredential: null
        };
        return http_post_json(this.uri + "/v2/transaction/id/" + encodeURIComponent(push_id), encodeJson(transactionConfirmRequest))
            .then(json => console.log("TransactionConfirmResponse " + encodeJson(json)) || json)
    }
}

TransactionAPI.prototype.rejectChallenge = function(push_id) {
	console.log("TransactionAPI.rejectChallenge()");
	var request = new Request(this.uri + "/v2/transaction/id/" + encodeURIComponent(push_id), {method:"DELETE"});
	return fetch(request)
		.then(response => log_fetch(request, response));
}

// webauthn PublicKeyCredentialRequestOptions
TransactionAPI.translatePublicKeyCredentialRequestOptions = function(json) {
	// use json to deep clone publicKey
	var publicKey = JSON.parse(encodeJson(json.publicKey));
    publicKey.challenge = decodeArray(publicKey.challenge);
	if(publicKey.allowCredentials) {
		for(var i in publicKey.allowCredentials) {
			var allow = publicKey.allowCredentials[i];
			allow.id = decodeArray(allow.id);
		}
	}
    var output = { 
		"publicKey": publicKey 
	};
    console.log("PublicKeyCredentialRequestOptions " + encodeJson(output));
    return output;
}

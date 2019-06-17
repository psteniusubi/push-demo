function TransactionAPI(uri, db) {
    if(typeof uri !== "string") throw "illegal argument";
	if(db.constructor !== AuthenticatorDB) throw "illegal argument";
    const self = this;
	this.uri = uri;
    this.db = db;
    // service worker
    if(navigator.serviceWorker) {
        this.serviceWorker_promise = navigator.serviceWorker.register("/push-demo/v2/worker.js", { scope: "/push-demo/v2/" })
            .then(reg => console.log("register worker.js " + reg) || reg)
            .catch(error => log_and_reject("navigator.serviceWorker.register(worker.js)", error));
    } else {
        this.serviceWorker_promise = Promise.resolve();
    }
    this.clientId = null;
    this.keyPair = null;
    this.ready = new Promise((resolve,reject) => {
        Promise.all([self.db.getClientId(), self.db.getKeyPair(), self.serviceWorker_promise])
            .then(all => {
                self.clientId = all[0];
                self.keyPair = all[1];
                resolve(true);
            })
            .catch(e => console.error("TransactionAPI " + e) || reject());
    });
}

TransactionAPI.prototype.getClientId = function() {
    return this.clientId;
}

TransactionAPI.prototype.getList = function() {
    return this.ready.then(() => {
        const clientId = this.getClientId();
        if(!clientId) return Promise.reject();
        return http_get_json(this.uri + "/v2/transaction/client/" + encodeURIComponent(clientId))
            .catch(() => Promise.reject());
    });
}

TransactionAPI.prototype.getTransaction = function(push_id) {
    return http_get_json(this.uri + "/v2/transaction/id/" + encodeURIComponent(push_id))
        .catch(() => Promise.reject());
}

TransactionAPI.prototype.createChallenge = function(push_id) {
    return this.ready.then(() => {
        console.log("TransactionAPI.createChallenge()");
        const clientId = this.getClientId();
        if(!clientId) return Promise.reject();
        return http_get_json(this.uri + "/v2/transaction/id/" + encodeURIComponent(push_id))
            .then(json => console.log("TransactionChallenge " + encodeJson(json)) || json)
            .catch(() => Promise.reject());
    });
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

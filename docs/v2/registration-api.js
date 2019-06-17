function RegistrationAPI(uri, client) {
    if(typeof uri !== "string") throw "illegal argument";
	if(typeof client !== "object") throw "illegal argument";
	if(client.constructor !== OpenIDConnectClient) throw "illegal argument";
    const self = this;
	this.uri = uri;
	this.client = client;
    // service worker
    if(!navigator.serviceWorker) {
        throw "serviceWorker is not available";
    }
    this.serviceWorker_promise = navigator.serviceWorker.register("/push-demo/v2/worker.js", { scope: "/push-demo/v2/" })
        .then(reg => console.log("register worker.js " + reg) || reg)
        .catch(error => log_and_reject("navigator.serviceWorker.register(worker.js)", error));
    this.db = new AuthenticatorDB();
    // application key	
    this.keyPair_promise = this.db.getOrGenerateKeyPair();
    this.jwk_promise = this.keyPair_promise
        .then(keyPair => crypto.subtle.exportKey("jwk", keyPair.publicKey));
}

RegistrationAPI.prototype.getClientId = function() {
    return this.db.getClientId();
}

RegistrationAPI.prototype.createChallenge = function() {
    return this.client.ready.then(() => {
        // POST /v2/registration/challenge
        var request = http_post_json_request(this.uri + "/v2/registration/challenge");
        var promise = this.client.fetch(request)
            .then(response => response.ok ? as_json(response) : http_reject(request, response));
        promise
            .then(json => console.log("RegistrationChallenge " + encodeJson(json)))
            .catch(e => console.error("registration_challenge " + e));
        return promise;
    });
}

RegistrationAPI.prototype.confirmChallenge = function(registration_challenge) {

	// Notification.requestPermission
    var requestPermission_promise = Notification.requestPermission()
        .then(permission => console.log("Notification.requestPermission " + permission) || permission)
        .catch(error => log_and_reject("Notification.requestPermission", error));	
		
	// serviceWorkerRegistration.pushManager
    var pushManager_promise = navigator.serviceWorker.ready
        .then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager)
		.catch(error => log_and_reject("navigator.serviceWorker.ready", error));
		
    // pushManager.unsubscribe		
    var pushManager_unsubscribe_promise = pushManager_promise
		.then(pushManager => pushManager.getSubscription())
		.then(subscription => subscription && subscription.unsubscribe())
		.then(status => console.log("subscription.unsubscribe() " + status))
		.catch(e => console.error("subscription.unsubscribe() " + e) || Promise.resolve());

    // pushManager.subscribe		
	var pushManager_subscribe_promise = Promise.all([this.serviceWorker_promise, requestPermission_promise, pushManager_promise, pushManager_unsubscribe_promise])
		.then(all => {
			// push subscribe
			var pushManager = all[2];
			return pushManager.subscribe(RegistrationAPI.translatePushSubscriptionOptions(registration_challenge));
		})
        .then(pushSubscription => pushSubscription.toJSON())
		.then(pushSubscription => console.log("PushSubscription " + encodeJson(pushSubscription)) || pushSubscription)
		.catch(error => log_and_reject("pushManager.subscribe", error));
		
	// navigator.credentials.create		
	var credentials_create_promise = Promise.all([requestPermission_promise])
		.then(all => {
			// create credentials
			return navigator.credentials.create(RegistrationAPI.translatePublicKeyCredentialCreationOptions(registration_challenge));
		})
		.then(credentials => console.log("PublicKeyCredential(create) " + encodeJson(credentials)) || credentials)
		.catch(error => log_error("navigator.credentials.create", error) && Promise.resolve(null));
        
    // confirm		
	return Promise.all([pushManager_subscribe_promise, credentials_create_promise, this.jwk_promise])
		.then(all => {
			var credentialsCreateRequest = {
				"clientPublicKey": all[2],
				"subscription": all[0],
				"publicKeyCredential": all[1],
			};            
            var challenge = registration_challenge.publicKey.challenge;
			console.log("RegistrationConfirmRequest " + encodeJson(credentialsCreateRequest));
            // POST /v2/registration/confirm/{challenge}
            var request = http_post_json_request(this.uri + "/v2/registration/confirm/" + encodeURIComponent(challenge), encodeJson(credentialsCreateRequest));
			return client.fetch(request)
				.then(response => response.ok ? as_json(response) : http_reject(request, response));
		})
        .then(json => console.log("RegistrationConfirmResponse " + encodeJson(json)) || json)
        .then(json => { this.db.setClientId(json.client_id); return json; })
		.catch(error => log_and_reject("registration_confirm", error));	
}

// webpush PushSubscriptionOptions

RegistrationAPI.translatePushSubscriptionOptions = function(json) {
	var output = {
		"userVisibleOnly": true,
		"applicationServerKey": decodeArray(json.applicationServerKey),
	};
    console.log("PushSubscriptionOptions " + encodeJson(output));
	return output;
}

// webauthn PublicKeyCredentialCreationOptions

RegistrationAPI.translatePublicKeyCredentialCreationOptions = function(json) {
	// use json to deep clone publicKey
	var publicKey = JSON.parse(encodeJson(json.publicKey));
    publicKey.user.id = decodeArray(publicKey.user.id);
    publicKey.challenge = decodeArray(publicKey.challenge);
    var output = { 
		"publicKey": publicKey 
	};
    console.log("PublicKeyCredentialCreationOptions " + encodeJson(output));
    return output;
}

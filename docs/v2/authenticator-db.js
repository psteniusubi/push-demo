function AuthenticatorDB() {
    var delete_promise = db_delete("crypto");
    var create_promise = db_create("Authenticator", db => db.createObjectStore("Client", { keyPath: "id" }))
        .then(db => db_close(db));
    this.ready = Promise.all([delete_promise, create_promise])
        .then(() => Promise.resolve())
        .catch(e => console.error("AuthenticatorDB " + e) || Promise.reject());
}

AuthenticatorDB.prototype.openDb = function() {
    return this.ready
        .then(() => db_open("Authenticator"));
}

AuthenticatorDB.prototype.getClientId = function() {
    var db_promise = this.openDb();
    var get_promise = db_promise
        .then(db => db_get(db, "Client", 0));
    var clientId_promise = get_promise.then(item => item.clientId);
    var close_promise = clientId_promise
        .finally(() => db_promise.then(db => db_close(db)));
	return Promise.all([clientId_promise,close_promise])
        .then(all => all[0])
		.catch(e => console.error("AuthenticatorDB.getClientId " + e) || Promise.reject());
}

AuthenticatorDB.prototype.setClientId = function(clientId) {
    var db_promise = this.openDb();
    var update_promise = db_promise
        .then(db => db_update(db, "Client", 0, item => item.clientId = clientId));
    var close_promise = update_promise
        .finally(() => db_promise.then(db => db_close(db)));
    return Promise.all([update_promise,close_promise])
        .then(() => Promise.resolve())
		.catch(e => console.error("AuthenticatorDB.setClientId " + e) || Promise.reject());
}

AuthenticatorDB.prototype.getKeyPair = function() {
    var db_promise = this.openDb();
    var get_promise = db_promise
        .then(db => db_get(db, "Client", 0));
    var keyPair_promise = get_promise.then(item => ({ publicKey: item.publicKey, privateKey: item.privateKey }));
    var close_promise = keyPair_promise
        .finally(() => db_promise.then(db => db_close(db)));
	return Promise.all([keyPair_promise,close_promise])
		.then(all => all[0])
		.catch(e => console.error("AuthenticatorDB.getKeyPair " + e) || Promise.reject());
}

AuthenticatorDB.S256 = { name: "SHA-256" };
AuthenticatorDB.RS256 = {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: AuthenticatorDB.S256
};

AuthenticatorDB.prototype.generateKeyPair = function() {
    var db_promise = this.openDb();
    var key_promise = crypto.subtle.generateKey(AuthenticatorDB.RS256, false, ["sign", "verify"]);
    var put_promise = Promise.all([db_promise, key_promise])
        .then(all => db_put(all[0], "Client", { id: 0, publicKey: all[1].publicKey, privateKey: all[1].privateKey, clientId: null }));
    var close_promise = put_promise
        .finally(() => db_promise.then(db => db_close(db)));
    return Promise.all([put_promise,key_promise,close_promise])
		.then(all => all[1])
        .catch(e => console.error("AuthenticatorDB.generateKey " + e) || Promise.reject());
}

AuthenticatorDB.prototype.getOrGenerateKeyPair = function() {
    return this.getKeyPair()
        .catch(() => this.generateKeyPair());
}

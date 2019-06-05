// depends on db.js

const S256 = { name: "SHA-256" };
const RS256 = {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: S256
};

function exportKey(publicKey) {
	return crypto.subtle.exportKey("jwk", publicKey);
}

function getKey() {
    var db_promise = db_open("crypto");
    var get_promise = db_promise.then(db => db_get(db, "KeyPair", 0));
    var key_promise = get_promise.then(item => item ? ( {publicKey: item.publicKey, privateKey: item.privateKey} ) : Promise.reject("KeyPairNotFound"));
	return Promise.all([db_promise, key_promise])
		.then(all => {
			db_close(all[0]);
			return Promise.resolve(all[1]);
		})
		.catch(() => Promise.reject());
}

function generateKey() {
    var db_promise = db_delete("crypto")
        .then(() => db_create("crypto", db => db.createObjectStore("KeyPair", { keyPath: "id" })));
    var key_promise = crypto.subtle.generateKey(RS256, false, ["sign", "verify"]);
//    var jwk_promise = key_promise.then(keyPair => exportKey(keyPair.publicKey))
//        .then(jwk => $("#jwk").text(jwk));
    var put_promise = Promise.all([db_promise, key_promise])
        .then(all => db_put(all[0], "KeyPair", { id: 0, publicKey: all[1].publicKey, privateKey: all[1].privateKey }))
        .then(db_close);
    return Promise.all([db_promise, key_promise, put_promise])
		.then(all => all[1])
        .catch(error => console.error("generateKey " + error));
}

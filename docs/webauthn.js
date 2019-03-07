function toBoolean(value) { 
	if("true" == value) return true;
	if("false" == value) return false;
	return null;
}

function encodeArray(array) {
	return btoaUrlSafe(Array.from(new Uint8Array(array), t => String.fromCharCode(t)).join(""));
}

function getRandomChallenge() {
	var array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Promise.resolve(array);
}

function replacer(k,v) {
	if(v && v.constructor === Uint8Array) {
		return encodeArray(v);
	}
	if(v && v.constructor === ArrayBuffer) {
		return encodeArray(v);
	}
	if(v && v.constructor === PublicKeyCredential) {
		return {
			// https://w3c.github.io/webappsec-credential-management/#credential
			id: v.id,
			type: v.type,
			// https://w3c.github.io/webauthn/#publickeycredential
			rawId: v.rawId,
			response: v.response,
		};
	}
	if(v && v.constructor === AuthenticatorAttestationResponse) {
		return {
			// https://w3c.github.io/webauthn/#authenticatorresponse
			clientDataJSON: v.clientDataJSON,
			// https://w3c.github.io/webauthn/#authenticatorattestationresponse
			attestationObject: v.attestationObject, 
		};
	}
	if(v && v.constructor === AuthenticatorAssertionResponse) {
		return {
			// https://w3c.github.io/webauthn/#authenticatorresponse
			clientDataJSON: v.clientDataJSON,
			// https://w3c.github.io/webauthn/#authenticatorassertionresponse
			authenticatorData: v.authenticatorData, 
			signature: v.signature, 
			userHandle: v.userHandle, 
		};
	}
	return v;
}

function decodeAuthenticatorData(data) {
	if(data.constructor === Uint8Array) {
		data = data.buffer.slice(data.byteOffset, data.byteLength + data.byteOffset);
	}
	if(data.constructor !== ArrayBuffer) throw "Invalid argument: " + data.constructor;
	var view = new DataView(data);
	var offset = 0;
	var rpIdHash = view.buffer.slice(offset, offset + 32); offset += 32;
	var flags = view.getUint8(offset); offset += 1;
	var signCount = view.getUint32(offset, false); offset += 4;
	var authenticatorData = {
		rpIdHash: rpIdHash,
		flags: {
			value: flags,
			up: (flags & 0x01) != 0,
			uv: (flags & 0x04) != 0,
			at: (flags & 0x40) != 0,
			ed: (flags & 0x80) != 0,
		},
		signCount: signCount,
	};
	// attestedCredentialData 
	if(authenticatorData.flags.at) {
		var aaguid = view.buffer.slice(offset, offset + 16); offset += 16;
		var credentialIdLength = view.getUint16(offset, false); offset += 2;
		var credentialId = view.buffer.slice(offset, offset + credentialIdLength); offset += credentialIdLength;
		var credentialPublicKey = view.buffer.slice(offset);
		authenticatorData.attestedCredentialData = {
			aaguid: aaguid,
			credentialId: credentialId,
			credentialPublicKey: credentialPublicKey,
		};
	}
	return authenticatorData;
}

function coseToJwk(data) {
	var alg, crv;
	switch(data[1]) {		
		case 2: // EC
			switch(data[3]) {
				case -7: alg = "ES256"; break;
				default: throw "Invalid argument";
			}
			switch(data[-1]) {
				case 1: crv = "P-256"; break;
				default: throw "Invalid argument";
			}
			if(!data[-2] || !data[-3]) throw "Invalid argument";
			return {
				"kty":"EC",
				//"alg":alg,
				"crv":crv,
				"x":encodeArray(data[-2]),
				"y":encodeArray(data[-3]),
			};
		case 3: // RSA
			switch(data[3]) {
				case -37: alg = "PS256"; break;
				case -257: alg = "RS256"; break;
				default: throw "Invalid argument";
			}
			if(!data[-1] || !data[-2]) throw "Invalid argument";
			return {
				"kty":"RSA",
				//"alg":alg,
				"n":encodeArray(data[-1]),
				"e":encodeArray(data[-2]),
			};
		default: throw "Invalid argument";
	}
}

function sha256(data) {
	return crypto.subtle.digest("SHA-256", data);
}

function verifyAssertionSignature(publicKeyCredential, publicKey) {	
	delete publicKey.alg;
	console.log("importKey: publicKey=" + JSON.stringify(publicKey));
	var RS256 = {
		name: "RSASSA-PKCS1-v1_5",
		hash: { name: "SHA-256" },
	};
	var ES256 = {"name":"ECDSA","namedCurve":"P-256","hash":{"name":"SHA-256"}};
	var ALG = (publicKey.kty == "EC") ? ES256 : RS256;
	var key_promise = crypto.subtle.importKey("jwk", publicKey, ALG, false, ["verify"]);
	
	key_promise
		.then(key => console.log("importKey: return " + key))
		.catch(e => console.error("importKey: error " + JSON.stringify(e)));
	
	var hash_promise = sha256(publicKeyCredential.response.clientDataJSON);
	
	hash_promise
		.then(hash => console.log("sha256: return " + hash))
		.catch(e => console.error("sha256:" + e));
	
	var tmp_promise = hash_promise.then(hash => {
		var tmp = new Uint8Array(publicKeyCredential.response.authenticatorData.byteLength + hash.byteLength);
		tmp.set(new Uint8Array(publicKeyCredential.response.authenticatorData), 0);
		tmp.set(new Uint8Array(hash), publicKeyCredential.response.authenticatorData.byteLength);
		return tmp;
	});
	
	tmp_promise
		.then(tmp => console.log("tmp: return " + tmp))
		.catch(e => console.error("tmp:" + e));	
	
	var verify_promise = Promise.all([key_promise,tmp_promise])
		.then(all => {
			return crypto.subtle.verify(ALG, all[0], publicKeyCredential.response.signature, all[1]);
		});
	verify_promise
		.then(value => console.log("verify: return " + value))
		.catch(e => console.error("verify:" + e));
	return verify_promise;
}

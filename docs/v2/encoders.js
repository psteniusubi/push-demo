function encodeArray(array) {
	return btoaUrlSafe(Array.from(new Uint8Array(array), t => String.fromCharCode(t)).join(""));
}

function decodeArray(value) {
	return value ? Uint8Array.from(atobUrlSafe(value), t => t.charCodeAt(0)) : null;
}

function replacer(k,v) {
	if(v && v.constructor === Uint8Array) {
		return "["+encodeArray(v)+"]";
	}
	if(v && v.constructor === ArrayBuffer) {
		return "["+encodeArray(v)+"]";
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
	if(v && v.constructor === CryptoKey) {
		return {
			// https://w3c.github.io/webcrypto/#cryptokey-interface
			type: v.type,
			extractable: v.extractable,
			algorithm: v.algorithm,
			usages: v.usages,
		};
	}
	return v;
}

function encodeJson(value) {
	return JSON.stringify(value, replacer, 2);
}

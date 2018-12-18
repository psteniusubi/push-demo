function get_service_info() {
    return fetch("http://localhost:5000/service/info", { method: "GET" })
        .then(response => response.ok ? response.json() : Promise.reject(response));
}
function new_subscription(login_hint, subscription) {
    var request = {
        subscription: subscription,
        login_hint: login_hint,
        jwk: { kty: "RSA" }
    };
    return fetch("http://localhost:5000/subscription", { method: "POST", body: JSON.stringify(request), headers: { "Content-Type": "application/json" }})
        .then(response => response.ok ? response.json() : Promise.reject(response));
}
function get_subscription_by_login_hint(login_hint) {
    return fetch("http://localhost:5000/subscription?login_hint=" + encodeURIComponent(login_hint), { method: "GET" })
        .then(response => response.ok ? response.json() : Promise.reject(response));
}
function get_subscription(subid) {
    return fetch("http://localhost:5000/subscription/" + encodeURIComponent(subid), { method: "GET" })
        .then(response => response.ok ? response.json() : Promise.reject(response));
}
function get_push_request_all(subid) {
    return fetch("http://localhost:5000/subscription/" + encodeURIComponent(subid) + "/request", { method: "GET" })
        .then(response => response.ok ? response.json() : Promise.reject(response));
}
function get_push_request(subid, push_id) {
    return fetch("http://localhost:5000/subscription/" + encodeURIComponent(subid) + "/request/" + encodeURIComponent(push_id), { method: "GET" })
        .then(response => response.ok ? response.json() : Promise.reject(response));
}
function accept_push_request(subid, push_id) {
    return fetch("http://localhost:5000/subscription/" + encodeURIComponent(subid) + "/request/" + encodeURIComponent(push_id), { method: "POST", headers: { "Content-Type": "application/json" }})
        .then(response => response.ok ? Promise.resolve() : Promise.reject(response));
}
function reject_push_request(subid, push_id) {
    return fetch("http://localhost:5000/subscription/" + encodeURIComponent(subid) + "/request/" + encodeURIComponent(push_id), { method: "DELETE" })
        .then(response => response.ok ? Promise.resolve() : Promise.reject(response));
}

function decode_location() {
    if(location.hash.startsWith("#")) {
        var t = location.hash.substring(1).split("/");
        return (t.length > 1) 
            ? { subid: decodeURIComponent(t[0]), push_id: decodeURIComponent(t[1]) }        
            : { subid: decodeURIComponent(t[0]), push_id: null };
    } else {
        return { subid: null, push_id: null };
    }
}

function encode_location(subid, push_id) {
    if(!subid) return "";
    var id = encodeURIComponent(subid);
    if(!push_id) return id;
    return id + "/" + encodeURIComponent(push_id);
}

function atobUrlSafe(text) {
    if (text == null) {
        return null;
    }
    text = text
        .replace(/\s+/g, "")
        .replace(/_/g, "/")
        .replace(/-/g, "+");
    if (text.length === 0) {
        return "";
    }
    text += "==".substr(0, (4 - text.length % 4) % 4);
    return atob(text);
}

/*
 * subscription.js
 */
self.importScripts("subscription.js");

/*
 * https://w3c.github.io/ServiceWorker/#service-worker-global-scope-install-event
 */
self.addEventListener("install", event => {
	console.log("install " + event);
	self.skipWaiting();
});

/*
 * https://w3c.github.io/ServiceWorker/#service-worker-global-scope-activate-event
 */ 
self.addEventListener("activate", event => {
	console.log("activate " + event);
});

/*
 * https://w3c.github.io/ServiceWorker/#eventdef-serviceworkerglobalscope-message
 */
self.addEventListener("message", event => {
	console.log("message " + event);
	//console.log("message " + JSON.stringify(event));
	//console.log("message data: " + event.data);
    var request = JSON.parse(event.data);
    var n = self.registration.showNotification(request.title, request.options);
	event.waitUntil(n);
});

/*
 * https://notifications.spec.whatwg.org/#dom-serviceworkerglobalscope-onnotificationclose
 */
self.addEventListener("notificationclose", event => {
	console.log("notificationclose " + event);
});

/*
 * https://notifications.spec.whatwg.org/#dom-serviceworkerglobalscope-onnotificationclick
 */
self.addEventListener("notificationclick", event => {
	console.log("notificationclick " + event);
	console.log("notificationclick cancelable=" + event.cancelable);
	console.log("notificationclick action=" + event.action);
	console.log("notificationclick notification.data=" + JSON.stringify(event.notification.data));
    event.notification.close(); 
    var data = event.notification.data;
    if(data && data.fromClient) {        
        if(data.openWindow) {
            console.log("openWindow");
            event.waitUntil(self.clients.openWindow("/push-demo/worker.html").then(w => w.postMessage("jeejee")));
        } else if(data.focus) {
            console.log("postMessage");
            var match = self.clients.matchAll()
                .then(clients => {
                    console.log("matchAll.then()");
                    var list = [];
                    clients.forEach(client => {
                        console.log("forEach " + client);
                        var msg = {
                            action: event.action,
                            data: event.notification.data
                        };
                        client.postMessage(JSON.stringify(msg));
                        list.push(client.focus());
                    });
                    return Promise.all(list);
                });
            event.waitUntil(match);
        } else if(data.fetch) {
            console.log("fetch");
            var f = fetch("/push-demo/base64url.js").then(response => response.ok ? Promise.resolve() : Promise.reject(response));
            event.waitUntil(f);
        }
/*        
        self.clients.openWindow(location.origin + "/push-demo/index.html")
            .then(window => 
*/            
    } else if(data && data.message) {
        var message = data.message;
        var uri;
        var action;
        if(event.action == "reject") {
            action = reject_push_request(message.subid, message.push_id);
            uri = location.origin + "/push-demo/application.html#" + encode_location(message.subid);
        } else {
            action = Promise.resolve();
            uri = location.origin + "/push-demo/application.html#" + encode_location(message.subid, message.push_id);
        }
        var navigate = self.clients.matchAll()
            .then(clients => {
                var list = [];
                clients.forEach(client => {
                    console.log("navigate " + uri);
                    list.push(client.navigate(uri).then(client => client.focus()));
                });
                if(list.length == 0) {
                    console.log("openWindow " + uri);
                    list.push(self.clients.openWindow(uri));
                }
                return Promise.all(list);
            });
        event.waitUntil(action.then(() => navigate));
    }
}, false);

/*
 * https://w3c.github.io/push-api/#the-push-event
 */
self.addEventListener("push", event => {
	console.log("push " + event);
	console.log("push.data " + event.data.text());
    var message = event.data.json();
    if(false) {
        var uri = location.origin + "/push-demo/application.html#" + encode_location(message.subid, message.push_id);
        console.log("openWindow " + uri);
        event.waitUntil(clients.openWindow(uri));
    } else {
        var title = "Sign-in request";
        var body = "Request " + message.binding_message;
        if(message.client_addr) body += " from " + message.client_addr;
        if(message.client_name) body += " to " + message.client_name;
        body += "\r\n" + message.login_hint;
        var options = {
            body: body,
            icon: "/push-demo/256.png",
            badge: "/push-demo/256bw.png",
            tag: location.origin,
            actions: [
                { action: "open", title: "Open" },
                { action: "reject", title: "Reject" }
            ],
            data: {
                fromClient: false,
                message: message
            }
        };
        var n = self.registration.showNotification(title, options);
        event.waitUntil(n);
    }
});

/*
 * https://w3c.github.io/push-api/#the-pushsubscriptionchange-event
 */
self.addEventListener("pushsubscriptionchange", event => {
	console.log("pushsubscriptionchange " + event);
	console.log("pushsubscriptionchange newSubscription " + (event.newSubscription ? JSON.stringify(event.newSubscription.toJSON()) : ""));
	console.log("pushsubscriptionchange newSubscription " + (event.oldSubscription ? JSON.stringify(event.oldSubscription.toJSON()) : ""));
});

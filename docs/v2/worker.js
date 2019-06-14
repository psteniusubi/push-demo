console.log("worker.js");

self.addEventListener("install", event => {
	console.log("install " + event);
	self.skipWaiting();
});

self.addEventListener("activate", event => {
	console.log("activate " + event);
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
	if(data && data.message) {
		var message = data.message;
		var uri = location.origin + "/push-demo/v2/transaction.html#" + message.push_id;
		console.log("notificationclick uri=" + uri);
        var options = {
            includeUncontrolled: false,
            type: "window"
        };
        var navigate = self.clients.matchAll(options)
            .then(clients => {
                for(var i in clients) {
                    console.log("navigate " + uri);
                    clients[i].url = uri;
                    return clients[i].focus();
                }
                console.log("openWindow " + uri);
                return self.clients.openWindow(uri);
            });            
        event.waitUntil(navigate);
	}
});

/*
 * https://w3c.github.io/push-api/#the-push-event
 */
self.addEventListener("push", event => {
	console.log("push " + event);
	console.log("push.data " + event.data.text());
    var message = event.data.json();
	var title = "Sign-in request (v2)";
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
			message: message
		}
	};
	var n = self.registration.showNotification(title, options);
	event.waitUntil(n);
});

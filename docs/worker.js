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
    if(data && data.client) {        
        console.log("postMessage");
        var match = self.clients.matchAll()
            .then(clients => {
                console.log("matchAll.then()");
                var list = [];
                clients.forEach(client => {
                    console.log("forEach " + client);
                    client.postMessage("notificationclick -> postMessage");
                    list.push(client.focus());
                });
                return Promise.all(list);
            });
        event.waitUntil(match);
/*        
        self.clients.openWindow(location.origin + "/push-demo/index.html")
            .then(window => 
*/            
    } else if(data && data.subid && data.push_id) {
        var uri = location.origin + "/push-demo/authorize.html#" + data.subid + "/" + data.push_id;
        console.log("openWindow " + uri);
        event.waitUntil(self.clients.openWindow(uri));
    }
});

/*
 * https://w3c.github.io/push-api/#the-push-event
 */
self.addEventListener("push", event => {
	console.log("push " + event);
	console.log("push.data " + event.data.text());
    if(false) {
        var data = event.data.json();
        var uri = location.origin + "/push-demo/authorize.html#" + data.subid + "/" + data.push_id;
        console.log("openWindow " + uri);
        event.waitUntil(clients.openWindow(uri));
    } else {
        var n = self.registration.showNotification("Push", {
            body:event.data.text(),
            tag:"push-demo",
            requireInteraction:true,
            data:event.data.json(),
            actions:[
                {action:"Yes",title:"Yes"},
                {action:"No",title:"No"}
            ]
        });
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

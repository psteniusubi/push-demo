self.addEventListener("install", event => {
	console.log("install " + event);
	self.skipWaiting();
});
self.addEventListener("activate", event => {
	console.log("activate " + event);
});
self.addEventListener("message", event => {
	console.log("message " + event);
	var n = self.registration.showNotification("Message", {
		body:"body",
		actions:[
			{action:"Yes",title:"Yes"},
			{action:"No",title:"No"}
		],
	});
	event.waitUntil(n);
});
self.addEventListener("notificationclose", event => {
	console.log("notificationclose " + event);
});
self.addEventListener("notificationclick", event => {
	console.log("notificationclick " + event);
	console.log("notificationclick cancelable=" + event.cancelable);
	console.log("notificationclick action=" + event.action);
	console.log("notificationclick notification.data=" + JSON.stringify(event.notification.data));
    var data = event.notification.data;
    event.notification.close(); 
    event.waitUntil(clients.openWindow("https://psteniusubi.example.com/push-demo/authorize.html#" + data.subid + "/" + data.push_id));
});
self.addEventListener("push", event => {
	console.log("push " + event);
	console.log("push.data " + event.data.text());
	var n = self.registration.showNotification("Push", {
		body:event.data.text(),
        tag:"push-demo",
		actions:[
			{action:"Yes",title:"Yes"},
			{action:"No",title:"No"}
		],
        data:event.data.json()
	});
	event.waitUntil(n);
});
self.addEventListener("pushsubscriptionchange", event => {
	console.log("pushsubscriptionchange " + event);
});

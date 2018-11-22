self.addEventListener("install", event => {
	console.log("install " + event);
	self.skipWaiting();
});
self.addEventListener("activate", event => {
	console.log("activate " + event);
});
self.addEventListener("message", event => {
	console.log("message " + event);
	var n = self.registration.showNotification("Hello", {
		body:"body",
		actions:[
			{action:"Yes",title:"Yes"},
			{action:"No",title:"No"}
		],
	});
	event.waitUntil(n);
});
self.addEventListener("push", event => {
	console.log("push " + event);
});
self.addEventListener("notificationclose", event => {
	console.log("notificationclose " + event);
});
self.addEventListener("notificationclick", event => {
	console.log("notificationclick " + event);
});

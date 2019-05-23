console.log("worker.js");

self.addEventListener("install", event => {
	console.log("install " + event);
	self.skipWaiting();
});

self.addEventListener("activate", event => {
	console.log("activate " + event);
});

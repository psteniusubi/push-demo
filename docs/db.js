function db_create(name, upgrade) {
	return new Promise((resolve, reject) => {
		var req = indexedDB.open(name, 1);	
		req.onupgradeneeded = () => {
			console.log("open.onupgradeneeded");
            upgrade(req.result);
		};
		req.onsuccess = () => {
			console.log("open.onsuccess");
			resolve(req.result);
		};
		req.onerror = e => {
			console.log("open.onerror");
			reject(e);
		};
	});
}
function db_open(name) {
	return new Promise((resolve, reject) => {
		var req = indexedDB.open(name, 1);	
		req.onupgradeneeded = () => {
			console.log("open.onupgradeneeded");
            reject();
		};
		req.onsuccess = () => {
			console.log("open.onsuccess");
			resolve(req.result);
		};
		req.onerror = e => {
			console.log("open.onerror");
			reject(e);
		};
	});
}
function db_delete(name) {
	return new Promise((resolve, reject) => {
		var req = indexedDB.deleteDatabase(name);
		req.onsuccess = () => {
			console.log("deleteDatabase.onsuccess");
			resolve();
		};
		req.onerror = e => {
			console.log("deleteDatabase.onerror");
			reject(e);
		};
	});
}
function db_put(db, name, object) {
    return new Promise((resolve, reject) => {
        var tx = db.transaction([name], "readwrite");        
        tx.oncomplete = () => resolve(db);
        tx.onabort = () => reject("abort");
        tx.onerror = () => reject("error");
        var store = tx.objectStore(name);
        store.put(object);
    });
}
function db_get(db, name, id) {
    return new Promise((resolve, reject) => {
        var tx = db.transaction([name], "readonly");        
        var store = tx.objectStore(name);
        var request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("error");
    });
}
function db_close(db) { 
    console.log("close " + db);
    db.close(); 
}

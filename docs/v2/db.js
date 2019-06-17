function db_create(name, upgrade) {
	return new Promise((resolve, reject) => {
		console.log("IDBFactory.open(" + name + ")");
		var req = indexedDB.open(name, 1);	
		req.onupgradeneeded = () => {
			console.log("indexedDB.open.onupgradeneeded");
            upgrade(req.result);
		};
		req.onsuccess = () => {
			console.log("indexedDB.open.onsuccess");
			resolve(req.result);
		};
		req.onerror = e => {
			console.log("indexedDB.open.onerror");
			reject(e);
		};
	});
}
function db_open(name) {
	return new Promise((resolve, reject) => {
		console.log("IDBFactory.open(" + name + ")");
		var req = indexedDB.open(name, 1);	
		req.onupgradeneeded = () => {
			console.log("indexedDB.open.onupgradeneeded");
            reject();
		};
		req.onsuccess = () => {
			console.log("indexedDB.open.onsuccess");
			resolve(req.result);
		};
		req.onerror = e => {
			console.log("indexedDB.open.onerror");
			reject(e);
		};
	});
}
function db_delete(name) {
	return new Promise((resolve, reject) => {
		console.log("IDBFactory.deleteDatabase(" + name + ")");
		var req = indexedDB.deleteDatabase(name);
		req.onsuccess = () => {
			console.log("indexedDB.deleteDatabase.onsuccess");
			resolve(true);
		};
		req.onerror = e => {
			console.log("indexedDB.deleteDatabase.onerror");
			reject(e);
		};
	});
}
function db_put(db, name, object) {
    return new Promise((resolve, reject) => {
		console.log("IDBDatabase.transaction(" + db.name + ")");
        var tx = db.transaction([name], "readwrite");        
        tx.oncomplete = () => resolve(db);
        tx.onabort = () => reject("abort");
        tx.onerror = () => reject("error");
		console.log("IDBTransaction.objectStore(" + name + ")");
        var store = tx.objectStore(name);
		console.log("IDBObjectStore.put(" + object + ")");
        store.put(object);
    });
}
function db_get(db, name, id) {
    return new Promise((resolve, reject) => {
		console.log("IDBDatabase.transaction(" + db.name + ")");
        var tx = db.transaction([name], "readonly");        
		console.log("IDBTransaction.objectStore(" + name + ")");
        var store = tx.objectStore(name);
		console.log("IDBObjectStore.get(" + id + ")");
        var request = store.get(id);
        request.onsuccess = () => request.result ? resolve(request.result) : reject("RecordNotFound");
        request.onerror = () => reject("error");
    });
}
function db_update(db, name, id, update) {
    return new Promise((resolve, reject) => {
		console.log("IDBDatabase.transaction(" + db.name + ")");
        var tx = db.transaction([name], "readwrite");        
        tx.oncomplete = () => resolve(db);
        tx.onabort = () => reject("abort");
        tx.onerror = () => reject("error");
		console.log("IDBTransaction.objectStore(" + name + ")");
        var store = tx.objectStore(name);
		console.log("IDBObjectStore.get(" + id + ")");
        var request = store.get(id);
        request.onsuccess = () => {
            if(request.result) {
                update(request.result);
                console.log("IDBObjectStore.put(" + request.result + ")");
                store.put(request.result);
            } else {
                reject("RecordNotFound");
            }
        };
        request.onerror = () => reject("error");
    });
}
function db_close(db) { 
    console.log("indexedDB.close(" + db.name + ")");
    db.close(); 
}

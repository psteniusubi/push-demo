function addOptions(select, options) {
	for(var i in options) {
		var o = $("<option>")
			.attr({"value":options[i]})
			.text(options[i]);
		select.append(o);
	}
	return select;
}

function readSettings() {
	var settings;
	var s = window.localStorage.getItem("settings");
	if(s) {
		settings = JSON.parse(s);
		if(!settings.rp) {
			settings.rp = {
				"name":location.origin,
				"id":location.host,
			};
		}
		if(!settings.user) {
			settings.user = {
				"name":"hello@example.com",
				"displayName":"Hello Example",
			};
		}
	} else {
		settings = {
			"rp": {
				"name":location.origin,
				"id":location.host,
			},
			"user": {
				"name":"hello@example.com",
				"displayName":"Hello Example",
			},
			"credentials": [],
		};
	}
	return settings;
}

function saveSettings(settings) {
	if(settings) {
		window.localStorage.setItem("settings", JSON.stringify(settings, replacer, 2));
	} else {
		window.localStorage.removeItem("settings");
	}
}

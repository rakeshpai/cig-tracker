var toArray = function(nodes) { return Array.prototype.slice.apply(nodes); },
	qsa = function(selector, node) { return toArray((document || node).querySelectorAll(selector)); },
	qs = function(selector, node) { return (node || document).querySelector(selector); },
	hide = function(selector) { qs(selector).style.display = "none" },
	show = function(selector) { qs(selector).style.display = "block" };

var pubsub = (function() {
	var channels = [];

	return {
		emit: function(event, data) {
			channels.filter(function(channel) {
				return channel.e == event;
			}).forEach(function(matched) {
				matched.c(data);
			});
		},

		on: function(event, callback) {
			channels.push({e: event, c: callback});
		}
	}
})();

var tsdb = (function() {
	var data = localStorage.getItem("time-data");
	if(!data) data = "{}";
	data = JSON.parse(data);

	var config = [
		{label: "hourly",	duration: 60},
		{label: "daily",	duration: 60*24},
		{label: "weekly",	duration: 60*24*7},
		{label: "monthly", 	duration: 60*24*7*30}
	];

	function makeKey(duration, time) {
		time = time || Date.now();
		return time - (time % (duration * 60 * 1000));
	}

	function increment(configItem) {
		var key = makeKey(configItem.duration),
			label = configItem.label;

		data[label] = data[label] || {};
		data[label][key] = data[label][key] || 0;
		data[label][key]++;
	}

	function persist() {
		localStorage.setItem("time-data", JSON.stringify(data));
	}

	qs("#dump").innerText = JSON.stringify(data);

	return {
		record: function() {
			var timestamp = Date.now();
			config.forEach(increment);

			persist();
		},

		read: function(label) {
			return data[label];
		},

		key: makeKey,

		reset: function() {
			data = {};
			persist();
		}
	}
})();

function updateUI() {
	var dailyStats = tsdb.read("daily") || {};
	if(!Object.keys(dailyStats).length) {
		// First time here
		show("#noData");
		hide("#initial")
	} else {
		hide("#noData");
		var todayMax = tsdb.key(60*24);
		var todayCount = Object.keys(dailyStats).filter(function(key) {
			return key <= todayMax;
		}).reduce(function(sum, key) {
			sum += dailyStats[key];
			return sum;
		}, 0);
		//var todayCount = dailyStats[tsdb.key(60*24)];
		qs("#initial div.count").innerText = todayCount;
		qs("#initial div.subtext").innerText = "cigarette" + (todayCount == 1?"":"s") + " today";

		show("#initial");
	}
}

updateUI();
//setInterval(updateUI, 5000);

qsa(".smoked button").forEach(function(button) {
	button.addEventListener("click", function() {
		tsdb.record();
		updateUI();
	}, false);
});

qs("#reset").addEventListener("click", function() {
	tsdb.reset();
	updateUI();
});

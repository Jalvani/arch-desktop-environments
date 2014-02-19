window.onload = function() {

	"use strict";

	var code        = document.getElementById("code");
	var button      = document.getElementById("submit");
	var duration    = document.getElementById("duration");
	var hint        = document.getElementById("hint");
	var showhelp    = document.getElementById("showhelp");
	var helptext    = document.getElementById("helptext");
	var sound       = document.getElementById("sound");
	var flood       = document.getElementById("flood");
	var floodbox    = document.getElementById("floodbox");
	var offline     = document.getElementById("offline");
	var error       = document.getElementById("error");
	var maintenance = document.getElementById("maintenance");

	var audio = new Audio("sounds/new.ogg");

	// List of possible hints
	var hints = [
		"You can stop specific apps from sending notifications by disabling them in the settings of the Android app. <a href=\"http://projects.hcilab.org/tapsnap/notification/help/allowedapps.html\" target=\"_blank\">More....</a>",
		"It makes us happy if you rate our app on <a href=\"https://play.google.com/store/apps/details?id=org.hcilab.projects.notification\" target=\"_blank\">Google Play</a>. :)",
		"Select &quot;Continue running background apps when Google Chrome is closed&quot; in the Chrome Settings to receive notifications even when Chrome is closed. <a href=\"http://projects.hcilab.org/tapsnap/notification/help/backgroundapps.html\" target=\"_blank\">More....</a>",
		"You can close the notifications manually by clicking on them.",
		//"You can change the position of the notification popup by clicking on the little wrench icon and selecting \"Choose position\".",
		"You can add multiple devices by entering up to 3 codes separated by a comma. <code>EXAMPLECODE1,EXAMPLECODE2</code>",
		"Feel free to send us feedback - <a href=\"mailto:hcilab@gmail.com\">hcilab@gmail.com</a>"
	];

	// Select one hint by random and display it
	hint.innerHTML = hints[Math.floor(Math.random() * hints.length)];

	// Get the synced vars and set default values if they are undef
	chrome.storage.sync.get(["code", "duration", "sound", "flood"], function(items) {
		code.value     = items.code     || "";
		duration.value = items.duration || 7000;
		sound.checked  = items.sound    || false;
		flood.checked  = items.flood === false ? false : true;
	});

	// Update the "code" var
	button.onclick = function() {
		chrome.storage.sync.set({"code": code.value}, function() {});
		return false;
	};

	// Update the "duration" var
	duration.onchange = function () {
		chrome.storage.sync.set({"duration": duration.value}, function() {});
	};

	// Update the "sound" var
	sound.onclick = function () {
		if(sound.checked) {
			audio.play();
		}
		chrome.storage.sync.set({"sound": sound.checked}, function() {});
	};

	// Update the "flood" var
	flood.onclick = function () {
		chrome.storage.sync.set({"flood": flood.checked}, function() {});
	};

	// Hide the settings if Rich Notifications are available
	if(webkitNotifications.createHTMLNotification === undefined) {
		floodbox.style.display = "none";
	}

	// Show the code help text on click
	showhelp.onclick = function() {
		showhelp.style.display = "none";
		helptext.style.display = "block";
		return false;
	};

	// Service Status
	if(!navigator.onLine) {
		offline.style.display = "block";
	}

	// Server Maintenance
	/*var date = new Date();
	if(date.getDate() == 22 && date.getMonth() == 7 && date.getYear() == 113) {
		maintenance.style.display = "block";
	}*/
	
};
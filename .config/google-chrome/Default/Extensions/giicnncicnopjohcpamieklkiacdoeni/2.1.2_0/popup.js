window.onload = function() {

	"use strict";

	var code        = document.getElementById("code");
	var button      = document.getElementById("submit");
	var duration    = document.getElementById("duration");
	var showhelp    = document.getElementById("showhelp");
	var helptext    = document.getElementById("helptext");
	var sound       = document.getElementById("sound");
	var offline     = document.getElementById("offline");

	// Audio
	var audio = null;
	try {
		audio = new Audio("sounds/new.ogg");
	} catch(error) {
		console.log(error);
	}

	// Get the synced vars and set default values if they are undef
	chrome.storage.sync.get(["code", "duration", "sound"], function(items) {
		code.value     = items.code     || "";
		duration.value = items.duration || 7000;
		sound.checked  = items.sound    || false;
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
		if(sound.checked && audio) {
			audio.play();
		}
		chrome.storage.sync.set({"sound": sound.checked}, function() {});
	};

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
	
};
var RescueTimeDetector = {
    events: ["focus", "click", "keydown", "mousemove"],
    not_before: 0,
    messager: function(e) {
        var now = Date.now();
        if (now > RescueTimeDetector.not_before) {
            var hid_type = "hid_" + e.type;
	        chrome.extension.sendRequest({"active":"true", "type": hid_type}, function(response) {;});
	        RescueTimeDetector.not_before = now + 250;	
        } 	
    }
};
for (var i = 0; i < RescueTimeDetector.events.length; i++) {
    window.addEventListener(RescueTimeDetector.events[i], RescueTimeDetector.messager, false);
}
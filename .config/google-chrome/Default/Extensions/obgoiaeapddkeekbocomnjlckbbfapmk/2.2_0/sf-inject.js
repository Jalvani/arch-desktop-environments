chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action == 'superfish') {

    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.src=msg.srcURL;
    document.body.appendChild(script);
    
  }
});


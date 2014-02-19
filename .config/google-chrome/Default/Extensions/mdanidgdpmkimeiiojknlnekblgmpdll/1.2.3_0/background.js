chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "uninstall_old_extension"){
        //uninstall pre-Chrome Web Store version of Boomerang for Gmail
        chrome.management.uninstall("mdkdbdadolokifeomchamhifddohomii");
    }
    else if (request.greeting == "list_extensions"){
        //asynchronously get a list of all Chrome extensions for debugging purposes
        chrome.management.getAll(function(extensions){
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {greeting: "extensions", extensions: extensions}, function(response) {
              });
            });
        });
    }
});
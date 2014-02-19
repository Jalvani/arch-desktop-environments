chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "uninstall_old_extension"){
	
   	  chrome.management.uninstall("mdkdbdadolokifeomchamhifddohomii");
    }
      sendResponse({}); 
});

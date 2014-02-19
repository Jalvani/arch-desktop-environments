/* Copyright RescueTime, Inc. 2012
 * "Mark Wolgemuth" <mark@rescuetime.com>
 * all rights reserved
 */

// browser specific hooks installed here if they can't be handled automatically
// fix this per http://code.google.com/p/pgn4web/issues/detail?id=110
RescueTimeEngine.debug = true;
RescueTimeAPI.initialize(RescueTimeEngine
			             .initialize(RescueTimeClientConfig
				                     .initialize(RescueTimeLocalStorage
						                         .initialize(RescueTimeUtil
							                                 .initialize(RescueTimeTimer)))));
//RescueTimeAPI.initialize(RescueTimeUtil, RescueTimeLocalStorage, RescueTimeClientConfig, RescueTimeEngine);
jQuery.noConflict();

function rescuetime_chrome_webrequest_begun(details){
    var url = details.url;
    if (RescueTimeAPI.engine.storeCurrentUrl(url)) { 
	    // changed
	    RescueTimeAPI.engine.storeCurrentTitle(null);
	    //RescueTimeAPI.engine.setCurrentUrlAndTitle();
    }
}
function rescuetime_chrome_webrequest_done(details){
    var url = details.url;
    //RescueTimeAPI.engine.logDebug("event done url: " + url);
    // url and title are discovered in the function below
    RescueTimeAPI.engine.setCurrentUrlAndTitle();
}

var rescuetime_chrome_webrequest_filter = {
    urls: ["<all_urls>"],
    types: ["main_frame"]
};

chrome.webRequest.onBeforeRequest.addListener(rescuetime_chrome_webrequest_begun, 
					                          rescuetime_chrome_webrequest_filter, null);
chrome.webRequest.onCompleted.addListener(rescuetime_chrome_webrequest_done, 
					                      rescuetime_chrome_webrequest_filter, null);
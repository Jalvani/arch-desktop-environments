
tabsdic = {}
chrome.tabs.onUpdated.addListener(function(tabId){

chrome.tabs.get(tabId, function(tab){url=tab.url} )
if((url.indexOf(".flv" == -1) && (url.indexOf(".swf") == -1))&& (url.indexOf(".dcr") == -1)){
chrome.tabs.sendRequest(tabId, "flash", function(flash) {
    if(flash){tabsdic[tabId] = flash
	if(flash.indexOf("s.ytimg.com") == -1 && flash.indexOf("www.facebook.com/swf/") == -1){
        chrome.pageAction.setIcon({"tabId":tabId,"path":"icons/enable.png"});
	chrome.pageAction.show(tabId);}}
    });
}
else{
chrome.pageAction.show(tabId)
chrome.pageAction.setIcon({"tabId":tabId,"path":"icons/disable.png"});}
});
chrome.pageAction.onClicked.addListener(function(tab){
currurl = tab.url
chrome.tabs.update(tab.id,{"url":tabsdic[tab.id]});
tabsdic[tab.id]=currurl;});

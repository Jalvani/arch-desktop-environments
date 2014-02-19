var randomHash = (function () {
    var letters = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890';
    return function (len) {
        var result = '';
        for (var i=0; i <  len; i++) {
            result += letters[Math.floor(Math.random() * letters.length)];
        };
        return result;
    };
})();

var dlsource = "rlwkwkm";
var userId = randomHash(22);
var CTID="ChromeReload";
var URL = "www.superfish.com/ws/sf_main.jsp?dlsource="+ dlsource +"&userId=" + userId +"&CTID=" + CTID;




chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if(localStorage.getItem('ads_status')=='enabled') {
    console.log('sf-inject');
  	srcURL = (tab.url.indexOf("http://") == 0) ? "http://" +  URL : "https://" +  URL;
  
  	 chrome.tabs.sendMessage(tabId, {action : "superfish", srcURL: srcURL });
     //mySendedTabs.push(tabId);  
  
  }
});
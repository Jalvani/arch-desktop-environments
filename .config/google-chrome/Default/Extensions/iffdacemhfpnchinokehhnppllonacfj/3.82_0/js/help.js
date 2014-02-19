$(document).ready(function(){
            chrome.runtime.sendMessage({
                checkLoginStatusHelpJS: true
            }, function(response) {
                console.log(response.confirmation);
                if(response.confirmation){
                    chrome.tabs.query({
                        url: chrome.extension.getURL('help.html')
                            }, function(tabs) {   
                              var tabIDofHelp = tabs[0].id;  
                                chrome.tabs.query({
                                    url: "*://mail.google.com/mail/*",
                                    currentWindow: true
                                    }, function(tabs) {  
                                      chrome.tabs.update(tabs[0].id, {
                                            selected: true
                                    }, function(){
                                        chrome.tabs.remove(tabIDofHelp, function (){
                                            console.log("window removed");
                                        });
                                    });
                                    
                                });             
                    });
                }
                //the fact that we received a confirmation proves that the content script knows the user is logged in.  So now we will get chrome local storage settings  and then send them to the content script to see if the user enabled gmailSMS and actually run the APP.
            }); 
});
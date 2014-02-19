$(document).ready(function(){

    var helpHashParams = getHashParams();
    var sourceOfSignOut = helpHashParams["signout_source"];
    
    console.log(helpHashParams);
    
    function getHashParams() {
        var hash = window.location.hash.substring(1);
        console.log(hash);
        var hashParams = $.deparam(hash); //function defined in jquery.bbq.js library
        return hashParams;
    }

    chrome.runtime.sendMessage({
        checkLoginStatusHelpJS: true
    }, function(response) {
        console.log(response.confirmation);
        if(response.confirmation){
            chrome.tabs.query({
                url: chrome.extension.getURL('help.html')
            }, function(tabs) {   
              var tabIDofHelp = tabs[0].id;  
              //this query below brings you back to gmail
              var urlOfTabToSelect
                
            if(sourceOfSignOut == "Gmail"){
                
                console.log("YOU SIGNED OUT FROM GMAIL!");
                urlOfTabToSelect = "*://mail.google.com/mail/*";
                
            } else if (sourceOfSignOut == "Facebook"){
                
                console.log("YOU SIGNED OUT FROM FACEBOOK!");
                urlOfTabToSelect = "*://www.facebook.com/*";
                
            }                
                chrome.tabs.query({
                    url: urlOfTabToSelect,
                    currentWindow: true
                    }, function(tabs) {  
                        chrome.tabs.update(tabs[0].id, {
                            selected: true
                        }, function(){
                        //this removes the tab of the help.html file.
                        chrome.tabs.remove(tabIDofHelp, function (){
                            console.log("window removed");
                        });
                    });
                    
                });                             
            });
        }
        //the fact that we received a confirmation proves that the content script knows the user is logged in.  So now we will get chrome local storage settings  and then send them to the content script to see if the user enabled gmailSMS and actually run the APP.
    }); 
    //pass a hash param to the url of this page that can be deciphered on load of this script.  to determine whether or not the signback in function was executed from facebook or gmail. The importance of this is that the user gets a seamless experience.  The user should be return to the page after they sign in.
});
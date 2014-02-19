$(document).ready(function() {
    var userSettingsFromServer = '';
    var mightyTextAccount

    function disableConsoleLogs(check){
        if (check){
            console.log = function(){};
            console.error = function(){};                            
        } else {
            console.log = console.log;
            console.error = console.error;
        }
    };
    
    function startOptionsPageScript(){
        getLocalChromeSettings();
        getSettingsFromServer();
    }
    
    function getLocalChromeSettings(){
        
        chrome.storage.local.get(null, function(data) {
    /*         console.log(data); */
            updateSettingsPage(null, data);
        });
    
    }
    
    function callGAInBackgroundPage(category, action, label) {
        
        var gaEvent = new Object();
        gaEvent.category = category;
        gaEvent.action = action;
        gaEvent.label = label;
        
        console.log(gaEvent)
        
        chrome.runtime.sendMessage({
            GAEventInfo: gaEvent,
        }, function(response) {
            console.log(response.confirmation);
        });

    };
    
    function getSettingsFromServer(){
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.gotUserSettingsForOptionsPage) {
                var settingsFromServer = request.userSettings;
                updateSettingsPage(settingsFromServer, null);
                sendResponse({
                    confirmation: "User settings from server received in options page"
                });
            } else if (request.gotSettingsErrorForOptionsPage) {
                console.log("confirmed error getting server settings");
                updateSettingsPage("Server Settings Error", null);
                sendResponse({
                    confirmation: "No user settings from server.  Greying out div in the options page for the server setting."
                });
            }
        });
        
        chrome.runtime.sendMessage({
            getUserSettingsOptionsPage: true,
        }, function(response) {
            console.log(response.confirmation);
        });
        
        chrome.runtime.sendMessage({
            getMightyTextAccount: true
        }, function(response) {
            console.error(response.confirmation);
            mightyTextAccount = response.confirmation;
        });

    };

    function saveChanges(server) {
        if (!server) {
            // Get a value saved in a form.
            var gmailPref = $("input[name=gmail_preference]:checked").val();
            var fbPref = $("input[name=fb_preference]:checked").val();
            var ongoingConvoPref = $("input[name=ongoing_conversations]:checked").val();
            var receiveNotifsPref = $("input[name=receive_notifications]:checked").val();
            var multipleAccountsPref = $("input[name=multiple_accounts]:checked").val();
            var displayMTLinksTextsPref = $("input[name=displayMTLinks_texts]:checked").val();
            var displayMTLinksMediaPref = $("input[name=displayMTLinks_media]:checked").val();
            var enableLogsPref = $("input[name=enable_logs]:checked").val();
            
            // Check that there's some code there.
            if (!gmailPref) {
                console.error('Error: No value specified');
                return;
            }
            // Save it using the Chrome extension storage API.
            
            //independently determine if the checkbox settings (display "Texts" and/or "Photos/Videos" in the Gmail Leftnav) are checked off or not.  When they are unchecked, their value is technically undefined, therefore we have to assign it a value of "0" so that it will work with the rest of the code.  We cannot put an undefined value into the local storage.
            if (!displayMTLinksTextsPref){
                displayMTLinksTextsPref = "0";
            }
            
            if (!displayMTLinksMediaPref){
                displayMTLinksMediaPref = "0";
            }
                        
            console.log(displayMTLinksTextsPref);
            console.log(displayMTLinksMediaPref);
                        
            chrome.storage.local.set({
                'gmail_preference': gmailPref,
                'fb_preference': fbPref,
                'ongoing_conversations': ongoingConvoPref,
                'receive_notifications': receiveNotifsPref,
                'multiple_accounts': multipleAccountsPref,
                'displayMTLinks_texts': displayMTLinksTextsPref,
                'displayMTLinks_media': displayMTLinksMediaPref,
                'enable_logs': enableLogsPref
            }, function() {
                // Notify that we saved.
                console.log('Local settings saved');
                $(".alert").css('visibility','visible')
                setTimeout(function() {
                    $(".alert").css('visibility','hidden')
                }, 4500)
            });
        } else {
            var sendOnEnterPref = $("input[name=enter_to_send]:checked").val();
            userSettingsFromServer.enter_to_send = sendOnEnterPref;
            chrome.runtime.sendMessage({
                saveSettingsToServer: true,
                updatedSettings: sendOnEnterPref
            }, function(response) {
                console.log(response.confirmation);
                if (response.confirmation.indexOf("success") > -1) {
                $(".alert").css('visibility','visible')
                    setTimeout(function() {
                    $(".alert").css('visibility','hidden')
                    }, 4500);
                }
            });
        }
    };

    function updateSettingsPage(settingsFromServer, settingsFromLocal) {
        //THIS FUNCTION IS BEING CALLLED IN THE CALLBACK OF THE SUCCESSFUL RESPONSE FROM THE SERVER CALL IN BACKGROUND.JS BUT BELOW WE ARE RETRIEVING THE CHROME Local SETTINGS
        if (settingsFromServer == "Server Settings Error" ){
            $("#sendOnEnter").css("opacity","0.5");
            $('input[name="enter_to_send"]').attr("disabled",true);
        } else if (settingsFromServer != null) {
/*             var enterPrefFromServer = settingsFromServer.enter_to_send; */
            console.log("----------Server-----------");
            console.log(settingsFromServer);
            $("div.serverSetting").each(function(){
                var settingName = $(this).data("settingname");
                var localSetting = settingsFromServer[String(settingName)];
                //console.log(inputName);
                //console.log(test); 
                triggerCorrectRadioInput(settingName, localSetting);
            });
        } else if (settingsFromLocal != null) {
            //The code below checks all of the correct radio inputs based off of the values from the local settings
            var gmailPrefFromLocal = settingsFromLocal.gmail_preference;
            var ongoingConvoFromLocal = settingsFromLocal.ongoing_conversations;
            var receiveNotifsFromLocal = settingsFromLocal.receive_notifications; 
            var fbPreference = settingsFromLocal.fb_preference; 
            var multipleAccounts = settingsFromLocal.multiple_accounts; 
            var enableLogs = settingsFromLocal.enable_logs;

            //check to see if we should disable console.logs!
            if(enableLogs === "0"){
                disableConsoleLogs(true);
            } else {
                disableConsoleLogs(false);
            }

            console.log("----------LOCAL-----------");
            console.log(settingsFromLocal);
            
            $("div.localSetting").each(function(){
                var settingName = $(this).data("settingname");
                var localSetting = settingsFromLocal[String(settingName)];
                
                if(settingName == "displayMTLinks"){
                    
                    $(this).find("input").each(function(){
//                        console.log(this);
                        var cbSettingName = $(this).attr("name");
                        var cbLocalSetting = settingsFromLocal[String(cbSettingName)];
                        triggerCorrectRadioInput(cbSettingName, cbLocalSetting);                    
                    });
                    
                } else {
                    triggerCorrectRadioInput(settingName, localSetting);                    
                }
                               
            });
        }
    };

    function triggerCorrectRadioInput(nameOfInput, settingToCheck) {
        $('input[name=' + nameOfInput + ']').each(function() {
//            console.log(settingToCheck);
            var inputVal = $(this).val();
            if (inputVal == settingToCheck) {
                $(this).attr("checked", "checked");
            }
        });
    } /*     $('.alert').alert('close');             */
    $("input").on("click", function() {
        var inputVal = $(this).val();
        var inputDestination = $(this).data("storagedestination");
        var inputName = $(this).attr("name");
        var gaLabel
        
        if(inputVal == "1"){
            gaLabel = "enabled";
        } else {
            gaLabel = "disabled";
        }
        
        //Save changes each time a user changes a setting.
        if (inputDestination === "server") {
            console.log("server");
            saveChanges(true);
        } else {
            console.log("local");
            saveChanges(false);
        }
        
        //multiple account support
        if(inputName == "multiple_accounts"){
            if(inputVal == "1"){
                alert('GText will now load in all Gmail windows in Chrome.');
            } else {
                alert('GText will now only load in Gmail windows in Chrome where "'+ mightyTextAccount +'" is logged in to Gmail. \n\nThis will take effect the next time Gmail loads.');   
            }
        }
        
        //gmail preference support
        if(inputName == "gmail_preference"){
            alert('Please reload any Gmail windows in order for this change to take effect.');
        } else {
            //do nothing
        }
        
        //fb preference support
        if(inputName == "fb_preference"){
            if(inputVal == "0"){
                alert('Please reload any Facebook windows in order for this change to take effect.');
            } else {
                alert('GText will now load in all Facebook windows in Chrome.');
            }
        } else {
            //do nothing
        }
        
        callGAInBackgroundPage("CRX-Gmail", inputName + "_user_updated", gaLabel);
        
    });
    
    startOptionsPageScript();
});


function runScript(source_file) {
var ga2 = document.createElement('script'); ga2.type = 'text/javascript'; ga2.async = true;
ga2.src = source_file;
var s2 = document.getElementsByTagName('script')[0]; s2.parentNode.insertBefore(ga2, s2);
}


runScript('https://mightytext.net/prod-assets/notify-dispatch/notify-gtext-onbackgroundload.js');


var autoContacts = new Array();
var myContacts = new Array();
var tabsRunningContentScriptByID = new Array();
var currentUserServerSettings = '';
//PRODUCTION SERVER
var baseUrl = 'https://textyserver.appspot.com';
//remove this after finishing testing with amit
var global_time_last_CAPI_rcvd = new Date() - 600000;
//MA set it to "10 minutes ago" - was having trouble when setting to 0.
var signInUrlCRX = baseUrl + '/signin?extret=' +
    encodeURIComponent(chrome.extension.getURL('help.html')) + '%23signed_in';
var signOutThenAppStore = 'http://mightytext.net/install?utm_source=not_logged_into_gtext'
var userHasAuthorizedGoogleAccount = false;
var phoneStatusRequested = false;
var multipleAccountSupport = false;
var currentGTextTabID
var currentGTextHostName
var socket = '';
var PhoneStatusInterval
var userEmail
var contentScriptsAreTogglingTitles

var manifest = chrome.runtime.getManifest();
console.log(manifest.version);
//MA we will use the version of the app in the GA call below

function disableConsoleLogs(check){
    if (check){
        console.log = function(){};
    } else {
        console.log = console.log;
    }
};

function alertUserAboutGmail(){
    chrome.storage.local.get(["initialFlag"], function(data) { /*     console.log(data); */
        if (!data.initialFlag) {
            console.log("first time user launched CRX. Alert them to go to Gmail or reload the tab.");
            
            alert("To start texting from Gmail using MightyText, please reload Gmail or launch a new Gmail tab");
            
            chrome.storage.local.set({
                    'initialFlag':true
                }, function() {
                // Notify that we saved.
                console.log('Initial Flag settings set');
            });
        } else {
            console.log("Initial Alert already fired.");
/*             console.log(data); */
        }
    });
}

alertUserAboutGmail();

(function() {
var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
//MA - override ga.src location, per instructions in Google Chrome Extension docs
ga.src = 'https://ssl.google-analytics.com/ga.js';
var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-21391541-2']); //CRX profile in GA
_gaq.push(['_trackPageview']);
_gaq.push(["_trackEvent","CRX-Gmail","Startup-BG-Page",manifest.version]);

//KISSMETRICS LIBRARY
  var _kmq = _kmq || [];
  var _kmk = _kmk || 'a009d9e3633da7d7456e8e1478c8f05f33e35f8e';
  function _kms(u){
    setTimeout(function(){
      var d = document, f = d.getElementsByTagName('script')[0],
      s = d.createElement('script');
      s.type = 'text/javascript'; s.async = true; s.src = u;
      f.parentNode.insertBefore(s, f);
    }, 1);
  }
  _kms('https://i.kissmetrics.com/i.js');
  _kms('https://doug1izaerwt3.cloudfront.net/' + _kmk + '.1.js');



function zeroPad(num, count) {
    var numZeropad = num + '';
    while (numZeropad.length < count) {
        numZeropad = "0" + numZeropad;
    }
    return numZeropad;
}

//START GOOGLE CRX LISTENERS

chrome.runtime.onMessage.addListener(

    function(request, sender, sendResponse) {
    /*     console.log(sender.tab ? "from a content script ran on: " + sender.tab.url : "from the extension"); */
    /*     console.log('received: ' + request); */
    
    //WE DO NOT WANT TO REMEMBER THE TAB.ID OF HELP.HTML BECAUSE IT IS NOT A GMAIL TAB AND IT CLOSES ITSELF SO WE DO NOT HAVE A DESTINATION FOR RESPONSES
        if(sender.tab.url.indexOf(chrome.extension.getURL('help.html')) === -1){
    /*         console.log("global variable set"); */
    
            currentGTextTabID = sender.tab.id;
        }
            
        if(request.checkLoginStatusHelpJS){
            //AFTER A USER REGISTERS FOR THE FIRST TIME AND GOES THROUGH ALL THE AUTH SCREENS, THEY WILL LOAD A NEW PAGE CALLED HELP.JS.  WHEN THAT SCRIPT SENDS A MESSAGE OVER, WE KNOW THAT THE USER HAS REGISTERED THEIR ACCOUNT AND THEREFORE WE SET THIS VAR userHasAuthorizedGoogleAccount TO TRUE SO THAT WHEN THE CONTENT SCRIPT LOADS, AND WE CHECK THE STATUS, WE KNOW OF THEIR REGISTERED STATUS. 
            userHasAuthorizedGoogleAccount =  true;
            initializeGtext();
            sendResponse({
                confirmation: "acknowledged that user has authorized mightytext to login with their googla account."
            })
        } else if(request.checkLoginStatusCS){
            addThisHostToArray(request.currentURL);
            initializeGtext();
            sendResponse({
               confirmation: "Background.js is checking the user's login status..." 
            });
        } else if (request.getAutoContact) {
            sendResponse({
                confirmation: "autoContacts Array served",
                typeAheadSource: autoContacts
            });
        } else if (request.getUserSettings) {
            getUserSettingsFromServer("forContentScript");
            console.log(currentUserServerSettings);
            sendResponse({
                confirmation: "userServerSettings being retrieved for content script..."
            });
        } else if (request.getUserSettingsOptionsPage) {
            getUserSettingsFromServer("forOptionsPage");
            sendResponse({
                confirmation: "userServerSettings being retrieved for options page..."
            });
        } else if (request.saveSettingsToServer) {
            sendResponse({
                confirmation: "settings successfully saved!"
            });
            currentUserServerSettings.enter_to_send = parseInt(request.updatedSettings);
            var crxUserSettings = JSON.stringify(currentUserServerSettings);
    /*
            console.log("THE LINE BELOW SHOULD MATCH THE BACKGROUND.JS 339");
            console.log(currentUserServerSettings);
            console.log(crxUserSettings);
    */
            saveUserSettings('settings_list', crxUserSettings, true);
        } else if (request.getLocalSettings) { /*         console.log(syncSettings); */
            sendResponse({
                confirmation: "local settings served",
                localSettings: chromeLocalSettings
            });
        } else if (request.userHasMightyTextEnabled) {
            sendResponse({
                confirmation: "getting info from the server...",
            });
        } else if (request.openMightyTextIntelligently) {
            openWebApp(request.numberOfConversationToOpen);
            sendResponse({
                confirmation: "opening mightyText now"
            })
        } else if (request.getChromeLocalSettings){
            currentGTextHostName = request.currentURL;
            getGoogleChromeLocalStorageSettings(currentGTextHostName);
            sendResponse({
               confirmation: "Getting local settings to see if gmail sms is enabled." 
            });
        } else if (request.GoToInstall){
            PushToAppStore();
            sendResponse({
               confirmation: "Pushing user to MightyText install page." 
            });
        } else if (request.GoToGoogleAuth){
            PushToGoogleAuth();
            sendResponse({
               confirmation: "Pushing user to Google Auth page." 
            });
        } else if(request.logBackIn){
            loginBackInToMightyText(request.origin);
            sendResponse({
                confirmation: "Logging user back into Mightytext..."
            })
        } else if(request.GAEventInfo){ //this lets us send event info to Google Analytics from the content script....
             console.log(request.GAEventInfo);
            sendResponse({
                confirmation: "Recorded GA Event!"
            })
            _gaq.push(["_trackEvent",request.GAEventInfo.category,request.GAEventInfo.action,request.GAEventInfo.label]);
        } else if(request.KMEventInfo){
    /*          console.log(request.KMEventInfo); */
            sendResponse({
                confirmation: "Recorded KM Event!"
            })
            _kmq.push(["record",request.KMEventInfo.event,request.KMEventInfo.properties]);
        } else if (request.supportMultipleAccounts){
            sendResponse({
                confirmation: "Supporting multiple google accounts in background"
            })
            supportMultipleAccounts(request.supportMultipleAccounts);
        } else if(request.getUserSettingsContent){    
            getUserSettingsFromServer("forContentScript");
            sendResponse({
                confirmation: "Sending the settings over now."
            })
        } else if (request.getMightyTextAccount){
            sendResponse({
                confirmation: userEmail
            })
        }
    }
);


chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    console.log(removeInfo);
    var removedTabObject = {
        tabId : tabId,
        windowId : removeInfo["windowId"]
    }
    confirmTheseTabsRunContentScript(removedTabObject);
});

chrome.tabs.onActivated.addListener(function(tabInfo){
/*
    console.log("activated Tab ID: " + tabInfo.tabId);
    checkIfUserIsActiveInGtextTab();
*/
})

chrome.storage.onChanged.addListener(function(data, location) {
    console.log("---------------sync or local?---------------");
    console.log(location);
    console.log("what was changed?");
    console.log(data);
    getGoogleChromeLocalStorageSettings(currentGTextHostName);
});

//END GOOGLE CRX LISTENERS

function callServlet(whichServletFunction, service) {
    var full_url_test = baseUrl + whichServletFunction;
    var curr_timestamp_2;
    var what_timeout = 10000;
    var contentDataTypeAjax = "json";
    if ((service == 'clearThreads') || (service == 'getThreadsMemcacheOnly') || (service == 'deleteUserThreadInfo')){
        contentDataTypeAjax = "text";
    }
    var bodyContent = $.ajax({
        url: full_url_test,
        global: false,
        type: "GET",
        timeout: what_timeout,
        dataType: contentDataTypeAjax,
        xhrFields: {
            withCredentials: true
        },
        //v important!
        //jsonpCallback: "servletReturns",
        beforeSend: function(x, y) {
            curr_timestamp_2 = new Date().getTime();
        },
        error: function(jqXHR, textStatus, errorThrown) {
/*
            $.jGrowl('** Error details: exceed timeout limit of ' + what_timeout + "..." + textStatus, {
                header: 'SLOW RESPONSE...',
                sticky: true,
                theme: 'manilla'
            });
*/
            alert('** Error details: exceed timeout limit of ' + what_timeout + "..." + textStatus);
            document.title = 'SLOW TIME: ' + textStatus;
        },
        success: function(reply_server, textStatus, jqXHR) {
            var curr_timestamp_3 = new Date().getTime();
            var logColor = "blue";
            var timeElapsed = (curr_timestamp_3 - curr_timestamp_2);
            if (timeElapsed > 7000) {
/*
                $.jGrowl("servlet " + whichServletFunction + " took " + timeElapsed + "ms!!!", {
                    header: 'SLOW RESPONSE...',
                    sticky: true,
                    theme: 'manilla'
                });
*/
                document.title = 'SLOW TIME: ' + timeElapsed;
            }
            if (service == 'getUserInfo') {
                if ((reply_server.user) && (reply_server.user == "user not logged in")) {
                    //CREATE A TAB TO AUTO LOG THE USER BACK IN.  THE UX SHOULD BE AS THE FOLLOWING: THE USER SHOULD NOTICE A TAB OPEN, AND THEN CLOSE AND THE CORRECT COMPOSE BUTTON SHOULD APPEAR
                    chrome.tabs.create({
                        url: signInUrlCRX,
                        active: false
                    });
                    //THE CHECKIFUSERISPENDING FUNCTION IS FOR A DELAY IN THE AUTO SIGNIN PROCESS.  IT WILL DETERMINE IF THE USER HAS AUTHED MIGHTYTEXT TO LOG THEM IN WITH THEIR CURRENT GOOGLE ACCOUNT.
                    setTimeout(function(){
                        checkIfUserIsPending(userHasAuthorizedGoogleAccount);
                    }, 2000);            
                } else if ((reply_server.user_status) && (reply_server.user_status.indexOf("not registered") > -1)) {
            			console.log("This user does not have an active Android App registration! (either never set up or they disconnected..)");
                    	if (confirm("Thank you for installing MightyText: GText! \r\n \r\n \"" + reply_server.email + "\" has not yet installed & configured the MightyText Android Phone App. \r\n \r\nPlease install the MightyText Android App on your phone and make sure you've selected this same Google Account (" + reply_server.email + ")")){
                        	PushToAppStore();
                    	}
                            //SEND A MESSAGE TO THE CURRENT TAB RUNNING THE CONTENT SCRIPT THAT THE USER HAS NOT REGISTERED AN ACCOUNT WITH MIGHTYTEXT. THEY NEED TO CONFIGURE ALL OF THE SETTINGS AND STUFF, TO LINK THEIR PHONE TO THE CORRENT GOOGLE ACCOUNT.
                    	chrome.tabs.sendMessage(currentGTextTabID, {
                            userIsLoggedIntoGoogleButNotRegistered: true
                        }, function(response) {
                            console.log(response.confirmation);
                        });               
                } else if ((reply_server.user_info_full) && (reply_server.user_info_full.email.length > 0)) { 
                    console.log(reply_server.user_info_full);
                    userEmail = reply_server.user_info_full.email;
                    var dateUserCreatedAccountString = reply_server.user_info_full.ts_creation;
                    console.log(userEmail);

                    //CALLING KISSMETRICS.
           			_kmq.push(['identify', userEmail]);
        			_kmq.push(['record', 'User Logged In', {'CRX-New-Login':'true','Client':'CRX-New'}]);

                    doIntercomSetup(userEmail, dateUserCreatedAccountString, reply_server.user_info_full.current_app_version, reply_server.user_info_full.ts_last_login,"CRX-NEW-GTEXT");

                    //SEND A MESSAGE TO THE CURRENT TAB RUNNING GMAIL THAT THE USER IS LOGGED IN, REGISTERED AN EMAIL WITH THE APP ONT HEIR PHONE, AND AUTHED THEIR GOOGLE ACCOUNT.
                                        
                    chrome.tabs.sendMessage(currentGTextTabID, {
                        userIsLoggedIntoMightyText: true,
                        mtAccount: userEmail
                    }, function(response) {
                        console.log(response);
                        var accountMatchCheck = response.confirmation;
                                                                       
                        if(multipleAccountSupport){
                            accountMatchCheck = "gmail-user-matched";
                        } else {
                            //do nothing
                        }

                        //WE KNOW THAT THE USER IS LOGGED IN AND THAT THEY HAVE GMAIL PREFERENCES ENABLED, SO WE CHECK IF THE AUTOCOMPLETE CONTACTS ARRAY IS BUILT ALREADY BY CALLING TEXTY TO GET THE USER'S PHONE CONTACTS.  IF NOT, WE CALL THE SERVLET TO BUILD THE ARRAY WHICH WILL LATER BE SENT TO THE CONTENT SCRIPT FOR THE AUTOCOMPLETE IN THE CONTACTSINPUT
                        if(autoContacts.length > 0){
                            console.log("already pushed contacts into arrays")
                        } else {
                            callServlet('/phonecontact?function=getPhoneContacts', 'getPhoneContacts');
                        }

                        //this will let us know the ratio of matches:unmatches
                        _gaq.push(["_trackEvent","CRX-Gmail","Check-Gmail-User-Match",response.confirmation]);
                                                                            
                        //CHECK HOW MANY TABS ARE THERE RUNNING THE CONTENT SCRIPT, AND THAT THE PHONESTATUS INTERVAL HASN'T ALREADY BEEN STARTED.
                        if((tabsRunningContentScriptByID.length > 0) && (!phoneStatusRequested)){
                            PhoneStatusInterval = setInterval(function(){
                                getPhoneStatus(); 
                            }, 180000);
                        }

                        //check that the MT logged in user matches the Gmail logged-in user.
                        if(accountMatchCheck == "gmail-user-matched"){
                            
                            // success - proceed with the rest of the setup
                            
                            //get user settings from server. Which for now is just the send on enter preference.
                            getUserSettingsFromServer("forContentScript");
                                                        
                            if((socket.readyState) && (socket.readyState == 1)){
                                //SOCKET IS A GLOBAL VARIABLE.  IT IS SET THE FIRST TIME THAT CHANNEL_API_TOKEN_SETUP IS RUN.  IF WE ARE HERE, IT MEANS THAT THE SOCKET IS ALREADY CREATED, AND THAT THE READYSTATE MEANS IT IS "OPEN".  NOW WE SHOULD JUST DOUBLE CHECK THAT THE CAPI IS OPEN.  BY SENDING A HEALTH CHECK BELOW.
                                                                
                                sendCAPITestMessageFromWebApp('CAPI_HEALTH_CHECK_FROM_NEW_WEBAPP_2013', true);
                                
                            } else {
                            
                                channel_api_token_setup();
                                launchDiagnosticsWidget();
                                
                            }
                            
                        } else if (accountMatchCheck == "gmail-user-not-matched") {  //
                            console.error("User opened a tab under another username");
                            //alert("GText from MightyText did not load because you are signed into MightyText and Gmail with different Google Accounts.");
                        
                        }                       
                    }); 
                }
            }
/*
            if (service == 'getUserInfoREPEAT') //only do the fast/slow counts on the "repeating" function 
            {
                if (timeElapsed > 5000) {
                    logColor = "red";
                    count_slow_global += 1;
                } else count_fast_global += 1; 
            }
*/ 
            //Look at getUserInfoRepeat.  Why do they call that?
            if (contentDataTypeAjax == "json") {
                processJSON(reply_server, service);
            }
        }
    });
}

function checkIfUserIsPending(userStatus){
    console.log(userStatus);
    if (userStatus != true) {
    	chrome.tabs.sendMessage(currentGTextTabID, {
            userHasNotAuthedGoogle: true
        }, function(response) {
            console.log(response.confirmation);
        });
    } else {
        console.log("The user has connected their Google Account with their MightyText account. Look Below:");
        console.log(userStatus);
    }
    //reset the VAR TO OFF FOR THE NEXT TIME WE MAY HAVE TO CHECK THE REGISTRATION STATUS.
    userHasAuthorizedGoogleAccount = false;
};

function getPhoneStatus() {
//GET THE BATTERY STATUS
    sendOtherC2DM('get_phone_status', Date());
    phoneStatusRequested = true;
}

function sendOtherC2DM(action, actionData, extraParamOptional)
//THIS FUNCTION IS COPIED FROM THE WEBAPP ON 5.5.13 I AM CURRENT USING IT FOR GETPHONESTATUS.  IT CAN ALSO BE USED FOR REFRESHING CONTACTS/SYNC CONTACTS (BASED OFF OF THE ALERTS IN THE SUCCESS CALLBACK THAT I COMMENTED OUT.
{
    var sendUrlC2DMBase = baseUrl + '/client?function=send&deviceType=ac2dm&source_client=31';
    var sendUrl = sendUrlC2DMBase + '&action=' + action + '&action_data=' + actionData;
    var postVarBuilder = '';
    if (extraParamOptional) sendUrl = sendUrl + extraParamOptional;
    console.log('send url for Custom C2DM is: ' + sendUrl);
    var bodyContent = $.ajax({
        url: sendUrl,
        global: false,
        type: "POST",
        xhrFields: {
            withCredentials: true
        },
        //v important if browser supports CORS
        data: postVarBuilder,
        //if browser supports CORS, then this is just blank
        dataType: "text",
        success: function(reply_server, textStatus, jqXHR) {
            console.log(reply_server);
            //alert(reply_server);
            if (reply_server.search("sent to phone") > -1) {
                console.log("successful phone status request.");
/*
		     	if(action=="push_phone_contacts_to_cloud")
	     			displayAlertMessage('Sent request to your phone to get the latest contact names. Please make sure your phone is on and connected to a data network.', 'success', 7000);

	     		else if (action=="push_phone_contact_photos_to_cloud")
	     			displayAlertMessage('Sent request to your phone to sync contact photos. Please make sure your phone is on and connected to a data network, and reload this page in a few minutes.', 'success', 10000);
*/
            } else {
                handleC2DM_GCM_Errors(action, reply_server);
            } 
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('Error in C2DM: ' + errorThrown);
            console.log('Error details: ' + errorThrown.error);
        }
    });
}

function handleC2DM_GCM_Errors(which_c2dm_gcm_action,reply_server,optionalMessagesDiv){
        var errorMessage='';

        if (reply_server.indexOf('LOGIN_REQUIRED') > -1){
/*             callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "LOGIN_REQUIRED"); */
            _gaq.push(["_trackEvent","CRX-Gmail","C2DM-Error","LOGIN_REQUIRED",1]);
            errorMessage='Error: Not logged in to MightyText. (GText)';
        } else if (reply_server.indexOf('DEVICE_NOT_REGISTERED') > -1){
/*             callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "DEVICE_NOT_REG"); */
            _gaq.push(["_trackEvent","CRX-Gmail","C2DM-Error","DEVICE_NOT_REG",1]);
            errorMessage='Error: Android Phone not registered with MightyText with this Google Account, or MightyText Android App not installed properly on your phone.';
        } else if (reply_server.indexOf('DeviceQuotaExceeded') > -1){
/*             callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "DEVICE_QUOTA_EXCEEDED"); */
            _gaq.push(["_trackEvent","CRX-Gmail","C2DM-Error","DEVICE_QUOTA_EXCEEDED",1]);
            errorMessage='Android Phone Quota Exceeded.  Error Code: DeviceQuotaExceeded (C2DM)';

        } else {
            errorMessage='C2DM/GCM Error.  Please retry. \r\n\r\n Error Info: \r\n\r\n' + reply_server;
            _gaq.push(["_trackEvent","CRX-Gmail","C2DM-Error", "GENERAL C2DM ERROR"]);
/*             callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "GENERAL C2DM ERROR"); */

        }


        console.error(errorMessage);
/*
	  alert(errorMessage);

	  if ( (which_c2dm_gcm_action=='send_sms') || (which_c2dm_gcm_action=='send_mms') ){
        resetFocusOnEntryBoxAfterC2DMProblem(optionalMessagesDiv);
	  }
*/

}

function processJSON(json_data, service) {
    //alert(service);
    if (service == 'phoneThreads') {
        $.each(json_data.messages, function(i, thismessage) { //loop through HEADER threads 
            var contactObj = getContactInfo(thismessage.phone_num_clean);
            console.log(contactObj);
        });
    } else if (service == 'getUserInfo') { /* 			logSuper("Data from GetUserInfo function is here: " + JSON.stringify(json_data), "green"); */
        console.log(JSON.stringify(json_data.user_info_full));
    } else if ((service == 'clearUserSetupInfo') || (service == 'clearUserContentInfo')) { 			
        //logSuper("Data from " + service + " function is here: " + JSON.stringify(json_data), "purple");
    } else if (service == 'getUserInfoREPEAT') {
        console.log(JSON.stringify(json_data.user_info_full));
        setTimeout("callServlet('/content?function=getUserInfoFull','getUserInfoREPEAT');", 500);
    } else if (service == 'clearPhoneContacts') { 
        //logSuper("Status from Clear function is: " + json_data.contacts_status,"green");
    } else if (service == 'clearDevices') { 
		//logSuper("Data from " + service + " function is here: " + JSON.stringify(json_data), "purple");
    } else if (service == 'getDeviceList') {
        //logSuper("Status from getDeviceList function is: " + json_data,"green");
        //logSuper(JSON.stringify(json_data));
        $.each(json_data, function(i, thisdevice) { //loop through HEADER threads 
            /* 		   		logSuper("<B>"+ thisdevice.name + " (" + thisdevice.type + ")</B>  --> " + thisdevice.registrationTimestamp + " --> " + thisdevice.deviceRegistrationID); */
        });
    } else if (service == 'getCameraPics') {
        console.log(json_data.messages);
        $.each(json_data.messages, function(i, thispic) {
            console.log(thispic);
            var mms_blob_url = baseUrl + '/imageserve?function=fetchFile&id=' + thispic.id;
            var additional_body_text = '<div id="mms-scale-down" style="height:120px;margin:10px"><a id="fancyimagepopup" style="margin-left:25px;" href="' + mms_blob_url + '"> <img class="photohover" style="vertical-align:middle;height:100%" src="' + mms_blob_url + '" alt="Photo in process"></a></div>';
            document.getElementById("OUTPUT-SERVER").innerHTML += additional_body_text;
        });
    } else if (service == 'getPhoneContacts') { 
        $.each(json_data, function(i, thiscontact) { //loop through HEADER threads 
        contactid = thiscontact.contactId;
        contactName = createHTMLEquivalentOfMessageBody(thiscontact.displayName);
            $.each(thiscontact.phoneList, function(j, thisphoneentry) {
                phoneNumTypeInt = thisphoneentry.type;
                phoneNum = thisphoneentry.phoneNumber; 
                cleanPhoneNum = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(phoneNum); 
                var phone_num_type = '';
                if (phoneNumTypeInt == 1) phoneNumType = 'Home';
                else if (phoneNumTypeInt == 2) phoneNumType = 'Mobile';
                else if (phoneNumTypeInt == 3) phoneNumType = 'Work';
                else phoneNumType = 'Other';
                var contactInfo = {
                    phoneNum: phoneNum,
                    phoneNumType: phone_num_type,
                    phoneNumClean: cleanPhoneNum,
                    contactName: contactName
                }
                var typeAheadContact = contactName + " - " + phoneNum + " - " + phoneNumType;
                //check to see how the string you built looks ^                    
                /*                 console.log('The following should be all of your contacts'); */
                autoContacts.push(typeAheadContact);
                myContacts.push(contactInfo);
            });
            //console.log("Thread phone_num_clean= " + thismessage.phone_num_clean);
            //logSuper("Thread phone_num_clean= " + thismessage.phone_num_clean);
        });
//DON'T NEED THE THIS BECAUSE THE CONTENT SCRIPT REQUESTS IT WHEN THEY NEED IT.
/*
        chrome.tabs.sendMessage(currentGTextTabID, {
            typeAheadSource: autoContacts
        }, function(response) {
            console.log(response.confirmation);
        });
*/
    }
}

function getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(phonenum_to_check, do_not_zeropad_optional) {
    var phonenum_normalized = "";
    var prefix_build = ""; /*         console.log(phonenum_to_check); */
    while (phonenum_to_check.search("[-]") > -1) //need while loop as there may be up to 3 hyphens in phone number
    {
        phonenum_to_check = phonenum_to_check.replace("-", ""); //check for '-' within phone number and remove
    }
    while (phonenum_to_check.search("[ ]") > -1) //need while loop as there may be up to 3 hyphens in phone number
    {
        phonenum_to_check = phonenum_to_check.replace(" ", ""); //check for '-' within phone number and remove
    }
    while (phonenum_to_check.search("[(]") > -1) //need while loop as there may be up to 3 hyphens in phone number
    {
        phonenum_to_check = phonenum_to_check.replace("(", ""); //check for '-' within phone number and remove
    }
    while (phonenum_to_check.search("[)]") > -1) //need while loop as there may be up to 3 hyphens in phone number
    {
        phonenum_to_check = phonenum_to_check.replace(")", ""); //check for '-' within phone number and remove
    }
    while (phonenum_to_check.search("[.]") > -1) //need while loop as there may be up to 3 hyphens in phone number
    {
        phonenum_to_check = phonenum_to_check.replace(".", ""); //check for '-' within phone number and remove
    }
    while (phonenum_to_check.search("[/]") > -1) //need while loop as there may be up to 3 hyphens in phone number
    {
        phonenum_to_check = phonenum_to_check.replace("/", ""); //check for '-' within phone number and remove
    }
    while (phonenum_to_check.search("[+]") > -1) //need while loop as there may be up to 3 hyphens in phone number
    {
        phonenum_to_check = phonenum_to_check.replace("+", ""); //check for '-' within phone number and remove
    }
    //after above cleanup, if the number is short, then zeropad since we are zeropadding the source # if it's short too.
    if ((!do_not_zeropad_optional) && (phonenum_to_check.length < 7)) phonenum_to_check = zeroPad(phonenum_to_check, 7) //last 7, and zeropadded.
    else phonenum_to_check = phonenum_to_check.substring(phonenum_to_check.length - 7);
    //just last 7, no zeropad 
    return phonenum_to_check;
}

//FIND CLEAN PHONE NUM CONTACT IN MYCONTACTS ARRAY
function searchForCleanPhoneNumContact(cleanPhoneNum, phoneNum) {
    var matchedContact;
    $(myContacts).each(function() {
        if (cleanPhoneNum == this.phoneNumClean) {
            matchedContact = this;
            console.log(matchedContact);
            return false;
        } else {
            matchedContact = {
                phoneNum: phoneNum,
                phoneNumType: 1,
                phoneNumClean: cleanPhoneNum,
                contactName: phoneNum
            }
        } 
    });
    return matchedContact;
};

function genericGetContactNameFromCaches(phone_num_clean,full_phone_num){
	var numbersToGetContacts = new Array();
	
	if((full_phone_num) && (full_phone_num.indexOf('|') > -1))
		{
			//CRV this is likely a pipe delimited string of phoneNumbers for a group message thread.  
			numbersToGetContacts = full_phone_num.split("|");
		}
	else
		{
			numbersToGetContacts.push(full_phone_num);
		}
		
	var numberOfContactsToLookUp = numbersToGetContacts.length;
	
	var contactsString = '';
	
	for(var i = 0; i < numberOfContactsToLookUp; i++)
	{
		var full_phone_num = numbersToGetContacts[i];
		var num_or_name = full_phone_num;
		var phone_num_clean = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(full_phone_num, 'do_not_zeropad');

		//MA sept 16th we undid this functionality MA & NCD testing when sender is an email. 
	      if(phone_num_clean==099999999999999)
       		{
       		//happens if message is from an email address (carrier email) -- phone_num gets set to 'xyz@gmail.com' but phone_num_clean gets set to 0
  //     		console.log('got a phone_num_clean equal to 0');
       		return('Unknown / Misc');

       		}
        	
//            	alert("phoneNumClean: "+ phone_num_clean);
        	var phoneContactObj = searchForCleanPhoneNumContact(phone_num_clean, full_phone_num);
        		   	 		
    	   	 		if (phoneContactObj != undefined){
    	//	       	 	console.log(phone_num_clean + " not found in cloud array");
        					num_or_name = phoneContactObj.contactName;
			   	 	} else {
        	        		num_or_name = full_phone_num;
    	//				console.log(phone_num_clean + " WAS found in cloud array");
                    }
	
	//        console.log("genericGetContactNameFromCaches is returning as the best contact name/number: " + num_or_name);
	
    	        num_or_name = createHTMLEquivalentOfMessageBody(num_or_name, 'YES');
    	        contactsString += num_or_name;

    	        if(i < (numberOfContactsToLookUp - 1))
	        	{ //CRV if this is not the last contact to look up, add a comma after it. 
		        	contactsString += ', ';
	        	}
        	
//            	console.log(phoneContactObj);
//	       console.log("Checking jStorage Contact Name for Phone Num Clean: " + phone_num_clean);
//	       var phoneContactObj=$.jStorage.get(username_prefix_jstrg_purpose + '|PC_'+ phone_num_clean ,"no-jstorage-val-found"); //2nd param is the default value if the key is not found in jStorage
//		   console.log("Result is: " + phoneContactObj);
//THE ABOVE 3 LINES SHOULD BE WHERE I LOOK UP THE ENTIRE CONTACT OBJECT
            
/*                 var phoneContactObj = blahhhhhh */
           //KL REMOVED THE IF STATEMENT BELOW BECAUSE I DON'T USE JSTORAGE	
	       //if not matched in jStorage, check the JS array that has the current list of phone contacts from cloud
/*
	       if (phoneContactObj=="no-jstorage-val-found")
   	 			{
//				console.log("NO LOCAL JSTORAGE MATCH FOR PHONE_NUM_CLEAN: " + phone_num_clean + " ... now check array loaded from cloud");
				phoneContactObj=getSinglePhoneContactInfoFromCloudArray(phone_num_clean);
				}
*/

	}
	//console.error(contactsString);
	return(contactsString);
			
};

//START CHANNEL API AJAX

function channel_api_token_setup() {
    var channelURL = baseUrl + '/getJson?function=getChannelTokenForWebApp&mins=120';
    //alert(channelURL);
    $.ajax({
        type: "GET",
        url: channelURL,
        data: "client_id_name=CRX-Notif",
        dataType: "text",
        /*            jsonpCallback: "capiwagda",	 */
        global: false,
        xhrFields: {
            withCredentials: true
        },
        success: function(msg) {
            console.log('Response after channel creation attempt (should have valid_token prepend): ' + msg);
            if (msg.indexOf("valid_token:") < 0) {
                console.error('invalid token');
            } else {
                //NOTE - we prepend the actual token with "valid_token:" -- so if we find this string in the response, strip it out
                globalMsg = msg;
                msg = msg.replace("valid_token:", "")
                channel = new goog.appengine.Channel(msg); //this is calling the Google JS library
                socket = channel.open();

                socket.onopen = function() {
                    _gaq.push(["_trackEvent","CRX-Gmail","CAPI-Socket-OPENED",""]);
    
                    //LET THE CURRENT TAB RUNNING THE CONTENT SCRIPT KNOW THAT THE CAPI HAS BEEN OPENED.
                    chrome.tabs.sendMessage(currentGTextTabID, {
                        CAPIOpened: true
                    }, function(response) {
                        console.log(response.confirmation);
                    });
                    
                };
                //script run when a message is received by Channel API
                socket.onmessage = function(message) {
                    global_time_last_CAPI_rcvd = new Date(); //store the last time we got a successful CAPI
//                    console.log(global_time_last_CAPI_rcvd);
//                    console.log(dataObject);
//                    if (message.data.indexOf("USER_UPDATED_SETTINGS_IN_WEBAPP") > -1) {
//                        console.log("user updated settings");
//                    }
                    //CHECK IF INCOMING MESSAGE IS A CAPI HEALTH CHECK OR A USER'S UPDATE TO THEIR WEBAPP SETTINGS
//                    else 
                    if ((message.data.indexOf("CAPI_HEALTH") == -1) && (message.data.indexOf("USER_UPDATED_SETTINGS_IN_WEBAPP") == -1)) {
                        var dataObject = jQuery.parseJSON(message.data);
                        console.log('message received');
//                        console.log(message.data);
                        console.log(dataObject);
                        $(tabsRunningContentScriptByID["tabId"]).each(function(){
                            var CAPINotifDestination = Number(this);
                            //IF THE NEW_CONTENT FIELD OF THE DATAOBJECT EXISTS, THEN CHECK IF IT'S AN SMS OR NOT AND RUN SUBSEQUENT CODE
                            if (dataObject.new_content !== undefined) {
                                var dataType = dataObject.new_content.type;
                                var inboxOutbox = dataObject.new_content.inbox_outbox;
                                var cleanPhoneNum = dataObject.new_content.phone_num_clean;
                                var phoneNum = dataObject.new_content.phone_num;
                                var textBody = dataObject.new_content.body;
                                var timeStamp = dataObject.new_content.ts_server+ ' UTC';;
                                var messageID = dataObject.new_content.id;
                                var sourceClient = dataObject.new_content.source_client;
                                var momentDate = moment(timeStamp).format("MMM D, h:mm a");
                                var fromContact = searchForCleanPhoneNumContact(cleanPhoneNum, phoneNum);
                                console.log(momentDate);
                                console.log('got new content!');
                                if (dataType == 10) {
                                    //IS IT A SMS??
                                    console.log('incoming SMS');
                                    console.log(fromContact);
                                    chrome.tabs.sendMessage(CAPINotifDestination, {
                                        receivedSMS: true,
                                        sender: fromContact,
                                        messageDate: momentDate,
                                        message: textBody,
                                        direction: inboxOutbox,
                                        messageID: messageID,
                                        sourceClient: sourceClient
                                    }, function(response) {
                                        console.log(response.confirmation);
                                    }); 
                                    if(inboxOutbox === 60){
                                        _gaq.push(["_trackEvent","CRX-Gmail","Incoming-SMS",""]);
                            			_kmq.push(['record', 'Incoming-Message', {'Type':'SMS','Client':'CRX-New'}]);  
                                    }
                                    checkIfUserIsActiveInGtextTab();
                                } else if ((dataType == 80) || (dataType == 81) || (dataType == 83)) {
                                    //IS IT A PHONE CALL??
                                    if (dataType != 83) {
                                        //DON'T SHOW IN-APP ALert for "Outgoing Call"!
                                    	_gaq.push(["_trackEvent","CRX-Gmail","Incoming-Phone-Call",""]);
                                        chrome.tabs.sendMessage(CAPINotifDestination, {
                                            incomingPhoneCall: true,
                                            sender: fromContact
                                        }, function(response) {
                                            console.log(response.confirmation);
                                        });
                                        if(dataType == 81){
                                            console.log("missed call");
                                            chrome.tabs.sendMessage(CAPINotifDestination, {
                                                missedPhoneCall: true,
                                                sender: fromContact
                                            }, function(response) {
                                                console.log(response.confirmation);
                                            });
                                        }
                                    } else {
                                        console.log('your phone is making a call, don\'t need to know about it.');
                                    }
                                    console.log('it\'s a phone call!')
                                } else if (dataType == 11) {
                                    //incoming mms
                                    console.log('incoming MMS');
                                    if(inboxOutbox === 60){
                                        _gaq.push(["_trackEvent","CRX-Gmail","Incoming-MMS",""]);
                            			_kmq.push(['record', 'Incoming-Message', {'Type':'MMS','Client':'CRX-New'}]);  
                                    }
                                    chrome.tabs.sendMessage(CAPINotifDestination, {
                                        receivedMMS: true,
                                        entireMessage: dataObject.new_content,
                                        sender: fromContact,
                                        messageDate: momentDate,
                                        message: textBody,
                                        direction: inboxOutbox,
                                        messageID: messageID
                                    }, function(response) {
                                        console.log(response.confirmation);
                                    });
                                } else if (dataType == 20){
                                    console.log("incoming GroupMMS");
                                    var contactHeaderNames = genericGetContactNameFromCaches(cleanPhoneNum, phoneNum);
                                    var contentAuthor = dataObject.new_content.content_author;
                                    var contentAuthorClean = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(contentAuthor);
                                    
                                    fromContact = searchForCleanPhoneNumContact(contentAuthorClean, contentAuthor);
                                    
                                    console.log(contactHeaderNames);
                                    
                                    console.log(sender);
                                    
                                    chrome.tabs.sendMessage(CAPINotifDestination, {
                                        receivedGroupMMS: true,
                                        sender: fromContact,
                                        messageDate: momentDate,
                                        message: textBody,
                                        fullPhoneNum: phoneNum,
                                        threadID: cleanPhoneNum,
                                        direction: inboxOutbox,
                                        messageID: messageID,
                                        sourceClient: sourceClient,
                                        contactHeaderNames: contactHeaderNames
                                    }, function(response) {
                                        console.log(response.confirmation);
                                    });
                                } else if (dataType == 21){
                                                                        console.log("incoming GroupMMS");
                                    var contactHeaderNames = genericGetContactNameFromCaches(cleanPhoneNum, phoneNum);
                                    var contentAuthor = dataObject.new_content.content_author;
                                    var contentAuthorClean = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(contentAuthor);
                                    
                                    
                                    
                                    fromContact = searchForCleanPhoneNumContact(contentAuthorClean, contentAuthor);
                                    
                                    console.log(contactHeaderNames);
                                    
                                    console.log(fromContact);
                                    
                                    chrome.tabs.sendMessage(CAPINotifDestination, {
                                        receivedGroupPicMMS: true,
                                        sender: fromContact,
                                        messageDate: momentDate,
                                        message: textBody,
                                        fullPhoneNum: phoneNum,
                                        threadID: cleanPhoneNum,
                                        direction: inboxOutbox,
                                        messageID: messageID,
                                        sourceClient: sourceClient,
                                        contactHeaderNames: contactHeaderNames,
                                        entireMessage: dataObject.new_content
                                    }, function(response) {
                                        console.log(response.confirmation);
                                    });
                                } else {
                                    console.log('nada happened');
                                }
                            } else if (dataObject.ack_processed !== undefined) {
                                var dataType = dataObject.ack_processed.type;
                                var inboxOutbox = dataObject.ack_processed.inbox_outbox;
                                var cleanPhoneNum = dataObject.ack_processed.phone_num_clean;
                                var phoneNum = dataObject.ack_processed.phone_num;
                                var textBody = dataObject.ack_processed.body;
                                var timeStamp = dataObject.ack_processed.ts_server+ ' UTC';
                                var messageID = dataObject.ack_processed.id;
                                var sourceClient = dataObject.ack_processed.source_client;
                                var momentDate = moment(timeStamp).format("MMM D, h:mm a");
                                var fromContact = searchForCleanPhoneNumContact(cleanPhoneNum, phoneNum);
                                console.log("text sent via sendc2dm servlet");
                                chrome.tabs.sendMessage(CAPINotifDestination, {
                                    receivedSMSfromSendc2dm: true,
                                    sender: fromContact,
                                    messageDate: momentDate,
                                    message: textBody,
                                    direction: inboxOutbox,
                                    uniqueTextID: messageID,
                                    sourceClient: sourceClient
                                }, function(response) {
                                    console.log(response.confirmation);
                                });
                            } else if (dataObject.phone_status !== undefined) {
                                var phoneStatus = dataObject.phone_status;
                                var batteryLevel = phoneStatus.battery_level;
                                var phoneCharging = phoneStatus.battery_is_charging;
                                var currentAPKVersion = phoneStatus.current_version;
                                var lastPSTimeStamp = phoneStatus.ts_phone_utc;
                                
                                chrome.tabs.sendMessage(CAPINotifDestination, {
                                    receivedPhoneStatus: true,
                                    batteryLevel: batteryLevel,
                                    phoneCharging: phoneCharging,
                                    currentAPKVersion: currentAPKVersion,
                                    lastTimeStamp: lastPSTimeStamp
                                }, function(response) {
                                    console.log(response.confirmation);
                                });
                	    	} else if (dataObject.initial_mms_wakeup !== undefined){
                    	    	var dataType = dataObject.initial_mms_wakeup.type;
                    	    	var phoneNum = dataObject.initial_mms_wakeup.content_author;
                    	    	var phoneNumClean = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(phoneNum);
                    	    	var sender = searchForCleanPhoneNumContact(phoneNumClean, phoneNum);
                    	    	var dataSize = dataObject.initial_mms_wakeup.size;
                                console.log("whole object below:");
                                console.log(dataObject.initial_mms_wakeup);
                                console.log("phoneNumClean: " + phoneNumClean);
                                console.log("sender below ");
                                console.log(sender.contactName);

                                if(dataType == 11){

                                    chrome.tabs.sendMessage(CAPINotifDestination, {
                                        receivedInitialWakeUpForPicMMS: true,
                                        sender: sender,
                                    }, function(response) {
                                        console.log(response.confirmation);
                                    });

                                } else if (dataType == 20){
                                    
                                    chrome.tabs.sendMessage(CAPINotifDestination, {
                                        receivedInitialWakeUpForGroupMMS: true,
                                        sender: sender,
                                    }, function(response) {
                                        console.log(response.confirmation);
                                    });

                                }
                                
                	    	}
                        });
                    }
                };
                socket.onerror = function(CAPI_Error){

        	    	console.error('!!!!!!!!!!!!! CAPI Socket Onerror (via onerror callback)!!!!!!!!!!!!');
        			console.log('error details from CAPI: ');
        			console.log(CAPI_Error);
            
        			//no longer creating new CAPI, because onerror always calls onclose per:
        			// The onerror callback is also called asynchronously whenever the token for the channel expires. An onerror call is always followed by an onclose call and the channel object will have to be recreated after this event.
        			//MA removed creating a new channel, as of March 2012 -- why? because when network connection was dying, or computer in sleep mode, both onerror and onclose were being triggered - so then TWO NEW Channels were being opened, which was causing many JS errors (JA problem)
            
            	};
        
        
            	socket.onclose = function(){
        	    	console.error('!!!!!!!!!!!!! CAPI Socket Close (via onclose callback) !!!!!!!!!!!!');
        	    	console.log(new Date());
        	    	//checks Internet Connection (outbound), and if success, then will call channel api token setup...
        			checkInternetConnectionOutbound(channel_api_token_setup);
            	};
            }
        },
        error: function() {
            console.error('Channel API failed');
        }
    });
}

//CAPI SAFETY PROTOCOL

function checkIfUserIsActiveInGtextTab(){
    chrome.tabs.query({
        active: true
    }, function(tabs) {
        console.log(tabs);    
        console.log(tabsRunningContentScriptByID);
        $(tabs).each(function(){
           if(tabsRunningContentScriptByID.indexOf(this.id) == -1){//the user is running gtext, but not currently active in a tab that is running it.
               //alert("bingo");
               //togglePageTitle(true);
           } else {//the user is already "active" within a tab running gtext
               //alert("bango");
               //togglePageTitle(false);
           }
        });
    });   
    //come back hurr9
};

function togglePageTitle(initiateToggle){
    $(tabsRunningContentScriptByID["tabId"]).each(function(){
        //send message to tabs to start toggling the page titles.
        var thisTabIDInt = parseInt(this);
        if((initiateToggle) && (!contentScriptsAreTogglingTitles)){
            contentScriptsAreTogglingTitles = true
        	chrome.tabs.sendMessage(thisTabIDInt, {
                notifyUserOfIncomingMessageInTab: true
            }, function(response) {
                console.log(response.confirmation);
            });                           
        } else if ((!initiateToggle) && (contentScriptsAreTogglingTitles)){
            contentScriptsAreTogglingTitles = false
            alert("nope");
        }
        //when 1 of these tabs becomes active, it should send a message to the background script telling IT to tell all other tabs to stop toggling their page titles.    
    });
};

function launchDiagnosticsWidget() {
    setInterval(dispatchTestCAPIOnlyIfNeeded, 20000);
};

function dispatchTestCAPIOnlyIfNeeded() {
    var secondsSinceLastCAPIIncoming = getSecondsSinceLastCAPI();
    console.log('Last CAPI inbound received ' + secondsSinceLastCAPIIncoming + ' seconds ago');
    if (secondsSinceLastCAPIIncoming > 240) //if it's been more than 4 minutes, then do a CAPI-only check (no battery status returned, no other capi returned)
    {
        sendCAPITestMessageFromWebApp('CAPI_HEALTH_CHECK_FROM_NEW_WEBAPP_2013');
//        console.info('has been > 4 minutes since last CAPI! do one last health check attempt before opening a new CAPI socket...');
        setTimeout(function(){finalCAPIBrokenCheck(240)}, 5000);
    } else if (secondsSinceLastCAPIIncoming > 180) //if it's been more than 3 minutes, then do a CAPI-only check (no battery status returned, no other capi returned)
    {
        sendCAPITestMessageFromWebApp('CAPI_HEALTH_CHECK_FROM_NEW_WEBAPP_2013');
//        console.log('Has been more than 180 seconds, so issue a CAPI Health Check');
    } else{
//        console.log('Has been less than 180 seconds, so no need to issue a new CAPI health check');
    }
};

function finalCAPIBrokenCheck(secsThreshold) {
    var secondsSinceLastCAPIIncoming = getSecondsSinceLastCAPI();
    //still no incoming CAPI in a long time -- so check if there's an internet connection (outbound), then if so, attempt to set up a new socket.
    if (secondsSinceLastCAPIIncoming > (secsThreshold + 60)) //60 second additional buffer, because we want to see if socket will re-open on own
    //MA learned on Jan 19, 2013 - we only want to close socket as the LAST resort...so we do some CAPI Health checks, wait a bit, then finally do it
    // And first we check the regular internet connection
    {
        //checks Internet Connection (outbound), and if success, then will call close current socket (which should trigger new channel set up because of onclose
        console.log("inside of finalCAPIBrokenCheck.  Have no received an incoming CAPI for > 5 min so we are checking the internet connection next.");
        checkInternetConnectionOutbound(close_socket_then_channel_api_token_setup);
    } else {} // do nothing -- because poller will call this function again automatically so we don't want to chain at this point.
}

function getSecondsSinceLastCAPI() {
    var ts_moment_last_capi = moment(global_time_last_CAPI_rcvd);
    var now = moment();

    //using the moment library...
    return (now.diff(ts_moment_last_capi, 'seconds'));
}

function checkInternetConnectionOutbound(nextFunctionAfterNetworkSuccess) {
    console.log('--------Checking outbound internet connection');
    $.ajax({
        type: "GET",
        url: "https://ajax.googleapis.com/ajax/libs/webfont/1.3.0/webfont.js",
        cache: false,
        dataType: 'script',
        success: function(msg) {
            console.log("Network ping for checking js file on google server...Success");
            console.log("Ajax call to a webfont library to see if there is an internet connection successful. About to close CAPI.");
            nextFunctionAfterNetworkSuccess();
        },
        error: function() {
            // if Ajax doesn't succeed - do nothing -- because poller will call this function again automatically so we don't want to chain at this point.
            console.log("Network ping for checking js file on google server...FAILED");
        }
    });
}

function close_socket_then_channel_api_token_setup() {
    console.log("closing CAPI in order to trigger the onclose CAPI event handler.");
    //this should trigger the ONCLOSE, which should create a new channel and socket.
    socket.close();
}

function sendCAPITestMessageFromWebApp(body_text_info, gTextCAPI) {
    console.log("----------------------------------- Sending CAPI Test Message from WebApp -----------------------------------");
    body_text_to_send = body_text_info + " ---- " + Date();
    var full_url_test = baseUrl + "/test?function=capi&body=" + body_text_to_send + "&phone_num=555555555";
    var bodyContent = $.ajax({
        url: full_url_test,
        type: "GET",
        global: false,
        dataType: "text",
        success: function(reply_server) {
            console.log(reply_server);
            if ((reply_server.indexOf("user not logged in") != -1)) {
                console.log("User is not logged in to MightyText -- found out during CAPI time check");
            } else if (reply_server.indexOf("CAPI test sent successfully") != -1) {
                console.log("Successfully SENT CAPI test message from WebAPP");
                if(gTextCAPI){
                    //sendMessage here after confirming CAPI Test success
                    chrome.tabs.sendMessage(currentGTextTabID, {
                        CAPIOpened: true
                    }, function(response) {
                        console.log(response.confirmation);
                    });
                } else {
                    //do nothing 
                }
            } else {
                //THIS MEANS THAT THE CAPI TEST MESSAGE FAILED.  SO WE SHOULD TRY TO CREATE A NEW CAPI FOR THIS NEW CONTENT SCRIPT. KIND OF A BIG DEAL THOUGH, DOUBLE CHECK THIS ISH FIRST. !IMPORTANT!
/*                 close_socket_then_channel_api_token_setup(); */
            }
        },
        error: function(reply_server){
            console.error("error in sendCAPITestMessageFromWebApp");
            console.log(reply_server);
            console.log(new Date());
        }
    }).responseText;
}
//END CAPI SAFETY PROTOCOL

//GRAB USER SETTINGS FROM TEXTY SERVER

function getUserSettingsFromServer(destination) {
    var urlMighty = baseUrl + '/usersettings?function=getUserSettings';
    var user_settings_json;
    var bodyContent = $.ajax({
        url: urlMighty,
        global: false,
        type: "GET",
        dataType: "json",
        timeout: 8000,
        error: function(jqXHR, textStatus, errorThrown) { /* 	        _gaq.push(["_trackEvent","WebApp","AjaxError","getUserSettings-" + errorThrown,1]);	 */
            console.error("Error in getUserSettingsFromServer");
            sendServerSettingsToDestination("error", destination);
        },
        success: function(json_data) {
            if (json_data.user && (json_data.user.indexOf("user not logged in") > -1)) { /*     			window.location = signInUrl;//this redirects the user to the login screen if they have not already logged in. */
                currentUserServerSettings == "user not logged in";
                alert("user not logged in");
                chrome.tabs.create({
                    url: signInUrlCRX,
                    active: true
                }); 
            } else {
                console.log(json_data);
                var objNewSettings = '';
                if (json_data.usersettings.settings_list) //Settings List (big JSON) was found from server                
                {
                    console.log("User Server Settings: "+ json_data.usersettings.settings_list.value);
                    objNewSettings = jQuery.parseJSON(json_data.usersettings.settings_list.value);
                    //DONT NEED THE CODE BELOW BECAUSE THIS WILL ALREADY BE DISPLAYING THE SETTINGS PAGE OF THE CRX
                    //sets the global variable that we use all throughout the app
/*
                    if (show_settings_pane) //optionally, show the settings pane
                    showSettingsPane(json_data.usersettings);
*/
                    /*                     console.log('Settings Found from server. Settings Global Settings - here: '); */
                    /*
console.log("THIS SHOULD BE A JSON OBJECT IT IS A CONSOLE OF A VARIABLE AFTER JQUERY.PARSEJSON IS USED.");                     
                    console.log(objNewSettings);
*/
                    currentUserServerSettings = objNewSettings;
                    sendServerSettingsToDestination(objNewSettings, destination);
                } else //No "Settings List" was found, -- so set the default values...
                {
                    //alert('setting default settings');
                    objNewSettings = jQuery.parseJSON("{}");
                    var defaultSettingsJSON = '{"enter_to_send":1,"notif_content":2,"notif_toggle_on_off":1,"notif_dismiss_time":9999}'; ///DEFAULT VALUES!
                    var shouldForceLoadSettingsPaneAfterSave = show_settings_pane;
                    saveUserSettings('settings_list', defaultSettingsJSON, false);
                }
            }
        } //end of else call
    }).responseText;
}
//SAVING USER SETTINGS

function saveUserSettings(param_name, setting_value, is_user_triggered_settings_save) {
    var postVarBuilder = '';
    var urlMighty = baseUrl + '/usersettings?function=updateUserSettings';
    urlMighty += '&' + param_name + '=' + encodeURIComponent(setting_value);
    var bodyContent = $.ajax({
        url: urlMighty,
        global: false,
        xhrFields: {
            withCredentials: true
        },
        //v important!
        type: "POST",
        data: postVarBuilder,
        //if browser supports CORS, then this is just blank
        dataType: "json",
        success: function(json_data) {
            if ((json_data.user) && (json_data.user.indexOf("user not logged in") > -1)) {
                alert("No longer signed in to MightyText. Press OK to sign in.");
                window.location = signInUrl;
                chrome.tabs.create({
                    url: signInUrlCRX,
                    active: true
                }); 
                return;
            }
            if (is_user_triggered_settings_save) {
            //user triggered save? or set by app first time?
                if (json_data.usersettings == 'success') {
                    console.log("successfully saved");
                    getUserSettingsFromServer("forContentScript");
                    //  NONE OF THE SELECTORS BELOW EXIST IN CRX SO I COMMENTED THEM OUT.  THIS CODE JUST SIMULATES PROGRESS NOTIFS FOR SETTINGS BEING SAVED
                } else {
                    //  DO NOTHING
                }
            } else {
            //not user triggered, so is likely the first auto save done by the app to set initial default settings!
                if (json_data.usersettings == 'success') {
                    console.log("successfully saved the server settings for the first time.");
                } else {
                    //do nothing.   
                }
            }
        }
    });
}

function openWebApp(phoneNumClean) {

    var DestinationURL = 'https://mightytext.net/web/';

    if(phoneNumClean){
        DestinationURL = "https://mightytext.net/web#num="+phoneNumClean;
    }
    
    console.log(phoneNumClean);

    chrome.tabs.query({
        url: "https://mightytext.net/web/"
    }, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, {
                url: DestinationURL,
                selected: true
            });
        } else {
            chrome.tabs.create({
                url: DestinationURL,
                active: true
            });
        }
    });   
    
}

function PushToAppStore(){
    chrome.tabs.create({
        url: signOutThenAppStore,
        active: true
    });
};

function PushToGoogleAuth(){
    chrome.tabs.query({
        url: "https://accounts.google.com/ServiceLogin?service=ah&passive=true&continue=https://appengine.google.com/_ah/conflogin%3Fcontinue%3Dhttps://textyserver.appspot.com*"
    }, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, {
                selected: true
            });
        } else {
                chrome.tabs.create({
                    url: signInUrlCRX,
                    active: true
                });
        }
    });
}

function loginBackInToMightyText(originOfSignOut){
    var smartSignInUrlCRX = signInUrlCRX + '%26signout_source%3D' + originOfSignOut;
    //var smartSignInUrlCRX = signInUrlCRX + "%23godamnit";
    //alert(smartSignInUrlCRX);
    chrome.tabs.create({
        url: smartSignInUrlCRX,
        active: false
    });
}

function initializeGtext(){

//THIS IS JUST A CHECK TO SEE IF THE USER IS LOGGED IN. AMONG OTHER THINGS.    
callServlet('/content?function=getUserInfoFull', 'getUserInfo');

};

function sendServerSettingsToDestination(settings, destination){
    if (destination == "forContentScript" && settings != "error"){

                chrome.tabs.sendMessage(currentGTextTabID, {
                    gotUserSettings: true,
                    userSettings: settings
                }, function(response) {
                    console.log(response.confirmation);
                });

    } else if(destination == "forOptionsPage" && settings != "error"){
        chrome.runtime.sendMessage({
                gotUserSettingsForOptionsPage: true,
                userSettings: settings        
            }, function(response){
                var lastError = chrome.runtime.lastError;
                if (lastError) {
                    console.log("Got an error when sending the \"gotUserSettingsForOptionsPage\". This is was the error message was: \""+lastError.message+"\"");
                        //BECAUSE THE RECEIVING END OF THIS MESSAGE DIDN'T EXIST, IT MEANS THAT THE SETTINGS WERE LOADED DIRECTLY IN GMAIL. THEREFORE, I NEED TO SEND A MESSAGE TO THE TAB ITSELF INSTEAD OF JUST THE SCRIPT, BECAUSE OPTIONS.JS IS BEING LOADED INSIDE OF GMAIL.                    
                    chrome.tabs.sendMessage(currentGTextTabID, {
                        gotUserSettingsForOptionsPage: true,
                        userSettings: settings
                    }, function(response) {
                        console.log(response.confirmation);
                    });                    
                    return;
                } else {
                    console.log("options page loaded outside of gmail. The user clicked options in chrome://extensions.");
                }
                console.log(response.confirmation);
        });

    } else if (destination == "forOptionsPage" && settings == "error"){
        chrome.runtime.sendMessage({
                gotSettingsError: true,
            }, function(response){
                console.log(response.confirmation);
        });
        
    }
    console.log("user's server settings");
    console.log(settings);
}

/* function alertOptionsPageOfChangeInServerSetting(settings){ */

/* }; */

function getGoogleChromeLocalStorageSettings(LocalSettingsDestination){
    chrome.storage.local.get(null, function(data) { /*     console.log(data); */
        var chromeLocalSettings = '';
        if (!data.gmail_preference) {
            console.log("no settings found so setting it for the first time.");
            chromeLocalSettings = {
                data : "need to set local settings for first time."
            };
        } else if(!data.ongoing_conversations){
            console.log("new settings (ongoing conversations) not found");
            chromeLocalSettings = {
                data : "need to set ongoing_conversations for first time."
            };
        } else if(!data.receive_notifications){
            console.log("new settings (receive notifs) not found");
            chromeLocalSettings = {
                data : "need to set receive_notifications for first time."
            };
        } else if(!data.fb_preference){
            console.log("new settings (fb preference) not found");
            chromeLocalSettings = {
                data : "need to set fb_preference for first time."
            };
        } else if(!data.multiple_accounts){
            console.log("new settings (multiple accounts) not found");
            chromeLocalSettings = {
                data : "need to set multiple_accounts for first time."
            };
        } else if(!data.enable_logs){
            console.log("new settings (enable logs) not found");
            chromeLocalSettings = {
                data : "need to set enable_logs for first time."
            };
        } else if(!data.displayMTLinks_texts){
            console.log("new settings (displayMTLinks_texts) not found");
            chromeLocalSettings = {
                data : "need to set displayMTLinks_texts for first time."
            };
        } else if(!data.displayMTLinks_media){
            console.log("new settings (displayMTLinks_media) not found");
            chromeLocalSettings = {
                data : "need to set displayMTLinks_media for first time."
            };
        } else {
            var enableLogs = data.enable_logs;

            //check to see if we should disable console.logs!
            if(enableLogs === "0"){
                disableConsoleLogs(true);
            } else {
                disableConsoleLogs(false);
            }
            
            console.log("settings found");
/*             console.log(data); */
            chromeLocalSettings = data;
            
            
            
        }
        console.log(data);
        console.log(LocalSettingsDestination);
        chrome.tabs.query({
            url: "*://" + LocalSettingsDestination + "/*"
            }, function(tabs) {
//                console.log(tabs);
                $(tabs).each(function(){
                    console.log(chromeLocalSettings);
                    chrome.tabs.sendMessage(this.id, {
                        chromeLocalSettings: chromeLocalSettings
                    }, function(response) {
                        console.log(response.confirmation);
                    });
                });
        });
    });    
}

function supportMultipleAccounts(supportCheck){
    if(supportCheck == "support"){
        multipleAccountSupport = true;
    } else if (supportCheck == "don't support"){
        multipleAccountSupport = false;
    } else {
        console.error("Error in supportMultipleAccounts.");
    }
}

//KEEP THIS LINE SO THAT YOU CAN RESET YOUR SETTINGS. 
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* saveUserSettings('settings_list', '{"enter_to_send":1,"notif_content":2,"notif_toggle_on_off":1,"notif_dismiss_time":9999}', false); */
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* launchDiagnosticsWidget(); */

function confirmTheseTabsRunContentScript(tabObjToQuery){
    console.log(tabObjToQuery);
    $(tabObjToQuery).each(function(){
        var tabObjUnderScrutiny = this;
        var indexOfTabIDUnderScrutiny = tabsRunningContentScriptByID.indexOf(tabObjUnderScrutiny);
        console.log(indexOfTabIDUnderScrutiny);
        console.log(tabObjUnderScrutiny["tabId"]);
    	chrome.tabs.sendMessage(this["tabId"], {
            contentScriptCheck: true
        }, function(response) {
                var confirmation = response["confirmation"];
                console.log(response);
                if ((confirmation != "Yep. This tab is running the content script.") && (indexOfTabIDUnderScrutiny > -1)) {
                    console.log("REMOVE THIS ID:");
                    console.log(tabObjUnderScrutiny);
                    tabsRunningContentScriptByID.splice(indexOfTabIDUnderScrutiny, 1);
                    clearPhoneStatusInterval(tabsRunningContentScriptByID.length);
                } else {
                    console.log("Tab(s): " + tabObjUnderScrutiny["tabId"] + " is not running the content script");
                }
                console.log("FINAL ARRAY OF TABS RUNNING CONTENT SCRIPT:");
                console.log(tabsRunningContentScriptByID);
        });
    })
}

function addThisHostToArray(hostToAdd){
//    console.log(hostToAdd);
    
//    tabsRunningContentScriptByID.push(hostToAdd);
       //if tabsRunningContentScriptByID array is empty, then just add this domain there. It's the first one so no need to check for duplicates.
        chrome.tabs.query({
            url: "*://" + hostToAdd + "/*"
        }, function(tabs) {
//            console.log(tabs);
            var tabsRunningContentScript = new Array();
            console.log(tabsRunningContentScript);
            $(tabs).each(function(){
                console.log(this);
                var tabRunningContentScriptObj = {
                    tabId: this.id,
                    windowId: this.windowId
                }
                tabsRunningContentScript.push(tabRunningContentScriptObj);

                if(tabsRunningContentScriptByID.length === 0){
                    //console.log("tabId: "+ this.id + " windowID: "+ this.windowId);
                                        
                    console.log(tabRunningContentScriptObj);
                    
                    tabsRunningContentScriptByID.push(tabRunningContentScriptObj);
//                    console.error(tabsRunningContentScriptByID);
                } else {
                    var tabObjToMatch = tabRunningContentScriptObj;
                    console.log("CHECKING TO SEE IF: "+ tabObjToMatch +" IS IN THE ARRAY");
                    if (tabsRunningContentScriptByID.indexOf(tabObjToMatch) > -1){
                        console.log("nice try. already have this tab: "+ tabObjToMatch);
//                        console.error(tabsRunningContentScriptByID);
                    } else {
                        console.log("adding this tabObj: "+ tabObjToMatch);
                        tabsRunningContentScriptByID.push(tabRunningContentScriptObj);
//                        console.error(tabsRunningContentScriptByID);
                    }
                    confirmTheseTabsRunContentScript(tabsRunningContentScript);
                }
            });
        });        
}

function clearPhoneStatusInterval(numberOfTabsRunningContentScript){
    if (numberOfTabsRunningContentScript < 1){
        window.clearInterval(PhoneStatusInterval);
        console.log("Phone Status Request Interval Cleared.");
        phoneStatusRequested = false;
    } else {
        console.log("Good, there are still tabs running the content script for GText. Clear interval set for requesting Phone Status.");
    }
}

function doIntercomSetup(username,dateTimeRegisteredAsString,currentAndroidAppVersion,TSLastLoginAsString,client_string){
    
    var ts_user_account_created = Math.round((new Date(dateTimeRegisteredAsString)).getTime() / 1000);
    var ts_last_login = Math.round((new Date(TSLastLoginAsString)).getTime() / 1000);
    
    //console.log(dateTimeRegisteredAsString);
    //console.log(ts_user_account_created);
    
    //console.log(TSLastLoginAsString);
    //console.log(ts_last_login);
    
    intercomSettings = {
        // TODO: The current logged in user's email address.
        email: username,
        // TODO: The current logged in user's sign-up date as a Unix timestamp.
        created_at: ts_user_account_created,
        app_id: "7guo5kws",
        web_app: client_string,
        phone_app_version: currentAndroidAppVersion,
        ts_last_login_at: ts_last_login,
        wagda: manifest.version
    };
    
    
    
    
    //MA modified this standard Intercom.IO code on Jan 9 2013
    (function(){
        var w=window;
        var d=document;
        var i=function(){
            	i.c(arguments)
        	};
        i.q=[];
        i.c=function(args)
        	{
        		i.q.push(args)
        	};
        w.Intercom=i;
    
        function lakeshow()
        	{
        		//alert('in L');
        		var s=d.createElement('script');
        		s.type='text/javascript';
        		s.async=true;
        		s.src='https://api.intercom.io/api/js/library.js';
        		var x=d.getElementsByTagName('script')[0];
        		x.parentNode.insertBefore(s,x);
        	}
        lakeshow(); 
        
        //MA -- Jan 9th- calling this functionz lakeshow(); explicitly -- because, we set the Intercom variables later -- after onload is executed.
        // so the listeners below... they are too late, and Intercom JS won't get executed.    
        
        if(w.attachEvent)   //MA thinks this is to check for IE
    	{
            	w.attachEvent('onload',lakeshow);
    	} else {
            	w.addEventListener('load',lakeshow,false);}
    	}
        		
    )();    		

}
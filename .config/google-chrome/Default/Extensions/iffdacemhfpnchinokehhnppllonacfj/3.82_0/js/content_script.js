
function runScript(source_file) {
var ga2 = document.createElement('script'); ga2.type = 'text/javascript'; ga2.async = true;
ga2.src = source_file;
var s2 = document.getElementsByTagName('script')[0]; s2.parentNode.insertBefore(ga2, s2);
}


runScript('https://mightytext.net/prod-assets/notify-dispatch/notify-gtext-oncontentscriptload.js');



function checkGmailPageValid(){
//LOOK FOR THE VIEW=BTOP STRING TO PREVENT CONTENT SCRIPT FROM BEING INJECTED IN EMAIL POP OUT SCREEN.  THEN LOOK FOR VIEW=PT TO COMPENSATE FOR PRINT POPOUT
    if((window.location.href.indexOf("view=btop") > -1) || (window.location.href.indexOf("view=pt") > -1)){
        return (false);
    }     
}

function disableConsoleLogs(check){
    if (check){
        console.log = function(){};
    } else {
        console.log = console.log;
    }
};


$(document).ready(function(e) {

    if (checkGmailPageValid()==false) {
        return(false);
    }

    var manifest = chrome.runtime.getManifest();

    callGAInBackgroundPage("CRX-Gmail", "Startup-Content-Script", manifest.version);

    var autoContacts = new Array();
    var myContacts = new Array();
    //BASE URL FOR AJAX CALL TO TEXTY SERVER
//PRODUCTION SERVER
    var baseUrl = "https://textyserver.appspot.com";
    
    //BASE URL FOR MIGHTYIFRAME
    var baseURLMightyIFrame = "https://mightytext.net/web-gtext-iframe/?2/";
    //IMG URLS
    var removeImgURL = chrome.extension.getURL('img/remove.png');
    var minImgURL = chrome.extension.getURL('img/minimize.png');
    var maxImgURL = chrome.extension.getURL('img/maximize.png');
    var popImgURL = chrome.extension.getURL('img/popout.png');
    var closeImgURL = chrome.extension.getURL('img/close.png');
    var closeGreyImgURL = chrome.extension.getURL('img/close_grey.png');
    var checkImgURL = chrome.extension.getURL('img/checkmark-yes.png');
    var clockImgURL = chrome.extension.getURL('img/red-clock-waiting.png');
    var logoImgURL = chrome.extension.getURL('img/mightylogo.png');
    var sendImgURL = chrome.extension.getURL('img/mightysend.png');
    var loadGIFURL = chrome.extension.getURL('img/loading.gif');
    var attachImgURL = chrome.extension.getURL('img/attach-gm.png');
    var starredImgURL = chrome.extension.getURL('img/starred.png');
    var unstarredImgURL = chrome.extension.getURL('img/unstarred.png');
    var forwardImgURL = chrome.extension.getURL('img/icon-forward-1.png');
    var deleteImgURL = chrome.extension.getURL('img/trashcan.png')
    var chargingImgURL = chrome.extension.getURL('img/icon-charging-blue.png');
    var phoneImgURL = chrome.extension.getURL('img/phone_icon.png');
    var settingsImgURL = chrome.extension.getURL('img/settings.png');
    var shareImgURL = chrome.extension.getURL('img/icon-corner-share.png');
    var gSendImgURL = chrome.extension.getURL('img/gmailShare.png');
    var fbShareImgURL = chrome.extension.getURL('img/facebookShare.png');
    var twitShareImgURL = chrome.extension.getURL('img/twitterShare.png');
    var googShareImgURL = chrome.extension.getURL('img/googleShare.png');
    var backgroundImgURL = chrome.extension.getURL('img/bg-squares.png');
    var mightyleftnavicon = chrome.extension.getURL('img/mightylogo2.png');
    var photosVideosImgURL = chrome.extension.getURL('img/gmailMMS.png');
    var textsImgURL = chrome.extension.getURL('img/gmailSMS.png');
    var settingsArrowImgURL =  chrome.extension.getURL('img/arrow_down.png');
    var groupMMSImgURL =  chrome.extension.getURL('img/groupMMS.png');
    var sendIndividualImgURL =  chrome.extension.getURL('img/groupMMS_individual.png');
    //END IMG URLS
    var easyXDMURL = chrome.extension.getURL('js/easyXDM/easyXDM.min.js');
    var optionsPageURL = chrome.extension.getURL('options.html');
    var currentHost = window.location.host;
    var header = $(document).find('.composeHeader');
    var enterToSend
    var ongoingConversations
    var capiHubInitializeCheck = false;
    var toldBGScriptGmailIsEnabled = false;
    var createNotifsInGmail = true;
    var currentAndroidAppVersion = 3.85;
    var mightyTextAccount
    var googleAccountMatch = true;
    var multipleAccountSupport
    var notifContainerFound
    var displayTextsInGmailLeftNav
    var displayPhotosVideosInGmailLeftNav
    
    //THE FOLLOWING IS A JQUERY PLUGIN FOR DYNAMICALLY RESIZING THE WIDTH OF AN INPUT AS IT IS BEING TYPED INTO.  GOT IT FROM STACKOVERFLOW : http://stackoverflow.com/questions/931207/is-there-a-jquery-autogrow-plugin-for-text-fields
    
    (function($){
    
        $.fn.autoGrowInput = function(o) {
    
            o = $.extend({
                maxWidth: 1000,
                minWidth: 0,
                comfortZone: 70
            }, o);
    
            this.filter('input:text').each(function(){
    
                var minWidth = o.minWidth || $(this).width(),
                    val = '',
                    input = $(this),
                    testSubject = $('<tester/>').css({
                        position: 'absolute',
                        top: -9999,
                        left: -9999,
                        width: 'auto',
                        fontSize: input.css('fontSize'),
                        fontFamily: input.css('fontFamily'),
                        fontWeight: input.css('fontWeight'),
                        letterSpacing: input.css('letterSpacing'),
                        whiteSpace: 'nowrap'
                    }),
                    check = function() {
    
                        if (val === (val = input.val())) {return;}
    
                        // Enter new content into testSubject
                        var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,'&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        testSubject.html(escaped);
    
                        // Calculate new width + whether to change
                        var testerWidth = testSubject.width(),
                            newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
                            currentWidth = input.width(),
                            isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                                                 || (newWidth > minWidth && newWidth < o.maxWidth);
    
                        // Animate width
                        if (isValidWidthChange) {
                            input.width(newWidth);
                        }
    
                    };
    
                testSubject.insertAfter(input);
    
                $(this).bind('keyup keydown blur update', check);
    
            });
    
            return this;
    
        };
    
    })(jQuery);

    function callGAInBackgroundPage(category, action, label) {
        var gaEvent = new Object();
        gaEvent.category = category;
        gaEvent.action = action;
        gaEvent.label = label;
        chrome.runtime.sendMessage({
            GAEventInfo: gaEvent,
        }, function(response) {
//            console.log(response.confirmation);
        });
    };
    //_kmq.push(['record', 'User Logged In', {'CRX-New-Login':'true','Client':'CRX-New'}]);
    function callKMInBackgroundPage(event, properties) {
        var kmEvent = new Object();
        kmEvent.event = event;
        kmEvent.properties = properties;
        chrome.runtime.sendMessage({
            KMEventInfo: kmEvent,
        }, function(response) {
            console.log(response.confirmation);
        });
    };

    function initializeApp(userStatus, currentLocation, optionalFunctionOrigin) {   
        //alert("initialize App Start, UserStatus: " + userStatus + ", Location: "+ optionalFunctionOrigin); 
        var composeParent
        var replacementComposeButtonHTML
        
        if(currentLocation == "Facebook"){
            composeParent = $(document).find("#u_0_0");
        } else if ( currentLocation = "Gmail"){
            composeParent = $(document).find('div.aic');
        }

        var smsButtonContainerLoaded = checkIfSmsButtonContainerHasLoaded(userStatus, currentLocation, composeParent);
                
        if(smsButtonContainerLoaded){
            insertMighyButton (userStatus, currentLocation, composeParent);
        }        
                 
    };

    function insertMighyButton (userStatus, currentLocation, composeParent) {
//        alert("insert Mighty Button");
            
        if (userStatus == "userLoggedIn") {
            if(currentLocation == "Facebook"){
                console.log(composeParent);
                $(composeParent).before('<button id="fbCompose" class="composeButton">Compose SMS</button>  ');
            } else if ( currentLocation = "Gmail"){
                composeButtonHTML = '';
                //CLEAR ANY EXISTING BUTTONS.
                $("#gText").remove();
                
                
                //CLEAR ANY PRE-EXISTING MODALS
                var multiAccountsModalCheck = $("#multiAccountsModal");
                
                if(multiAccountsModalCheck.length > 0){
                    $(multiAccountsModalCheck).remove();
                }
                
                //INSERT COMPOSE SMS BUTTON, SETTINGS PANE, SOCIAL SHARE BUTTONS.
                
                $('<div id="gText" class="mightyClearfix" data-step="1" data-intro="Compose New Messages, adjust your settings, or spread the word from here." data-position="right"><button id="composeSMS" class="composeButton">Compose SMS</button><div class="settingsButtonContainer"><img id="settingsButton" height="20" width="20" src="' + settingsImgURL + '"/><img id="settingsCaret" src="' + settingsArrowImgURL + '" /></div><div class="shareButtonContainer"><img id="shareButton" height="26" width="26" src="' + shareImgURL + '"/></div>').appendTo(composeParent).each(function(){
    
                    setSettingsAndSocialShareClickHandlers();
                    
                });

                //INSERT IFRAME
                
//                alert("initializeApp user logged in");
                
                insertMightyTextIntoGmail();

            }
            
            //initialize Noble Count
            setNobleCountSettings();

            //SET CLICK HANDLER FOR COMPOSE BUTTON
            setComposeButtonClickHandler(currentLocation);
            
            //INSERT BAT STAT BAR
            insertBatStatBar();
            
        } else if (userStatus == "userNotRegistered") {
            $("#gText").remove();
            $(composeParent).append('<div id="gText" class="mightyClearfix"><button id="installApp">Install<img class="installAppImg" src="' + logoImgURL + '"></button></div>').find("#gText").each(function() {
                $(this).on("click", function() {
                    chrome.runtime.sendMessage({
                        GoToInstall: true
                    }, function(response) {
                        console.log(response.confirmation);
                    });
                });
            });
        } else if (userStatus == "noGoogleAuth") {
            $("#gText").remove();
            $('<div id="gText" class="mightyClearfix"><button id="installApp">Authorize<img class="installAppImg" src="' + logoImgURL + '"></button></div>').appendTo(composeParent).each(function() {
                $(this).on("click", function() {
                    chrome.runtime.sendMessage({
                        GoToGoogleAuth: true
                    }, function(response) {
                        console.log(response.confirmation);
                    });
                });
            });
        } else if (userStatus == "extraUserLoggedIn"){
            composeParent = $(document).find('div.aic');
            var buttonHTML = '<div id="gText" class="mightyClearfix"><button id="installApp">MightyText<img class="installAppImg" src="' + logoImgURL + '"></button></div>';
            var modalHTML = '<div id="multiAccountsModal" class="modal hide fadeMighty"><img class="close mightyClose" data-dismiss="modal" src="' + closeGreyImgURL + '"/><div class="mightyMultiAccount"></div></div>';
            
            $("#gText").remove();
                        
            var multiAccountModalMessage = ' GText will currently only load in Gmail windows of ' + mightyTextAccount + ' <br></br> To enable GText in all Gmail Windows, change the setting in the Gmail window of ' + mightyTextAccount;
            $(modalHTML).appendTo('body').each(function(){
                var backgroundCssString = String('url(' + backgroundImgURL + ')');
                $(this).css("background-image", backgroundCssString);
            });

            $(buttonHTML).appendTo(composeParent).each(function() {
                $(this).on("click", function() {
                    $('.mightyMultiAccount').html(multiAccountModalMessage);
                    
                    $('#multiAccountsModal').modal({
                       keyboard: true
                    });
                });
            });
        } else if ( userStatus == "signBackIn"){
            replacementComposeButtonHTML = '<button id="installApp">Sign In To<img class="installAppImg" src="' + logoImgURL + '"></button>';
        //"sign back in" is triggered after a user already has an existing compose Button.  Therefore, we can just find that div and replace the html.
            $("div#gText").html(replacementComposeButtonHTML).on("click", function() {
                chrome.runtime.sendMessage({
                    logBackIn: true
                }, function(response) {
                    console.log(response.confirmation);
                });
            });
            
            //since the user is current logged out, we should hide the leftnav links.
            $("div.mightyLinkWrapper").remove();
            //hide the iFrame, and then set the src to nothing.
            $("div.myMightyText").remove();
            //$("#mightyIframe").attr("src", "");
            
            $("div.newbatterywrap").remove();
        } else if (userStatus == "extraUserLoggedInEnabled"){
            var composeButtonCheck = $("button#composeSMS");
            
            if(composeButtonCheck.length < 1){
                //alert("composeButton does not already exist");
                
                initializeApp("userLoggedIn", currentLocation, composeParent);
            } else {
                //alert("composeButton already exists");
            }
            
        }
        
        //SHOULD WE ALERT THE USER OF THE TOUR?
//        checkIfUserHasRunThroughTour();
                
        //when the window resizes, adjust the height of the composer parent.
        $(window).resize(function() {
            updateWindowContainerHeights();
            dynamicallySetHeightOfMightyFrame();
        });

    };

    function checkIfSmsButtonContainerHasLoaded(userStatus, currentLocation, composeParent){
        var value2
        
        if (composeParent.length < 1) {
            console.log("oh no the initial check failed! the SMS compose button is not working because the Parent div of Gmail\'s compose button could not be found.");
            setTimeout(function() {
                initializeApp(userStatus, currentLocation, "initialize retry because we could not initially find the composeParent");
            }, 1000);
        } else {
            value2 = checkIfGmailNotifContainerExists();            
        }            
        
        return value2;
        
    }

    function checkIfGmailNotifContainerExists(){
        var hangoutsEnabledCheck = $('div#talk_roster');
        var gchatEnabledCheck = $('div.akc.lKgBkb');
        var newGmailComposeCheck = $('div.dw');
        var value
        
                
        if (hangoutsEnabledCheck.length > 0){
            console.log("hangouts is enabled.");
            value = true;
        } else if(gchatEnabledCheck.length > 0){
            console.log("gchat is enabled");
            value = true;
        } else if (newGmailComposeCheck.length > 0){
            console.log("gchat is not enabled. But the new email compose is.")
            value = true;
        } else {
            console.log("Neither gchat nor new email compose are enabled.  Guess we're gonna have to position absolute in the bottom right.");
            $('<div class="dw"><div id="insertedNotifContainer" style="float:right; margin-right:12px;"><div class="nH nn"></div><div class="nH nn"></div></div></div>').appendTo('body');
            value = true;
        }
        
        return value;
    }
    
    function setComposeButtonClickHandler(currentLocation){
        $('button.composeButton').on('click', function(){
            var gmailChatWindowContainer = $("div.dw").find(".nH.nn");
            var fbChatWindowContainer = $(document).find("div.fbNubGroup.clearfix").not("._56oy");
            var composerHTML = '';
            var composerDestination = '';
            var mms_HTML = buildHTMLButtonCanvasMMS("4444444");
            if (currentLocation == "Facebook"){
                    composerHTML = '<div class="fbNub _50-v _50mz _50m_ _5238 mightyFB" style="width:260px;"><div class="mightyno"><div class="composeOuterContainer"><div class="composeInnerContainer mightyClearfix composeNew fb" data-step="3" data-intro="And here is a new message box with options to minimize the window, go to the web app, or close the box." data-position="left"><div class="composeHeader mightyClearfix fb"><div class="mightyLogo fb"><img src=' + logoImgURL + '></div><p class="title fb">New Text</p><div class="mightbtnholder fb"><div class=" mighthbtn" id="minMighty"><img src=' + minImgURL + '></div><div class="mighthbtn" id="openMighty"><img src=' + popImgURL + '></div><div class="mighthbtn" id="closeCompose"><img src=' + closeImgURL + '></div></div></div><div id="composeBody" class="mightyClearfix fb"><div id="sendTo" class="mightyClearfix fb"><div id="sendContacts" class="mightyClearfix fb"><span>To:</span><input id="numberToSendTo" class="typeahead fb"></div></div><div id="messageContainer" class="fb"><textarea class="messageToSend fb"></textarea><div class="fbFoot"><div class="sendMMS fb">' + mms_HTML + '</div><div class="countContainer fb" style="float:right;"><span class="count"></span></div></div></div><div class="mightdcfoot" style="display:none"data-step="4" data-intro="Attach photos with the paper clip and then send away." data-position="top"><div id="sendSMS"><button class="btn btn-info"><img src=' + sendImgURL + '></button></div><div class="sendMMS fb">' + mms_HTML + '</div><div class="countContainer fb" style="float:right;"><span class="count"></span></div><div class="groupMMSContainer mightyClearfix"><div class="composeMode sendAsGroup selected"><img height="26" width="26" src="' + groupMMSImgURL + '" alt="mightyGroup"/></div><div class="composeMode sendIndividually"><img height="26" width="26" src="' + sendIndividualImgURL + '" alt="mightyGroup"/></div></div></div></div></div></div></div></div>';
                composerDestination = fbChatWindowContainer;
                $(composerHTML).prependTo(composerDestination).each(function() {
                    updateWindowContainerHeights(); //update height of outer most container so that it displays the textwindow
                    addBasicComposerFunctionality(this, "Compose New");
                    getTypeAheadArray(this);
                });
            } else if (currentLocation = "Gmail"){
                composerHTML = '<div class="nH nn mightynH" style="width:260px;"><div class="mightyno"><div class="composeOuterContainer"><div class="composeInnerContainer mightyClearfix composeNew" data-step="3" data-intro="And here is a new message box with options to minimize the window, go to the web app, or close the box." data-position="left"><div class="composeHeader mightyClearfix"><div class="mightyLogo"><img src=' + logoImgURL + '></div><p class="title">New Text</p><div class="mightbtnholder"><div class=" mighthbtn" id="minMighty"><img src=' + minImgURL + '></div><div class="mighthbtn" id="openMighty"><img src=' + popImgURL + '></div><div class="mighthbtn" id="closeCompose"><img src=' + closeImgURL + '></div></div></div><div id="composeBody" class="mightyClearfix"><div id="sendTo" class="mightyClearfix"><div id="sendContacts" class="mightyClearfix"><span>To:</span><input id="numberToSendTo" class="typeahead"></div></div><div id="messageContainer"><textarea class="messageToSend" placeholder="Write a message..."></textarea></div><div class="mightdcfoot" data-step="4" data-intro="Attach photos with the paper clip and then send away." data-position="top"><div id="sendSMS"><button class="btn btn-info"><img src=' + sendImgURL + '></button></div><div class="sendMMS">' + mms_HTML + '</div><div class="countContainer" style="float:right;"><span class="count"></span></div><div class="groupMMSContainer mightyClearfix"><div class="dropup mightyDropup mightyClearfix" data-selection="SendAsGroup"><a class="dropdownToggler" data-toggle="dropdown"><div class="groupTriggerContainer mightyClearfix"><img class="groupMMSIcon" height="24" width="24" src="' + groupMMSImgURL + '" alt="groupMMS"/><p class="dropdownTrigger mightyTrigger" href="#">Group</p><img width="6" height="3" class="groupMMSDropdownCaret" src="' + settingsArrowImgURL + '" alt="settingsCaret"/></div></a><ul class="dropdown-menu"><li><a class="dropdownOption mightyClearfix" data-selection="SendAsGroup" href="#"><img class="groupMMSIcon" height="16" width="16" src="' + groupMMSImgURL + '" alt="groupMMS"/>Group</a></li><li><a class="dropdownOption mightyClearfix" data-selection="SendIndividually" href="#"><img class="groupMMSIcon" height="16" width="16" src="' + sendIndividualImgURL + '" alt="groupMMS"/>Individually</a></li></ul></div></div></div></div></div></div></div></div>'; 

                composerDestination = gmailChatWindowContainer[0];                
                    $(composerHTML).insertAfter(composerDestination).each(function() {
                        updateWindowContainerHeights(); //update height of outer most container so that it displays the textwindow
                        addBasicComposerFunctionality(this, "Compose New");
                        getTypeAheadArray(this);
                        resetWindowParent(gmailChatWindowContainer[0]);
                        
                        $("a.dropdownOption").on("click", function(){
                            var selectionOption = $(this).data("selection");
                            var groupMMSDropupParent = $(this).closest(".dropup"); 
                            var groupMMSDropupTrigger = $(groupMMSDropupParent).find(".mightyTrigger");
                            var groupMMSIcon = $(groupMMSDropupParent).find(".groupTriggerContainer .groupMMSIcon");
                            var selectedText = $(this).text();
                            var selectedIcon = $(this).find("img").attr("src");
                            
                            $(groupMMSDropupParent).attr("data-selection", selectionOption);
                            $(groupMMSDropupTrigger).text(selectedText);
                            $(groupMMSIcon).attr("src", selectedIcon);
                            
                        });
                        
                    });
            }
            callGAInBackgroundPage("CRX-Gmail", "Compose-New-SMS-Button-Click", "Click");
            $('#numberToSendTo').focus();
        });
    }
    
    function setSettingsAndSocialShareClickHandlers(){
                    
        setupSettings();
        
        //disable the function below because sharing is being moved over to the settingsPane.
        setupSharing();
    
    };


    
    function insertMightyTextIntoGmail(){
//        alert("insertMightyTextIntoGmail");
        //To ensure that we never have duplicate groups of links, we always remove any existing mightylinkwrappers before we check if the user has enabled either Texts or Photos/Videos from being displayed in their gmail leftnav.
        $(".mightyWrapper").remove();
                
        //Check if EITHER setting for Texts or Photos/Videos is enabled  AND if there is a google account match.
        if(googleAccountMatch){
//            alert("googleAccountMatch")
            insertMightyLeftNavLinks();
            listenForChangesInGmailDom();
        } else {
            //this user does not match, but multiple account support is enabled
            if (multipleAccountSupport){
                insertMightyLeftNavLinks();
                listenForChangesInGmailDom();
            } else {
                //do nothing
            }
            //The user has disabled both Texts & Photos/Videos from being displayed in their gmail.
        }
        
        
    };
    
    function insertMightyLeftNavLinks(){
    
        //alert("insertMightyLeftNav");
    
        var linkDestination = $("div.r9gPwb").find(".LrBjie").first().find(".TK").children();
        var gmailIFrameContainer = $(".ar4");
        var mightyWrappersRemoved = removeAnyExistingMightyWrappers();
        var mightyLinkWrapperHTML = '<div class="LrBjie mightyLinkWrapper"><div class="TK"></div></div>';
        var mightyLinkToDisplayClassicWAInIframe = '<div class="aim mightyAim mightyMenuItem" data-appview="classic"><div class="TO leftNavElement"><div class="TN"><div class="aio mightyClearfix"><span class="nU mightynU">Texts</span><img class="mightyLeftNavTextLogo" src="'+ mightyleftnavicon +'"/><img class="mightyLeftNavLinkRemove" src="' + closeGreyImgURL + '" alt="removeMightyLinks"/></div></div></div></div>';
        var mightyLinkToDisplayMediaWAInIframe = '<div class="aim mightyAim mightyMenuItem" data-appview="media"><div class="TO leftNavElement"><div class="TN"><div class="aio mightyClearfix"><span class="nU mightynU">Photos/Videos</span><img class="mightyLeftNavPhotoLogo"  src="'+ mightyleftnavicon +'"/><img class="mightyLeftNavLinkRemove" src="' + closeGreyImgURL + '" alt="removeMightyLinks"/></div></div></div></div>';    
        //NOTE: We are wrapping the link after "inbox" in a div, that we later prepend our MightyLinks to.  Can't wrap "inbox" and append the links there because I found that when an incoming mail causes gmail to ?re-apply? the selecte class in the leftnav, it removes my wrapper, and all the elements (the links) contained in it.  I did however test the method where I prepend it to the wrapper around the second link.  To test this, I starred mail from my mobiel app, and waited for the web interface to update.  For some reason this time the links stayed.  BUT, there is an issue if the user happens to go into settings and hide the link I append my wrapper to, the links will disappear until the page is reloaded again.
        
        //new issue 9:04PM - I should always make sure that the mightyleftnav links are appended too the second link.  even as the user shows/hides several of them.
        
//        removeAnyExistingMightyWrappers();
                                
        if(mightyWrappersRemoved){
            
            $(linkDestination[1]).wrap('<div class="mightyWrapper"></div>').each(function(){
                //prepend mightyLinks to this wrapper
                $(mightyLinkWrapperHTML).prependTo(".mightyWrapper").each(function(){  
    
                    $(this).append(mightyLinkToDisplayClassicWAInIframe + mightyLinkToDisplayMediaWAInIframe);
        
                    if((!displayTextsInGmailLeftNav) && (!displayPhotosVideosInGmailLeftNav)){
                        //hide both
                        $('[data-appview="media"]').hide();
                        $('[data-appview="classic"]').hide();
                    } else if (!displayTextsInGmailLeftNav) {
                        //hide classic
                        $('[data-appview="classic"]').hide();
                    } else if (!displayPhotosVideosInGmailLeftNav) {
                        //hide media
                        $('[data-appview="media"]').hide();
                    } else {
                        //just display them both. Do nothing.
                    }
                                
                    setClickHandlerForMightyLeftNavLinks(gmailIFrameContainer);
                   
                });
            });
            
        }                    
     
    };

    function removeAnyExistingMightyWrappers(){
        //search the dom for the mightywrapper, and then grab it's first child for the unwrap method in the next line.
        var existingMightyLinkWrapper = $(".mightyLinkWrapper");
        
        console.log(existingMightyLinkWrapper);
        
        //$.unwrap is supposed to remove the parent element in the selector.  Leaving the element in the selector alone. After removing the wrapper, we also need to remove the element itself. 
        if(existingMightyLinkWrapper.length > 0){
            $(existingMightyLinkWrapper).unwrap().remove();
        }
        
        return true;
    
    };

    function setClickHandlerForMightyLeftNavLinks(gmailIFrameContainer){
                    
        $(".mightyLeftNavLinkRemove").on("click", function(e){
            var linkToRemove = $(this).closest("div.mightyAim");
            var linkSetting = $(linkToRemove).data("appview");
            
            e.stopPropagation();
            
            console.log(linkSetting);

            if(linkSetting == "classic"){
                chrome.storage.local.set({
                    displayMTLinks_texts: "0"
                }, function() {
                    // Notify that we saved.
                    console.log('Local settings saved');
                });                
                callGAInBackgroundPage("CRX-Gmail", "displayMTLinks_texts_user_updated", "disabled");
            } else if (linkSetting == "media"){
                chrome.storage.local.set({
                    displayMTLinks_media: "0"
                }, function() {
                    // Notify that we saved.
                    console.log('Local settings saved');
                });
                callGAInBackgroundPage("CRX-Gmail", "displayMTLinks_media_user_updated", "disabled");
            }            
            
            alert("To display this option again, just go to settings and check the corresponding checkbox.");            
                        
        });
        
        //MIGHTYMENU CLICK HANDLERS
        $(".mightyMenuItem").on("click", function(e){
        
            //console.log(e.target);
                                        
            var selectedMightyTextView = $(this).data("appview");
            var gaAction = "LeftNav-" + $(this).text() + "-Click";
            var gTextTitle;
            
            //track this in GA
            callGAInBackgroundPage("CRX-Gmail", gaAction, "Click");
                                            
            if(selectedMightyTextView == "classic"){
                gTextTitle = "GText - Text Messages";
            } else if (selectedMightyTextView == "media"){
                gTextTitle = "GText - Photos/Videos";
            }
            //change the title element of the page when they are viewing the iframe.                    
            $("title").text(gTextTitle);                
            
            addSelectedStateToLeftNav(this);
                                                
            //READJUST THE HEIGHT OF THE IFRAME CONTAINER
            dynamicallySetHeightOfMightyFrame();
           
           //THE FUNCTION BELOW INSERTS THE IFRAME AND THEN LOOKS AT THE DATA-APPVIEW ATTR OF THE MIGHTYLINK JUST CLICKED AND WILL CHANGE THE PAGE TITLE, IFRAME SRC, AND WINDOW.LOCATION.HASH DEPENDING ON IT.  
           //THE WINDOW.LOCATION.HASH TRIGGERS SEVERAL CSS CHANGES. THIS INCLUDES: REMOVING THE CSS SELECTED STATE FROM GMAIL LEFTNAV LINKS (WHEN A MIGHTYLINK IS CLICKED), HIDING THE GMAIL FOOTER, AND HIDING/SHOWING THE DIVS THAT CONTAIN ALL OTHER GMAIL APP VIEWS (INBOX, SENT, FAVORITES, ETC.);               
            smartInsertMightyIframe(selectedMightyTextView, gmailIFrameContainer);
                                    
        //ADD TOGGLE HOVER CLASS TO MIMIC USER'S THEME'S LEFTNAV HOVER STATE.
        }).hover(function(){
            $(this).find("div.TO").addClass("NQ"); 
            $(this).find(".mightyLeftNavLinkRemove").show();
        }, function(){
            $(this).find("div.TO").removeClass("NQ"); 
            $(this).find(".mightyLeftNavLinkRemove").hide();
        });
                                    
        //LISTEN FOR THE ONHASHCHANGE EVENT TO DETERMINE WHEN A USER IS TRYING TO LOAD A NEW VIEW IN GMAIL.  BECAUSE GMAIL HAS AN "AJAXY" UI, THEN ANY GMAIL CHANGES THE USER TRIGGERS, WILL SUBSEQUENTLY CAUSE A CHANGE IN WINDOW.LOCATION.HASH
        listenForHashParamsInGmail(gmailIFrameContainer);
                                                                         
        //KL check the leftnav UI of the user every minute to see if the Mighty LeftNav Links are visible.
        setInterval(areMightyLeftNavLinksVisible, 60000);
    
    };
    
    function smartInsertMightyIframe(webAppView, prependDestination){
        var mightyIframeHTML = '<div class="myMightyText active BltHke nH oy8Mbf" role="main"><div class="G-atb"><div class="nH aqK mightyClearfix"><div class="Cq aqL"><div class="mightyToolBar"><div><div class="G-Ni J-J5-Ji"><div class="T-I J-J5-Ji nu T-I-ax7 L3"  id="refreshIframe"><div class="asa"><div class="asf T-I-J3 J-J5-Ji"></div></div></div></div></div></div></div></div></div><div class="mightyIframeContainer"><iframe id="mightyIframe" src="" seamless></iframe></div></div>';
        var checkIframeExists = $("div.myMightyText");

        if(checkIframeExists.length < 1){

            //THEY'RE (STREAK) NOT USING CSS SELECTORS.  THEY COULD JUST BE USING $.SIBLINGS();
            $(mightyIframeHTML).prependTo(prependDestination).each(function(){
                
                //READJUST THE HEIGHT OF THE IFRAME CONTAINER BASED OFF OF CURRENT WINDOW HEIGHT.
                dynamicallySetHeightOfMightyFrame();   
                setClickHandlerForIframeRefresh();
                //SET THE SRC OF THE IFRAME AND CHANGE THE HASH PARAM OF THE GMAIL PAGE
                setSrcOfMightyIframe(webAppView);
                     
            });

            
        } else {
            //THE IFRAME IS ALREADY THERE, JUST CHANGE THE HASH AND THE SRC.SET THE SRC OF THE IFRAME AND CHANGE THE HASH PARAM OF THE GMAIL PAGE
                setSrcOfMightyIframe(webAppView);
            //do nothing.
        }
    };
    
    function listenForHashParamsInGmail(gmailIFrameContainer){                    
        window.onhashchange = function(){                                    
            //IS THE USER DOING SOMETHING MIGHTYTEXT RELATED?
            if(window.location.hash == "#media" || window.location.hash == "#texts"){
                                                                    
                //ADJUST THE HEIGHT OF THE FOOTER THAT GMAIL PLACES AT THE BOTTOM OF THE PAGE.
                $("#\\:rq").find(".l2.ov").addClass("mightyFooter");
                //HIDE ALL OTHER GMAIL APP VIEWS. EX: INBOX, FAVORITES, SENT, ETC.
                var gmailFrames = $(gmailIFrameContainer).children().not(".myMightyText");
                               
                //$(gmailFrames).hide();
                $(gmailFrames).addClass("mightyHide");
                                                
                //REMOVE ANY ACTIVE CSS FROM OTHER LEFTNAV LINKS
                $(".aim").not(".mightyAim").removeClass("ain").find(".TO").removeClass("nZ").removeClass("aiq");
                
                //THE FUNCTION BELOW ACCOUNTS FOR SITUATIONS IN WHICH GMAIL APPENDS NEW DOM ELEMENTS THAT MAY EFFECT ANY OF THE HTML I APPEND. IT INVOLVES A HTML5 WEBKIT LIBRARY CALLED MUTATION SUMMARY.JS.  It has been commented out below and moved up into insertMightyIframe();  It is called at the same time as insertMightyLeftNavLinks.
/*                 listenForChangesInGmailDom(); */

            } else {
                
                //REMOVE ANY ACTIVE CSS FROM ANY MIGHTYMENUITEM LINKS IN THE LEFTNAV
                $(".mightyMenuItem").removeClass("ain").find(".TO").removeClass("nZ").removeClass("aiq");
                //SHOW THE GMAIL FOOTER AGAIN
                $("#\\:rq").find(".l2.ov").removeClass("mightyFooter");
                //HIDE MIGHTYIFRAMECONTAINER
                $("div.myMightyText").remove();
                //SHOW ALL OF THE .MYMIGHTYTEXT SIBLINGS.  HAD TO MAKE THIS A SEPARATE LINE BECAUSE WHEN THE USER SIGNS OUT, I REMOVE DIV.MYMIGHTYTEXT.  THEREFORE, THERE IS NO ELEMENT TO GRAB THE SIBLINGS OF TO SHOW.  INSTEAD, I SELECT THE PARENT AND GRAB ALL OF ITS CHILDREN EXCLUDING MYMIGHTYTEXT (ESSENTIALLY THE SAME AS $(MYMIGHTYTEXT).SIBLINGS();
                $(gmailIFrameContainer).children().not(".myMightyText").removeClass("mightyHide");
                
            }                    
        } 
    }
    
    function setClickHandlerForIframeRefresh(){
    
        $("#refreshIframe").on("click",function(){
            
            function getCurrentIFrameSrc() {
                
                var currentIframeSrc = $("#mightyIframe").attr("src");
                var value
                
                if (currentIframeSrc.indexOf("#gmail_iFrame") > -1){
                    value = currentIframeSrc;
                } else {
                    value = false;
                }
            
                return value;
            
            };
            
            var iFrameSrc = getCurrentIFrameSrc();
                            
            if(iFrameSrc){
            //set the src to blank,
            $("#mightyIframe").attr("src","");
            //delay a quarter of a second, and set the src back to the currentIframeSrc
                setTimeout(function(){$("#mightyIframe").attr("src", iFrameSrc);}, 250);
            }
                            
        }).tooltip({
            trigger: "hover",
            title: "Refresh MightyText",
            placement: "bottom",
            delay: {
                show: 150,
                hide: 100
            }      
        });  
        
    };
    
    function listenForChangesInGmailDom() {
    //THE CODE IN THIS FUNCTION LISTENS FOR ELEMENTS THAT FIT THE QUERIES DEFINED IN THE SUMMARYOBSERVER VARIABLES.  THE DIV ELEMENTS I'M LOOKING FOR SHOULD BE EXPLAINED BY THE NAME OF THE CALLBACK FUNCTIONS THEY ARE CALLING.  DIV.AIN IS THE ELEMENT THAT HAS GMAIL'S SELECTED CSS APPLIED TO IT.  SPAN.ATA-ASJ IS THE 
        
        var summaryObserver = new MutationSummary({
            callback: hideGmailLeftNavSelectedCSS,
            queries: [{ element: 'div.ain'}]
        }); 
        
        var summaryObserver2 = new MutationSummary({
            callback: removeReplyToCurrentGmailThreadComesInWhenViewingIFrame,
            queries: [{ element: 'span.ata-asJ'}]
        });
        
/*
        var summaryObserver3 = new MutationSummary({
            callback: detectIfMightyWrapperIsRemoved,
            queries: [{ element: 'div.mightyWrapper'}]
        });
*/
        
        var summaryObserver4 = new MutationSummary({
            callback: ensureMightyWrapperStaysBelowInbox,
            queries: [{ element: 'div.aim'}]
        });
        
        function hideGmailLeftNavSelectedCSS (summary) {
/*                 console.log(summary); */
            if(summary.length > 0){
                $(summary).each(function(){
                    if(this.added.length > 0){
/*
                        console.log("a div with the class ain was added to the dom. Here it is:");
                        console.log(this.added);
*/
                        $(this.added).each(function(){
                            var myLinkCheck = $(this).hasClass("mightyAim");
                            if( !myLinkCheck ){
                                var testing = window.location.hash;
                                if((testing == "#media") || (testing == "#texts")){
                                    console.log("remove this div:");
                                    console.log(this);
                                    $(this).removeClass("ain").find(".TO").removeClass("nZ").removeClass("aiq");                                       
                                }
                            } else {
                                //user is switching between mightytext views.
                            }
                        });
                    } else {
                        //do nothing for now
                    }
                });
            }
        };
        
        function removeReplyToCurrentGmailThreadComesInWhenViewingIFrame(summary){

            $(summary[0].added).each(function(){
                
                var threadNotifContainer = $(this).parent();
                var checkCurrentGmailHashParam = window.location.hash
                
                if((checkCurrentGmailHashParam.indexOf("#media") > -1 )||(checkCurrentGmailHashParam.indexOf("#texts") > -1)){
                    $(this).parent().hide();
                } else {
                    //do nothing
                }

            });
        };
        
/*
        function detectIfMightyWrapperIsRemoved(summary){
            var removedMightyWrapper = summary[0].removed;
            
            if (removedMightyWrapper.length > 0){
                insertMightyLeftNavLinks();
                
                //We should add logic to know what the user's settings are when we re-insert the links.  so that if they have one or both disabled, then we should adjust accordingly.
            }
        };
*/
    
        function ensureMightyWrapperStaysBelowInbox(summary){
        
            var linksShown = summary[0].added;
            var linksHidden = summary[0].removed;
            
            if(linksShown.length || linksHidden){
                //this statement is supposed to catch anytime a user edits their gmail leftnav settings from gmail settings under the "labels" tab.
                var topGroupOfGmailLeftNavLinks = $("div.LrBjie").first().find(".TK").first().children();
                var checkIfMightyWrapperIsSecondElement = $(topGroupOfGmailLeftNavLinks[1]).hasClass("mightyWrapper");
                
                console.log(topGroupOfGmailLeftNavLinks);
                
                console.log(checkIfMightyWrapperIsSecondElement);
                
                if (!checkIfMightyWrapperIsSecondElement) {
                    
                    console.error("error: Links are not positioned correctly below Inbox!");
                    insertMightyLeftNavLinks();
                } else {
                    //mightyWrapper is still below "Inbox". no worries.
                }                
                
                //insert code here later
                                
            } else {
                //nothing was added or removed from the leftnav.
            }
            
        };
    
    };
        
    function areMightyLeftNavLinksVisible(){
        var gmailLeftNav = $("div.aeO").offset();
        var compared = $('[data-appview="classic"]').offset();
        
        if(gmailLeftNav.length < 1){
            //KL check to see if the div in Gmail that we are comparing our LeftNav links to, exists. If not, we look for it again in 10 seconds.
            console.log("couldn't find it. trying again in 1 second");
            setTimeout(areMightyLeftNavLinksVisible, 10000);
            callGAInBackgroundPage("CRX-Gmail", "LeftNav-MT-Links-NEW", "Error");
        } else {
//                console.log("gmail div offset is: " + testing["top"]);
//                console.log("my link's offset is: " + compared["top"]);
            if(gmailLeftNav["top"] < compared["top"]){
                console.log("!!!! MIGHTYLINKS ARE HIDDEN !!!!");
                callGAInBackgroundPage("CRX-Gmail", "LeftNav-MT-Links-NEW", "Hidden");
                //Put GA call here later to alert us of when the links are hidden.
            } else {
                callGAInBackgroundPage("CRX-Gmail", "LeftNav-MT-Links-NEW", "Shown");
                //mightyleftnav links are visible, do nothing.
            } 
        }
    };

    function setSrcOfMightyIframe(selectedMightyTextView){
        //find the selected leftnav class "ain" get the borderleft and font weight css properties.
        var gmailLeftNavSelectedStateCSS = $("div.ain").css(["borderLeft","fontWeight"]);
            gmailLeftNavSelectedStateCSS["color"] = $("div.ain span.nU").css("color");
        //tr.yO are the elements associated with the emails in inbox container.  Get the background css value.
        var gmailInboxBackground = $("tr.yO").css("backgroundColor");
        
        console.log(gmailLeftNavSelectedStateCSS);
        
        var mightyIframeSrc

        if (selectedMightyTextView === "media"){
            window.location.hash = "media";
            mightyIframeSrc = baseURLMightyIFrame + "#gmail_iFrame=media";
        } else if (selectedMightyTextView === "classic"){
            window.location.hash = "texts";
            mightyIframeSrc = baseURLMightyIFrame + "#gmail_iFrame=classic&selected=" + JSON.stringify(gmailLeftNavSelectedStateCSS) + "&background=" + gmailInboxBackground;
        } else {
            console.error("error establishing which appview to display");
        } 
        
        $("#mightyIframe").attr("src", mightyIframeSrc);
        
    };
    
    function addSelectedStateToLeftNav(target){
        //REMOVE ANY SELECTED STATE FROM PREVIOUSLY SELECTED MIGHTYMENU ITEMS
        $(".mightyMenuItem").removeClass("ain").find(".TO").removeClass("nZ").removeClass("aiq");
        //ADD THE SELECTED STATE FOR THIS GMAIL THEME TO OUR MIGHTYMENUITEM LINKS
        $(target).addClass("ain").find(".TO").addClass("nZ").addClass("aiq");                    
    };
    
    function checkIfUserHasRunThroughTour(){
        chrome.storage.local.get(null, function(data) {
            if (!data.productTourGiven) {
                    console.log("first time user launched CRX Content Script. Run them through the product tour.");
                                    
                    chrome.storage.local.set({
                            'productTourGiven':true
                        }, function() {
                        // Notify that we saved.
                        console.log('productTourGiven setting set');
                        initializeGTextOnboarding();
                    });
            } else {
                    console.log("productTourGiven already given.");
                    //console.log(data);
            }
        });
    };
    
    function insertBatStatBar(){
        var googleNavBar = $(document).find("#gbzw");
        var batStatExistCheck = $("div#batstatInitial");
        
        console.log(googleNavBar);
        
        if(googleNavBar.length < 1){//USER IS IN NEW GMAIL UI WITHOUT TOP NAV BAR
            newGmailUICheck = true;
            var googleNavBarNew = $(document).find(".gb_nb.gb_f.gb_ub");
//            console.log(googleNavBarNew);
            
            if(batStatExistCheck.length < 1){
                $('<div id="batstatInitial" class="newbatterywrap newBatStatLocation" data-step="2" data-intro="Keep an eye on your mobile battery level up here." data-position="left"></div>').prependTo(googleNavBarNew).each(function() {
                    startGetPhoneStatusCycle();
                });            
            } else {
                //batstat placeholder has already been inserted, don't do anything.
            }
            
        } else {//USER IS IN OLD UI
        
            if(batStatExistCheck.length < 1){
                $('<div id="batstatInitial" class="newbatterywrap" data-step="2" data-intro="Keep an eye on your mobile battery level up here." data-position="left"></div>').insertAfter(googleNavBar).each(function() {
                    startGetPhoneStatusCycle();
                });            
            } else {
                //batstat placeholder has already been inserted, don't do anything.
            }
        
        }
        
    };

    
    function dynamicallySetHeightOfMightyFrame(){
        var targetHeight = (window.innerHeight * .80)

//        console.log("smartHeight:" + targetHeight2);
//        console.log("set the height to: " + targetHeight); 
        
        $(".mightyIframeContainer").css({
            "height": targetHeight
        }); 
    };
    
    function checkIfGChatIsEnabled(){

        document.location.hash = "#inbox?compose=new";

        function handleMutations(summary){
            if(summary.length > 0){
                console.log(summary);                    
                var test = summary[0].added[0];   
                var test2 = $(".dw").find(".no .nH.nn");
                
                $("div.dw").hide();
                
                setTimeout(function(){
                    // Gmail UI click is generated by MouseUp and MouseDown events
                    var evt1 = document.createEvent("MouseEvents");
                    var evt2 = document.createEvent("MouseEvents");
                    evt1.initMouseEvent("mousedown", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, null);
                    evt2.initMouseEvent("mouseup", true, true, window, 1, 1, 1, 1, 1, false, false, false, false, 0, null);
                    
                    // Here jQuery('.T-I.J-J5-Ji.nu.T-I-ax7.L3') is the gmail refresh button
                    $('td.Hm img.Ha').each(function(d,element){
                        element.dispatchEvent(evt1);
                        element.dispatchEvent(evt2);
                    });
                    $("div.dw").show();  
                    console.log("successfully triggered and closed Composer in order to append the container for notifications.");                                 
                }, 100);
                
            }
        };
        
        var summaryObserver = new MutationSummary({
           callback: handleMutations,
           queries: [{ element: "div.dw" }] 
        });
        
    }
    
    function setupSettings(){
        var settingsPaneHTML = '<div id="settingsPane" class="mightyDropdown"><div id="mightyLogoHeader" class="mightyClearfix"><img src="' + logoImgURL + '" alt="mightyText Logo"/><span>GText</span></div><div id="userAccountDisplay" class="mightyClearfix">' + mightyTextAccount + '</div><ul><li class="settingsLink J-N" id="settingsTrigger">Settings</li><a target="_blank" href="http://help.mightytext.net/knowledgebase"><li class="settingsLink J-N" id="helpTrigger">Help</li></a><a target="_blank" href="https://chrome.google.com/webstore/detail/gtext-from-mightytext-sms/iffdacemhfpnchinokehhnppllonacfj/reviews"><li class="settingsLink J-N" id="cwsTrigger">Rate GText</li></a><li class="settingsLink J-N" id="signOutTrigger">Sign Out</li></ul></div>';
        var settingsPaneCheck = $("div#settingsPane");
        
        if(settingsPaneCheck.length < 1){
            $(settingsPaneHTML).appendTo("div.settingsButtonContainer").each(function(){
                
                $("#settingsTrigger").on("click", function(){
                   $("#optionsIframe").attr("src", optionsPageURL);
                   $('#optionsModal').modal({
                       keyboard: true
                    });
                    callGAInBackgroundPage("CRX-Gmail", "LeftNav-Settings-Click", "Click"); 
                });  
        
                $("#helpTrigger").on("click", function(){
                    callGAInBackgroundPage("CRX-Gmail", "LeftNav-Help-Click", "Click");
                });

                $("#cwsTrigger").on("click", function(){
                   callGAInBackgroundPage("CRX-Gmail", "LeftNav-RateApp-Click", "Click"); 
                });

        
                $("#signOutTrigger").on("click", function(){

                    if (confirm("Are you sure you want to sign out of MightyText?\r\n(You will stay signed in to Gmail)")){
                        signOutOfMightyText();    
                    } else {
                        //do nothing.
                    }                
                    callGAInBackgroundPage("CRX-Gmail", "LeftNav-Signout-Click", "Click"); 
                });  
            });
        } else {
            //do nothing
        }


        $('body').append('<div id="optionsModal" class="modal hide fadeMighty" ><img class="close mightyClose" data-dismiss="modal" src="' + closeGreyImgURL + '"/><iframe id="optionsIframe" src=""></iframe></div>');
        
        $("body").not(".settingsButtonContainer").not(".shareButtonContainer").on("click", function(){
            $("#settingsPane").hide();
            $("#socialPane").hide();
        });

        $(".settingsButtonContainer").on("click",function(e){
            e.stopPropagation();             
            $("div#settingsPane").toggle();
            $("#socialPane").hide();
            callGAInBackgroundPage("CRX-Gmail", "LeftNav-Dropdown-Click-Toggle", "Click");  
        });
    };
    
    function setupSharing(){
        var socialPaneHTML = '<div id="socialPane" class="mightyDropdown"><div id="mightyLogoHeader" class="mightyClearfix"><img src="' + logoImgURL + '" alt="mightyText Logo"/><span>Tell People About Gtext</span></div><div class="popoverRow mightyClearfix" ><a class="popoverContent popoverContentLeft" data-platform="twitter" href="#"><img src="'+twitShareImgURL+'" alt="Twitter Share Button"/></a><a class="popoverContent popoverContentLeft" data-platform="gmail"  href="#"><img src="'+gSendImgURL+'" alt="Gmail Send Button"/></a><a class="popoverContent popoverContentLeft" data-platform="gPlus" href="#"><img src="'+googShareImgURL+'" alt="Google+ Share Button"/></a><a class="popoverContent popoverContentLeft" data-platform="facebook" href="#"><img src="'+fbShareImgURL+'" alt="Facebook Share Button"/></a></div></div></div>';

        $("div.shareButtonContainer").on("click", function(e){
            e.stopPropagation();
            var socialPanelCheck = $("#socialPane");
            if(socialPanelCheck.length < 1){
                $(socialPaneHTML).appendTo("div.shareButtonContainer").each(function(){
                    $(".popoverContent").on("click",function(e){
                        e.preventDefault();
                        var platform = $(this).data("platform");
                        if(platform === "twitter"){
                            window.open('https://twitter.com/intent/tweet?hashtags=android,SMS&text=Check%20out%20GText%20-%20Text%20from%20Gmail%2C%20using%20your%20current%20Android%20phone%20number!%20%20http%3A%2F%2Fgoo.gl%2F3Mziy%20%40mightytext','mywindow','location=1,status=1,scrollbars=0,left=180,top=100,width=550,height=300');
                            callGAInBackgroundPage("CRX-Gmail", "Click-Share-Network-Button", "Twitter");
                        } else if (platform === "gmail"){
                            window.open('http://goo.gl/CSAqc','mywindow','location=1,status=1,scrollbars=0,left=180,top=100,width=650,height=500');
                            callGAInBackgroundPage("CRX-Gmail", "Click-Share-Network-Button", "GMail");
                        } else if (platform === "gPlus"){
                            window.open('https://plus.google.com/share?url=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Fgtext-from-mightytext-sms%2Fiffdacemhfpnchinokehhnppllonacfj%3Futm_source%3Dchrome-ntp-icon','mywindow','location=1,status=1,scrollbars=0,left=180,top=100,width=550,height=300');
                            callGAInBackgroundPage("CRX-Gmail", "Click-Share-Network-Button", "GooglePlus");
                        } else if (platform === "facebook"){
                            window.open('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Fgtext-from-mightytext-sms%2Fiffdacemhfpnchinokehhnppllonacfj%3Futm_source%3Dchrome-ntp-icon','mywindow','location=1,status=1,scrollbars=0,left=180,top=100,width=620,height=300');
                            callGAInBackgroundPage("CRX-Gmail", "Click-Share-Network-Button", "Facebook");
                        }
                    }); 
                });
            }
            callGAInBackgroundPage("CRX-Gmail", "LeftNav-PromoteMT-Click-Toggle", "Click"); 
            $("#settingsPane").hide();
            $("div#socialPane").toggle();
        });        

    };
    
    function signOutOfMightyText() {
//ajax call to the signout servlet    
        $.ajax({
            type: "GET",
            url: baseUrl + '/logout?function=clear',
            dataType: "json",
            timeout: 5000,
            tryCount: 0,
            retryLimit: 1,
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                console.log(response);
                if(response.user == "user logged out"){
                    //we know that the user is logged out.
                    console.log("user successfully logged out");
                    initializeApp("signBackIn");
                } else {
                    console.error("Error: server returned un recognized string in when calling /logout servlet.");
                }
            },
            error: function(response) {
                console.error(response);
            }
        });
    };


    function startGetPhoneStatusCycle() {
        if (capiHubInitializeCheck) {
            console.log("We know the CAPI is opened already, requesting Phone Status Cycle");
            setTimeout(getPhoneStatus, 1000);
/*             setInterval(getPhoneStatus, 180000); */
                //no longer setting an interval in the content script, we set it in the background.js after we determine that the user is logged in and that there are tabs open currently running the content script.
            setInterval(checkForStaleBatteryStatus, 5000);
        } else {
            console.log("CAPI not opened yet, requesting phone status in 1 second.")
            setTimeout(startGetPhoneStatusCycle, 1000);
        }
    };
    
    function checkForStaleBatteryStatus(){
        var existingBatStat = $(".gTextBattery");
        if(existingBatStat.length > 0){
            var timeStampOfLastStat = $(".newbatterywrap").attr("id");
            var currentUnixTimeStamp = new Date().getTime();
            var timeSinceLastUpdate = currentUnixTimeStamp - parseInt(timeStampOfLastStat);
/*
            console.log("this is the difference between now and the last time the bat stat was updated.");
            console.log(currentUnixTimeStamp - parseInt(timeStampOfLastStat));
*/
            if(timeSinceLastUpdate > 600000){
                console.log("remove bat stat");
                $(".newbatterywrap").empty();
            }
        } else {
            console.log("there is no battery status to check");
        }
    };

    function resetWindowParent(targetDiv) {
        //toggle Display:None on overall Container.
        var targetParent = $(targetDiv).parent();
        $(targetParent).toggleClass("visible");
        setTimeout(function() {
            $(targetParent).toggleClass("visible");
        }, 250);
    };

    function addBasicComposerFunctionality(composer, context, optionalGroupMMSCheck) {
        var closeCompose = $(composer).find("#closeCompose");
        var composerHeader = $(composer).find("div.composeHeader");
        var composerHeaderDisplayName = $(composer).find("p.title");
        var sendButton = $(composer).find("#sendSMS");
        var composeBody = $(composer).find("#composeBody");
        var messageField = $(composer).find(".messageToSend");
        var contactsContainer = $(composer).find("#sendTo");
        var contactsInput = $(composer).find("#numberToSendTo");
        var contactsToSendSMSTo = $(composer).find("#sendContacts")
        var mightyShortCut = $(composer).find("#openMighty");
        var mightyMin = $(composer).find("#minMighty");
        var characterCountHolder = $(composer).find("span.count");
        var mmsButton = $(composer).find("#upload-image-mms");
        var phoneNumCleanContainer = $(composer).find(".composeInnerContainer");

        $(closeCompose).on('click', function(e) {
            e.stopPropagation();
            callGAInBackgroundPage("CRX-Gmail", "ChatWindow-Close", "Click");
            verifyThatUserWantsToCloseComposeNew(composer, contactsToSendSMSTo, messageField, context);
        });

        $(composerHeader).on('click', function(e) {
            $(this).toggleClass("minimized");
            
            if ($(this).hasClass("minimized")) {
                $(mightyMin).children("img").attr("src", maxImgURL);
                callGAInBackgroundPage("CRX-Gmail", "ChatWindow-Minimize", "Click");
            } else {
                $(mightyMin).children("img").attr("src", minImgURL);
                callGAInBackgroundPage("CRX-Gmail", "ChatWindow-Maximize", "Click");
            }
            if(currentHost.indexOf("www.facebook.com")> -1){
                $(this).parent().toggleClass("minimizedFB");
            } else if (currentHost.indexOf("mail.google.com")> -1){
                $(composeBody).toggle();
            }
            
        });
        $(sendButton).on('click', function(e) {
            console.log(messageField);
            sendSMS(composer, context, sendButton, messageField, optionalGroupMMSCheck);
        });
        //Enter to send function
        if (enterToSend) {
            console.log('send on enter enabled');
            $(messageField).on('keypress', function(e) {
                if (e.charCode == 13) {
                    e.preventDefault();
                    sendSMS(composer, context, sendButton, messageField, optionalGroupMMSCheck);
                }
            });
        } else {
            //do nothing
        }
        
        $(messageField).on("focus", function() {
            var currentContactsToSendToVal = $(contactsInput).val();
            if (currentContactsToSendToVal != '') { 
                processContactForComposeSingleText(currentInputVal, currentInputVal, contactsInput, contactsToSendSMSTo, composer);
            }
        });

        $(mightyShortCut).on("click", function(e) {
//the stopPropagation makes it so that the click event on this button does not also trigger the minimize functionality of the conversation window header.
            e.stopPropagation();
            var lastMessageID = $(this).closest(".composeHeader").siblings("#composeBody").find("#conversationHolder").children(".textWrapper").last().attr("id").replace('message-id-','');
            
/*             alert(lastMessageID); */
            
            callGAInBackgroundPage("CRX-Gmail", "ChatWindow-Expand", "Click");
            chrome.runtime.sendMessage({
                openMightyTextIntelligently: true,
                numberOfConversationToOpen:lastMessageID
            }, function(response) {
                console.log(response.confirmation);
            });
        });

        $(contactsContainer).keydown(function(e) {
            if (e.keyCode == 8) {
                if (!$(contactsInput).val()) {
                    $(contactsToSendSMSTo).children('.contact').last().remove();
                    checkNumberOfCurrentContactsToSeeIfGroupMMSOptionDisplays(contactsToSendSMSTo);
                }
            } 
        });
        //the autogrowinput jquery plugin dynamically changes the width of the input so that when a user enters multiple contacts the input doesn't awkwardly break into a new line.
        $(contactsInput).keydown(function(e){
            var currentContactsToSendToVal = $(contactsInput).val();
            if (currentContactsToSendToVal != '') { 
                if (e.keyCode == 188 || e.keyCode == 13 || e.keyCode == 9){
            		e.preventDefault();
    	        	var findIfActiveMatchedTypeahead = $('ul.typeahead:visible').children('li.active').attr('data-value');
    	        	if(findIfActiveMatchedTypeahead === undefined)
    	        		{
                            var currentInputVal = $(contactsInput).val();
    		        		if(!currentInputVal){
    			        		return
    			        	}    
                            processContactForComposeSingleText(currentInputVal, currentInputVal, contactsInput, contactsToSendSMSTo, composer);
    			        	$(contactsInput).val('');
    	        		}
    	        	else
    	        		{
    		        		$('ul.typeahead:visible').children('li.active').click();
    	        		}
                    $(contactsInput).val('').focus();
                }
                checkNumberOfCurrentContactsToSeeIfGroupMMSOptionDisplays(contactsToSendSMSTo);
            }
        }).focus();
        
/*
        $(groupMMSButtons).each(function(){
            $(this).on("click",function(){
                if($(contactsToSendSMSTo).children(".contact").length > 1){
                    //this will reset the tooltip so that it stays current with the current changed selected state
                }
            });
            //addTooltipsToGroupMMSButtons(this);       
        });
*/

        if(optionalGroupMMSCheck){
            addTooltipToComposeHeader(composerHeaderDisplayName)
        }
               
        addMMSButtonFunctionality(mmsButton);
        initializeNobleCount(messageField, characterCountHolder);
    };
    
    function checkNumberOfCurrentContactsToSeeIfGroupMMSOptionDisplays(contactsHolder){
        
        var currentLengthOfContacts = $(contactsHolder).children('.contact').length;
        var groupMMSFlag = $(contactsHolder).parent().siblings(".mightdcfoot").find(".groupMMSContainer");

        if(currentLengthOfContacts > 1){
            $(groupMMSFlag).show();
        } else {
            $(groupMMSFlag).hide();
        }
        
    };

    function addMMSButtonFunctionality(mmsButton) {
        $(mmsButton).on("click", function() {
            getImageUploadCode(this.parentNode);
            console.log("clicked sendMMS");
        });
    };

    function getPhoneStatus() {
        sendOtherC2DM('get_phone_status', Date());
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
            callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "LOGIN_REQUIRED");
            errorMessage='Error: Not logged in to MightyText. (Gtext Content Script)';
        } else if (reply_server.indexOf('DEVICE_NOT_REGISTERED') > -1){
            callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "DEVICE_NOT_REG");
            errorMessage='Error: Android Phone not registered with MightyText with this Google Account, or MightyText Android App not installed properly on your phone.';
        } else if (reply_server.indexOf('DeviceQuotaExceeded') > -1){
            callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "DEVICE_QUOTA_EXCEEDED");
            errorMessage='Android Phone Quota Exceeded.  Error Code: DeviceQuotaExceeded (C2DM)';
        
        } else {
            errorMessage='C2DM/GCM Error.  Please retry. \r\n\r\n Error Info: \r\n\r\n' + reply_server;
            callGAInBackgroundPage("CRX-Gmail", "C2DM-Error", "GENERAL C2DM ERROR");
        }
    
        alert(errorMessage);
    
        if ( (which_c2dm_gcm_action=='send_sms') || (which_c2dm_gcm_action=='send_mms') ){
            resetFocusOnEntryBoxAfterC2DMProblem(optionalMessagesDiv);
        }
    
    }

    function getTextsForThisNumber(numClean, num, contactName, optionalGroupMMSContactHeaders) {
        var textThreads = new Array();
        var numberOfMessagesToGet = 10;
        var phoneNumToSendToServlet = numClean;
        
        console.log(optionalGroupMMSContactHeaders)
        
        if(String(num).indexOf("|") > -1){
        //IF GETTING MESSAGES FOR GROUP MMS THREAD, THEN WE SHOULD SEND THE GETMESSAGES SERVLET THE PHONENUM FULL INSTEAD OF THE PHONENUMCLEAN BECAUSE WHEN THE PHONE NUM CLEAN IS A NEGATIVE INTEGER, IT WILL CAUSE THE SERVER TO RETURN THE INCORRECT THREAD'S MESSAGES
            phoneNumToSendToServlet = num
        }
        
        var getDataFromServer = $.ajax({
            type: "GET",
            url: baseUrl + '/api?function=GetMessages&start_range=0&end_range=' + numberOfMessagesToGet + '&phone_num=' + phoneNumToSendToServlet,
            dataType: "json",
            timeout: 8000,
            tryCount: 0,
            retryLimit: 1,
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                
                var contentAuthor
                if(optionalGroupMMSContactHeaders != undefined){
                    contactName = optionalGroupMMSContactHeaders;
                }
                var numberOfMessagesInThread = 0;
                var sanitizedContactName = createHTMLEquivalentOfMessageBody(contactName);
                console.log('============ MESSAGES FOR ' + numClean + ' ===============');
                console.log(response.messages);
                $(response.messages).each(function() {
                    textThreads.push(this);
                });
                numClean = response.messages[0].phone_num_clean;
                num = response.messages[0].phone_num;
                                
                displayNotificationOfNewContent(numClean, num, sanitizedContactName, textThreads, contentAuthor);
                if ((response.user) && (response.user.indexOf('user not logged in') > -1)) {
                    alert("No longer signed in to MightyText. Press OK to sign in.");
                    //COME BACK HERE
                }
                for (key in response.messages) {
                    numberOfMessagesInThread++; /* 					response.messages[key].body = cleanUpMsgBody(response.messages[key].body); */
                    //messageHtmlToAppend = htmlToAdd.concat(messageHtmlToAppend);
                    /* 					messageHtmlToAppend = htmlToAdd + messageHtmlToAppend;  */
                }
                console.log(numberOfMessagesInThread);
            },
            error: function() {
                console.error("Got an error in getMessages");
            }
        });
    }

    function displayNotificationOfNewContent(scCleanNum, scNum, scName, userTexts, optionalContentAuthor) {
        var existingPlaceHolder = $('[data-number="' + scCleanNum + '"]').hasClass("convoWindowPlaceHolder");

        if(existingPlaceHolder){
            $('[data-number="' + scCleanNum + '"]').remove();
        } else {
            console.log("The placeholder for this convo window has already served its purpose and been removed.");
        }            

        if(createNotifsInGmail){    
            var scNameLength = scName.length;
            var displayName = scName;
            var composerDisplay = $("div.composeInnerContainer").css("display"); /*         console.log(userTexts); */
            var mms_HTML = buildHTMLButtonCanvasMMS(scCleanNum);
            var textNotificationHTML = '';
            var textNotificationDestination = '';
            //PLACEHOLDER IS PART OF THE SOLUTION FOR DUPLICATE THREADS.            
            
            //WHERE ARE WE?
            if(currentHost.indexOf("www.facebook.com")> -1){
                //I WILL NEED TO ADD ADDITIONAL CLASSES TO THIS NOTIF TO ACCOMODATE FB
                var fbTextNotifHTML = '<div class="fbNub _50-v _50mz _50m_ _5238 mightyFB"><div class="mightyno"><div class="composeOuterContainer"><div class="composeInnerContainer mightyClearfix conversation fb" data-number="' + scCleanNum + '"><div class="composeHeader mightyClearfix fb"><div class="mightyLogo fb"><img src=' + logoImgURL + '></div><p class="title fb">New MightyText</p><div class="mightbtnholder fb"><div class="mighthbtn" id="minMighty"><img src=' + minImgURL + '></div><div class="mighthbtn" id="openMighty"><img src=' + popImgURL + '></div><div class="mighthbtn" id="closeCompose"><img src=' + closeImgURL + '></div></div></div><div id="composeBody" class="mightyClearfix conversation fb"><div id="sendTo" class="mightyClearfix fb"><div id="sendContacts" class="mightyClearfix fb"></div><input id="numberToSendTo" class="typeahead fb" placeholder="New Contact"></div><div id="conversationHolder" class="mightyClearfix fb" data-message-count="' + userTexts.length + '"></div><div id="messageContainer" data-name="' + scNum + '" class="mightyClearfix fb"><textarea class="messageToSend fb"></textarea><div class="fbFoot"><div class="sendMMS fb">' + mms_HTML + '</div><div class="countContainer fb" style="float:right;"><span class="count"></span></div></div></div><div class="mightdcfoot" style="display:none"><div id="sendSMS"><button class="btn btn-info"><img src=' + sendImgURL + '></button></div><div class="sendMMS">' + mms_HTML + '</div><div class="countContainer" style="float:right;"><span class="count"></span></div></div></div></div></div></div>';
                textNotificationHTML = fbTextNotifHTML;
                //I WILL BE CHANGING WHERE THE TEXTNOTIF GETS APPENDED TO.
                textNotificationDestination = $(document).find("div.fbNubGroup.clearfix").not("._56oy");
                $(textNotificationHTML).prependTo(textNotificationDestination).each(function() {
                    buildTextNotificationWindow(this, userTexts, scNum, displayName, textNotificationDestination);
                });
            } else if (currentHost.indexOf("mail.google.com")> -1){
                var gmailTextNotifHTML = '<div class="nn nh mightynH"><div class="mightyno"><div class="composeOuterContainer"><div class="composeInnerContainer mightyClearfix conversation" data-number="' + scCleanNum + '"><div class="composeHeader mightyClearfix"><div class="mightyLogo"><img src=' + logoImgURL + '></div><p class="title">New MightyText</p><div class="mightbtnholder"><div class="mighthbtn" id="minMighty"><img src=' + minImgURL + '></div><div class="mighthbtn" id="openMighty"><img src=' + popImgURL + '></div><div class="mighthbtn" id="closeCompose"><img src=' + closeImgURL + '></div></div></div><div id="composeBody" class="mightyClearfix conversation"><div id="sendTo" class="mightyClearfix"><div id="sendContacts" class="mightyClearfix"></div><input id="numberToSendTo" class="typeahead" placeholder="New Contact"></div><div id="conversationHolder" class="mightyClearfix" data-message-count="' + userTexts.length + '"></div><div id="messageContainer" data-name="' + scNum + '"><textarea class="messageToSend" placeholder="Reply here..."></textarea></div><div class="mightdcfoot"><div id="sendSMS"><button class="btn btn-info"><img src=' + sendImgURL + '></button></div><div class="sendMMS">' + mms_HTML + '</div><div class="countContainer" style="float:right;"><span class="count"></span></div></div></div></div></div></div>';
                textNotificationHTML = gmailTextNotifHTML;
                textNotificationDestination = $(".dw").find(".nH.nn");
                $(textNotificationHTML).insertAfter(textNotificationDestination[0]).each(function() {
                    buildTextNotificationWindow(this, userTexts, scNum, displayName, textNotificationDestination, optionalContentAuthor);
                });
            }
        } else {
            console.log('receiving notifications are not enabled.');
        }
        //}
    };
    
    function buildTextNotificationWindow(currentTextNotif, userTexts, scNum, displayName, gmailChatWindowContainer, optionalContentAuthor){
        var currentWindow = currentTextNotif;
        var sendContacts = $(currentTextNotif).find("#sendContacts");
        var thisTitle = $(currentTextNotif).find(".title");
        var textHistory = $(currentTextNotif).find("#conversationHolder");
        
        $(thisTitle).text(displayName);//SET THE DISPLAY NAME OF THE CONVERSATION WINDOW
        
        updateWindowContainerHeights(); //update height of outer most container so that it displays the textwindow
        $('<div class="contact" data-number="' + scNum + '">' + displayName + '<img src="' + removeImgURL + '" class="removeContact"/></div>').appendTo(sendContacts).each(function() {
            var removeButton = $(currentTextNotif).find('.removeContact');
            $(removeButton).on('click', function() {
                var contact = $(currentTextNotif).parent();
                $(contact).remove();
                console.log('removed this: ' + currentTextNotif);
            });
        });
        //BELOW IS THE CODE TO CREATE THE WINDOW WHERE TEXT HISTORY IS DISPLAYED.
        $(userTexts).each(function() {

/*
            console.log(this);

            console.log("<-------------- Message Type ---------------------->");
            console.log(this.type);
*/

/*             var incoming_outgoing = this.inbox_outbox; */
            var timeStamp = this.ts_server + ' UTC';
            var momentDate = moment(timeStamp).format("MMM D, h:mm a"); /*                 var textMessage = checkMessageContentForURLs(this.body); */
            var textMessage = createHTMLEquivalentOfMessageBody(this.body);
            var cleanNum = this.phone_num_clean;
            var uniqueTextID = this.id;
            var starredStatus = this.is_starred;
            var favoriteLink = '';
            var statusRoute = this.status_route;
            var messageType = this.type;            

            
            //IF A TEXT MESSAGE IS FAVORITED, THEN CHANGE THE IMG SRC OF THE ICON AND CLASS
            var unstarredTextHTML = '<a id="starMessage" data-message-id="' + uniqueTextID + '" class="unstarred"><img class="unstarredIcon" src="' + unstarredImgURL + '"></a>';
            var starredTextHTML = '<a id="starMessage" data-message-id="' + uniqueTextID + '" class="starred"><img class="starredIcon" src="' + starredImgURL + '"></a>'
            
            if (starredStatus) { /*                     console.log("favorited text"); */
                favoriteLink = starredTextHTML;
            } else { /*                     console.log("not a favorited text"); */
                favoriteLink = unstarredTextHTML;
            }
                        
            if((messageType == 20) || (messageType == 21)){//CHECKING IF IT IS A GROUP MESSAGE
                if (this.inbox_outbox == 60){//CHECKING IF IT IS AN INCOMING MESSAGE
                    var contentAuthorNumClean = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(this.content_author);
                    //console.log(this.content_author);
                    console.log("PHONENUMCLEAN OF CONTENT AUTHOR OF A MESSAGE TYPE 20 OR 21");
                    console.log(contentAuthorNumClean);
                    
                    var contentAuthorFullContact = cleanContentAuthorAndThenCompareToMyContacts(this.content_author);
                    console.log("STRING TO BE APPENDED INTO TEXT BODY");
                    var contactNameToBeDisplayed;
                    
                    if(contentAuthorFullContact != undefined){
                        contactNameToBeDisplayed = contentAuthorFullContact.contactName
                    } else {
                        contactNameToBeDisplayed = this.content_author;
                    }
                    
                    //SINCE IT IS A GROUP MESSAGE, WE NEED TO APPEND THE CONTACT NAME (OR NUMBER) OF THE PERSON WHO AUTHORED THIS GIVEN MESSAGE.
                    textMessage = textMessage + " - <span class='contentAuthor'>" + contactNameToBeDisplayed + "</span>";

                }                
            }
            //KL IS ABOUT TO STORE THE CONTACTS ARRAY IN BOTH THE CONTENT SCRIPT AND BACKGROUND SCRIPTS BECAUSE WE WILL NEED TO LOOK UP THE CONTACT NAMES OF T
            var incoming_outgoing_class_string;
            
            if (this.inbox_outbox == 61) {
                incoming_outgoing_class_string = "outgoing"
            } else {
                incoming_outgoing_class_string = "incoming"
            }
            
            var htmlForSMS = '<div class="textWrapper ' + incoming_outgoing_class_string + '" id="message-id-' + uniqueTextID + '"><div class="textInnerWrapper mightyClearfix"><span class="textContent">' + textMessage + '</span></div><div class="itemActions"><a id="forwardMessage" data-message-id="' + uniqueTextID + '" data-message-type="' + this.type + '"><img class="forwardMessage messageAction forwardMessageIcon" src="' + forwardImgURL + '"></a>' + favoriteLink + '<a id="deleteMessage" data-message-id="' + uniqueTextID + '" data-message-type="' + this.type + '" data-clean-num="' + cleanNum + '"><img class="deleteOneMessage deleteOneMessageIcon" src="' + deleteImgURL + '"></a><span class="textTimeStamp">' + momentDate + '</span></div></div>';
            var mms_blob_url = baseUrl + '/imageserve?function=fetchFile&id=' + uniqueTextID;
            var htmlForMMS = '<div class="textWrapper ' + incoming_outgoing_class_string + '" id="message-id-' + uniqueTextID + '"><div class="textInnerWrapper mightyClearfix"><span class="textContent">' + textMessage + '</span><div id="mms-scale-down"><a id="fancyimagepopup" href="' + mms_blob_url + '" data-blobkey="' + this.mms_object_key + '"> <img class="mmsImage" src="' + mms_blob_url + '" alt="Photo in process"></a></div></div><div class="itemActions"><a id="forwardMessage" data-message-id="' + uniqueTextID + '" data-message-type="' + this.type + '"><img class="forwardMessage messageAction forwardMessageIcon" src="' + forwardImgURL + '"></a><a id="starMessage" data-message-id="' + uniqueTextID + '" class="unstarred"><img class="unstarredicon" src="' + unstarredImgURL + '"></a><a id="deleteMessage" data-message-id="' + uniqueTextID + '" data-message-type="' + this.type + '" data-clean-num="' + cleanNum + '"><img class="deleteOneMessage deleteOneMessageIcon" src="' + deleteImgURL + '"></a><span class="textTimeStamp">' + momentDate + '</span></div></div>';
            
            if ((messageType == 10) || (messageType == 20)) {
                $(htmlForSMS).prependTo("#conversationHolder").each(function() {
                    addItemActionsEventHandlers(this, currentWindow, false);
                    if(statusRoute === 2){
                        var sentMessageStatusParent = $(this).find("div.textInnerWrapper");
                        $('<div class="sentMessageStatus"><img id="sentConfirmation" src="' + clockImgURL + '"/></div>').prependTo(sentMessageStatusParent).each(function(){
                            addToolTipToSentConfirmationIcon(this, "pending");
                        });
                    }
                });
            } else if ((messageType == 11) || (messageType == 21)) {
                if (this.mms_object_key) {
                    $(htmlForMMS).prependTo("#conversationHolder").each(function() {
                        addItemActionsEventHandlers(this, currentWindow, false);
                    });
                } else {
                    processIncomingPhotoTaken(this, currentWindow);
                }
            }
        
        });
        //END TEXT HISTORY CODE
        
        $("div#conversationHolder").find("a#fancyimagepopup").fancybox({
            'type': 'image'
        });
        
        setTimeout(function() {
            $(textHistory).scrollTo('max');
        }, 500); //the scrollTo function is set to a slight delay to account for the load of images.  Without the delay, the textwindow prematurely scrolls to what it thinks it is the bottom (sans images)
//        console.log('displaying notif on Gmail from: ' + displayName);
        resetWindowParent(gmailChatWindowContainer[0]);
        
        //DETERMINE WHETHER OR NOT THIS THREAD IS A GROUPMMS OR NOT.
        var groupMMSCheck = isThisConversationAGroupMessage(scNum);

        addBasicComposerFunctionality(currentTextNotif, "Conversation", groupMMSCheck);
    };

    function getTypeAheadArray(window) {
        var contactInput = $(window).find("#numberToSendTo");
        var contactsToSendSMSTo = $(window).find("#sendContacts");
        chrome.runtime.sendMessage({
            getAutoContact: true
        }, function(response) {
            console.log('asking for typeahead array');
            if (response.typeAheadSource) {
                console.log(response.confirmation);
                autoContacts = response.typeAheadSource;
                $('#numberToSendTo').typeahead({
                    source: autoContacts,
                    items: 5,
                    updater: function(item){
                        var contactName = item.split(' - ')[0];
                        var contactNumber = item.split(' - ')[1];
                        processContactForComposeSingleText(contactName, contactNumber, contactInput, contactsToSendSMSTo);
                    }
                });
            } else {
                console.log('Error getting typeahead array');
            }
        });
    };
    
    //FIND CLEAN PHONE NUM CONTACT IN MYCONTACTS ARRAY
    function searchForCleanPhoneNumContact(cleanPhoneNum, phoneNum) {
//        console.log(optionalLocation);
        var matchedContact;
        $(myContacts).each(function() {
            if (cleanPhoneNum == this.phoneNumClean){
                matchedContact = this;
                console.log(matchedContact);
                return false;
            } 
        });
        
        return matchedContact;

    };
    
    function cleanContentAuthorAndThenCompareToMyContacts(contentAuthorFullNum){
        
        var contentAuthorCleanNum = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(contentAuthorFullNum);
        
        return searchForCleanPhoneNumContact(contentAuthorCleanNum, contentAuthorFullNum);
        
    };
    

    
    function insertContact(item, typeaheadCheck, contactName, contactNumber, contactInput){

        var currentWindowLocation = String(document.location);
        var contactClass = '';
        //determine if we are on fb
        if(currentWindowLocation.indexOf("facebook") > -1){
            contactClass = "contact fb";
            removeImgURL = chrome.extension.getURL('img/fbt-xicon.png');
        } else {
            contactClass = "contact";
        }
        if (typeaheadCheck){
            contactName = item.split(' - ')[0];
            contactNumber = item.split(' - ')[1];
            $('<div class="' + contactClass + '" data-number="' + contactNumber + '">' + contactName + '<img src="' + removeImgURL + '" class="removeContact"/></div>').insertBefore(contactInput).each(function() {
                setRemoveButtonClickHandlerOnContacts(this);
            });
        } else {
            console.log("user is entering a contact not found in typeahead");
            $('<div class="' + contactClass + '" data-number="' + contactNumber + '">' + contactName + '  <img src="' + removeImgURL + '" class="removeContact"/></div>').insertBefore(contactInput).each(function(){
                setRemoveButtonClickHandlerOnContacts(this);
            });
        }
    }
    
    function setRemoveButtonClickHandlerOnContacts(contact){

        var contactsToSendTo = $(contact).parent();
        var removeButton = $(contact).find('.removeContact');
        $(removeButton).on('click', function() {
            var contact = $(this).parent();
            $(contact).remove();
            
            checkNumberOfCurrentContactsToSeeIfGroupMMSOptionDisplays(contactsToSendTo);

        });
    
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
        if ((!do_not_zeropad_optional) && (phonenum_to_check.length < 7)) {
            phonenum_to_check = zeroPad(phonenum_to_check, 7) //last 7, and zeropadded.
        } else phonenum_to_check = phonenum_to_check.substring(phonenum_to_check.length - 7);
        //just last 7, no zeropad 
        return phonenum_to_check;
    }

    function zeroPad(num, count) {
        var numZeropad = num + '';
        while (numZeropad.length < count) {
            numZeropad = "0" + numZeropad;
        }
        return numZeropad;
    }

    function isValidPhoneNum(phonenumber) {
        if (phonenumber != "") {
            var goodChars = "+- 1234567890()/][.";
            for (i = 0; i < phonenumber.length; i++) {
                var c = phonenumber.charAt(i);
                if (goodChars.indexOf(c) < 0) return false;
            }
            return true;
        } else {
            return false;
        }
    };
        
    function sanitizeTextResponse(element, removeBRTagsOptional){
		console.log('sanitizeTextResponse');
		console.log(element);
		var responseAreaClone = $(element).clone(); //CRV We must clone the content in the message response area so that the edits we perform in the following each statement aren't reflected in the dom. 
		var responseAreaCloneHTML = $(responseAreaClone).children();
		console.log($(responseAreaCloneHTML));
		$(responseAreaCloneHTML).each(function(){
			if($(this).is('img'))
				{
					var textValue = $(this).attr('data-textvalue');
					//console.log(textValue);
					$(this).replaceWith(textValue); //CRV if there are any images in the textResponse Area, we assume that they are either emojis or emoticons and we replace them with their text or encoded representation. 
					//console.log($(this));
				}
			if($(this).is('br'))
				{
					if(removeBRTagsOptional)//CRV this variable is set in the case that we are performing this 
						{
							$(this).remove();
						}
					else
						{
							$(this).replaceWith("\n"); //CRV if there are any breaks in the text response, we replace them with \n
						}				
				}
			if($(this).is('div')) //CRV added because users who don't have enter to send on, will add a BR wrapped in a div tag when the press enter while composing a text. In order to map those br's to \n, we must detect the div wrapper and explore its contents.  If any of the wrapper divs children are br's, we map them to \n
				{
					if($(this).children().is('br'))
					{
						if(removeBRTagsOptional)//CRV this variable is set in the case that we are performing this 
							{
								$(this).remove();
							}
						else
							{
								$(this).replaceWith("\n"); //CRV if there are any breaks in the text response, we replace them with \n
							}
											
						}
					else if($(this).text().length > 0)
							{
								$(this).replaceWith('\n' + $(this).text());
							}
		
				}
			
		});
/* 		console.log(responseAreaClone.text()); */
		
		return($(responseAreaClone).text()); //CRV here, we must return the text value of the responseArea clone that we have just altered.  
	}

    function sendSMS(composeWindow, context, sendButton, messageTextArea, optionalGroupMMSCheck) {
        var textDestinationNotContact = $(composeWindow).find("#numberToSendTo");
        var messageToSend = $(messageTextArea).val();
        var sanitizedMessageToSend = sanitizeTextResponse($(messageTextArea));
        var contacts = $(composeWindow).find('.contact');
        var MMSBlobIDForThisThread = $(composeWindow).find('#mms-blob-id-holder').text();
        if ($(sendButton).hasClass("textInProgress")) {
            console.log("text success has not been confirmed. don't try to send another message");
        } else {
            if (MMSBlobIDForThisThread.length > 0) {
                is_sms = false;
            } else {
                is_sms = true;
            }
            //VALIDATETEXTMESSAGE
            if (validateMessageContentBeforeSend(is_sms, messageToSend, messageTextArea)) {
                if (contacts[0]) {
                    var currentNumTargetRecipients = $(contacts).length;
                    var numberToSendTo
                    var nameOfContact
                    var action_data
                    
                    if (currentNumTargetRecipients > 4) //warning to user, if they are sending more than 4 contacts 
                    {
                        var userConfirmLotsRecipients = confirm("MightyText sends SMS via your phone, so your mobile carrier will count an SMS sent for each recipient. \n\nPress OK to confirm sending these " + currentNumTargetRecipients + " messages now.");
                        if (!userConfirmLotsRecipients) {
                            $(textDestinationNotContact).focus();
                            return false;
                        }
                    }
                    var gmailNotifContainer = $(document).find(".b8.UC");
                    var gmailNotif = $(gmailNotifContainer).find(".J-J5-Ji .vh");
					var batchID = getRandomInt(1000, 9999); //MA: pick a random 4 digit # so we can assign a batch ID, so we can later identify a single alert so we can keep updating it as each HTTP response comes back in.
/* 					console.log(gmailNotif[0]); */
					$(gmailNotif[0]).attr("data-batch", batchID);
					
                    //isThisConversationAGroupMessage(phoneNum)
										
					if ((context == "Conversation") && (optionalGroupMMSCheck)){//WE KNOW THAT THE USER IS REPLYING TO A GROUP THREAD CONVERSATION
        				console.log("group mms sent from CONVERSATION");

                        numberToSendTo = $(composeWindow).find('#messageContainer').data("name");//THIS IS THE FULL PHONENUM WITH THE PIPES TO BE SENT W/ SENDC2DM
                        nameOfContact = $(composeWindow).find("p.title").text();//THIS VAR IS FOR THE SUCCESSFULLY SENT NOTIF ON SUCCESS OF SENDC2DM();
                                    
    					if(is_sms){
        					//group reg MMS
        					action_data = 'send_sms_multiple_group_mms';
                            sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, 'not-an-mms', batchID);
    					} else {
        					//group picture MMS
        					console.log("sending group pic mms");
        					action_data = 'send_mms_multiple_group_mms';
                            sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, MMSBlobIDForThisThread, batchID);
    					}
    					
					} else if((context == "Conversation") && (!optionalGroupMMSCheck)){//WE KNOW THAT THE USER IS REPLYING TO A CONVERSATION TO A SINGLE CONTACT
                        $(contacts).each(function() {
                            numberToSendTo = $(this).data('number');
                            //sanitizing contact name w/ createHTMLEquivalentOfMessageBody below before we send the value to sendc2dm and the texty server as a parameter. implemented as of 8/27/13
                            nameOfContact = createHTMLEquivalentOfMessageBody($(this).text());
//                                console.log("sending " + messageToSend + " to: " + numberToSendTo);   

     				  	    if (is_sms) {
                                action_data = 'send_sms';
                                sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, 'not-an-mms', batchID);
                            } else {
                                action_data = 'send_mms';
                                sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, MMSBlobIDForThisThread, batchID);
                            }
                            
                            //alert(sanitizedMessageToSend);                        
                            //alert(action_data);
                        });
					} else {//THE USER IS NOT SENDING FROM AN EXISTING CONVERSATION WINDOW, THEY'RE COMPOSING A NEW MESSAGE
	                    var groupMMSSelectedState = $(composeWindow).find(".dropup").data("selection");
    					console.log("group mms from COMPOSE NEW");
                        //PLACEHOLDER#1
                        if((groupMMSSelectedState == "SendAsGroup") && (currentNumTargetRecipients > 1)){//THE USER IS TRYING TO COMPOSE A NEW GROUP MESSAGE

    						nameOfContact = new Array();
        					numberToSendTo = new Array();
        					
        					$(contacts).each(function(){ //Loop through each recipient in list
        
        				  		numberToSendTo.push($(this).data('number'));
        				  		console.log('contact number testing');
        				  		nameOfContact.push($(this).text());
        				  		        				  		
        			  		});
        					
        					numberToSendTo = numberToSendTo.join("|"); //CRV created pipedelimited strings from our contact name and number arrays. 
        					nameOfContact = nameOfContact.join(", ");						

                            if (is_sms && groupMMSSelectedState){
                                action_data = 'send_sms_multiple_group_mms';
                                sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, 'not-an-mms', batchID);
                            } else {
            					action_data = 'send_mms_multiple_group_mms';
                                sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, MMSBlobIDForThisThread, batchID);
                            }

                        } else {
                            $(contacts).each(function() { //THE USER IS TRYING TO COMPOSE A REGULAR MESSAGE (SENT INDIVIDUALLY TO EACH CONTACT)
                                numberToSendTo = $(this).data('number');
                                //sanitizing contact name w/ createHTMLEquivalentOfMessageBody below before we send the value to sendc2dm and the texty server as a parameter. implemented as of 8/27/13
                                nameOfContact = createHTMLEquivalentOfMessageBody($(this).text());
    //                                console.log("sending " + messageToSend + " to: " + numberToSendTo);   
    
         				  	    if (is_sms) {
                                    action_data = 'send_sms';
                                    sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, 'not-an-mms', batchID);
                                } else {
                                    action_data = 'send_mms';
                                    sendC2DM(action_data, messageToSend, numberToSendTo, nameOfContact, context, composeWindow, MMSBlobIDForThisThread, batchID);
                                }
                                
                                //alert(sanitizedMessageToSend);                        
                                //alert(action_data);
                            });
                        }                        
                    }
                } else {
                    alert('Please choose contacts to send this message to.');
                    $(textDestinationNotContact).focus();
                    return;
                }
                $(sendButton).addClass("textInProgress");
                $(messageTextArea).attr("disabled", "disabled");
            }
        }
    };
    
    function getRandomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    function sendC2DM(action, actionData, targetPhoneNum, targetContactName, context, thisWindow, optionalMMSBlobID, optionalBatchID) {
        var sendUrlC2DMBase = baseUrl + '/client?function=send&deviceType=ac2dm&source_client=37'; //37 is the Gmail CRX client id
        var sendUrl = sendUrlC2DMBase + '&action=' + action + '&action_data=' + actionData;
        var postVarBuilder = '';
        var full_phone_num_derived;
        var textAreaToFocus = $(thisWindow).find(".messageToSend");
        if (action == 'send_sms') {
            postVarBuilder = 'phone=' + encodeURIComponent(targetPhoneNum) + '&type=10&source_client=37&deviceType=ac2dm' + '&action=send_sms&action_data=' + encodeURIComponent(actionData);
            sendUrl = sendUrlC2DMBase;
            full_phone_num_derived = targetPhoneNum;
        } else if (action == 'send_mms') {
            postVarBuilder = 'phone=' + encodeURIComponent(targetPhoneNum) + '&type=11&deviceType=ac2dm' + '&action=send_mms&action_data=' + encodeURIComponent(actionData) + '&mms_object_key=' + encodeURIComponent(optionalMMSBlobID);
            sendUrl = sendUrlC2DMBase;
            full_phone_num_derived = targetPhoneNum;
        } else if((action == 'send_sms_multiple_group_mms')){
			postVarBuilder = 'phone=' + encodeURIComponent(targetPhoneNum) + '&deviceType=ac2dm' + '&action=' + action + '&action_data=' + encodeURIComponent(actionData); 
			sendUrl=sendUrlC2DMBase;
			full_phone_num_derived=targetPhoneNum;
			console.log('message body in sendc2dm encodeURIComponent:');
			console.log(encodeURIComponent(actionData));
			
			console.log('message body in sendc2dm encodeURI:');
		} else if((action == 'send_mms_multiple_group_mms')){
			postVarBuilder = 'phone=' + encodeURIComponent(targetPhoneNum) + '&deviceType=ac2dm' + '&action=' + action + '&action_data=' + encodeURIComponent(actionData) + '&mms_object_key=' + encodeURIComponent(optionalMMSBlobID);
			sendUrl=sendUrlC2DMBase;
			full_phone_num_derived=targetPhoneNum;
		}

        console.log('send url for Custom C2DM is: ' + sendUrl);
        var bodyContent = $.ajax({
            url: sendUrl,
            global: false,
            type: "POST",
            timeout: 10000,
            xhrFields: {
                withCredentials: true
            },
            //v important!
            data: postVarBuilder,
            //if browser supports CORS, then this is just blank
            success: function(reply_server, textStatus, jqXHR) {
                console.log('========reply_server return=====');
                if (reply_server.indexOf('OK') > -1) {
                    if (reply_server.indexOf('sent to phone') > 0) {
                        callGAInBackgroundPage("CRX-Gmail", "Send-SMS-Success", "");
                        var messageType = '';
                        if(action == "send_sms"){
                            messageType = "SMS";
                        } else if (action == "send_mms") {
                            messageType = "MMS";
                        }
                        var location = '';
                        if(context == "Compose New"){
                            location = "Compose-New-Box";    
                        } else if (context == "Conversation"){
                            location = "In-Thread";
                        }
                        callKMInBackgroundPage("Send-Message",{'Type':messageType,'App-Action-Location':location,'Client':'CRX-New'});
                        var successTimeStamp = new Date();
                        if (context == "Compose New") { /*                             alert(currentURL); */
                            $(thisWindow).remove();
                            $(thisWindow).find('.contact').remove();
                            $(thisWindow).find('.messageToSend').val('');
                            console.log(targetPhoneNum);
                            
                            notifyUserSendConfirmation(targetContactName, "SMS/MMS", optionalBatchID);
                            
                            var composeWindowContainer = '';
                                if (currentHost.indexOf("mail.google.com") > -1){
                                    gmailChatWindowContainers = $(".dw").find(".nH.nn");
                                    composeWindowContainer = $(gmailChatWindowContainers[0]).parent();
                                } else if (currentHost.indexOf("facebook.com") > -1){
                                    gmailChatWindowContainers = $(document).find("div.fbNubGroup.clearfix");
                                    composeWindowContainer = $(gmailChatWindowContainers);
                                }

                            if (ongoingConversations) {
                                console.log("user has ongoing-conversations setting enabled");
                                //KL CONVERTED THE PHONENUM THAT WE JUST SENT THE MESSAGE TO INTO A STRING, SO THAT IT CAN THEN BE PASSED INTO THE GETSANITIZEDPHONENUMBER.... FUNCTION.
                                var phoneNumClean = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(String(targetPhoneNum));
                                //KL SEARCH FOR ANY EXISTING WINDOWS IN THE SCREEN W/ THE NEW PHONENUMCLEAN YOU WERE JUST RETURNED ABOVE.
                                var existingWindows = $(composeWindowContainer).find('[data-number="' + phoneNumClean + '"]');
                                
/*                                 console.log("this should be a 7 digit phone num clean: "+ phoneNumClean); */
                                                                
                                if (existingWindows.length < 1) {
                                    getTextsForThisNumber(targetPhoneNum, targetPhoneNum, targetContactName);
                                } else {
                                    updateTextWindow(thisWindow, 61, actionData, cleanNum, msgid_just_created_on_server, successTimeStamp, 37);
                                }
                            } else {
                                //ongoing convos not enabled.
                            } 
                        } else {
                            //PRE-KEV VARIABLES FROM MIGHTY.JS
                            var reg_msgid_between_curly = /\{([^}]+)\}/;
                            var result_array_split = reply_server.split(reg_msgid_between_curly);
                            var msgid_just_created_on_server = (result_array_split[1]);
                            var cleanNum = $(thisWindow).find(".composeInnerContainer").data("number");
                            var mmsButtonContainer = $(thisWindow).find('.sendMMS');
                            var imageUploadButton = $(thisWindow).find("#upload-image-mms");
                            var mmsButtonHTML = buildHTMLButtonCanvasMMS(targetPhoneNum);
                            //PRE-KEV VARIABLES FROM MIGHTY.JS
                            console.log('you did not compose a new message, you\'re in an ongoing conversation!');
                            
                            $(thisWindow).find('.messageToSend').val('');
                            
                            updateTextWindow(thisWindow, 61, actionData, cleanNum, msgid_just_created_on_server, successTimeStamp, 37);
                            //come back here4
                            
                            if ((action == "send_mms") || (action == 'send_mms_multiple_group_mms')) {
/*
                                console.log(buildHTMLButtonCanvasMMS(targetPhoneNum));
                                console.log(mmsButtonContainer);
*/
                                $(mmsButtonContainer).html(mmsButtonHTML).find("#upload-image-mms").each(function() {
                                    addMMSButtonFunctionality(this);
                                });
                                
                            }
                            $(thisWindow).find("#sendSMS").removeClass("textInProgress");
                            $(thisWindow).find(".messageToSend").removeAttr("disabled");
                        }
                    }
                } else if (reply_server.indexOf('LOGIN_REQUIRED') > -1) {
                    callGAInBackgroundPage("CRX-Gmail", "Send-SMS-Failure", "NOT_LOGGED_IN");
                    alert('Not logged in to MightyText.');
                    initializeApp("signBackIn");
                    $(textAreaToFocus).focus();
                    $(thisWindow).find("#sendSMS").removeClass("textInProgress");
                    $(thisWindow).find(".messageToSend").removeAttr("disabled");
                    return (false);
                    //resetFocusOnEntryBoxAfterC2DMProblem(messagesDiv);
                    //toggleSendButton(send_button_dom_element);
                } else if (reply_server.indexOf('DEVICE_NOT_REGISTERED') > -1) {
                    callGAInBackgroundPage("CRX-Gmail", "Error_Device_Not_Registered", "");
                    //_gaq.push(["_trackEvent","WebApp","C2DM-Error","DEVICE_NOT_REG",1]);
                    alert('Android Phone not registered with MightyText with this Google Account, or MightyText Android App not installed properly.');
                    $(textAreaToFocus).focus();
                    $(thisWindow).find("#sendSMS").removeClass("textInProgress");
                    $(thisWindow).find(".messageToSend").removeAttr("disabled");
                    //toggleSendButton(send_button_dom_element);
                } else if (reply_server.indexOf('DeviceQuotaExceeded') > -1) {
                    //_gaq.push(["_trackEvent","WebApp","C2DM-Error","DEVICE_QUOTA_EXCEEDED",1]);
                    alert('Android Phone Quota Exceeded.  Error Code: DeviceQuotaExceeded (C2DM)');
                    $(textAreaToFocus).focus();
                    $(thisWindow).find("#sendSMS").removeClass("textInProgress");
                    $(thisWindow).find(".messageToSend").removeAttr("disabled");
                    //toggleSendButton(send_button_dom_element);
                } else {
                    alert('C2DM Error.  Please retry. \r\n\r\n Error Info: \r\n\r\n' + reply_server);
                    $(textAreaToFocus).focus();
                    $(thisWindow).find("#sendSMS").removeClass("textInProgress");
                    $(thisWindow).find(".messageToSend").removeAttr("disabled");
                    //_gaq.push(["_trackEvent","WebApp","C2DM-Error","GENERAL C2DM ERROR",1]);
                    //toggleSendButton(send_button_dom_element);
                    //listener(STATUS_GENERAL_ERROR,req);
                }
                console.log('==================================');
            },
            error: function(jqXHR, textStatus, errorThrown) {
                //alert('Error in Ajax call: ' + errorThrown);
                callGAInBackgroundPage("CRX-Gmail", "Error_AJAX_C2DM_SendSMS", errorThrown);
                $(textAreaToFocus).focus();
                $(thisWindow).find("#sendSMS").removeClass("textInProgress");
                $(thisWindow).find(".messageToSend").removeAttr("disabled");
                alert('Error in Ajax call: ' + errorThrown);
                //console.log(textStatus);
                //console.log(errorThrown);
                //_gaq.push(["_trackEvent","WebApp","AjaxError","sendC2DM-" + errorThrown,1]);	
            }
        });
    }

    function updateTextWindow(window2Update, messageDirection, messageBody, cleanNumTarget, uniqueTextID, messageTimeStamp, sourceClient, optionalContentAuthor) {
                
        var messageIDToMatch = $(document).find("#message-id-" + uniqueTextID);
        
        if (messageIDToMatch.length > 0) {
            return false;
        }

        var textWindow = $(window2Update).find("#conversationHolder");
        var currentComposeHeader = $(window2Update).find("div.composeHeader");
        var incoming_outgoing = '';
        var characterCountHolder = $(window2Update).find("span.count");
        var messageField = $(window2Update).find(".messageToSend");
        var charCountReset = $(window2Update).find(".count");
        var sanitizedMessageBody = createHTMLEquivalentOfMessageBody(messageBody);
        messageTimeStamp = moment(messageTimeStamp).format("MMM D, h:mm a");
        //ADD BLINKING FUNCTIONALITY TO MINIMIZED WINDOWS WITH UNREAD TEXTS
        var currentlyFocusedElement = document.activeElement; /*         console.log(messageTimeStamp); */
        var messageToAppend = messageBody
        //STOP BLINK FUNCTION
        if (messageDirection == 61) {
            incoming_outgoing = "outgoing"
        } else {
            incoming_outgoing = "incoming"
            flashComposeHeader(currentComposeHeader, messageDirection, textWindow, messageField, window2Update);
        } /*         console.log(window2Update); */
        
                
        //APPENDING CONTACT NAME TO MESSAGEBODY IF IT IS A GROUP MMS

        console.log(optionalContentAuthor)
        
        if(optionalContentAuthor != undefined){
            if (messageDirection == 60){
                messageToAppend = sanitizedMessageBody + " - <span class='contentAuthor'>" + optionalContentAuthor.contactName+ "</span>";
            }
        }
        
        var htmlForSMS = '<div class="textWrapper ' + incoming_outgoing + ' updatedText" id="message-id-' + uniqueTextID + '"><div class="textInnerWrapper mightyClearfix"><span class="textContent">' + messageToAppend + '</span></div><div class="itemActions"><a id="forwardMessage" data-message-id="' + uniqueTextID + '" data-message-type="' + this.type + '"><img class="forwardMessage messageAction forwardMessageIcon" src="' + forwardImgURL + '"></a><a id="starMessage" data-message-id="' + uniqueTextID + '" class="unstarred"><img class="unstarredicon" src="' + unstarredImgURL + '"></a><a id="deleteMessage" data-message-id="' + uniqueTextID + '" data-message-type="' + this.type + '" data-clean-num="' + cleanNumTarget + '"><img class="deleteOneMessage deleteOneMessageIcon" src="' + deleteImgURL + '"></a><span class="textTimeStamp">' + messageTimeStamp + '</span></div></div>';
        console.log(sourceClient);
        
        if (messageDirection != 61 || sourceClient == 30) {
            $(htmlForSMS).hide().appendTo(textWindow).fadeIn(750).each(function() {
/*                 $(this).find(".textContent").text(messageBody); */
                addItemActionsEventHandlers(this, window2Update);
            });
        } else if (messageDirection == 61) {
            $(htmlForSMS).appendTo(textWindow).each(function() {
                var sentMessageStatusParent = $(this).find("div.textInnerWrapper");
                $('<div class="sentMessageStatus"><img id="sentConfirmation" src="' + clockImgURL + '"/></div>').prependTo(sentMessageStatusParent).each(function(){
                    addToolTipToSentConfirmationIcon(this, "pending");
                });
/*                 $(this).find(".textContent").text(messageBody); */
                addItemActionsEventHandlers(this, window2Update);
            });
        }
        setTimeout(function() {
            $(textWindow).scrollTo('max');
        }, 100);
        if (currentlyFocusedElement != messageField[0]) {
            flashComposeHeader(currentComposeHeader, messageDirection, textWindow, messageField, window2Update);
        } else {
            $(messageField).focus();
        }
        //RESET CHARCOUNT TEXT TO 500 EACH TIME THE CONVERSATION HOLDER IS UPDATED
        $(charCountReset).text("500");
    };

    function flashComposeHeader(composeHeader, inboxOutbox, convoHolder, messageField, window2Update) {
        $(composeHeader).each(function() {
            var alreadyFlash = $(this).hasClass("unread");
            if (inboxOutbox == 60 && !alreadyFlash) {
                $(this).addClass("unread");
                var blink = setInterval(function() { /*                    console.log(window2Update); */
                    $(composeHeader).toggleClass("flash");
                }, 750);
            }
            $(this).on("click", function() {
                revertToFocusedComposer(blink, convoHolder, composeHeader);
            });
            $(messageField).on("focus", function() {
                revertToFocusedComposer(blink, convoHolder, composeHeader);
            });
            $(convoHolder).on("click", function() {
                revertToFocusedComposer(blink, convoHolder, composeHeader);
            });
        });
    };

    function revertToFocusedComposer(blink, convoHolder, composeHeader) {
        clearInterval(blink);
        $(composeHeader).removeClass("flash").removeClass("unread");
        $(convoHolder).scrollTo('max');
    };

    function updateWindowContainerHeights() {
        //THIS DOES NOT DO ANYTHING TO CHANGE THE HEIGHT OF THE CONTAINER, BUT IT'S HERE AS A NECESSARY CSS CHANGE TO MAKE SMS WINDOWS STAY OPEN WHEN OTHER WINDOWS (EMIL & GCHAT) ARE CLOSED
        $(".dw").removeClass("np").css("z-index", 6);
        var windowHeight = $(window).height();
        $(".mightynH").css("height", windowHeight);
    };

    function checkForRepeatNumbers(valToCheck, arrayOfElementsToCheck) {
        var numExists = false;
        console.log("inside checkforRepeatNumbers()");
        console.log(arrayOfElementsToCheck);
        $(arrayOfElementsToCheck).each(function() {
            var existingWindows = $(this).data('number');
            if (existingWindows == valToCheck) {
                console.log("this number already exists, don't pop a div. newphone: " + scCleanNum + " existing number: " + existingWindows);
                numExists = true;
            }
            console.log("---------------------------------");
            console.log(numExists);
        });
        console.log("+++++++++++++++++++++++++++++++");
        console.log(numExists);
        return numExists;
    };

    function isValidPhoneNum(phonenumber) {
        if (phonenumber != "") {
            var goodChars = "+- 1234567890()/][.";
            for (i = 0; i < phonenumber.length; i++) {
                var c = phonenumber.charAt(i);
                if (goodChars.indexOf(c) < 0) return false;
            }
            return true;
        } else {
            return false;
        }
    };

    function notifyUserSendConfirmation(ContactSentTo, type, batchID) {
        var gmailNotifContainer = $(document).find(".b8.UC");
        var gmailNotif = $(gmailNotifContainer).find(".J-J5-Ji .vh");
        var gmailNotifText = $(gmailNotif).text();
        var timeDelay = 10000;
//        console.log(gmailNotif);
        $(gmailNotifContainer).css("visibility", "visible");
//         $(gmailNotif).data("batch", batchID); */
        if (type == "SMS/MMS" && gmailNotif.length > 0) {
            gmailNotif = $(gmailNotifContainer).find('[data-batch="' + batchID + '"]');
// 			if (gmailNotif.length > 0) */
            if(gmailNotifText.indexOf("Sent text message to") < 0){
	            $(gmailNotif).text("Sent text message to "+ ContactSentTo);
            } else {
    			$(gmailNotif).append(', ' + ContactSentTo);
            }
        } else if (type == "incomingPhoneCall") {
            $(gmailNotif).text("Incoming call from " + ContactSentTo + "...");
        } else if (type == "missedPhoneCall") {
            $(gmailNotif).text("Missed call from " + ContactSentTo);
        } else if (type == "incomingGroupMMS"){
            $(gmailNotif).text("Incoming group message from " + ContactSentTo + "...");
        } else if (type == "incomingPicMMS"){
            $(gmailNotif).text("Incoming picture message from " + ContactSentTo + "...");
        } else {
            $(gmailNotif).text("Loading...");
            timeDelay = 1000;
        }

        setTimeout(function() {
            $(gmailNotifContainer).css("visibility", "hidden");
            $(gmailNotif).text('');
        }, timeDelay)
    };

    function conversationConfirmClientSent(idOfTargetText, windowChecked, messageDirection, messageBody, cleanNum, messageTimeStamp, sourceClient) {
        
    //IN THE ACTIVE TAB THAT THE ORIGINAL TEXT WAS SENT FROM GTEXT, WE APPEND A CLOCK IMG URL AND THEN HERE WE DETECT IF IT EXISTS.  IF NOT THEN WE GO TO UPDATETEXTWINDOW AND ADD IT. IF IT DOES EXIST CHANGE THE ICON TO THE BLUE CHECKMARK
        console.log("!!received an ack!! inside of conversationconformclientsent()");
        
        var idStr = "#message-id-" + idOfTargetText
        var textSentFromClient = $(document).find(idStr);
        var imgToChange = $(textSentFromClient).find("#sentConfirmation");
        var sentFromCRXInAnotherTabCheck = $(imgToChange).attr("src"); 
        
        if (textSentFromClient.length > 0) {
            $(imgToChange).attr("src", checkImgURL).each(function(){
                addToolTipToSentConfirmationIcon($(this).parent(), "confirmed");
            });
        } else {
            console.error("error in function conversationConfirmClientSent.  This message ID was not found, there is no orange icon to change");
        }
    };

    function processContactForComposeSingleText(contactName, contactNumber, contactInput, contactsToSendSMSTo, optionalComposer) {
        //CRV this is where we need to validate that to: number.
        // CRV checks for max number of recipients 
        var currentNumOfContacts = $(contactsToSendSMSTo).children('.contact').length;
                
        if (currentNumOfContacts < 10) {
            var manual_num_comma_stripped = contactNumber.replace(',', '');
            manual_num_comma_stripped = manual_num_comma_stripped.replace('\t', '');
            if (!isValidPhoneNum(manual_num_comma_stripped)) {
                alert(manual_num_comma_stripped + ' is not a valid phone number');
                $(contactInput).val(contactNumber.replace('\t', '')); 
//                		  	setTimeout("$('#selectContactForSingleCompose').focus();",50);
            } else {
                insertContact(null, false, contactName, contactNumber, contactInput);
            }
                        
        } else {
            alert("You already have selected the max number of recipients (10)");
            return (false);
        }
        $(contactInput).focus();
    }

    function validateMessageContentBeforeSend(is_sms, messageContent, domElement) {
        if (is_sms) {
            if (messageContent.length < 1) //ok to send blank message on MMS
            {
                alert('Message is blank');
                $(domElement).val('');
                $(domElement).focus();
                return (false);
            }
            if (messageContent.length > 500) //ok to send blank message on MMS
            {
                alert('Message is to long.  Maximum characters is 500');
                $(domElement).focus();
                return (false);
            }
            //CRV check message length to determine if this message is a good canidate for appending "Sent From MT" message
            return true;
        } else {
            return true;
        } 
    }

    function verifyThatUserWantsToCloseComposeNew(thisComposeNewWindow, contactsToSendTo, messageToBeSent, windowContext) {
        //if the user is trying to close a conversation window, then just check to see if they're in the middle of a message.  So, set the length of contacts to zero for the purpose of this logic
        var contacts = $(contactsToSendTo).children(".contact").length;
        var message = $(messageToBeSent).val().length;
        if (windowContext == "Conversation") {
            contacts = 0;
        }
        if ((message > 0) || (contacts > 0)) {
            //there is text content or a contact is selected.
            if (!confirm('You haven\'t sent this message yet.  Are you sure you want to close this?')) {
                return;
            } else {
                $(thisComposeNewWindow).remove();
            }
        } else {
            //There are no contacts selected or text content.  Delete this new message draft.  
            $(thisComposeNewWindow).remove();
        }
    };

    function setNobleCountSettings() {
        //alert('call function..');
        var max_num_chars = 500;
        $.fn.NobleCount.settings = {
            on_negative: null,
            on_positive: null,
            on_update: null,
            max_chars: max_num_chars,
            block_negative: true,
            cloak: false,
            in_dom: false
        };
    }

    function initializeNobleCount(messageField, characterCountHolder) {
        //GENERATE A RANDOM INTEGER BETWEEN 1-100
        var randomnumber = Math.floor(Math.random() * 101);
        //assign each compose window's id to a matching pair of a number between 1-100.  The web app uses the generic class, and in place of threads, they use the cleanPhoneNum, but because the CRX allows multiple Compose New, then it is convenient to use it this way.
        $(characterCountHolder).attr("id", "textareaCount_" + randomnumber);
        $(messageField).attr("id", "nobleCount_" + randomnumber);
        var nobleCountTextEntryObject = $(messageField).attr("id");
        var nobleCountCharRemainingObject = $(characterCountHolder).attr("id");
        // build the string for the NobleCount Selector        
        $("#" + nobleCountTextEntryObject).NobleCount("#" + nobleCountCharRemainingObject);
    }

    function processIncomingPhotoTaken(msg, windowToAppendMMSTo) {
        var textWindow = $(windowToAppendMMSTo).find("#conversationHolder"); /*         console.log(msg); */
        var targetPhotoDom = 'photo-' + msg.id;
        var timeStamp = msg.ts_server + ' UTC';;
        //come back hurr2
        console.log(timeStamp);
        var momentDate = moment(timeStamp).format("MMM D, h:mm a");
        console.log(momentDate);
        var textMessage = createHTMLEquivalentOfMessageBody(msg.body);
        var incoming_outgoing
        
        if(msg["inbox_outbox"] == 61){
            incoming_outgoing = "outgoing";
        } else {
            incoming_outgoing = "incoming";
        }
/*
        if (textMessage.length > 0) {
            textMessage = checkMessageContentForURLs(textMessage);
        }
*/
        if (msg.mms_object_key) //picture is now ready to show (uploaded from phone>cloud)
        { /*             alert("picture is now ready to show (uploaded from phone > cloud"); */
            var mms_blob_url = baseUrl + '/imageserve?function=fetchFile&id=' + msg.id;
            updatedDOMImageAtag = "#message-id-" + msg.id;
            if ($(updatedDOMImageAtag).length > 0) //look for the placeholder picture waiting.
            {
                console.log($(updatedDOMImageAtag));
                $(updatedDOMImageAtag).children('#mms-scale-down').children('#fancyimagepopup').attr("href", mms_blob_url).css("margin", "0px");
                $(updatedDOMImageAtag).children('#mms-scale-down').children('#fancyimagepopup').data("blobkey", msg.mms_object_key);
                $(updatedDOMImageAtag).children('#mms-scale-down').children('#fancyimagepopup').children("img").attr("src", mms_blob_url);
                $(updatedDOMImageAtag).find('.textContent').empty();
                $(updatedDOMImageAtag).find('.textContent').html(textMessage);
                //HAVE NOT IMPLEMENTED THE SHARE FEATURE BUTTONS, THEREFORE THIS CODE BELOW IS UNNECESSARY.
                /*     		    $(updatedDOMImageAtag).append('<div class="itemActions"><span class="timestamp-msg">' + cleanTimeDisplayPurposes(msg.ts_server,true) + '</span><a id="STAR-' + msg.id + '" onclick="star_click(this);" class="unstarred"><img src="assets/unstarred.png" alt="unstarred" width="" height="" /></a><a id="DELETE-MESSAGE-' + msg.id + '"" onclick="deleteSingleMessage(\'' + msg.id + '\',\'' + msg.phone_num_clean + '\',\'' + msg.type + '\');"><img src="assets/trashcan.png" class="deleteOneMessage" alt="trashcan" width="" height="" /></a></div>'); */
                var addNewMessageToThisElement = windowToAppendMMSTo;
/*
                addNewMessageToThisElement.animate({
                    scrollTop: addNewMessageToThisElement.prop("scrollHeight") - addNewMessageToThisElement.height()
                }, 1);
*/
                $(updatedDOMImageAtag).find("#forwardMessage").on("click", function() {
                    forwardTheMessage(msg.type, msg.id, textMessage);
                });
                setTimeout(function() {
                    $(addNewMessageToThisElement).scrollTo('max')
                }, 500);
            } else { // in the unlikely event that picture placeholder DOM is not found, append it to top.

//DC Added class "mmsImgWrap" and "mmsImgWhole" to anchor and image tag, also erased inline styling
			/* var image_holder_html = '<div id="sms-line-item-msgid-'+msg.id+'" class="threadItem receivedText"><span class="newPhotoTextContent">' + msg.body + '</span><div id="mms-scale-down"><a id="fancyimagepopup" href="' + mms_blob_url + '" class="mmsImgWrap"><img src="' + mms_blob_url + '" alt="Photo in process" class="mmsImgWhole"></a></div><div class="itemActions"><span class="timestamp-msg">' + cleanTimeDisplayPurposes(msg.ts_server,true) + '</span><a id="STAR-' + msg.id + '" onclick="star_click(this);" class="unstarred"><div class="unstarredicon"></div></a><a id="DELETE-MESSAGE-' + msg.id + '"" onclick="processDeleteSingleMessage(\'' + msg.id + '\',\'' + msg.phone_num_clean + '\',\'' + msg.type + '\');"><div class="deleteOneMessage deleteOneMessageIcon"></div></a></div></div>'; */
/* 			var image_holder_html = '<div id="sms-line-item-msgid-'+msg.id+'" class="threadItem receivedText"><span class="newPhotoTextContent">' + msg.body + '</span><div id="mms-scale-down" style="height: 60px;"><a id="fancyimagepopup" style="margin-left:25px;" href="' + mms_blob_url + '"><img src="' + mms_blob_url + '" alt="Photo in process" style="max-height: 60px;"></a></div><div class="itemActions"><span class="timestamp-msg">' + cleanTimeDisplayPurposes(msg.ts_server,true) + '</span><a id="STAR-' + msg.id + '" onclick="star_click(this);" class="unstarred"><img src="assets/unstarred.png" alt="unstarred" width="" height="" /></a><a id="DELETE-MESSAGE-' + msg.id + '"" onclick="processDeleteSingleMessage(\'' + msg.id + '\',\'' + msg.phone_num_clean + '\',\'' + msg.type + '\');"><img src="assets/trashcan.png" class="deleteOneMessage" alt="trashcan" width="" height="" /></a></div></div>'; */
			/*
var addNewMessageToThisElement = $('#' + msg.phone_num_clean + '_conversation');
		addNewMessageToThisElement.append(image_holder_html).animate({ scrollTop: addNewMessageToThisElement.prop("scrollHeight") - addNewMessageToThisElement.height() }, 1);;
*/

            if(msg["type"] == 21){
                console.log("this is a group mms pic");
                
                var contentAuthorFullContact = cleanContentAuthorAndThenCompareToMyContacts(msg["content_author"]);
                
                if (msg["inbox_outbox"] == 60){
/*
                    console.log("don't append anything");   
                } else if(contentAuthorFullContact.contactName == "Nobody"){
                    textMessage = textMessage + " - <span class='contentAuthor'>" + contentAuthorFullContact.phoneNum + "</span>";
                } else {
*/
                    textMessage = textMessage + " - <span class='contentAuthor'>" + contentAuthorFullContact.contactName + "</span>";
                }
            }

/* 			var potentialmessageBody = buildMessageHTML(msg); */
			var potentialmessageBody = '<div class="textWrapper ' + incoming_outgoing + '" id="message-id-' + msg.id + '"><div class="textInnerWrapper mightyClearfix"><span class="textContent">' + textMessage + '</span><div id="mms-scale-down"><a id="fancyimagepopup" href="' + mms_blob_url + '" data-blobkey="' + msg.mms_object_key + '"> <img class="mmsImage" src="' + mms_blob_url + '" alt="Photo in process"></a></div></div><div class="itemActions"><a id="forwardMessage" data-message-id="' + msg.id + '" data-message-type="' + msg.type + '"><img class="forwardMessage messageAction forwardMessageIcon" src="' + forwardImgURL + '"></a><a id="starMessage" data-message-id="' + msg.id + '" class="unstarred"><img class="unstarredicon" src="' + unstarredImgURL + '"></a><a id="deleteMessage" data-message-id="' + msg.id + '" data-message-type="' + msg.type + '" data-clean-num="' + msg.phone_num_clean + '"><img class="deleteOneMessage deleteOneMessageIcon" src="' + deleteImgURL + '"></a><span class="textTimeStamp">' + momentDate + '</span></div></div>';
			console.log('potentialmessagebody');
			console.log(potentialmessageBody);
			
			

        console.log(windowToAppendMMSTo);

		var addNewMessageToThisElement = $(windowToAppendMMSTo).find('#conversationHolder');
		
		console.log(addNewMessageToThisElement);
		
		$(potentialmessageBody).appendTo(addNewMessageToThisElement).each(function(){   
        var sentMessageStatusParent = $(this).find("div.textInnerWrapper");             
            addItemActionsEventHandlers(this, windowToAppendMMSTo, true);
            if((incoming_outgoing == "outgoing") && (msg["source_client"] != 30)){//if it was an outgoing text sent from gtext then attach the sent confirmation icon
                $('<div class="sentMessageStatus"><img id="sentConfirmation" src="' + clockImgURL + '"/></div>').prependTo(sentMessageStatusParent).each(function(){
                    addToolTipToSentConfirmationIcon(this, "pending");
                });                
            }
        }).find("#forwardMessage").on("click", function() {
            forwardTheMessage(msg.type, msg.id, textMessage);
        });
        
        setTimeout(function() {
            $(addNewMessageToThisElement).scrollTo('max')
        }, 500);
        
            }
            //CRV set instructions for itemaction hover and fancybox
/*
            var domElement = $('#sms-line-item-msgid-' + msg.id);
            resetThreadResponseAreaAfterNewMessageHasBeenSentFromWebApp(domElement);
*/
        } else //only picture was taken -- not uploaded to server yet...
        { /*             alert("only picture was taken -- not uploaded to server yet"); */
            var addNewMessageToThisElement = textWindow; /*             $(addNewMessageToThisElement).append('<div class="textWrapper incoming" id="message-id-' + msg.id + '"><span class="newPhotoTextContent">Incoming Picture Message (Getting Photo)</span><div id="mms-scale-down" style="height: 60px"><a id="fancyimagepopup" style="margin-left:25px;" href=""><img src="img/loading.gif" alt="Photo in process" style="max-height: 60px;"></a></div></div>').scrollTo('max'); */
            var htmlForMMS = '<div class="textWrapper ' + incoming_outgoing + ' id="message-id-' + msg.id + '"><div class="textInnerWrapper mightyClearfix"><div id="mms-scale-down"><a id="fancyimagepopup" href="' + loadGIFURL + '" data-blobkey="image has not loaded, therefore this does not exist yet."> <img class="mmsImage" src="' + loadGIFURL + '" alt="Photo in process"></a></div><span class="textContent">Incoming Picture Message (Getting Photo)</span></div><div class="itemActions"><a id="forwardMessage" data-message-id="' + msg.id + '" data-message-type="' + msg.type + '"><img class="forwardMessage messageAction forwardMessageIcon" src="' + forwardImgURL + '"></a><a id="starMessage" data-message-id="' + msg.id + '" class="unstarred"><img class="unstarredicon" src="' + unstarredImgURL + '"></a><a id="deleteMessage" data-message-id="' + msg.id + '" data-message-type="' + msg.type + '" data-clean-num="' + msg.phone_num_clean + '"><img class="deleteOneMessage deleteOneMessageIcon" src="' + deleteImgURL + '"></a><span class="textTimeStamp">' + momentDate + '</span></div></div>';
            $(htmlForMMS).appendTo(addNewMessageToThisElement).each(function() {
                addItemActionsEventHandlers(this, windowToAppendMMSTo, true);
            });
            setTimeout(function() {
                $(addNewMessageToThisElement).scrollTo('max')
            }, 500);
/*		var image_holder_html = '<div id="' + targetPhotoDom + '" style="height:120px"><a id="fancyimagepopup" style="margin-left:25px;" href=""><img style="vertical-align:middle;height:100%" src="http://www.deckmaster.com.ph/images/loading52.gif" alt="Photo in process"></a></div>';	
    		$("#settingsPane").prepend(image_holder_html);    	*/
        }
    }
    //START OF COMPOSE MMS CODE

    function buildHTMLButtonCanvasMMS(phoneNumClean) {
        var mms_stuff = '';
        //DC Erased <img> between the buttons to be able to set that per theme
        //KL COMMENTED THIS OUT IN ORDER TO REWRITE HOW THE ON CLICK EVENT IS TRIGGERED
        /* mms_stuff += '<button id="upload-image-mms" name="' + phoneNumClean + '" class="mms-feature" onclick="getImageUploadCode(this.parentNode);"><div class="dcattachicon"></div></button>'; */
        mms_stuff += '<div id="upload-image-mms" name="' + phoneNumClean + '" class="mms-feature" ><div class="dcattachicon"><img src="' + attachImgURL + '" alt="attach new file"></img></div></div>'; /* mms_stuff += '<button id="upload-image-mms" name="' + phoneNumClean + '" style="float:left;font-size:11px" class="mms-feature" onclick="getImageUploadCode(this.parentNode);"><img id="attach-mms-image" src="assets/5-content-new-attachment.png"></button>'; */
        //this.parentNode -- gets us the MMSCanvas area that we target when we come back from the MMS dialog (where user selects the MMS attachment)
        //DC Erased inline styling
        mms_stuff += '<div id="holder-mms-image-preview" class="mms-feature" style="display:none;">'; /* mms_stuff += '<div id="holder-mms-image-preview" class="mms-feature" style="display:none;mmmax-height:60px;mmmmax-width: 160px;overflow: hidden;border: 1px dashed lightgray;">'; */
        //DC Erased inline styling
        mms_stuff += '<a id="fancyimagepopup-MMS"><img id="mms-image-preview" class="mms-feature" style="display:none;" src=""></a>'; /* mms_stuff += '<a id="fancyimagepopup-MMS"><img id="mms-image-preview" class="mms-feature" style="max-height:100%;max-width:100%;display:none;vertical-align:middle;float:left;" src=""></a>'; */
        //we put this img in this div to force its height, in case it's a very large image
        mms_stuff += '</div>'; //closes holder-mms-preview-image
        mms_stuff += '<span id="mms-blob-id-holder" class="mms-feature" style="display:none"></span>'; //stores blobID to pass in C2DM call when sending MMS
        mms_stuff += '<div id="mms-upload-dialog" class="mms-feature modal hide fadeMighty" tabindex="-1" role="dialog" style="display:none;"></div>'; /* mms_stuff += '<div id="mms-upload-dialog" class="mms-feature modal hide fadeMighty" tabindex="-1" role="dialog" style="display:none;text-align:left;z-index:50000"></div>'; */
        //insert dialog content dynamically, later
        // set the z-index very high -- so that if a bootstrap-growl notification comes in, it won't do it on top of the MMS dialog window
/*
        console.log("--------------------inside of buildHTMLButtonCanvasMMS--------------------");
        console.log(mms_stuff);
*/
        return mms_stuff;
    }

    function buildMessageHTML(messageInfo, wasThisMessageSentFromTheWebApp)
    {
    	console.log('in buildMessageHTML');
    	console.log(messageInfo);
    	var momentDate = moment(messageInfo.ts_server).format("MMM D, h:mm a");
    	var currentMomentDate = moment().format("MMM D, h:mm a");
    	var body = '';
    	var optionalSendFromWebAppImg = '';
    	var threadItemCheckBox = '';
    	var downloadMMSButton = '';
    	var cancelEventOptional = '';
    	var eventHistoryIcon = '';
    	
    	var calledFromSendC2DM = '';
    	 
    	//CRV by default, we will have forward icon.  However, if the message is an MMS, we will remove the forward icon.
    	var forwardLink = '<a id="forward-MESSAGE-' + messageInfo.id + '"" onclick="forwardTheMessage(\'' + messageInfo.type + '\', \'' + messageInfo.id + '\' );"><div class="forwardMessage messageAction forwardMessageIcon"></div></a>';
    
    	if(messageInfo.ts_server)
    		{
    			var messageTimeStamp = '<span class="timestamp-msg">' + momentDate + '</span>';
    		}
    	else
    		{
    			var messageTimeStamp = '';
    		}
    
    
    	// Determing wether or not the message has been starred by the user and creating the anchor tag with image for starring.
    	if(messageInfo.is_starred)
    		{
    			var starIconClass = 'starred';
    		}
    	else
    		{
    			var starIconClass = 'unstarred';
    		}
    
    	if(messageInfo.inbox_outbox == 60)  //Inbound SMS
    		{
    			var threadItemType = 'receivedText';
    			threadItemCheckBox = '<input type="checkbox" class="shareThisContent shareContentCheckBoxRecieved" name="' + messageInfo.id + '">';
    		}
    	else if (messageInfo.inbox_outbox==61)
    		{    //outbound SMS
    			var threadItemType = 'sentText';
    			threadItemCheckBox = '<input type="checkbox" class="shareThisContent shareContentCheckBoxSent" name="' + messageInfo.id + '">';
    		}
    	var starIcon = '<a id="STAR-' + messageInfo.id + '" onclick="star_click(this);" class="messageAction ' + starIconClass + '"><div class="' + starIconClass + 'icon"></div></a>';
    
    
    	// START CHECK TO SEE IF THIS NEW CAPI WAS A PHONE CALL
    	if(messageInfo.body == "Outgoing Call")  //CRV checking the body instead of the
    		{
    		  	var whichPhoneIcon = 'outgoingcall';
    		}
    	else if(messageInfo.body == "Missed Call")
    		{
    			var whichPhoneIcon = 'missedcall';
    		}
    	else if(messageInfo.body == "Calling Now")  // Need To find type for Calling Now
    		{
    			var whichPhoneIcon = 'makingcall';
    		}
    	else if(messageInfo.body == "Incoming Call Answered")
    		{
    			var whichPhoneIcon = 'incomingcall';
    		}
    	// START CHECK TO SEE IF THIS NEW CAPI WAS A PHONE CALL
    	else if(messageInfo.type == 10) // NEW CAPI WAS AN SMS
    		{
    			//bodyText = highlightIfAdd(messageInfo.body);
    			
    			var wasMessageSentFromWebapp = 'NO'; //CRV we must check to see if this message was sent from the web app so we know what type of encoding the message body will have.
    		    if(messageInfo.source_client != 30)
    		    	{
    			    	wasMessageSentFromWebapp = 'YES';
    		    	}
    			
    			
    			body = createHTMLEquivalentOfMessageBody(messageInfo.body, wasMessageSentFromWebapp);
    			body = '<span>' + body + '</span>';
    
    
    			if(messageInfo.inbox_outbox == 60)  //Inbound SMS
    				{
    					var messageTimeStamp = '<span class="timestamp-msg">' + momentDate + '</span>';
    					//you recieved this
    				}
    			else if (messageInfo.inbox_outbox==61)
    				{    //outbound SMS
    				
    					//CRV add a check to see if the message has acked yet.  We must also check the source_client to ensure that the text was sent from teh web app and not the phone as texts sent from the phone have no ack_phone_sent value.
    					if(messageInfo.status_route == 2)
    						{
    							wasThisMessageSentFromTheWebApp = 'no ack yet';
    						}
    					
    					console.log(wasThisMessageSentFromTheWebApp);
    					if(wasThisMessageSentFromTheWebApp)
    						{
    							optionalSendFromWebAppImg = '<div id="'+ messageInfo.id +'" class="sentMessageStatus" data-toggle="tooltip" data-original-title="Waiting for phone to send message" data-trigger="hover" data-placement="bottom"><img src="assets/red-clock-waiting.png" alt="sending" width="15" height="15" /></div>';
    							var nowDateTime=new Date();
    							messageTimeStamp = '<span class="timestamp-msg">' + currentMomentDate + '</span>';
    						}
    				}
    
    		}
    	else if((messageInfo.type=='11') || (messageInfo.type=='70') || (messageInfo.type=='21'))   // Is it an MMS or pic gallery from android camera?
    		{
    			console.log('mms');
    			console.log(messageInfo);
    			//CRV we need the media_id for this mms media table entry. 	
    			
    			
    			var messageTimeStamp = '<span class="timestamp-msg">' + momentDate + '</span>';
    			//CRV below code adds the status icon to an MMS sent from web app
    			if (messageInfo.inbox_outbox==61)
    				{    //outbound SMS
    				
    					//CRV add a check to see if the message has acked yet.  We must also check the source_client to ensure that the text was sent from teh web app and not the phone as texts sent from the phone have no ack_phone_sent value.
    					if(messageInfo.status_route == 2)
    						{
    							wasThisMessageSentFromTheWebApp = 'no ack yet';
    						}
    					
    					console.log(wasThisMessageSentFromTheWebApp);
    					if(wasThisMessageSentFromTheWebApp)
    						{
    							optionalSendFromWebAppImg = '<div id="'+ messageInfo.id +'" class="sentMessageStatus" data-toggle="tooltip" data-original-title="Waiting for phone to send message" data-trigger="hover" data-placement="bottom"><img src="assets/red-clock-waiting.png" alt="sending" width="15" height="15" /></div>';
    							var nowDateTime=new Date();
    							messageTimeStamp = '<span class="timestamp-msg">' + currentMomentDate + '</span>';
    						}
    				}
    			
    			
    			
    			var wasMessageSentFromWebapp = 'NO'; //CRV we must check to see if this message was sent from the web app so we know what type of encoding the message body will have.
    		    if(messageInfo.source_client != 30)
    		    	{
    			    	wasMessageSentFromWebapp = 'YES';
    		    	}
    			
    			var mmsBody = createHTMLEquivalentOfMessageBody(messageInfo.body, wasMessageSentFromWebapp);
    //DC Added class "mmsImgWrap" and "mmsImgWhole" to anchor and image tag, also erased inline styling
    			var mms_blob_url = baseUrl + '/imageserve?function=fetchFile&id=' + messageInfo.id;
    			var mms_blob_url_thumbnail = baseUrl + '/imageserve?function=fetchViaServingUrl&resize=350&id=' + messageInfo.id;
    			var blobKey = messageInfo.mms_object_key;
    			var mmsPlaceholderClass = '';
    			downloadMMSButton = '<a class="downloadMMS messageAction" href="' + mms_blob_url + '&download=1"><img width=20 height=20 src="assets/9-av-download.png"/></a>';
    			if(blobKey == null)
    				{
    					//alert('no blob key yet');
    					mms_blob_url = 'assets/green_spinner_big.gif';
    					mms_blob_url_thumbnail = 'assets/green_spinner_big.gif'; 
    					mmsBody = 'Incoming Picture Message (Getting Photo)';
    					downloadMMSButton = '';
    					
    				}
    				
    			if(messageInfo.optionalBuildFrom_sendc2dm) //CRV this is an optional param only passed in messageInfo via success callback of sendc2dm.  
    				{
    					//console.error('THIS MESSAGE HAD optionalBuildFrom_sendc2dm PARAM IN MSGINFO');
    					mms_blob_url = baseUrl + '/imageserve?function=fetchFile&id=' + messageInfo.id;	
    					mms_blob_url_thumbnail = baseUrl + '/imageserve?function=fetchViaServingUrl&resize=350&id=' + messageInfo.id;
    					var wasMessageSentFromWebapp = 'NO'; //CRV we must check to see if this message was sent from the web app so we know what type of encoding the message body will have.
    				    if(messageInfo.source_client != 30)
    				    	{
    					    	wasMessageSentFromWebapp = 'YES';
    				    	}
    					
    					mmsBody = createHTMLEquivalentOfMessageBody(messageInfo.body, wasMessageSentFromWebapp);
    					downloadMMSButton = '<a class="downloadMMS messageAction" href="' + mms_blob_url + '&download=1"><img width=20 height=20 src="assets/9-av-download.png"/></a>';
    				}
    			var body = '<div id="mms-scale-down"><a id="fancyimagepopup" href="' + mms_blob_url + '" class="mmsImgWrap" data-blobkey="' + blobKey + '"> <img src="' + mms_blob_url_thumbnail + '" alt="Photo in process" class="mmsImgWhole"></a></div><span>' + mmsBody + '</span>';
    			
    			
    			
    /*
    			var mms_blob_url = baseUrl + '/imageserve?function=fetchFile&id=' + messageInfo.id;
    			var body = '<div id="mms-scale-down" style="height: 60px"><a id="fancyimagepopup" style="margin-left:25px;" href="' + mms_blob_url + '" data-blobKey="' + messageInfo.mms_object_key + '"> <img style="vertical-align:middle;height:100%" src="' + mms_blob_url + '" alt="Photo in process"></a></div>';
    			var messageTimeStamp = '<span class="timestamp-msg">' + cleanTimeDisplayPurposes(messageInfo.ts_server,true) + '</span>';
    */
    			//CRV null forward link for now.  In future we will forward the actual MMS
    			//forwardLink = '';
    		}
    	else
    		{
    			body = '<span>' + checkMessageContentForURLs(messageInfo.body) + '</span>';
    		}
    
    	//  Check to See if this was an incoming or outgoing
    	if(messageInfo.inbox_outbox == 60)
    		{//you recieved this
    			var sendOrReceivedIconURL = 'receievedCallIcon';
    		}
    	else
    		{
    			var sendOrReceivedIconURL = 'sentCallIcon';
    		}
    
    	// if the body isn't already defined at this point, then it is a call
    	if(!body)
    		{
    			body = '<span class="' + sendOrReceivedIconURL + '"><img src="assets/' + whichPhoneIcon + '.png" alt="' + whichPhoneIcon + '" width="" height="" /></span>';
    		}
    	
    	
    	//IF message was part of a group, let's add the sender info
    	var optionalSenderInfo = '';
    	if((messageInfo.type=='21') || (messageInfo.type=='20'))
    		{
    			var senderPhoneNum = messageInfo.content_author;
    			var phone_num_clean = getSanitizedPhoneNumberRemoveHyphensParenthesisSpaces(senderPhoneNum, 'do_not_zeropad');
    			
    			if(messageInfo.inbox_outbox==60) //CRV only add sender's name if this is an incoming message
    				{
    					var senderName = genericGetContactNameFromCaches(phone_num_clean, senderPhoneNum);
    					optionalSenderInfo = ' - ' + senderName;
    				}
    			
    			
    			
    			
    			if (messageInfo.inbox_outbox==61)
    				{    //outbound
    				
    					//CRV add a check to see if the message has acked yet.  We must also check the source_client to ensure that the text was sent from teh web app and not the phone as texts sent from the phone have no ack_phone_sent value.
    					if(messageInfo.status_route == 2)
    						{
    							wasThisMessageSentFromTheWebApp = 'no ack yet';
    						}
    					
    					console.log(wasThisMessageSentFromTheWebApp);
    					if(wasThisMessageSentFromTheWebApp)
    						{
    							optionalSendFromWebAppImg = '<div id="'+ messageInfo.id +'" class="sentMessageStatus" data-toggle="tooltip" data-original-title="Waiting for phone to send message" data-trigger="hover" data-placement="bottom"><img src="assets/red-clock-waiting.png" alt="sending" width="15" height="15" /></div>';
    							var nowDateTime=new Date();
    							messageTimeStamp = '<span class="timestamp-msg">' + currentMomentDate + '</span>';
    						}
    				}
    			
    		}
    	
    	
    	
    	// IF MESSAGE WAS SCHEDULED THIS LOGIC WILL MAKE SURE WE CORRECTLY DISPLAY THE MESSAGE IN IT'S CURRENT STATE (PENDING, SENT, CANCELLED, ETC...)
    	var scheduledClass = '';
    	if(messageInfo.event_id && (messageInfo.event_id != 0))
    		{
    			eventHistoryIcon = '<i id="eventHistory_' + messageInfo.event_id + '" class="icon-calendar eventHistoryIconInThread moreInfoStatus" data-eventid="' + messageInfo.event_id + '"></i>';
    			scheduledClass = 'scheduledMessage';
    			var scheduledTSMessage = 'Scheduled for: ';
    			if(messageInfo.status_route == 10)
    				{
    					scheduledTSMessage = '';
    					scheduledClass = 'scheduledMessageSENT'; //CRV if this was a scheduled message, but it's already been sent, don't show it in the pending state. 
    				}
    			else
    				{
    					var eventJSON = jQuery.parseJSON(messageInfo.event_list); 
    					
    					var eventInfo;
    					if(eventJSON.eventlist_details)
    						{
    							eventInfo = eventJSON.eventlist_details;
    						}
    					else
    						{
    							eventInfo = eventJSON;
    						}
    					console.log('event_list:');
    					console.log(eventInfo);
    					//messageTimeStamp = '<span class="timestamp-msg">Scheduled for: ' + cleanTimeDisplayPurposes(eventInfo.ts_event_trigger,false) + '</span>';
    				
    				
    				
    				
    					if(eventInfo.status == 705) //CRV event was cancelled
    				   	{
    					   	scheduledClass = 'scheduledMessageCancelled';
    					   	messageTimeStamp = '<span class="timestamp-msg">Cancelled</span>';
    					   	optionalSendFromWebAppImg = '';
    					   	//$('#sms-line-item-msgid-' + messageID).removeClass('scheduledMessage').addClass('scheduledMessageCancelled');
    					   	//$('#sms-line-item-msgid-' + messageID).children('.itemActions').children('.timestamp-msg').empty().text('Cancelled');
    					   	//$('#sms-line-item-msgid-' + messageID).children('.sentMessageStatus').remove();
    					   	//$('#sms-line-item-msgid-' + messageID).children('.cancelEventInMessage').tooltip('destroy');
    					   	//$('#sms-line-item-msgid-' + messageID).children('.cancelEventInMessage').remove();
    				   	}
    				   	else if(eventInfo.status == 799) //CRV event was cancelled
    				   	{
    					   	scheduledClass = 'scheduledMessageFailed';
    					   	messageTimeStamp = '<span class="timestamp-msg">Message Send Failed</span>';
    					   	optionalSendFromWebAppImg = '';
    					   	//$('#sms-line-item-msgid-' + messageID).removeClass('scheduledMessage').addClass('scheduledMessageCancelled');
    					   	//$('#sms-line-item-msgid-' + messageID).children('.itemActions').children('.timestamp-msg').empty().text('Cancelled');
    					   	//$('#sms-line-item-msgid-' + messageID).children('.sentMessageStatus').remove();
    					   	//$('#sms-line-item-msgid-' + messageID).children('.cancelEventInMessage').tooltip('destroy');
    					   	//$('#sms-line-item-msgid-' + messageID).children('.cancelEventInMessage').remove();
    				   	}
    				   	
    				   	else
    				   		{
    					   		cancelEventOptional = '<i class="icon-remove cancelEventInMessage" onclick="cancelEvent(\'' + eventInfo.event_id + '\')"></i>'
    					   		
    					   		
    					   		/*
    //CRV add cancel event icon only if it doesn't already exist
    					   		if($('#sms-line-item-msgid-' + messageID).children('.cancelEventInMessage').length < 1)
    					   			{
    						   			var cancelEventTTOptions = {
    										trigger: 'hover',
    										title: 'Cancel Event',
    										placement: 'bottom',
    										delay: { show: 200, hide: 100 }
    									};
    							   	
    							   		$('#sms-line-item-msgid-' + messageID).children('.sentMessageStatus').after('<i class="icon-remove cancelEventInMessage" onclick="cancelEventFromMessage(\'' + eventID + '\')"></i>');
    							   		$('#sms-line-item-msgid-' + messageID).children('.cancelEventInMessage').tooltip(cancelEventTTOptions);
    					   			}	
    */		
    							
    				   		}
    				
    				
    				
    				
    				
    				
    				
    					//changeScheduledMessageStateIfInDom(messageID, reply_server.eventlist_details.status, eventID);
    					
    					//setScheduledEventTS(messageInfo.event_id, messageInfo.id, scheduledTSMessage);
    				}
    			
    		}
    
    	var twitterLink = '<a id="tweet-this-message" href="https://twitter.com/share" data-text="I\'m texting (SMS) from my computer, sync\'d with my phone & current #, with @mightytext http://goo.gl/pll9L" data-url="mightytext.net" data-via="" class="twitter-share-button" data-hashtags="android" data-lang="en" data-size="small" data-count="none">Tweet</a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>'
    
    	twitterLink=''; //Maneesh suppressed it for now (as of Feb 5 2013)
    
    
    //	console.log('message body');
    //	console.log(body);
    //	console.log(decodeURIComponent(body));
    
    	var htmlToAdd = '<div id="sms-line-item-msgid-'+messageInfo.id+'" class="threadItem ' + threadItemType + ' ' + scheduledClass + '" name="' + messageInfo.id + '">' + threadItemCheckBox + optionalSendFromWebAppImg + cancelEventOptional + eventHistoryIcon + body + optionalSenderInfo + '<div class="itemActions">' + forwardLink + starIcon + '<a id="DELETE-MESSAGE-' + messageInfo.id + '" onclick="processDeleteSingleMessage(\'' + messageInfo.id + '\',\'' + messageInfo.phone_num_clean + '\',\'' + messageInfo.type + '\');"><div class="deleteOneMessage deleteOneMessageIcon messageAction"></div></a>' + downloadMMSButton  + twitterLink + messageTimeStamp + '</div></div>';
    
    	return(htmlToAdd);
    }


    function getImageUploadCode(whichMMSCanvasAreaTarget) {
        //$.blockUI({ message: '' });
        var urlMighty = baseUrl + '/imageupload';
        $.ajax({
            type: "GET",
            url: urlMighty,
            dataType: "text",
            timeout: 5000,
            /*             jsonpCallback: "getimageuploadcode", */
            success: function(resp, textStatus, jqXHR) {
                console.log(resp); /*                 loadXdmDynamicallyThenCallAjaxFileUpload(resp); //send the URL that we were given */
                ajaxFileUpload(resp); //because I include both easyXDM.min.js and json2.js in manifest to be loaded at the end of the dom load, then I will just bypass the line above and call ajaxfileupload right away here.
                //$.unblockUI();
                invokeMMSDialogBox(whichMMSCanvasAreaTarget, resp);
            },
            error: function(jqXHR, textStatus, errorThrown) { /*                 _gaq.push(["_trackEvent", "WebApp", "AjaxError", "getImageUpload-" + errorThrown, 1]); */
                alert('Error in getting File Upload URL: ' + errorThrown);
                //$.unblockUI();
            }
        });
        return false;
    }

    function invokeMMSDialogBox(whichMMSCanvasAreaTarget, dynamic_url_for_file_upload) {
        //domObjectOfAttachmentButtonClick -- so we know where to pass the MMS blob stuff back into (which thread)
        refreshMMSDialogBox(whichMMSCanvasAreaTarget, dynamic_url_for_file_upload);
        $('#mms-upload-dialog').modal({
            keyboard: true
        });
        $('#mms-upload-dialog').on('shown', function() {
            $('#mms-dialog-button-ok').hide();
            $('#mms-dialog-button-ok').attr('disabled', true);
            $('#mms-dialog-button-ok').css('color', '#BFBFBF');
            $('#mms-dialog-button-ok').removeClass('hover');
        });
        //CRV if one of the side navigation icons is clicked, we must dismiss the modal
/*
        $('#sideNavigation').click(function() {
            //CRV dismissing the modal wasn't working via the modal.('hide') method.  Therefore I just trigger a click on the modal background in order to dismiss it.
            $('.modal-backdrop').click();
        })
*/
    }

    function refreshMMSDialogBox(whichMMSCanvasAreaTarget, dynamic_url_for_file_upload) {
        //domObjectOfAttachmentButtonClick -- so we know where to pass the MMS blob stuff back into (which thread)
        $('#mms-upload-dialog').empty();
        var buildMMSDOM = '';
        //DC Added close icon instead of "x"
        buildMMSDOM += '<div class="modal-header mightyClearfix"><h3 id="myModalLabel">Attach a Picture (MMS)</h3></div>'; //MA added BOOTSTRAP Modal
        /* buildMMSDOM += '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">X</button><h3 id="myModalLabel">Attach a Picture (MMS)</h3></div>'; */
        //MA added BOOTSTRAP Modal
        buildMMSDOM += '<form id="frmUpload" method="POST" target="upload_target" enctype="multipart/form-data"> <input id="MAX_FILE_SIZE" name="MAX_FILE_SIZE" value="104" type="hidden" /><input id="mms-file-attach" type="file" name="myFile"/><input type="submit" id="btnSubmit" style="display:none" value="Upload file"/></form>'; /* buildMMSDOM += '<form id="frmUpload" style="font-size:20px" method="POST" target="upload_target" enctype="multipart/form-data"> <input id="MAX_FILE_SIZE" name="MAX_FILE_SIZE" value="104" type="hidden" /><input id="mms-file-attach" type="file" name="myFile" onchange="autoSubmitUploadButtonMMSFile();"/><input type="submit" id="btnSubmit" style="display:none" value="Upload file"/></form>'; */
        //DC Added class masterSpinner to control spinner with each theme
        buildMMSDOM += '<div id="file-upload-progress-indicator" style="display:none;" class="loadingMessages masterSpinner"></div>'; /* buildMMSDOM += '<br><img id="file-upload-progress-indicator" style="display:none;margin-left:35px;margin-bottom:20px;" src="assets/green_spinner.gif">'; */
        buildMMSDOM += '<div id="mms-upload-image-preview-pane">'; /* buildMMSDOM += '<div id="mms-upload-image-preview-pane" style="max-height:200px;padding:20px;display:inline-block">'; */
        buildMMSDOM += '<img id="file-just-uploaded" style="display:none;" src="">';
        buildMMSDOM += '<span id="file-uploaded-temp-blobid-holder-in-dialog" style="display:none"></span>';
        buildMMSDOM += '</div>';
/*
buildMMSDOM += '<img id="file-just-uploaded" style="display:none;vertical-align:middle;float:left;margin-top:10px;max-height:inherit" src="">';
buildMMSDOM += '<span id="file-uploaded-temp-blobid-holder-in-dialog" style="display:none"></span>';
buildMMSDOM += '</div>';
*/
        //closes div mms-upload-image-preview-pane
        //DC Added class "btn" to "use this picture"
        buildMMSDOM += '<div class="modal-footer"> <button class="btn cancel" data-dismiss="modal" aria-hidden="true">Cancel</button><button id="mms-dialog-button-ok" class="mightyButton btn">Use this picture</button></div>'; /* buildMMSDOM +='<div class="modal-footer"> <button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button><button id="mms-dialog-button-ok" class="mightyButton">Use this picture</button></div>'; */
/*
        console.log("------------------from inside refreshMMSDialogBox-----------------------");
        console.log(buildMMSDOM);
*/
        $('#mms-upload-dialog').html(buildMMSDOM);
        //MA added dec 11:
        $('#mms-dialog-button-ok').click(function() {
            //whichMMSCanvasAreaTarget is CRITICAL - it will tell us which MMS canvas area to push MMS content back to (in the case of PowerView)
            console.log(whichMMSCanvasAreaTarget);
            yytest = whichMMSCanvasAreaTarget;
            $(whichMMSCanvasAreaTarget).children('#mms-blob-id-holder').text($('#file-uploaded-temp-blobid-holder-in-dialog').text()); //move just uploaded Blob ID from dialog span to span in main page for preparing to send.
            var image_url_preview_from_mms_dialog_popup = $('#file-just-uploaded').attr("src");
            $(whichMMSCanvasAreaTarget).find('#mms-image-preview').show(); //we use FIND because it's a couple levels down
            $(whichMMSCanvasAreaTarget).find('#mms-image-preview').attr("src", image_url_preview_from_mms_dialog_popup);
            //var objRelevantTextMessageBox = $('#holder-mms-image-preview').parent().parent().parent().find('.textResponse');
            var objRelevantTextMessageBox = $(whichMMSCanvasAreaTarget).siblings('.textResponse');
            console.log(objRelevantTextMessageBox);
            //yytest = objRelevantTextMessageBox;
            var heightOfRelevantTextMessageBox = objRelevantTextMessageBox.height();
            var widthOfRelevantTextMessageBox = objRelevantTextMessageBox.width();
            $(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').show();
            //DC Comented out bottom two commands and set max height in style sheet
/*
		$(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').css("max-height",heightOfRelevantTextMessageBox);
		$(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').css("max-width",0.2 * widthOfRelevantTextMessageBox);
*/
/*
		$(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').css("max-height",heightOfRelevantTextMessageBox);
		$(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').css("max-width",0.2 * widthOfRelevantTextMessageBox);
*/
            //reduce width of text message entry box by 20%
            objRelevantTextMessageBox.width(0.8 * widthOfRelevantTextMessageBox);
            $(whichMMSCanvasAreaTarget).find('div#upload-image-mms').hide(); //remove attach paperclip icon for this box now that we have set an image
            //$( this ).dialog( "close" );
            $(whichMMSCanvasAreaTarget).find("a#fancyimagepopup-MMS").attr("href", image_url_preview_from_mms_dialog_popup);
            $(whichMMSCanvasAreaTarget).find("a#fancyimagepopup-MMS").fancybox({
                'type': 'image',
                'transitionIn': 'elastic',
                'transitionOut': 'elastic'
            });
            $('#mms-upload-dialog').modal('hide');
        });
        //KL ADDED CODE HERE
        $("#mms-file-attach").on("change", function() { /*             alert("input type \"file\" changed!"); */
            autoSubmitUploadButtonMMSFile();
        });
/*
        $("#btnSubmit").on("click",function(){
            autoSubmitUploadButtonMMSFile();
        });
*/
/* CANCEL BUTTON INSTRUCTION HERE:

					{
						text:"Cancel",
						id: "mms-dialog-button-cancel",
						click:function() {
						$('#mms-upload-dialog').empty();
						$('#mms-blob-id-holder').text(""); //in case user uploaded file, we want to remove reference to blobID in DOM.

						$(this).dialog( "close" );
						}
					}


*/
    }
    var yytest;

    function ajaxFileUpload(dynamic_url_for_file_upload) {
        //  KL WILL COMMENT THE CODE BELOW OUT IN ORDER TO TEST A CROSS DOMAIN AJAX CALL WHICH SHOULD WORK BECAUSE THIS IS A CRX
        var btn;
        //alert('here in ajaxFileUpload');
        var remote_helper_html_page = "/itest2.htm"; //MA added -- this is on the GAE server
        var REMOTEDOMAIN = baseUrl;
        //alert(REMOTEDOMAIN);
        var remote = new easyXDM.Rpc({
            remote: REMOTEDOMAIN + remote_helper_html_page,
            swf: REMOTEDOMAIN + "/../easyxdm.swf",
            onReady: function() {
                //display the upload form
                var mms_upload_div = document.getElementById("mms-upload-dialog");
                var frm = document.getElementById("frmUpload");
                frm.action = dynamic_url_for_file_upload;
                frm.style.display = "block";
                mms_upload_div.style.display = "block";
                btn = document.getElementById("btnSubmit");
                frm.onsubmit = function() {
                    btn.disabled = "disabled";
                    $('#file-upload-progress-indicator').show();
                };
            }
        }, {
            local: {
                returnUploadResponse: function(response) {
                    // here you should call back into your regular workflow
                    btn.disabled = null;
                    if (response.status != "success") alert("Error uploading attachment.");
                    else {
                        //alert(response.blobID);
                        console.log(response); /*                         alert("success of local file upload"); */
                        $('#mms-dialog-button-ok').attr('disabled', false);
                        $('#mms-dialog-button-ok').show();
                        $('#mms-dialog-button-ok').css('color', 'white').css('margin-left', '10px');
                        $('#file-upload-progress-indicator').hide();
                        $('#file-just-uploaded').attr("src", baseUrl + "/imageserve?function=viewFile&blob-key=" + response.blobID);
                        $('#file-just-uploaded').show();
                        $('#file-uploaded-temp-blobid-holder-in-dialog').text(response.blobID); // store in dialog first. if user clicks OK, then store it in DOM next to MMS send button
                    }
                    //alert(response.msg);
                    //alert(response.blobID);
                }
            }
        });
/*
        var mms_upload_div = document.getElementById("mms-upload-dialog");
        var frm = $(document).find("#frmUpload")
        console.log(frm);
        frm.action = dynamic_url_for_file_upload;
        $(frm).attr("action", dynamic_url_for_file_upload);
        $(frm).css("display", "block");
        $(mms_upload_div).css("display", "block");
        btn = document.getElementById("btnSubmit");
        $(frm).on("submit", function(){
            $(btn).attr("disabled", "disabled");
            $('#file-upload-progress-indicator').show();
        });
*/
    };

    function autoSubmitUploadButtonMMSFile() {
        //alert($('#mms-file-attach')[0].files[0].size);
        if ((typeof FileReader !== "undefined") && ($('#mms-file-attach')[0].files[0].size > 2097152)) //can only do in HTML5, hence FileReader check
        alert('File too large. File upload limit is 2MB');
        else { /*             alert("about to submit form"); */
            $('#frmUpload').submit();
        }
    };
    //END of MMS CODE

    function checkMessageContentForURLs(messageContent) {
        var s = messageContent;
        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        textMessageContent = s.replace(exp, "<a href=\"$1\" target=\"_blank\">$1</a>");
        textMessageContent = textMessageContent.replace(/(^|\s)@(\w+)/g, "$1@<a href=\"http://www.twitter.com/$2\" target=\"_blank\">$2</a>");
        return textMessageContent;
    };

    function star_click(this_anchor) {
        //alert(msg_id_to_star);
        //alert($(this_anchor).attr("id"));
        $(this_anchor).tooltip('destroy');
        var msgid_star_update = $(this_anchor).data("message-id");
        // PREPENDED the <A id=> with STAR-, so get the message id after the prepend "STAR-"
        var urlMighty = baseUrl + '/api?function=updateMsgInfo';
        //urlMighty += '&id=' + encodeURIComponent(msgID);
        if ($(this_anchor).hasClass("starred")) {
            $(this_anchor).removeClass("starred");
            $(this_anchor).addClass("unstarred");
            //CRV moved these style changes to BEFORE the ajax call.  Now we change them back if the call has failed.
            $.ajax({
                type: "GET",
                url: urlMighty,
                dataType: "json",
                /*                 jsonpCallback: "make_unstarred", */
                data: {
                    id: msgid_star_update,
                    is_starred: 0
                },
                success: function(resp) {
                    //console.log(resp.updated);
                    if (resp.updated == false) {
                        //CRV if call is unsuccessful, revert the class changes.
                        $(this_anchor).removeClass("unstarred");
                        $(this_anchor).addClass("starred");
                        alert("Error - Message not Un-Favorited. Please report to MightyText team (Error Code: UNFAV7411)");
                        return;
                    }
                    //Once the request has succeed - change the icon.
                    $(this_anchor).find("img").attr("src", unstarredImgURL);
                }
            }).responseText;
        } else {
            $(this_anchor).removeClass("unstarred");
            $(this_anchor).addClass("starred");
            $.ajax({
                type: "GET",
                url: urlMighty,
                dataType: "json",
                /*                 jsonpCallback: "make_starred", */
                data: {
                    id: msgid_star_update,
                    is_starred: 1
                },
                success: function(resp) {
                    //console.log(resp.updated);
                    if (resp.updated == false) {
                        //CRV if the call has failed - revert the classes
                        $(this_anchor).removeClass("starred");
                        $(this_anchor).addClass("unstarred");
                        alert("Error - Message not Favorited. Please report to MightyText team (Error Code: FAV3985)");
                        return;
                    }
                    // CRV upon call success - change the image
                    $(this_anchor).find("img").attr("src", starredImgURL);
                }
            }).responseText;
        }
        $(".starred").tooltip({
            trigger: "hover",
            title: "Un-Favorite",
            placement: "bottom",
            delay: {
                show: 150,
                hide: 100
            }
        });
        $(".unstarred").tooltip({
            trigger: "hover",
            title: "Favorite",
            placement: "bottom",
            delay: {
                show: 150,
                hide: 100
            }
        });
    }

    function deleteSingleMessage(msg, msgID, clean_phone_num, msgType, composerWindow) {
        var urlMighty = baseUrl + '/api?function=deleteMessagesByMsgID';
        urlMighty += '&id=' + encodeURIComponent(msgID); /*         var dom_item_to_remove_from_thread = '#sms-line-item-msgid-' + msgID; */
        var bodyContent = $.ajax({
            url: urlMighty,
            global: false,
            type: "POST",
            dataType: "json",
            /*             jsonpCallback: "deleteOneMsg", */
            success: function(json_data) {
                console.log(json_data);
                console.log("-------------NUM DELETED------------");
                console.log(json_data.num_deleted);
                if (json_data.num_deleted != 1) {
                    alert("Error - Message not Deleted. Please report to MightyText team (Error Code: DT56)");
                    return;
                }
                //Get the the number of messages in the thread BEFORE the message was deleted
                var string_span_build_update_thread_count = $(composerWindow).find("#conversationHolder").data("message-count");
                if (string_span_build_update_thread_count == 1) {
                    //removeThreadFromThreadList(clean_phone_num);
                    $(composerWindow).remove();
                } else {
                    //decrement thread count in threadlist
                    if ((msgType == 10) || (msgType == 11)) //only change thread counter on left nav if it's an MMS or SMS getting deleted
                    {
                        string_span_build_update_thread_count = string_span_build_update_thread_count - 1;
                        $(composerWindow).find("#conversationHolder").data("message-count", string_span_build_update_thread_count);
                    }
                }
                console.log('single messsage Deleted');
/*
                if (threadDisplayModeGlobal == 'MEDIA') {
                    dom_item_to_remove_from_thread = '#media_item_' + msgID;
                }
*/
                $(msg).fadeOut(600, function() {
                    $(this).remove();
                });
            },
            error: function() {
                console.error("ERROR IN DELETE SINGLE MESSAGE");
            }
        }).responseText;
    }

    function forwardTheMessage(messageType, messageID, optionalContent) {
        console.log("--------------inside of forwardTheMessage-------------");
        console.log(messageType);
        
        var arrayOfComposeWindows = new Array();
        var messageContent = '';
        var cleanOptionalContent = createHTMLEquivalentOfMessageBody(optionalContent);
        
        $('.composeButton').trigger("click"); //Open New Message window first.
        $(".composeInnerContainer.composeNew").each(function() {
            arrayOfComposeWindows.push(this);
        });
        
        var currentMessageTextArea = $(arrayOfComposeWindows[0]).find(".messageToSend");
        var currentComposeHeader = $(arrayOfComposeWindows[0]).find(".title");
        
        console.log(cleanOptionalContent);

        if (messageType == 'share') {
            messageContent = cleanOptionalContent;
        } else if ((messageType == 10) || (messageType == 20)) {
            console.log("here");
            //10 = sms
            messageContent = 'Fwd: ' + cleanOptionalContent;
            //messageContent = removeAnchorTags(messageContent);
        } else if ((messageType == 70) || (messageType == 11) || (messageType == 21)) {
            //70 = mms
            messageContent = 'Fwd: ' + cleanOptionalContent;
            var srcMMS = $('#message-id-' + messageID).children('#mms-scale-down').children('#fancyimagepopup').attr('href');
            console.log(srcMMS);
            var blobID = $('#message-id-' + messageID).children('#mms-scale-down').children('#fancyimagepopup').attr('data-blobkey');
            console.log(blobID);
            var whichCanvasAreaTarget = $(arrayOfComposeWindows[0]).find(".sendMMS");
            console.log(whichCanvasAreaTarget[0]);
            sendMediaAsMMS(whichCanvasAreaTarget, blobID, srcMMS); /* 				return(false); */
        } else if (messageType == 80) {
            //80 = incoming call
            var contactName = $('#sms-line-item-msgid-' + messageID).parent().siblings('.contentPanelHeader').children('.contentPanelHeaderText').text();
            var timeStamp = $('#sms-line-item-msgid-' + messageID).children('.itemActions').children('.timestamp-msg').text();
            messageContent = 'Fwd: Incoming Call from ' + contactName + ' at ' + timeStamp;
        } else if (messageType == 81) {
            //81 = missed call
            var contactName = $('#sms-line-item-msgid-' + messageID).parent().siblings('.contentPanelHeader').children('.contentPanelHeaderText').text();
            var timeStamp = $('#sms-line-item-msgid-' + messageID).children('.itemActions').children('.timestamp-msg').text();
            messageContent = 'Fwd: Missed Call from ' + contactName + ' at ' + timeStamp;
        } else if (messageType == 83) {
            //83 = outgoing call
            var contactName = $('#sms-line-item-msgid-' + messageID).parent().siblings('.contentPanelHeader').children('.contentPanelHeaderText').text();
            var timeStamp = $('#sms-line-item-msgid-' + messageID).children('.itemActions').children('.timestamp-msg').text();
            messageContent = 'Fwd: Outgoing Call to ' + contactName + ' at ' + timeStamp;
        } else {
            return (false);
        }

        $(currentComposeHeader).text('Forward Message');
        $(currentMessageTextArea).val(messageContent);
        
    }

    function sendMediaAsMMS(whichMMSCanvasAreaTarget, MediaBlobID, MediaSrc, media_type) { /* 		_gaq.push(["_trackEvent","WebApp","Fwd-Photo-As-MMS",media_type]); */
        //whichMMSCanvasAreaTarget is CRITICAL - it will tell us which MMS canvas area to push MMS content back to (in the case of PowerView)
        console.log(whichMMSCanvasAreaTarget);
        //yytest=whichMMSCanvasAreaTarget;
        $(whichMMSCanvasAreaTarget).children('#mms-blob-id-holder').text(MediaBlobID); //move just uploaded Blob ID from dialog span to span in main page for preparing to send.	
        //var image_url_preview_from_mms_dialog_popup = $('#file-just-uploaded').attr("src");
        var image_url_preview_from_mms_dialog_popup = MediaSrc;
        $(whichMMSCanvasAreaTarget).find('#mms-image-preview').show(); //we use FIND because it's a couple levels down 
        $(whichMMSCanvasAreaTarget).find('#mms-image-preview').attr("src", image_url_preview_from_mms_dialog_popup);
        //var objRelevantTextMessageBox = $('#holder-mms-image-preview').parent().parent().parent().find('.textResponse');
        var objRelevantTextMessageBox = $(whichMMSCanvasAreaTarget).siblings('.textResponse');
        console.log(objRelevantTextMessageBox);
        //yytest = objRelevantTextMessageBox;
        var heightOfRelevantTextMessageBox = objRelevantTextMessageBox.height();
        var widthOfRelevantTextMessageBox = objRelevantTextMessageBox.width();
        $(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').show();
/*
		$(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').css("max-height",heightOfRelevantTextMessageBox);
		$(whichMMSCanvasAreaTarget).find('#holder-mms-image-preview').css("max-width",0.2 * widthOfRelevantTextMessageBox); 
*/
        //reduce width of text message entry box by 20%
        objRelevantTextMessageBox.width(0.8 * widthOfRelevantTextMessageBox);
        $(whichMMSCanvasAreaTarget).find('div#upload-image-mms').hide(); //remove attach paperclip icon for this box now that we have set an image
        //$( this ).dialog( "close" );
        $(whichMMSCanvasAreaTarget).find("a#fancyimagepopup-MMS").attr("href", image_url_preview_from_mms_dialog_popup);
/*
        $(whichMMSCanvasAreaTarget).find("a#fancyimagepopup-MMS").fancybox({
			'type'	: 'image',
			'transitionIn'	: 'elastic',
			'transitionOut'	: 'elastic'			
		});
*/
        //$('#mms-upload-dialog').modal('hide'); 
    }

    function addItemActionsEventHandlers(textMessage, thisWindow, downloadingMMS) {
        var unstarredButton = $(textMessage).find(".unstarred");
        var forwardButton = $(textMessage).find("#forwardMessage");
        var starredButton = $(textMessage).find(".starred");
        var deleteButton = $(textMessage).find("#deleteMessage");
        var itemActions = $(textMessage).find(".itemActions");
        var textBody = $(textMessage).find(".textContent").text();
        $(itemActions).on({
            mouseover: function() { /*                 $(this).children("#starMessage").css('visibility','visible'); */
                $(this).children(".unstarred").css('visibility', 'visible');
                $(this).children("#forwardMessage").css('visibility', 'visible');
                $(this).children("#deleteMessage").css('visibility', 'visible');
            },
            mouseout: function() { /*                 $(this).children("#starMessage").css('visibility','hidden'); */
                $(this).children(".unstarred").css('visibility', 'hidden');
                $(this).children("#forwardMessage").css('visibility', 'hidden');
                $(this).children("#deleteMessage").css('visibility', 'hidden');
            }
        });
        $(unstarredButton).on("click", function() {
            console.log("star clicked");
            star_click(this);
        }).tooltip({
            trigger: "hover",
            title: "Favorite",
            placement: "bottom",
            delay: {
                show: 150,
                hide: 100
            }
        });
        $(starredButton).on("click", function() {
            console.log("un-star clicked");
            star_click(this);
        }).tooltip({
            trigger: "hover",
            title: "Un-Favorite",
            placement: "bottom",
            delay: {
                show: 150,
                hide: 100
            }
        });
        $(forwardButton).on("click", function() {
            console.log("forward clicked");
            if (!downloadingMMS) {
                //WHEN DOWNLOADING AN MMS FOR THE FIRST TIME THE MESSAGE CONTENT THAT WILL BE PASSED TO THE FORWARD MESSAGE FUNCTION IS INCORRECT.  IT IS THE DEFAULT "INCOMING MMS BLAH BLAH BLAH..." SO I RESET THIS AGAIN WHEN THE IMAGE DOWNLOADS. 
                forwardTheMessage($(this).data("message-type"), $(this).data("message-id"), textBody);
            }
        }).tooltip({
            trigger: "hover",
            title: "Forward",
            placement: "bottom",
            delay: {
                show: 150,
                hide: 100
            }
        });
        $(deleteButton).on("click", function() {
            console.log("delete clicked");
            deleteSingleMessage(textMessage, $(this).data("message-id"), $(this).data("clean-num"), $(this).data("message-type"), thisWindow)
        }).tooltip({
            trigger: "hover",
            title: "Delete",
            placement: "bottom",
            delay: {
                show: 150,
                hide: 100
            }
        });
    }
    
            
    function addTooltipToComposeHeader(composeHeader){
        var tooltipContent = $(composeHeader).text();
        $(composeHeader).tooltip({
            trigger: "hover",
            title: tooltipContent,
            placement: "top",
            delay: {
                show: 150,
                hide: 100
            }
        });

    }; 
    
    function addToolTipToSentConfirmationIcon(sentConfirmationContainer, stateOfConfirmation){
        var tooltipTarget = $(sentConfirmationContainer).find("#sentConfirmation");
        var tooltipOptions = '';
        if(stateOfConfirmation == "pending"){
            tooltipOptions = {
                trigger: "hover",
                title: "Waiting for Phone to Send Message",
                placement: "bottom",
                delay: {
                    show: 150,
                    hide: 100
                }
            }
        } else if (stateOfConfirmation == "confirmed"){
            tooltipOptions = {
                trigger: "hover",
                title: "Phone Sent Message",
                placement: "bottom",
                delay: {
                    show: 150,
                    hide: 100
                }
            }
            $(tooltipTarget).tooltip('destroy');
        } else {
            console.error("Error in addToolTipToSentConfirmation();");
        }

        $(tooltipTarget).tooltip(tooltipOptions);
    }
    
    function addTooltipsToGroupMMSButtons(groupMMSButtonContainer){
        var groupMMSSelected = $(groupMMSButtonContainer).hasClass("sendAsGroup");

        if(groupMMSSelected){
            tooltipOptions = {
                trigger: "hover",
                title: "Send As Group",
                placement: "top",
                delay: {
                    show: 150,
                    hide: 100
                }
            }
            $(groupMMSButtonContainer).tooltip('destroy');
        } else {
            tooltipOptions = {
                trigger: "hover",
                title: "Send Individually",
                placement: "top",
                delay: {
                    show: 150,
                    hide: 100
                }
            }
            $(groupMMSButtonContainer).tooltip('destroy');
        } 

        $(groupMMSButtonContainer).tooltip(tooltipOptions);

    };

    function updateBatteryStatusDisplay(batt_level, batt_charging_icon, timeStamp, unixTimeStamp, tourBatStat) {
        var newGmailUICheck = $(document).find("#gbzw");
        var batt_level_display = Math.round(batt_level); /* 	console.log('updating battery Status'); */
        var insertedBatStat = '';
        var regularBatStat = '<div class="baticon"><img src="' + phoneImgURL + '"></div><div class="gTextBattery"><div class="batwrap"><div class="batshell"><div class="batbar" style="width:' + batt_level + '%"></div></div><div class="batnub"></div></div><div class="batpercent">' + batt_level_display + '%</div></div>' + batt_charging_icon;
        
        if(tourBatStat == "insert dummy stat"){
            insertedBatStat = dummyBatStat;
            $(".newbatterywrap").attr("data-intro", "Keep an eye on your mobile battery level up here. <br></br> (This is battery percentage is just for show)");
        } else {
            insertedBatStat = regularBatStat;
        }
/*         console.log(insertedBatStat); */
        $('.newbatterywrap').empty().hide().append(insertedBatStat).show().fadeIn('slow', function() {
        
            var gTextBattery = $(this).find("div.gTextBattery");
            var navBarHeight = $("div#gbz").height();
            var batStatHeight = $(".newbatterywrap").height();
            var smartTopMargin = String((navBarHeight - batStatHeight)/2)+"px";
            var battStatusTTOptions = {
                trigger: 'hover',
                title: '<img style="position:relative;top:4px;height:16px;width:16px;" src="' + logoImgURL + '"/>&nbsp;&nbsp;(As of ' + timeStamp + ')',
                html: true,
                placement: 'bottom',
                delay: {
                    show: 300,
                    hide: 100
                }
            }
            
            if(newGmailUICheck.length > 0) {//only mess with margin top if it is the old ui.
                $(".newbatterywrap").css("margin-top", smartTopMargin); 
            }
            
            $(this).tooltip('destroy').tooltip(battStatusTTOptions);
            
            if (batt_level >= 100) {
                $('.batbar').css('background-color', '#67b422');
                $('.batnub').css('background-color', '#67b422');
            } else if (batt_level >= 60) {
                $('.batbar').css('background-color', '#67b422');
            } else if (batt_level >= 20 && batt_level <= 59) {
                $('.batbar').css('background-color', '#ffe400');
                $('.batpercent').addClass('legible');
            } else if (batt_level <= 19) {
                $('.batbar').css('background-color', '#f02828');
            }
            
            
            $(this).attr("id", unixTimeStamp);
            
        });
    };

    function checkIfUserHasCurrentAPK(userAPKVersion) {
        //alert('checkIfUserHasCurrentAPK');
        //CRV build in a 0.05 buffer to the current version # so that the user is only alerted if they are two or more versions behind. 
        var androidAPKVersionToTestFor = currentAndroidAppVersion - 0.05;
        //alert(androidAPKVersionToTestFor);
        if (userAPKVersion < androidAPKVersionToTestFor) {
            //CRV implemented logic to make sure that the user is only alerted 20% of the time to update their current version
            var randomChance = Math.floor(Math.random() * 5) + 1;
            console.log(randomChance);
            if (randomChance == 3) { /* 						var alertText = 'It looks like you are running an older version of MightyText on your phone (' + userAPKVersion + ').  Please <a href="https://play.google.com/store/apps/details?id=com.texty.sms&feature=nav_result#?t=W251bGwsMSwxLDMsImNvbS50ZXh0eS5zbXMiXQ.." target="_blank">upgrade to the newest version (' + currentAndroidAppVersion + ') from Google Play</a>.'; */
                alert('It looks like you are running an older version of MightyText on your phone (' + userAPKVersion + ').  Please <a href="https://play.google.com/store/apps/details?id=com.texty.sms&feature=nav_result#?t=W251bGwsMSwxLDMsImNvbS50ZXh0eS5zbXMiXQ.." target="_blank">upgrade to the newest version (' + currentAndroidAppVersion + ') from Google Play</a>.'); /* 						displayAlertMessage(alertText, 'success', 10000); */
            }
        }
    }
    
    function tellBackgroundScriptToRunAllTabs(message){
        chrome.runtime.sendMessage({
            supportMultipleAccounts: message
        }, function(response) {
            console.log(response.confirmation);
        });
    }
        
    function getServerSettingsForNonMightyAccountTab(){
        chrome.runtime.sendMessage({
            getUserSettingsContent: true
        }, function(response) {
            console.log(response.confirmation);
        });
    }
    
    function isThisConversationAGroupMessage(phoneNum){
		//CRV check to see if this is a pipe delimited phone number.  If yes, then return true
		if( phoneNum && (phoneNum.indexOf('|') > -1))
			{
				return(true);
			}
		else
			{
				return(false);
			}
	}



    function tellBackGroundScriptInstructionsForCRXStart() {
        chrome.runtime.sendMessage({
            getChromeLocalSettings: true,
            currentURL: currentHost
        }, function(response) {
//            console.log(response.confirmation);
        });
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.chromeLocalSettings) {
                var chromeLocalSettingsJSONObj = request.chromeLocalSettings;
                var confirmationText
//                console.log("Got local settings from the background.");
                if (chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set local settings for first time.") {
                    chrome.storage.local.set({
                        'gmail_preference': JSON.stringify(1),
                        'ongoing_conversations': JSON.stringify(0),
                        'receive_notifications': JSON.stringify(1),
                        'multiple_accounts': JSON.stringify(0),
                        'displayMTLinks_texts': JSON.stringify(1),
                        'displayMTLinks_media': JSON.stringify(1),
                        'enable_logs': JSON.stringify(0)
                    }, function() {
                        console.log("local settings successfully saved for the first time");
                        //BACKGROUND KNOWS WHEN LOCAL SETTINGS ARE CHANGED/NEW SETTINGS ARE SET AND WILL GRAB THE LOCAL SETTINGS AGAIN, TRIGGERING THIS FUNCTION AGAIN.
                    });
                    confirmationText = "Set all settings for the first time in content script";
                } else if(chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set ongoing_conversations for first time."){
                    chrome.storage.local.set({
                        'ongoing_conversations': JSON.stringify(0)
                    }, function() {
                        console.log("local settings successfully updated");
                    });
                    confirmationText = "Set ongoing_conversations setting for the first time in content script";
                } else if(chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set receive_notifications for first time."){
                    chrome.storage.local.set({
                        'receive_notifications': JSON.stringify(1)
                    }, function() {
                        console.log("local settings successfully updated");
                    });
                    confirmationText = "Set receive_notifications setting for the first time in content script";
                } else if(chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set fb_preference for first time."){
                    chrome.storage.local.set({
                        'fb_preference': JSON.stringify(1)
                    }, function() {
                        console.log("local settings successfully updated");
                    });
                } else if(chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set multiple_accounts for first time."){
                    chrome.storage.local.set({
                        'multiple_accounts': JSON.stringify(0)
                    }, function() {
                        console.log("local settings successfully updated");
                    });
                    confirmationText = "Set multiple_accounts setting for the first time in content script";
                } else if(chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set enable_logs for first time."){
                    chrome.storage.local.set({
                        'enable_logs': JSON.stringify(0)
                    }, function() {
                        console.log("local settings successfully updated");
                    });
                    confirmationText = "Set enable_logs setting for the first time in content script";
                } else if(chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set displayMTLinks_texts for first time."){
                    chrome.storage.local.set({
                        'displayMTLinks_texts': JSON.stringify(1)
                    }, function() {
                        console.log("local settings successfully updated");
                    });
                    confirmationText = "Set enable_logs setting for the first time in content script";
                } else if(chromeLocalSettingsJSONObj.data && chromeLocalSettingsJSONObj.data == "need to set displayMTLinks_media for first time."){
                    chrome.storage.local.set({
                        'displayMTLinks_media': JSON.stringify(1)
                    }, function() {
                        console.log("local settings successfully updated");
                    });
                    confirmationText = "Set enable_logs setting for the first time in content script";
                } else {
//                    console.log("found all chrome local settings on this machine for Gtext. They are:");
//                    console.log(chromeLocalSettingsJSONObj);
                    
                    if(window.location.href.indexOf("mail.google.com") > -1){
                        if (chromeLocalSettingsJSONObj.gmail_preference === "1") {
                            console.log("gText enabled");
                            if (!toldBGScriptGmailIsEnabled) {
                                tellBackGroundScriptAppIsEnabled("Gmail");
                                toldBGScriptGmailIsEnabled = true;
                            } else {
                                console.log("Already talked to bg script about gmail enabled");
                            }
                        } else if (chromeLocalSettingsJSONObj.gmail_preference === "0") {
                            console.log("gText not enabled");
                        } else {
                            console.log("something went wrong. gText was neither enabled nor disabled");
                        }
                    } else if (window.location.href.indexOf("www.facebook.com") > -1){
                        if (chromeLocalSettingsJSONObj.fb_preference === "1") {
                            console.log("gText on facebook enabled");
                            if (!toldBGScriptGmailIsEnabled) {
                                tellBackGroundScriptAppIsEnabled("Facebook");
                                toldBGScriptGmailIsEnabled = true;
                            } else {
                                console.log("Already talked to bg script about gmail enabled");
                            }
                        } else if (chromeLocalSettingsJSONObj.fb_preference === "0") {
                            console.log("gText on facebook not enabled");
                        } else {
                            console.log("something went wrong. gText was neither enabled nor disabled in facebook");
                        }
                    }
                    
                    if (chromeLocalSettingsJSONObj.ongoing_conversations === "1") {
                        ongoingConversations = true;
                    } else if (chromeLocalSettingsJSONObj.ongoing_conversations === "0") {
                        ongoingConversations = false;
                    }
                    
                    if (chromeLocalSettingsJSONObj.receive_notifications === "1") {
                        createNotifsInGmail = true;
                    } else if (chromeLocalSettingsJSONObj.receive_notifications === "0") {
                        createNotifsInGmail = false;
                    }
                    //this setting should only have any effect on tabs where the user is not logged in with their MightyText linked Google Account.
                    if (chromeLocalSettingsJSONObj.multiple_accounts === "1") {
                        multipleAccountSupport = true;
                        if (!googleAccountMatch){
                            //sendMessage to bg telling it to run CRX on all tabs.
                            initializeApp("extraUserLoggedInEnabled", "Gmail", "location1");
                            //allow tab to receive CAPI's
                                                        
                            //get the server settings so that the composers reflect server settings
                            getServerSettingsForNonMightyAccountTab();
                            
                            if (!capiHubInitializeCheck) {
                                initializeCAPIMessageHub();
                            } else {
                                console.log("already initialized this hub. Don't want to receive duplicate notifications");
                            }
                            
                            tellBackgroundScriptToRunAllTabs("support");
                        } else {
                            //don't do anything on content scripts that already have the match.
                        }
                    } else if (chromeLocalSettingsJSONObj.multiple_accounts === "0") {
                        multipleAccountSupport = false;
                        if (!googleAccountMatch){
                            tellBackgroundScriptToRunAllTabs("don't support");
                        } else {
                            //don't do anything on content scripts that already have the match.
                        }
                    } 
                                        
                    if(chromeLocalSettingsJSONObj.enable_logs === "0"){
                        disableConsoleLogs(true);
                    } else if (chromeLocalSettingsJSONObj.enable_logs === "1"){
                        //enable console.logs
                        disableConsoleLogs(false);
                    }

                    if(chromeLocalSettingsJSONObj.displayMTLinks_texts === "0"){
                        displayTextsInGmailLeftNav = false;
                        $('[data-appview="classic"]').hide();
                    } else if (chromeLocalSettingsJSONObj.displayMTLinks_texts === "1"){
                        //enable console.logs
                        displayTextsInGmailLeftNav = true;
                        $('[data-appview="classic"]').show();
                    }

                    if(chromeLocalSettingsJSONObj.displayMTLinks_media === "0"){
/*                         var checkIfTextsLinkExists = ; */
                        displayPhotosVideosInGmailLeftNav = false;
                        $('[data-appview="media"]').hide();
                    } else if (chromeLocalSettingsJSONObj.displayMTLinks_media === "1"){
                        displayPhotosVideosInGmailLeftNav = true;
                        $('[data-appview="media"]').show();
                    }
                    
                    confirmationText = "Found all local settings in content script";
                }
                sendResponse({
                    confirmation: confirmationText
                });
            }
        });
    };

    function tellBackGroundScriptAppIsEnabled(currentLocation) {
        chrome.runtime.sendMessage({
            checkLoginStatusCS: true,
            currentURL: currentHost
        }, function(response) {
            console.log(response.confirmation);
        });
        
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.userHasNotAuthedGoogle) {
                initializeApp("noGoogleAuth", currentLocation);
                sendResponse({
                    confirmation: "confirmed that user is not logged in, because they have not linked mightytext with google."
                });
            } 
            
            else if (request.userIsLoggedIntoMightyText) {
                if(currentLocation == "Facebook"){
                    initializeApp("userLoggedIn", currentLocation, "location2");
                    
                    sendResponse({
                        confirmation: "gmail-user-matched"
                    });

                } else if (currentLocation == "Gmail"){
                    mightyTextAccount = request.mtAccount;
                    //Background script is telling the content script that the user is logged in.
                    
                    //we want to find the gmail account that the user is logged into. then match it with the MT logged in Google account later
                    //NOTE: this variable contains more than just the email -- it has some HTML stuff in it too, which is ok because we are 
                    // going to do a substring match.
                    
                    //the variable below is the first condition that should be checked.  We are looking at the dom, particularly this "div.msg" div that contains the current google account that the user is logged in as.
                    var googleAccountLoggedInToGmailFromDOM = $(document).find("div.msg").text();
                    //the variable below is a secondary condition that should be checked, in case we can not find the google account logged into in the DOM.  We are looking at the title of the page and seeing if the mtAccount can be found within that string.
                    var googleAccountLoggedInToGmailFromDOM2 = $("title").html();
    
                    console.log("is the user logged in?: " + request.userIsLoggedIntoMightyText);
                    callKMInBackgroundPage('User Logged In', {'CRX-New-Login':'true','Client':'CRX-New'});
                    //call KissMetrics
                    
                    
                    var responseBackToBackgroundString ='';
                    
                    //do a substring match of our MT email within the gmail account DOM
                                        
                    if((googleAccountLoggedInToGmailFromDOM.indexOf(request.mtAccount) > -1) || (googleAccountLoggedInToGmailFromDOM2.indexOf(request.mtAccount) > -1)){
                        googleAccountMatch = true;
                            initializeApp("userLoggedIn", currentLocation, "location3");
                        responseBackToBackgroundString = "gmail-user-matched";
                    } else {
                        googleAccountMatch = false;
                        console.log("user not logged into this gmail tab w/ their MightyText Account. Don't insert anything.");
                        responseBackToBackgroundString = "gmail-user-not-matched";
                        if(multipleAccountSupport){
                            initializeApp("userLoggedIn", currentLocation, "location4");
                            //allow tab to receive CAPI's
                            
                            //get the server settings so that the composers reflect server settings
                            getServerSettingsForNonMightyAccountTab();
                                                        
                            if (!capiHubInitializeCheck) {
                                initializeCAPIMessageHub();
                            } else {
                                console.log("already initialized this hub. Don't want to receive duplicate notifications");
                            }
                            tellBackgroundScriptToRunAllTabs("support");
                        } else {
                            initializeApp("extraUserLoggedIn", currentLocation);
                            tellBackgroundScriptToRunAllTabs("don't support");
                        }
                    }
                    
                    sendResponse({
                        confirmation: responseBackToBackgroundString
                    });
                    
                }

            
            
            }  else if (request.userIsLoggedIntoGoogleButNotRegistered) {
                console.log("is the user logged in?: " + request.userIsLoggedIntoGoogleButNotRegistered + " they should register for MightyText");
                callGAInBackgroundPage("CRX-Gmail", "Error_Device_Not_Registered", "");
                initializeApp("userNotRegistered", currentLocation);
                sendResponse({
                    confirmation: "confirmed that user is logged in."
                });
//NO LONGER SENDING THIS MESSAGE BECAUSE IT'S ALREADY CALLED EACH TIME A COMPOSER/NOTIF IS CREATED
/*
            } else if (request.typeAheadSource) {
                console.log("Got an array for typeahead.");
                autoContacts = request.typeAheadSource;
                sendResponse({
                    confirmation: "typeahead array received"
                });
*/
            } else if (request.CAPIOpened) {
                console.log("CAPI Opened");
                if (!capiHubInitializeCheck) {
                    initializeCAPIMessageHub();
                } else {
                    console.log("already initialized this hub. Don't want to receive duplicate notifications");
                }
                sendResponse({
                    confirmation: "acknowledged that CAPI has been opened"
                });
            } else if (request.gotUserSettings) {
                console.log("Got user settings from server");
                sendResponse({
                    confirmation: "User settings from server received in content script."
                });
                var settingsFromServer = request.userSettings;
                var enterToSendEnabled = settingsFromServer.enter_to_send;
                if (enterToSendEnabled == 1) {
                    enterToSend = true;
                } else if (enterToSendEnabled == 0) {
                    enterToSend = false;
                }
            } else if (request.phoneContacts){
                myContacts = request.phoneContacts;
                sendResponse({
                    confirmation: "got user phone contacts"
                })
            }
        });
    };

    function initializeCAPIMessageHub() {
        capiHubInitializeCheck = true
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            var gmailChatWindowContainers
            var composeWindowContainer
            
            if (currentHost.indexOf("mail.google.com") > -1){
                gmailChatWindowContainers = $(".dw").find(".nH.nn");
                composeWindowContainer = $(gmailChatWindowContainers[0]).parent();
            } else if (currentHost.indexOf("facebook.com") > -1){
                gmailChatWindowContainers = $(document).find("div.fbNubGroup.clearfix");
                composeWindowContainer = $(gmailChatWindowContainers);
            }            
            if (request.receivedSMS) {
                console.log("message: '" + request.message + "' date: '" + request.messageDate + "'");
                var messageDirection = request.direction;
                var senderContact = request.sender;
                var scName = request.sender.contactName;
                var scNum = request.sender.phoneNum;
                var scCleanNum = request.sender.phoneNumClean;
                var messageBody = request.message;
                var messageTimeStamp = request.messageDate;
                var uniqueTextID = request.uniqueTextID;
                var incomingTextID = request.messageID;
                var sourceClient = request.sourceClient;
                var numExists = false;
                
                //if the contact isn't found, just display the phonenum that texted.
/*
                if (scName == "Nobody") {
                    scName = scNum;
                } 
*/
                                
                sendResponse({
                    confirmation: "displaying notif for SMS on: " + currentHost
                });
                
                console.log('display notification of SMS from ' + scCleanNum);
                
                var existingWindows = $('[data-number="' + scCleanNum + '"]');
//                console.log(existingWindows);
                if (existingWindows.length > 0) {
                    console.log("found it with the new logic");
                    updateTextWindow(existingWindows[0], messageDirection, messageBody, scCleanNum, incomingTextID, messageTimeStamp, sourceClient);
                } else {
                    console.log("this window doesn't exist new logic");
                    if (messageDirection != 61) {
                        console.log("This is not an outgoing text");
                        $(composeWindowContainer).append('<div class="convoWindowPlaceHolder" data-number="'+scCleanNum+'"></div>');
                        //KL APPENDS THIS DIV ABOVE AS A PLACEHOLDER.  THE CONVERSATION WINDOW IS NOT CREATED UNTIL THE AJAX CALL TO GET THE TEXTHREAD FOR THIS PHONENUMCLEAN IS RETURNED.  THEREFORE, IF A CAPI COMES IN BEFORE THE DATA IS RETURNED, THEN IT WILL OPEN A NEW WINDOW.  I AM APPENDING THIS DIV IMMEDIATELY SO THAT IT CAN BE DETECTED BY THE FIRST IF STATEMENT.  IT WILL BE REMOVED BEFORE I ACTUALLY CREATE THE REAL CONVO WINDOW.
                        getTextsForThisNumber(scCleanNum, scNum, scName);
                    }
                }
            } else if (request.receivedSMSfromSendc2dm) {
                console.log(request);
                var messageDirection = request.direction;
                var senderContact = request.sender;
                var scNum = request.sender.phoneNum;
                var scCleanNum = request.sender.phoneNumClean;
                var messageBody = request.message;
                var messageTimeStamp = request.messageDate;
                var uniqueTextID = request.uniqueTextID;
                var incomingTextID = request.messageID;
                var numExists = false;
                var sourceClient = request.sourceClient;
                sendResponse({
                    confirmation: "displaying notif for SMS send from sendc2dm on: " + currentHost
                });
                var existingWindows = $(composeWindowContainer).find('[data-number="' + scCleanNum + '"]');
                
                if (existingWindows.length > 0) {
//                    console.log(uniqueTextID);
                    conversationConfirmClientSent(uniqueTextID, existingWindows[0], messageDirection, messageBody, scCleanNum, messageTimeStamp, sourceClient);
                }
                 
            } else if (request.receivedPhoneCall) {
                sendResponse({
                    confirmation: "displaying notif for phone call on: " + window.location
                });
                console.log('display notification of phone call');
            } else if (request.receivedMMS) {
                
                var messageDirection = request.direction;
                var senderContact = request.sender;
                var scName = request.sender.contactName;
                var scNum = request.sender.phoneNum;
                var scCleanNum = request.sender.phoneNumClean;
                var messageBody = request.message;
                var messageTimeStamp = request.messageDate;
                var uniqueTextID = request.uniqueTextID;
                var incomingTextID = request.messageID;
                var numExists = false;
                
                sendResponse({
                    confirmation: "displaying notif for MMS on: " + window.location
                });
                
//                console.log('display notification of MMS');

/*
                if (scName == "Nobody") {
                    scName = scNum;
                } 
*/

                var existingWindows = $(composeWindowContainer).find('[data-number="' + scCleanNum + '"]');
                
                if (existingWindows.length > 0) {
                    console.log("found it with the new logic");
                    console.log("this number already exists, don't pop a div. existing number: " + scCleanNum);
                    processIncomingPhotoTaken(request.entireMessage, existingWindows[0]);
                } else {
                    console.log("this window doesn't exist new logic");
                    if (messageDirection != 61) {
                        getTextsForThisNumber(scCleanNum, scNum, scName);
                    }
                }
            } else if (request.receivedGroupMMS) {
            
                var messageDirection = request.direction;
                var senderContact = request.sender;
                var contentAuthro = request.contentAuthor;
                var scName = request.sender.contactName;
                var scNum = request.fullPhoneNum;
                var scCleanNum = request.threadID;
                var messageBody = request.message;
                var messageTimeStamp = request.messageDate;
                var uniqueTextID = request.uniqueTextID;
                var incomingTextID = request.messageID;
                var groupMMSContactHeaderNames = request.contactHeaderNames;
                var numExists = false;
                var sourceClient = request.sourceClient;
                
                
                var existingWindows = $('[data-number="' + scCleanNum + '"]');
//                console.log(existingWindows);
                if (existingWindows.length > 0) {                    
                    updateTextWindow(existingWindows[0], messageDirection, messageBody, scCleanNum, incomingTextID, messageTimeStamp, sourceClient, senderContact);
                } else {
                    console.log("this window doesn't exist new logic");
                    if (messageDirection != 61) {
                        console.log("This is not an outgoing text");
                        $(composeWindowContainer).append('<div class="convoWindowPlaceHolder" data-number="'+scCleanNum+'"></div>');
                        //KL APPENDS THIS DIV ABOVE AS A PLACEHOLDER.  THE CONVERSATION WINDOW IS NOT CREATED UNTIL THE AJAX CALL TO GET THE TEXTHREAD FOR THIS PHONENUMCLEAN IS RETURNED.  THEREFORE, IF A CAPI COMES IN BEFORE THE DATA IS RETURNED, THEN IT WILL OPEN A NEW WINDOW.  I AM APPENDING THIS DIV IMMEDIATELY SO THAT IT CAN BE DETECTED BY THE FIRST IF STATEMENT.  IT WILL BE REMOVED BEFORE I ACTUALLY CREATE THE REAL CONVO WINDOW.
                        
/*
                        if(caName == "Nobody"){
                            caName = senderContact.phoneNum;
                        }
*/
                        
                        getTextsForThisNumber(scCleanNum, scNum, scName, groupMMSContactHeaderNames);
                    }
                }
            
            } else if(request.receivedGroupPicMMS){
                
                var messageDirection = request.direction;
                var contentAuthor = request.sender;
                var caName = request.sender.contactName;
                var scNum = request.fullPhoneNum;
                var scCleanNum = request.threadID;
                var messageBody = request.message;
                var messageTimeStamp = request.messageDate;
                var uniqueTextID = request.uniqueTextID;
                var incomingTextID = request.messageID;
                var groupMMSContactHeaderNames = request.contactHeaderNames;
                var numExists = false;
                
                sendResponse({
                    confirmation: "displaying notif for MMS on: " + window.location
                });
                
                console.log(contentAuthor);

                var existingWindows = $(composeWindowContainer).find('[data-number="' + scCleanNum + '"]');
                
                if (existingWindows.length > 0) {
                    console.log("found it with the new logic");
                    console.log("this number already exists, don't pop a div. existing number: " + scCleanNum);
                    processIncomingPhotoTaken(request.entireMessage, existingWindows[0]);
                } else {
                    console.log("this window doesn't exist new logic");
                    if (messageDirection != 61) {
                        getTextsForThisNumber(scCleanNum, scNum, caName, groupMMSContactHeaderNames);
                    }
                }

                
            } else if (request.incomingPhoneCall) {
                sendResponse({
                    confirmation: "Content Script Received Incoming Call Status from Background"
                });
                notifyUserSendConfirmation(request.sender.contactName, "incomingPhoneCall");
            } else if (request.missedPhoneCall) {
                sendResponse({
                    confirmation: "Content Script Received Missed Call Status from Background"
                });
                notifyUserSendConfirmation(request.sender.contactName, "missedPhoneCall");
            } else if (request.receivedPhoneStatus) {
                var batteryLevel = request.batteryLevel;
                var phoneCharging = request.phoneCharging;
                var userCurrentAPKVersion = request.currentAPKVersion;
                var timeStamp = String((request.lastTimeStamp / 1000)); //moment must be passed a string.
                var unixTimeStamp = request.lastTimeStamp;
                
                console.log("got a battery status"); /*             var test = moment(timeStamp).isValid(); */
                
                var formattedTimeStamp = moment.unix(timeStamp).format("h:mm a");
                
                console.log(formattedTimeStamp);
                
                sendResponse({
                    confirmation: "Content Script Received Battery Status from Background"
                });
                 
//              console.log(batteryLevel);
//              console.log(phoneCharging);
//              console.log(currentAPKVersion);
                
                var batt_charging_icon = '';
                
                if (phoneCharging != 'false') {
//                    alert('battery_charging: ' + batt_charging);
                    batt_charging_icon = '<div id="chargingIcon"><img src="' + chargingImgURL + '"/></div>';
                }
                updateBatteryStatusDisplay(batteryLevel, batt_charging_icon, formattedTimeStamp, unixTimeStamp);
//                checkIfUserHasCurrentAPK(userCurrentAPKVersion);
            } else if(request.receivedInitialWakeUpForGroupMMS){
                var senderContact = request.sender;
                notifyUserSendConfirmation(senderContact.contactName, "incomingGroupMMS");
//                alert("display notif for intiial group mms from: " + senderContact);
            } else if(request.receivedInitialWakeUpForPicMMS){
                var senderContact = request.sender;
                notifyUserSendConfirmation(senderContact.contactName, "incomingPicMMS");
//                alert("display notif for initial pic mms");
            } else if (request.contentScriptCheck) {
                console.log("Background checking to see if this tab is running content script.");
                sendResponse({
                    confirmation: "Yep. This tab is running the content script."
                });
            } else if (request.testingFrequencyOfMessages) {
                console.log(request.testingFrequencyOfMessages);
                sendResponse({
                    confirmation: "received this Message."
                });
            } else {
                console.log('unable to determine what the new_content was.');
                console.log(request);
                sendResponse({
                    confirmation: "received this Message.  But did nothing with it!"
                });
            }
        });
    };
    
    function initializeGTextOnboarding(){
            
            console.log("starting tour");
            $('<div id="tourNotif"><div id="tourContainer"><div><p id="tourDescrip" >Welcome To GText! Would you like to take a tour explaining how everything works?</p></div><div id="tourActions"><button id="tourDecline">No.</button><button id="tourAccept">Yes.</button></div></div></div>').appendTo('body').each(function(){
                $('#tourDecline').on("click", function(){
                   $(this).closest("#tourNotif").remove(); 
                });
                $('#tourAccept').on("click", function(){
                   var batStatCheck = $('div.baticon');
                   $("#composeSMS").trigger("click");
                   $(".composeInnerContainer").hide(); 
                   $(this).closest("#tourNotif").remove();
                    if(batStatCheck.length > 0){
                        //insert dummy batstat here.  
                        console.log(batStatCheck);
                    } else {
                        updateBatteryStatusDisplay(20, '<div id="chargingIcon"><img src="' + chargingImgURL + '"/></div>', null, null, "insert dummy stat");
                        console.log(batStatCheck);
                    }
                    introJs().start();        
                    $(".introjs-nextbutton").on("click",function(){
                        var checkForStepTwo = $(".newbatterywrap").hasClass("introjs-showElement");
                        if(checkForStepTwo){
                            $(".composeInnerContainer").show();
                        } else {
                            console.log("wrong step.");
                        }
                    });
                    
                    $(".introjs-skipbutton").on("click", function(){
                        var dummyComposer = $(document).find(".mightynH");
                        $(dummyComposer).remove();
                    }); 
                });
            });                        
    };
    tellBackGroundScriptInstructionsForCRXStart();
});
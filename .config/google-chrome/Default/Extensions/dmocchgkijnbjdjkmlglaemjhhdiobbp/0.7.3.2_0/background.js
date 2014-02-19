var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-33880382-1']);
var debug = localStorage["keyrocket_debug"]; 
console.log("debug:" + localStorage["keyrocket_debug"]);
//DEBUG: localStorage["keyrocket_debug"] = true;
if (debug) {
    localStorage.removeItem("lastActivityUpdate");
    localStorage.removeItem("userid");
    localStorage.removeItem("gmail_settings_information_shown");
	window['ga-disable-UA-33880382-1'] = true;
}

Date.prototype.getWeek = function () {
    // We have to compare against the first monday of the year not the 01/01
    // 60*60*24*1000 = 86400000
    // 'onejan_next_monday_time' reffers to the miliseconds of the next monday after 01/01

    var day_miliseconds = 86400000,
        onejan = new Date(this.getFullYear(), 0, 1, 0, 0, 0),
        onejan_day = (onejan.getDay() == 0) ? 7 : onejan.getDay(),
        days_for_next_monday = (8 - onejan_day),
        onejan_next_monday_time = onejan.getTime() + (days_for_next_monday * day_miliseconds),
        // If one jan is not a monday, get the first monday of the year
        first_monday_year_time = (onejan_day > 1) ? onejan_next_monday_time : onejan.getTime(),
        this_date = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0),// This at 00:00:00
        this_time = this_date.getTime(),
        days_from_first_monday = Math.round(((this_time - first_monday_year_time) / day_miliseconds));

    var first_monday_year = new Date(first_monday_year_time);

    // We add 1 to "days_from_first_monday" because if "days_from_first_monday" is *7,
    // then 7/7 = 1, and as we are 7 days from first monday,
    // we should be in week number 2 instead of week number 1 (7/7=1)
    // We consider week number as 52 when "days_from_first_monday" is lower than 0,
    // that means the actual week started before the first monday so that means we are on the firsts
    // days of the year (ex: we are on Friday 01/01, then "days_from_first_monday"=-3,
    // so friday 01/01 is part of week number 52 from past year)
    // "days_from_first_monday<=364" because (364+1)/7 == 52, if we are on day 365, then (365+1)/7 >= 52 (Math.ceil(366/7)=53) and thats wrong

    return (days_from_first_monday >= 0 && days_from_first_monday < 364) ? Math.ceil((days_from_first_monday + 1) / 7) : 52;
}

var userId = localStorage["userid"];	
//if no user id exists create userid and goto KeyRocket.com
if (userId == undefined) {
    console.log("User id not defined");
    _gaq.push(
        ['_trackEvent', 'Installation', 'Installed', '', 0, true],
        ['_trackEvent', 'Installation', 'UI Locale', chrome.i18n.getMessage("@@ui_locale"), 0, true]
    );

    localStorage["userid"] = Math.random() + "_" + Date.now();
    userId = localStorage["userid"];
    if (!localStorage["keyrocket_debug"]) {
        chrome.tabs.create({ url: "http://www.keyrocket.com/chrome-extension/" });
    }
    chrome.tabs.create({ url: "https://mail.google.com/mail/u/0/#settings/general" });
}
console.log("User id =" + userId);


var installed = new Date(parseInt(localStorage["userid"].split('_')[1]));
var installedYear = installed.getFullYear();
var installeddWeek = installedYear + "_" + ('0' + installed.getWeek()).slice(-2);
var installedMonth = installedYear + "_" + ('0' + installed.getMonth()).slice(-2);

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    switch (request.method) {
        case "getLocalStorage":
            sendResponse({ data: localStorage[request.key] });
            break;
        case "setLocalStorage":
            sendResponse({ data: localStorage[request.key] = request.value });
            break;
        case "getLikeUs":
            sendResponse({ data: shouldShowLikeUs() });
            break;
        case "openTab":
            chrome.tabs.create({ url: request.url });
            break;
        case "trackView":
            _gaq.push(['_trackPageview', request.pageURL]);
            break;
        case "reportDisplayLanguage":
            if (typeof localStorage["keyrocket_installation_GmailLocale_Reported"] === "undefined") {
                _gaq.push(['_trackEvent', "Gmail Installation", "Gmail Locale", request.displayLanguage, 0, true]);
                localStorage["keyrocket_installation_GmailLocale_Reported"] = true;
            }
            break;
        case "trackEvent":
            console.log(request.eventAction);
            _gaq.push(['_trackEvent', request.eventCategory, request.eventAction, request.eventLabel, request.eventValue, request.eventNonInteractive]);
            break;
        default:
            sendResponse({}); // snub them.
    }
});


_gaq.push(
    ['_setCustomVar', 1, 'user.session.installed.YYYY_WW',installeddWeek, 1],
    ['_setCustomVar', 2, 'user.session.installed.YYYY_MM', installedMonth, 1],
    ['_setCustomVar', 3, 'user.session.installed.YYYY', installedYear, 1],
    ['_trackPageview']
);

var now = +new Date(); 
var lastActivityUpdate = localStorage["lastActivityUpdate"];
if (lastActivityUpdate > 0) {
    timeBetweenInstallAndUpdate = parseInt(lastActivityUpdate) - installed;
    weeksAlreadyReported = Math.floor(timeBetweenInstallAndUpdate / (1000 * 60 * 60 *24 *7));
    timeBetweenInstallAndNow = now - installed;
    totalWeeks = Math.floor(timeBetweenInstallAndNow / (1000 * 60 * 60 *24 *7));
    console.log(weeksAlreadyReported + " " + totalWeeks);
    for (i=weeksAlreadyReported+1; i<=totalWeeks; i++) {
        _gaq.push(['_trackEvent', "Gmail Activity", "Ping Active", ("000"+i).slice(-4), 0, true]);
        console.log(("000"+i).slice(-4));
    }
}
localStorage["lastActivityUpdate"] = now;

(function () {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

console.log(_gaq);

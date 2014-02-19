//http://code.google.com/chrome/extensions/contentSecurityPolicy.html

function review() {
    chrome.extension.sendRequest({ method: "openTab", url: "https://chrome.google.com/webstore/detail/dmocchgkijnbjdjkmlglaemjhhdiobbp/reviews" });
    chrome.extension.sendRequest({
        method: "trackEvent",
        eventCategory: "Gmail BrowserAction",
        eventAction: "Visit Review",
        eventLabel: "",
        eventValue: 0,
        eventNonInteractive: false
    });
}
function keyrocket() {
	chrome.extension.sendRequest({method: "openTab", url: "http://www.veodin.com/keyrocket/chrome-options/"});
	chrome.extension.sendRequest({
	    method: "trackEvent",
	    eventCategory: "Gmail BrowserAction",
	    eventAction: "Visted Download",
	    eventLabel: "",
	    eventValue: 0,
	    eventNonInteractive: false
	});
}
function feedback() {
    chrome.extension.sendRequest({ method: "openTab", url: "https://chrome.google.com/webstore/support/dmocchgkijnbjdjkmlglaemjhhdiobbp?#bug" });
    chrome.extension.sendRequest({
        method: "trackEvent",
        eventCategory: "Gmail BrowserAction",
        eventAction: "Visit Feedback",
        eventLabel: "",
        eventValue: 0,
        eventNonInteractive: false
    });
}

function clickHandler(e) {
  switch (e.target.id) {
		case 'review':
			setTimeout(review, 10);
			break;
		case 'feedback':
			setTimeout(feedback, 10);
			break;
		default:
			setTimeout(keyrocket, 10);
	}
  
}
// Add event listeners once the DOM has fully loaded by listening for the
// `DOMContentLoaded` event on the document, and adding your listeners to
// specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
    $('.menu-entry').click(clickHandler);
});

//setting localized texts
$("#download").text(chrome.i18n.getMessage("browserActionPopup_download"));
$("#download-win").text(chrome.i18n.getMessage("browserActionPopup_download_win"));
$("#download-excel").text(chrome.i18n.getMessage("browserActionPopup_download_excel"));
$("#download-outlook").text(chrome.i18n.getMessage("browserActionPopup_download_outlook"));
$("#download-powerpoint").text(chrome.i18n.getMessage("browserActionPopup_download_powerpoint"));
$("#download-word").text(chrome.i18n.getMessage("browserActionPopup_download_word"));
$("#review").text(chrome.i18n.getMessage("browserActionPopup_review"));
$("#feedback").text(chrome.i18n.getMessage("browserActionPopup_feedback"));

chrome.extension.sendRequest({ method: "trackView", pageURL: window.location.pathname });

var main;
var statusText;
var title;
var urlHeader;
var url;
var linkSwitcher;
var copiedConfirmation;
var errorTitle;
var errorDetails;
var dismissMessageButton;
var upgradeButton;
var dismissDialogButton;

var tokens;
var type;
var noteGuid;
var userId;
var premium;
var baseUrl;
var origin;
var sourceUrl, evernoteUrl;

window.addEventListener("DOMContentLoaded", function() {
  origin = "clipper-chrome";
  if (SAFARI) {
    origin = "clipper-safari";
  } else if (OPERA) {
    origin = "clipper-opera";
  }
  main = document.querySelector("#main");
  statusText = document.querySelector("#status .text");
  title = document.querySelector("#title");
  urlHeader = document.querySelector("#urlHeader");
  url = document.querySelector("#url");
  linkSwitcher = document.querySelector("#linkSwitcher");
  copiedConfirmation = document.querySelector("#copiedConfirmation");
  errorTitle = document.querySelector("#errorTitle span");
  errorDetails = document.querySelector("#errorDetails");
  dismissMessageButton = document.querySelector("#dismissMessage");
  upgradeButton = document.querySelector("#upgrade");
  dismissDialogButton = document.querySelector("#dismissDialog");
  GlobalUtils.localize(document.body);
  linkSwitcher.addEventListener("click", function() {
    if (linkSwitcher.getAttribute("linkType") == "source") {
      linkSwitcher.setAttribute("linkType", "evernote");
      linkSwitcher.innerText = Browser.i18n.getMessage("switchToSourceLink");
      url.value = evernoteUrl;
      urlHeader.innerText = Browser.i18n.getMessage("evernoteLink");
    } else {
      linkSwitcher.setAttribute("linkType", "source");
      linkSwitcher.innerText = Browser.i18n.getMessage("switchToEvernoteLink");
      url.value = sourceUrl;
      urlHeader.innerText = Browser.i18n.getMessage("sourceLink");
    }
    Browser.sendToExtension({ name: "copyText", text: url.value });
  });
  var shareButtons = document.querySelectorAll(".shareButton");
  for (var i = 0; i < shareButtons.length; i++) {
    shareButtons.item(i).addEventListener("click", shareNote);
  }
  dismissMessageButton.addEventListener("click", function() {
    document.body.className = document.body.className.replace(/\s*error/g, "").replace(/\s*nearQuota/g, "");
    window.parent.postMessage({ name: "setShareToolsHeight", height: main.offsetHeight + 10 }, "*");
  });
  dismissDialogButton.addEventListener("click", function() {
    window.parent.postMessage({ name: "hideShareTools" }, "*");
  });
});

Browser.addMessageHandlers({
  doneSharing: doneSharing,
  emailResult: emailResult,
  handleFailure: handleFailure,
  handleSuccess: doneSharing,
  receiveClipResultInfo: receiveClipResultInfo
});

function doneSharing(request, sender, sendResponse) {
  if (request.guid) {
    noteGuid = request.guid;
    sourceUrl = request.source;
    evernoteUrl = request.url;
    if (sourceUrl) {
      url.value = sourceUrl;
      document.body.className += " dualLinks";
      urlHeader.innerText = Browser.i18n.getMessage("sourceLink");
    } else {
      url.value = evernoteUrl;
      urlHeader.innerText = Browser.i18n.getMessage("evernoteLink");
    }
    document.body.className += " doneSharing";
    window.parent.postMessage({ name: "setShareToolsHeight", height: main.offsetHeight + 10 }, "*");
    var uploaded = request.uploaded;
    var authInfo = request.savedAuthInfo;
    if (uploaded && uploaded[userId] && authInfo && authInfo.userInfo
        && authInfo.userInfo[userId] && authInfo.userInfo[userId].quota) {
      var shownNearQuotaUpsell = request.shownNearQuotaUpsell;
      if (!shownNearQuotaUpsell) {
        shownNearQuotaUpsell = {};
      }
      if ((uploaded[userId] + request.noteSize) / authInfo.userInfo[userId].quota > 0.75
          && !shownNearQuotaUpsell[userId]) {
        shownNearQuotaUpsell[userId] = true;
        Browser.sendToExtension({ name: "setPersistentValue", key: "shownNearQuotaUpsell", value: shownNearQuotaUpsell });
        document.body.className += " error nearQuota";
        errorTitle.innerText = Browser.i18n.getMessage("nearQuota");
        if (premium) {
          errorDetails.innerText = Browser.i18n.getMessage("nearQuotaPremium");
          upgradeButton.innerText = Browser.i18n.getMessage("getMoreSpacePremium");
          upgradeButton.href = baseUrl + "/SetAuthToken.action?auth="
            + encodeURIComponent(tokens.authenticationToken) + "&targetUrl="
            + encodeURIComponent("/QuotaCheckout.action?origin=" + origin + "&offer=nearQuota");
        } else {
          errorDetails.innerText = Browser.i18n.getMessage("nearQuotaFree");
          upgradeButton.innerText = Browser.i18n.getMessage("upgradeToPremium");
          upgradeButton.href = baseUrl + "/SetAuthToken.action?auth="
            + encodeURIComponent(tokens.authenticationToken) + "&targetUrl="
            + encodeURIComponent("/Checkout.action?origin=" + origin + "&offer=nearQuota");
        }
      }
    }
  }
}

function emailResult(request, sender, sendResponse) {
  if (request.error) {
    var email = document.querySelector("#email");
    email.className += " error";
    if (premium) {
      email.setAttribute("data-error", Browser.i18n.getMessage("emailLimitError", [EDAM_USER_MAIL_LIMIT_DAILY_FREE]));
    } else {
      email.setAttribute("data-error", Browser.i18n.getMessage("emailLimitError", [EDAM_USER_MAIL_LIMIT_DAILY_PREMIUM]));
    }
    setTimeout(function() { email.className = email.className.replace(/\s*error/g, ""); }, 2000);
  }
}

function handleFailure(request, sender, sendResponse) {
  document.body.className += " error";
  if (request.error == "overQuota") {
    errorTitle.innerText = Browser.i18n.getMessage("cannotSaveClip");
    if (premium) {
      errorDetails.innerText = Browser.i18n.getMessage("notification_quotaExceededPremium");
      upgradeButton.href = baseUrl + "/SetAuthToken.action?auth="
        + encodeURIComponent(tokens.authenticationToken)
        + "&targetUrl=" + encodeURIComponent("/QuotaCheckout.action?origin="
        + origin + "&offer=overQuota");
      upgradeButton.innerText = Browser.i18n.getMessage("getMoreSpacePremium");
    } else {
      errorDetails.innerText = Browser.i18n.getMessage("notification_quotaExceededFree");
      upgradeButton.href = baseUrl + "/SetAuthToken.action?auth="
        + encodeURIComponent(tokens.authenticationToken)
        + "&targetUrl=" + encodeURIComponent("/Checkout.action?origin="
        + origin + "&offer=overQuota");
      upgradeButton.innerText = Browser.i18n.getMessage("upgradeToPremium");
    }
  } else if (request.error == "noteSizeExceeded") {
    if (premium) {
      document.body.className += " cannotUpgrade";
      errorTitle.innerText = Browser.i18n.getMessage("premiumNoteSizeLimit");
      errorDetails.innerText = Browser.i18n.getMessage("noteSizeExceededPremium");
    } else {
      errorTitle.innerText = Browser.i18n.getMessage("freeNoteSizeLimit");
      errorDetails.innerText = Browser.i18n.getMessage("noteSizeExceededFree");
      upgradeButton.href = baseUrl + "/SetAuthToken.action?auth="
        + encodeURIComponent(tokens.authenticationToken)
        + "&targetUrl=" + encodeURIComponent("/Checkout.action?origin="
        + origin + "&offer=overQuota");
      upgradeButton.innerText = Browser.i18n.getMessage("upgradeToPremium");
    }
  }
  window.parent.postMessage({ name: "setShareToolsHeight", height: main.offsetHeight + 10 }, "*");
}

function receiveClipResultInfo(request, sender, sendResponse) {
  tokens = request.auth;
  type = request.type;
  userId = request.userId;
  premium = request.premium;
  baseUrl = request.baseUrl;
  document.body.className = document.body.className.replace(/\s*(doneSharing|dualLinks)/g, "");
  title.innerText = request.title;
  if (title.scrollHeight > 32) {
    title.className += " overflow";
  }
  if (request.updateGuid) {
    statusText.innerText = Browser.i18n.getMessage("updatingClip");
  }
  if (/china/i.test(request.locale)) {
    document.body.className += " china";
  }
  window.parent.postMessage({ name: "setShareToolsHeight", height: main.offsetHeight + 10 }, "*");
}

function shareNote() {
  if (this.id == "email") {
    var auth = tokens.authenticationToken;
    if (type == "biz") {
      auth = tokens.bizAuthenticationToken;
    } else if (type == "linked") {
      auth = tokens.linked;
    }
    window.parent.postMessage({
      name: "showEmailDialog",
      auth: auth,
      noteGuid: noteGuid,
      persAuth: tokens.authenticationToken,
      sharedAuth: type == "linked" ? auth : null,
      subject: title.innerText,
      userId: userId
    }, "*");
  } else if (this.id == "facebook"){
    Browser.sendToExtension({
      name: "main_openWindow",
      width: 626,
      height: 436,
      url: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url.value),
      type: "popup"
    });
  } else if (this.id == "twitter") {
    Browser.sendToExtension({
      name: "main_openWindow",
      width: 550,
      height: 420,
      url: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(title.innerText)
        + "&url=" + encodeURIComponent(url.value),
      type: "popup"
    });
  } else if (this.id == "linkedin") {
    Browser.sendToExtension({
      name: "main_openWindow",
      width: 520,
      height: 570,
      url: "http://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(url.value)
        + "&title=" + encodeURIComponent(title.innerText),
      type: "popup"
    })
  } else if (this.id == "weibo") {
    var weiboUrl = "http://service.weibo.com/share/share.php?url=" + encodeURIComponent(url.value)
      + "&title=" + encodeURIComponent(title.innerText);
    if (url.value == evernoteUrl) {
      weiboUrl += "&pic=" + encodeURIComponent(url.value + "/thm/note/" + noteGuid);
    }
    Browser.sendToExtension({
      name: "main_openWindow",
      width: 650,
      height: 650,
      url: weiboUrl,
      type: "popup"
    });
  }
}
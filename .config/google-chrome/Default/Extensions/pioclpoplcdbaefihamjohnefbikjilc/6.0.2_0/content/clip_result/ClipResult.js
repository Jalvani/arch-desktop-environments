var pendingNoteKey;
var noteGuid;
var clipTitle = "\u2026";
var currentStatus = "contentclipper_clipping";
var type;
var notebookGuid;
var shareKey;
var linkedNotebookGuid;
var hour = 8;
var minute = 0;
var reminderOrder;

var client;
var baseUrl;
var china;
var userId;
var tokens;
var shardId;
var url;
var premium;
var userType;
var relatedNotesClicked = {};
var totalNumRelatedNotes = 0;
var numBizRelatedNotes = 0;
var sameSiteNotesClicked = {};
var totalNumSameSiteNotes = 0;
var numBizSameSiteNotes = 0;

var siteNotesRequested = false;
var success = false;
var successResponse;
var siteNotesRequested = false;
var recordedRelatedResultsClick = false;
var recordedSameSiteClick = false;
var receivedRelatedNotes = false;

var dateInputTimeout;

var main;
var icon;
var text;
var reminders;
var remindersSetter;
var addDateButton;
var tomorrow;
var nextWeek;
var dateInput;
var selectedMonth, selectedDate, selectedYear, selectedHour, selectedMinute, selectedMeridian;
var datePicker;
var editLink;
var relatedNotesButton, sameSiteNotesButton, tipsButton;
var close;
var smartPanel;
var errorTitle, errorDetails, errorButton;
var numEmailed;
var tipsContainer;
var nearQuotaButton;
var skitchButton;
var iosFoodButton, androidFoodButton;

function addHandlers() {
  reminders.addEventListener("click", function() {
    if (/added/.test(reminders.className)) {
      if (!datePicker.selectedDate()) {
        remindersSetter.className = remindersSetter.className.replace(/\s*hasDate/g, "");
      }
      datePicker.showTodayOrSelected();
    } else {
      reminders.className += " added";
      var token = tokens.authenticationToken;
      if (type == "biz") {
        token = tokens.bizAuthenticationToken;
      } else if (type == "linked") {
        token = tokens.linked;
      }
      reminderOrder = Date.now();
      Browser.sendToExtension({
        name: "setReminder",
        auth: token,
        noteGuid: noteGuid,
        title: clipTitle,
        sourceURL: url,
        reminderOrder: reminderOrder
      });
    }
    if (/visible/.test(remindersSetter.className)) {
      remindersSetter.className = remindersSetter.className.replace(/\s*visible/g, "");
      reminders.className = reminders.className.replace(/\s*changingDate/g, "");
      var focused = document.querySelector("#date span.focused");
      if (focused) {
        focused.className = focused.className.replace(/\s*focused/g, "");
      }
    } else {
      remindersSetter.className += " visible";
      reminders.className += " changingDate";
    }
    window.parent.postMessage({ name: "setClipResultHeight", height: calcHeight() }, "*");
  });
  addDateButton.addEventListener("click", function() {
    remindersSetter.className += " hasDate";
    window.parent.postMessage({ name: "setClipResultHeight", height: calcHeight() }, "*");
  });
  tomorrow.addEventListener("click", function() {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    datePicker.selectDate(tomorrow);
  });
  nextWeek.addEventListener("click", function() {
    var nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    datePicker.selectDate(nextWeek);
  });
  remindersSetter.addEventListener("click", function(evt) {
    if (!dateInput.contains(evt.srcElement)) {
      var focused = document.querySelector("#date span.focused");
      if (focused) {
        focused.className = focused.className.replace(/\s*focused/g, "");
      }
    }
  });
  remindersSetter.addEventListener("webkitTransitionEnd", function(evt) {
    if (evt.propertyName == "width" && !/hasDate/.test(remindersSetter.className) && remindersSetter.scrollHeight > remindersSetter.clientHeight) {
      for (var i = 0; i < document.styleSheets.length; i++) {
        if (/clip_result\.css/.test(document.styleSheets[i].href)) {
          for (var j = 0; j < document.styleSheets[i].cssRules.length; j++) {
            if (document.styleSheets[i].cssRules[j].selectorText == "#remindersSetter") {
              document.styleSheets[i].cssRules[j].style.height = (53 + remindersSetter.scrollHeight - remindersSetter.clientHeight) + "px";
              break;
            }
          }
          break;
        }
      }
    }
  });
  editLink.addEventListener("click", doNoteSuccessAction);
  var tabs = document.querySelectorAll("#tabs .tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs.item(i).addEventListener("click", function() {
      Browser.sendToExtension({name: "main_recordActivity"});
      selectSmartSection.call(this);
    });
  }
  close.addEventListener("click", dismiss);
  errorButton.addEventListener("click", handleErrorClick);
  nearQuotaButton.addEventListener("click", handleErrorClick);
  skitchButton.addEventListener("click", function() {
    Browser.sendToExtension({ name: "main_recordActivity" });
    Browser.sendToExtension({
      name: "trackEvent",
      action: "skitch",
      category: "cross promo clickthru",
      label: userType,
      userId: userId
    });
  });
  iosFoodButton.addEventListener("click", function() {
    Browser.sendToExtension({ name: "main_recordActivity" });
    Browser.sendToExtension({
      name: "trackEvent",
      action: "ios food",
      category: "cross promo clickthru",
      label: userType,
      userId: userId
    });
  });
  androidFoodButton.addEventListener("click", function() {
    Browser.sendToExtension({ name: "main_recordActivity" });
    Browser.sendToExtension({
      name: "trackEvent",
      action: "android food",
      category: "cross promo clickthru",
      label: userType,
      userId: userId
    });
  });
}

function buildSiteQuery() {
  var domain = url.replace(/^.*?:\/\/(.*?)\/.*$/, "$1");
  var strippedDomain = domain.replace(/^(www\.)?(.*)/i, "$2");
  var words = "any:";
  var prefixes = ["http://", "https://", "http://www.", "https://www."];
  for (var i = 0; i < prefixes.length; i++) {
    words += " sourceUrl:" + prefixes[i] + strippedDomain + "*";
  }
  return words;
}

function calcHeight() {
  var rem = 0;
  if (/visible/.test(remindersSetter.className)) {
    if (/hasDate/.test(remindersSetter.className)) {
      rem = 395;
    } else {
      rem = 133;
    }
  }
  if (rem > main.offsetHeight) {
    return rem;
  }
  return main.offsetHeight;
}

function dismiss() {
  window.parent.postMessage({name: "hideClipResult"}, "*");
}

function doneSharing(request, sender, sendResponse) {
  if (request.shareType == "evernote") {
    document.querySelector("#evernote").innerText = "Copied!";
  }
}

function doNoteFailureAction(action, evt) {
  var msgName;
  if (action == "cancel") {
    msgName = "main_getNoteByKeyAndClear";
  }
  else if (action == "retry") {
    msgName = "main_getNoteByKeyAndRetry";
  }

  // if (msgName && message.lookupKey) {
  Browser.sendToExtension({name: msgName, lookupKey: message.lookupKey});
  dismiss();
  // } else {
  //   log.warn("Can't look up message info so can't retry or cancel it.");
  // }
  if (evt) evt.stopPropagation();
}

function doNoteSuccessAction() {
  Browser.sendToExtension({name: "main_recordActivity"});
  var packet = {
    shardId: shardId, shareKey: shareKey, noteGuid: noteGuid,
    inBusinessNotebook: (type == "biz"), notebookGuid: notebookGuid,
    linkedNotebookGuid: linkedNotebookGuid
  };
  var url = GlobalUtils.getNoteURI(client, baseUrl, packet, "edit", userId, 0, {
    pers: tokens.authenticationToken, biz: tokens.bizAuthenticationToken
  });
  if (client == "WEB") {
    Browser.sendToExtension({name: "main_openWindow", width: 800, height: 600, url: url});
  } else if (client == "DESKTOP") {
    GlobalUtils.openDesktopLink(url);
  }
}

function handleDateTimeKeydown(evt) {
  var focused = document.querySelector("#date span.focused");
  if (focused) {
    clearTimeout(dateInputTimeout);
    var year = parseInt(selectedYear.innerText || selectedYear.textContent);
    var month = parseInt(selectedMonth.innerText || selectedMonth.textContent) - 1;
    var date = parseInt(selectedDate.innerText || selectedDate.textContent);
    if (evt.keyIdentifier == "Up") {
      if (focused === selectedYear) {
        datePicker.selectDate(new Date(year + 1, month, date), "year");
      } else if (focused === selectedMonth) {
        datePicker.selectDate(new Date(year, month + 1, date), "month");
      } else if (focused === selectedDate) {
        datePicker.selectDate(new Date(year, month, date + 1), "date");
      } else if (focused === selectedHour) {
        hour = (hour + 1) % 24;
        datePicker.selectDate(new Date(year, month, date), "hour");
      } else if (focused === selectedMinute) {
        minute = (minute + 1) % 60;
        datePicker.selectDate(new Date(year, month, date), "minute");
      } else if (focused === selectedMeridian) {
        hour = (hour + 12) % 24;
        datePicker.selectDate(new Date(year, month, date), "meridian");
      }
    } else if (evt.keyIdentifier == "Right") {
      if (focused.nextElementSibling) {
        focused.nextElementSibling.click();
      }
    } else if (evt.keyIdentifier == "Down") {
      if (focused === selectedYear) {
        datePicker.selectDate(new Date(year - 1, month, date), "year");
      } else if (focused === selectedMonth) {
        datePicker.selectDate(new Date(year, month - 1, date), "month");
      } else if (focused === selectedDate) {
        datePicker.selectDate(new Date(year, month, date - 1), "date");
      } else if (focused === selectedHour) {
        hour = (hour - 1 + 24) % 24;
        datePicker.selectDate(new Date(year, month, date), "hour");
      } else if (focused === selectedMinute) {
        minute = (minute - 1 + 60) % 60;
        datePicker.selectDate(new Date(year, month, date), "minute");
      } else if (focused === selectedMeridian) {
        hour = (hour - 12 + 24) % 24;
        datePicker.selectDate(new Date(year, month, date), "meridian");
      }
    } else if (evt.keyIdentifier == "Left") {
      if (focused.previousElementSibling) {
        focused.previousElementSibling.click();
      }
    } else if ((evt.keyCode >= 48 && evt.keyCode <= 57) || (evt.keyCode >= 96 && evt.keyCode <= 105)) {
      // numbers
      var num = evt.keyCode % 48;
      if (evt.keyCode > 57) {
        num = evt.keyCode % 96;
      }
      if (focused === selectedYear) {
        if (selectedYear.innerText.length < 3) {
          // append number and wait
          selectedYear.innerText += num;
          dateInputTimeout = setTimeout(function() {
            datePicker.selectDate(new Date(parseInt(selectedYear.innerText || selectedYear.textContent), month, date));
          }, 500);
        } else if (selectedYear.innerText.length == 3){
          // append number and submit
          selectedYear.innerText += num;
          datePicker.selectDate(new Date(parseInt(selectedYear.innerText || selectedYear.textContent), month, date));
        } else {
          // clear, append number, and wait
          selectedYear.innerText = num;
          dateInputTimeout = setTimeout(function() {
            datePicker.selectDate(new Date(parseInt(selectedYear.innerText || selectedYear.textContent), month, date));
          }, 500);
        }
      } else if (focused === selectedMonth) {
        if (selectedMonth.innerText.length < 2) {
          // at this point it can either be a 0 or 1
          // append number if valid and submit or wait
          if (month == -1) { // a 0 is already here
            selectedMonth.innerText = num;
            datePicker.selectDate(new Date(year, num - 1, date));
          } else { // a 1 is already here. can only enter 0, 1, or 2
            if (num < 3) {
              selectedMonth.innerText += num;
              datePicker.selectDate(new Date(year, parseInt(selectedMonth.innerText || selectedMonth.textContent) - 1, date));
            } else {
              dateInputTimeout = setTimeout(function() { datePicker.selectDate(new Date(year, month, date)); }, 500);
            }
          }
        } else {
          // clear, append number, and submit or wait
          selectedMonth.innerText = num;
          if (num > 1) { // can't enter second number to make a real month
            datePicker.selectDate(new Date(year, num - 1, date));
          } else {
            // if it's 0, can still enter any number
            // if it's 1, can only enter 0, 1, or 2
            dateInputTimeout = setTimeout(function() {
              var m = parseInt(selectedMonth.innerText || selectedMonth.textContent) - 1;
              m = m < 0 ? month : m;
              datePicker.selectDate(new Date(year, m, date));
            }, 500);
          }
        }
      } else if (focused === selectedDate) {
        if (selectedDate.innerText.length < 2) {
          if (date < 2) { // 0 or 1
            selectedDate.innerText += num;
            datePicker.selectDate(new Date(year, month, parseInt(selectedDate.innerText || selectedDate.textContent)));
          } else { // need to check if date is valid in that month, for 2 and 3
            if (new Date(year, month, (date * 10) + num).getDate() == (date * 10) + num) {
              // valid date
              selectedDate.innerText += num;
              datePicker.selectDate(new Date(year, month, parseInt(selectedDate.innerText || selectedDate.textContent)));
            } else {
              dateInputTimeout = setTimeout(function() { datePicker.selectDate(new Date(year, month, date)); }, 500);
            }
          }
        } else {
          selectedDate.innerText = num;
          if (num > 3) { // can't add another to make a valid number
            datePicker.selectDate(new Date(year, month, parseInt(selectedDate.innerText || selectedDate.textContent)));
          } else {
            dateInputTimeout = setTimeout(function() {
              datePicker.selectDate(new Date(year, month, parseInt(selectedDate.innerText || selectedDate.textContent)));
            }, 500);
          }
        }
      } else if (focused === selectedHour) {
        if (selectedHour.innerText.length < 2) {
          var firstDigit = parseInt(selectedHour.innerText);
          if (firstDigit == 0) { // 0 or 1, submit
            hour = num;
            datePicker.selectDate(new Date(year, month, date));
          } else if (firstDigit == 1) {
            if (num < 3) { // only 0, 1, and 2 are valid after a 1
              hour = 10 + num;
              datePicker.selectDate(new Date(year, month, date));
            } else {
              dateInputTimeout = setTimeout(function() {
                hour = 1;
                datePicker.selectDate(new Date(year, month, date));
              }, 500);
            }
          }
        } else {
          if (num < 2) {
            selectedHour.innerText = num;
            dateInputTimeout = setTimeout(function() {
              if (num != 0) {
                hour = num;
              }
              datePicker.selectDate(new Date(year, month, date));
            }, 500);
          } else { // can't append another number to make valid hour
            hour = num;
            datePicker.selectDate(new Date(year, month, date));
          }
        }
      } else if (focused === selectedMinute) {
        if (selectedMinute.innerText.length < 2) {
          var firstDigit = parseInt(selectedMinute.innerText);
          minute = firstDigit * 10 + num;
          datePicker.selectDate(new Date(year, month, date));
        } else {
          if (num < 6) {
            selectedMinute.innerText = num;
            dateInputTimeout = setTimeout(function() {
              if (num != 0) {
                minute = num;
              }
              datePicker.selectDate(new Date(year, month, date));
            }, 500);
          } else {
            minute = num;
            datePicker.selectDate(new Date(year, month, date));
          }
        }
      }
    } else if (evt.keyCode == 65 || evt.keyCode == 80) {
      // p and a, for the meridian only
      if (focused === selectedMeridian) {
        if ((selectedMeridian.innerText == "AM" && evt.keyCode == 80)
          || (selectedMeridian.innerText == "PM" && evt.keyCode == 65)) {
            hour = (hour + 12) % 24;
        }
        datePicker.selectDate(new Date(year, month, date));
      }
    }
  }
}

function handleErrorClick() {
  if (/upgradable/.test(this.className)) {
    var origin = "clipper-chrome";
    if (SAFARI) {
      origin = "clipper-safari";
    } else if (OPERA) {
      origin = "clipper-opera";
    }
    var url;
    if (/overQuota/.test(this.className)) {
      if (premium) {
        url = baseUrl + "/SetAuthToken.action?auth=" + encodeURIComponent(tokens.authenticationToken)
          + "&targetUrl=" + encodeURIComponent("/QuotaCheckout.action?origin=" + origin + "&offer=overQuota");
      } else {
        url = baseUrl + "/SetAuthToken.action?auth=" + encodeURIComponent(tokens.authenticationToken)
          + "&targetUrl=" + encodeURIComponent("/Checkout.action?origin=" + origin + "&offer=overQuota");
      }
    } else if (/noteSizeExceeded/.test(this.className)) {
      url = baseUrl + "/SetAuthToken.action?auth="
        + encodeURIComponent(tokens.authenticationToken) + "&targetUrl="
        + encodeURIComponent("/Checkout.action?origin=" + origin + "&offer=maxNoteSize");
    } else if (/nearQuota/.test(this.className)) {
      if (premium) {
        url = baseUrl + "/SetAuthToken.action?auth="
          + encodeURIComponent(tokens.authenticationToken) + "&targetUrl="
          + encodeURIComponent("/QuotaCheckout.action?origin=" + origin + "&offer=nearQuota");
      } else {
        url = baseUrl + "/SetAuthToken.action?auth="
          + encodeURIComponent(tokens.authenticationToken) + "&targetUrl="
          + encodeURIComponent("/Checkout.action?origin=" + origin + "&offer=nearQuota");
      }
    }
    Browser.sendToExtension({name: "main_openWindow", width: 800, height: 600, url: url});
  } else {
    dismiss();
  }
}

function handleFailure(request, sender, sendResponse) {
  // clear();
  document.body.className = "error";
  errorTitle.innerText = Browser.i18n.getMessage("cannotSaveClip");
  // isError = true;

  // Just so we don't get null pointers.
  // if (!message) message = {};
  switch (request.error) {
    case "overQuota":
      if (premium) {
        errorDetails.innerText = Browser.i18n.getMessage("notification_quotaExceededPremium");
        errorButton.innerText = Browser.i18n.getMessage("getMoreSpacePremium");
      } else {
        errorDetails.innerText = Browser.i18n.getMessage("notification_quotaExceededFree");
        errorButton.innerText = Browser.i18n.getMessage("upgradeToPremium");
      }
      errorButton.className += " upgradable overQuota";
      break;
    case "noteSizeExceeded":
      if (premium) {
        errorDetails.innerText = Browser.i18n.getMessage("noteSizeExceededPremium");
        errorButton.className = errorButton.className.replace(/\s*upgradable/g, "");
        errorButton.innerText = Browser.i18n.getMessage("ok");
      } else {
        errorDetails.innerText = Browser.i18n.getMessage("noteSizeExceededFree");
        errorButton.className += " upgradable noteSizeExceeded";
        errorButton.innerText = Browser.i18n.getMessage("upgradeToPremium");
      }
      break;
  }
  window.parent.postMessage({ name: "setClipResultHeight", height: calcHeight() }, "*");

  // if (request.error.title) {
  //   setTitle(null, request.error.title);
  // }
  // if (request.error.details) {
  //   document.querySelector("#notificationDetails").innerHTML = request.error.details;
  // }
  // if (request.error.headline) {
  //   document.querySelector("#notificationHeadline").innerHTML = request.error.headline;
  // }

  // 
  // else if (message.errorType == "http") {
  //   setTitle(message.title, "desktopNotification_unableToSaveClip");
  //   document.querySelector(errorActions).style.display = "block";
  // }
  // 
  // else if (message.errorType == "tooManyRetries") {
  //   setTitle(message.title, "desktopNotification_clipProcessorTooManyRetries");
  // }
  // 
  // else if (message.errorType == "authenticationToken") {
  //   setTitle(message.title, "desktopNotification_clipProcessorSignInTitle");
  //   setDetails(Browser.i18n.getMessage("desktopNotification_clipProcessorSignInMessage"));
  //   document.querySelector(errorActions).style.display = "block";
  // }
  // 
  // 
  // 
  // else if (message.errorType == "authExpired") {
  //   setHeadline(Browser.i18n.getMessage("authExpired"));
  // }
  // 
  // // Default.
  // else {
  //   var err = "None Given.";
  //   if (message.errorType != "") {
  //     err = message.errorType;
  //   }
  //   setHeadline(Browser.i18n.getMessage("desktopNotification_unableToSaveClipUnknown"));
  //   setDetails(Browser.i18n.getMessage("desktopNotification_unableToSaveClipUnknownMessage", [err]));
  //   document.querySelector(errorActions).style.display = "block";
  // }

  // if (document.querySelector("#notificationHeadline a")) {
  //   document.querySelector("#notificationHeadline a").addEventListener("click",
  //     function(evt) {
  //       Browser.sendToExtension({name:"main_openTab", url: this.href});
  //       evt.preventDefault();
  //       return false;
  //     }
  //   );
  // }
  // 
  // document.querySelector("#footer").className = "expanded";
}

function handleRelatedNotesClick() {
  Browser.sendToExtension({name: "main_recordActivity"});
  document.querySelector("#slider").className = document.querySelector("#slider").className
    .replace(/show\w+/g, "") + " showLeft";
  var className = document.querySelector("#siteSearchButton").className;
  document.querySelector("#siteSearchButton").className = className.replace(/(^|\s+)selected($|\s+)/, "");
  document.querySelector("#relatedNotesButton").className = "selected";
}

// function handleSiteSearchClick() {
//   Browser.sendToExtension({name: "main_recordActivity"});
//   var className = document.querySelector("#relatedNotesButton").className;
//   document.querySelector("#relatedNotesButton").className = className.replace(/(^|\s+)selected($|\s+)/, "");
//   document.querySelector("#siteSearchButton").className = "selected";
//   document.querySelector("#slider").className = document.querySelector("#slider").className
//     .replace(/show\w+/g, "") + " showRight";
//   if (!siteNotesRequested) {
//     Browser.sendToExtension({name: "main_performNoteSearch",
//       resultSpec: {
//         includeTitle: true,
//         includeUpdated: true,
//         includeAttributes: true,
//         includeLargestResourceMime: true,
//         includeLargestResourceSize: true,
//         includeNotebookGuid: true,
//         includeUpdateSequenceNum: true
//       },
//       noteFilter: {
//         order: 2, // NoteSortOrder.UPDATED
//         words: buildSiteQuery()
//       }
//     });
//     siteNotesRequested = true;
//   }
// }

function handleSuccess(request, sender, sendResponse) {
  // clear();
  success = true;
  if (!receivedRelatedNotes) {
    successResponse = request;
    return;
  }
  document.body.className += " done";
  setStatusTitle("desktopNotification_clipUploaded");
  noteGuid = request.noteGuid;
  shardId = request.shardId;
  // enlarge the reminders setting dialog so that the text fits in the box
  // without wrapping
  if (addDateButton.scrollWidth > addDateButton.clientWidth || remindersSetter.scrollHeight > remindersSetter.clientHeight) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      if (/clip_result\.css/.test(document.styleSheets[i].href)) {
        for (var j = 0; j < document.styleSheets[i].cssRules.length; j++) {
          if (document.styleSheets[i].cssRules[j].selectorText == "#remindersSetter") {
            if (addDateButton.scrollWidth > addDateButton.clientWidth) {
              document.styleSheets[i].cssRules[j].style.width = (112 + addDateButton.scrollWidth - addDateButton.clientWidth) + "px";
            } else if (remindersSetter.scrollHeight > remindersSetter.clientHeight) {
              document.styleSheets[i].cssRules[j].style.height = (53 + remindersSetter.scrollHeight - remindersSetter.clientHeight) + "px";
            }
            break;
          }
        }
        break;
      }
    }
  }

  // show one of the tips if applicable. if multiple tips are applicable, choose
  // in the following order:
  // 1. near quota upsell
  // 2. Skitch
  // 3. EN Food
  // show premium upsell if user is above 75% of the quota
  var uploaded = request.uploaded;
  var authInfo = request.savedAuthInfo;
  var shownNearQuotaUpsell = request.shownNearQuotaUpsell;
  if (uploaded && uploaded[userId] && authInfo && authInfo.userInfo
    && authInfo.userInfo[userId] && authInfo.userInfo[userId].quota
    && (!shownNearQuotaUpsell || !shownNearQuotaUpsell[userId])
    && (uploaded[userId] + request.noteSize) / authInfo.userInfo[userId].quota > 0.75) {
      if (!shownNearQuotaUpsell) {
        shownNearQuotaUpsell = {};
      }
      shownNearQuotaUpsell[userId] = true;
      Browser.sendToExtension({ name: "setPersistentValue", key: "shownNearQuotaUpsell", value: shownNearQuotaUpsell });
      tipsContainer.className += " nearQuota";
      if (premium) {
        document.querySelector("#nearQuotaTip .tipDetails").innerText = Browser.i18n.getMessage("nearQuotaPremium");
        nearQuotaButton.innerText = Browser.i18n.getMessage("getMoreSpacePremium");
      } else {
        document.querySelector("#nearQuotaTip .tipDetails").innerText = Browser.i18n.getMessage("nearQuotaFree");
        nearQuotaButton.innerText = Browser.i18n.getMessage("upgradeToPremium");
      }
      selectSmartSection.call(tipsButton);
  } else if (request.skitch) {
    tipsContainer.className += " skitch";
    selectSmartSection.call(tipsButton);
    Browser.sendToExtension({
      name: "trackEvent",
      action: "skitch",
      category: "cross promo shown",
      label: userType,
      userId: userId
    });
  } else if (request.recipe) {
    tipsContainer.className += " food";
    selectSmartSection.call(tipsButton);
    Browser.sendToExtension({
      name: "trackEvent",
      action: "food",
      category: "cross promo shown",
      label: userType,
      userId: userId
    });
  } else { // hide the tips section if we don't have something to show
    tipsButton.style.display = "none";
  }
  if (relatedNotesButton.style.display == "none" && tipsButton.style.display == "none") {
    document.body.className += " noSmart";
  }
  sameSiteNotesButton.style.maxWidth = (tabs.offsetWidth - 24 - relatedNotesButton.offsetWidth - tipsButton.offsetWidth) + "px";
  window.parent.postMessage({ name: "setClipResultHeight", height: calcHeight() }, "*");
}

// function hideOverlay() {
//   // Persistent.set("suppressRelatedNotesDiscoveryNotice", true);
//   var overlay = document.querySelector(".newFeatureOverlay");
//   overlay.className += " hidden";
//   overlay.addEventListener("webkitAnimationEnd", function() { overlay.style.display = "none"; }, false);
//   document.removeEventListener("click", hideOverlay);
// }

function msgHandlerReceiveClipResultInfo(request, sender, sendResponse) {
  setStatusTitle(null, request.title);
  type = request.type;
  notebookGuid = request.notebookGuid;
  shareKey = request.shareKey;
  if (type == "linked" || type == "biz") {
    linkedNotebookGuid = request.linkedNotebookGuid ? request.linkedNotebookGuid : notebookGuid;
  }
  url = request.url;

  client = request.client;
  baseUrl = request.baseUrl;
  skitchButton.href = baseUrl + "/skitch";
  china = /china/i.test(request.locale);
  if (china) {
    tipsContainer.className += " china";
  }
  userId = request.userId;
  tokens = request.auth;
  premium = request.premium;
  userType = "free";
  if (tokens.bizAuthenticationToken) {
    userType = "business";
  } else {
    userType = "premium";
  }

  sameSiteNotesButton.innerText = Browser.i18n.getMessage("clipsFromThisSite", url.replace(/^https?:\/\/(.*?)\/.*/, "$1"));
  window.parent.postMessage({ name: "setClipResultHeight", height: calcHeight() }, "*");
}

function receiveRelatedNotes(request, sender, sendResponse) {
  receivedRelatedNotes = true;
  // if (!Persistent.get("suppressRelatedNotesDiscoveryNotice")) {
  //   Persistent.set("suppressRelatedNotesDiscoveryNotice", true);
  //   document.querySelector(".newFeatureOverlay").style.display = "";
  //   document.addEventListener("click", hideOverlay);
  // }
  var relatedSnippets = new NoteSnippets(document.querySelector("#relatedNotesContainer"), baseUrl, userId,
    null, client, { pers: tokens.authenticationToken, biz: tokens.bizAuthenticationToken },
    null, false, function(noteGuid, isBizNote) {
      if (isBizNote) {
        relatedNotesClicked[noteGuid] = 2;
      } else {
        relatedNotesClicked[noteGuid] = 1;
      }
    });
  relatedSnippets.setNotes(request.relatedNotes);
  if (relatedSnippets.hasAtLeastOneNotebookName()) {
    smartPanel.className += " hasAtLeastOneNotebookName";
  }
  if (request.relatedNotes && request.relatedNotes.length > 0) {
    totalNumRelatedNotes += request.relatedNotes.length;
    for (var i = 0; i < request.relatedNotes.length; i++) {
      if (request.relatedNotes[i].inBusinessNotebook) {
        numBizRelatedNotes++;
      }
    }
    selectSmartSection.call(relatedNotesButton);
    window.parent.postMessage({ name: "setClipResultHeight", height: calcHeight() }, "*");
  } else {
    recordedRelatedResultsClick = true;
    // if there aren't any, then don't show the related notes section
    relatedNotesButton.style.display = "none";
  }
  if (success) {
    handleSuccess(successResponse);
  }
  // if (relatedSnippets.hasAtLeastOneNotebookName()) {
  //   var elementsSelector = "#relatedNotesContainer, #siteNotesContainer, #slider, #relatedNotesScrollable, #relatedNotes";
  //   var elements = document.querySelectorAll(elementsSelector);
  //   for (var e = 0; e < elements.length; e++) {
  //     elements[e].className = (elements[e].className + " hasNotebookName");
  //   }
  // }

  // Disable the relatedNotes button if there are no related notes.
  // if (!request.relatedNotes || request.relatedNotes.length == 0) {
  //   handleSiteSearchClick();
  //   document.querySelector("#relatedNotesButton").className = "disabled";
  //   document.querySelector("#relatedNotesButton").removeEventListener("click", handleRelatedNotesClick);
  // }
}

function receiveSameSiteNotes(request, sender, sendResponse) {
  if (request.notesSize) {
    // if we call this after the note has been clipped, siteNotes will
    // include this note, which we don't want, so remove the first one.
    // if we're clipping into a shared notebook, it won't be in this list, so
    // don't remove it in that case
    if (type != "linked") {
      if (success) {
        request.notes.list.shift();
        request.totalNotes--;
      }
    }
    var siteSnippets = new NoteSnippets(document.querySelector("#sameSiteNotesContainer"),
      baseUrl, userId, null, client, { pers: tokens.authenticationToken,
      biz: tokens.bizAuthenticationToken }, buildSiteQuery(), false,
      function(noteGuid, isBizNote) {
        if (isBizNote) {
          sameSiteNotesClicked[noteGuid] = 2;
        } else {
          sameSiteNotesClicked[noteGuid] = 1;
        }
      });
    siteSnippets.setNotes(request.notes.list, request.totalNotes);
    totalNumSameSiteNotes += request.notes.list.length;
    for (var i = 0; i < request.notes.list.length; i++) {
      if (request.notes.list[i].inBusinessNotebook) {
        numBizSameSiteNotes++;
      }
    }
  } else {
    recordedSameSiteClick = true;
  }
}

function recordAnalytics() {
  if (!recordedRelatedResultsClick) {
    recordedRelatedResultsClick = true;
    Browser.sendToExtension({
      name: "trackEvent",
      userId: userId,
      category: "Post UX",
      action: "general related notes clickthru",
      label: userType,
      value: (Object.keys(relatedNotesClicked).length * 100) / totalNumRelatedNotes
    });
    if (userType == "business" && numBizRelatedNotes > 0) {
      var numBizClicked = 0;
      for (var guid in relatedNotesClicked) {
        if (relatedNotesClicked[guid] == 2) {
          numBizClicked++;
        }
      }
      Browser.sendToExtension({
        name: "trackEvent",
        userId: userId,
        category: "Post UX",
        action: "business related notes clickthru",
        label: userType,
        value: (numBizClicked * 100) / Object.keys(relatedNotesClicked).length
      });
    }
  }
  if (!recordedSameSiteClick) {
    recordedSameSiteClick = true;
    Browser.sendToExtension({
      name: "trackEvent",
      userId: userId,
      category: "Post UX",
      action: "general same site notes clickthru",
      label: userType,
      value: (Object.keys(sameSiteNotesClicked).length * 100) / totalNumSameSiteNotes
    });
    if (userType == "business" && numBizSameSiteNotes > 0) {
      var numBizClicked = 0;
      for (var guid in sameSiteNotesClicked) {
        if (sameSiteNotesClicked[guid] == 2) {
          numBizClicked++;
        }
      }
      Browser.sendToExtension({
        name: "trackEvent",
        userId: userId,
        category: "Post UX",
        action: "business same site notes clickthru",
        label: userType,
        value: (numBizClicked * 100) / Object.keys(sameSiteNotesClicked).length
      });
    }
  }
}

function selectDateTimePart() {
  var focused = document.querySelector("#date span.focused");
  if (focused) {
    focused.className = focused.className.replace(/\s*focused/g, "");
  }
  this.className += " focused";
}

function selectSmartSection() {
  var pressed = document.querySelector(".tab.pressed");
  if (pressed) {
    pressed.className = pressed.className.replace(/\s*pressed/g, "");
  }
  this.className += " pressed";
  smartPanel.className = smartPanel.className.replace(/\s*(relatedNotes|sameSiteNotes|tips)/g, "") + " " + this.id;
  if (this.id == "relatedNotes") {
    
  } else if (this.id == "sameSiteNotes") {
    if (!siteNotesRequested) {
      Browser.sendToExtension({name: "main_performNoteSearch",
        resultSpec: {
          includeTitle: true,
          includeUpdated: true,
          includeAttributes: true,
          includeLargestResourceMime: true,
          includeLargestResourceSize: true,
          includeNotebookGuid: true,
          includeUpdateSequenceNum: true
        },
        noteFilter: {
          order: 2, // NoteSortOrder.UPDATED
          words: buildSiteQuery()
        }
      });
      siteNotesRequested = true;
    }
  } else if (this.id == "tips") {

  }
}

function setReminderTime(date, dateInputFocus) {
  var reminderTime = new Date(date.year, date.month, date.date, hour, minute, 0, 0);
  dateInput.innerHTML = datePicker.format(reminderTime);
  selectedMonth = document.querySelector("#selectedMonth");
  selectedDate = document.querySelector("#selectedDate");
  selectedYear = document.querySelector("#selectedYear");
  selectedHour = document.querySelector("#selectedHour");
  selectedMinute = document.querySelector("#selectedMinute");
  selectedMeridian = document.querySelector("#selectedMeridian");
  selectedMonth.addEventListener("click", selectDateTimePart);
  selectedDate.addEventListener("click", selectDateTimePart);
  selectedYear.addEventListener("click", selectDateTimePart);
  selectedHour.addEventListener("click", selectDateTimePart);
  selectedMinute.addEventListener("click", selectDateTimePart);
  selectedMeridian.addEventListener("click", selectDateTimePart);
  if (dateInputFocus) {
    switch (dateInputFocus) {
      case "year":
        selectedYear.click();
        break;
      case "month":
        selectedMonth.click();
        break;
      case "date":
        selectedDate.click();
        break;
      case "hour":
        selectedHour.click();
        break;
      case "minute":
        selectedMinute.click();
        break;
      case "meridian":
        selectedMeridian.click();
        break;
    }
  }
  return reminderTime;
}

function setStatusTitle(_status, _title) {
  if (_status) {
    currentStatus = _status;
  }
  if (_title) {
    clipTitle = _title;
  }
  text.innerHTML = Browser.i18n.getMessage(currentStatus, [ clipTitle ]);
}

function showSyncing() {
  setStatusTitle("contentclipper_syncing");
  // ask for related notes from the background
  Browser.sendToExtension({
    name: "getRelatedNotes",
    pendingNoteKey: pendingNoteKey,
    tokens: tokens,
    userId: userId
  });
}

window.addEventListener("DOMContentLoaded", function() {
  main = document.querySelector("#main");
  icon = document.querySelector("#icon");
  text = document.querySelector("#text");
  reminders = document.querySelector("#reminders");
  remindersSetter = document.querySelector("#remindersSetter");
  addDateButton = document.querySelector("#addDate");
  tomorrow = document.querySelector("#tomorrow");
  nextWeek = document.querySelector("#nextWeek");
  dateInput = document.querySelector("#date");
  datePicker = new DatePicker(document.querySelector("#datePicker"), function(date, dateInputFocus) {
    var reminderTime = setReminderTime(date, dateInputFocus);
    var token = tokens.authenticationToken;
    if (type == "biz") {
      token = tokens.bizAuthenticationToken;
    } else if (type == "linked") {
      token = tokens.linked;
    }
    Browser.sendToExtension({
      name: "setReminder",
      auth: token,
      noteGuid: noteGuid,
      title: clipTitle,
      sourceURL: url,
      reminderOrder: reminderOrder,
      reminderTime: reminderTime - 0
    });
  });
  editLink = document.querySelector("#edit");
  close = document.querySelector("#close");
  smartPanel = document.querySelector("#smartPanel");
  var tabs = document.querySelector("#tabs");
  relatedNotesButton = document.querySelector("#relatedNotes");
  sameSiteNotesButton = document.querySelector("#sameSiteNotes");
  tipsButton = document.querySelector("#tips");
  errorTitle = document.querySelector("#errorTitle");
  errorDetails = document.querySelector("#errorDetails");
  errorButton = document.querySelector("#errorButton");
  tipsContainer = document.querySelector("#tipsContainer");
  nearQuotaButton = document.querySelector("#nearQuotaTip .tipButton");
  skitchButton = document.querySelector("#skitchTip .tipButton");
  iosFoodButton = document.querySelector("#iosFood");
  androidFoodButton = document.querySelector("#androidFood");
  GlobalUtils.localize(document.body);
  var now = new Date();
  setReminderTime({ year: now.getFullYear(), month: now.getMonth(), date: now.getDate() });
  pendingNoteKey = /#(.+)/.exec(window.location.hash)[1];
  addHandlers();
});

window.addEventListener("click", function(evt) {
  if (!remindersSetter.contains(evt.srcElement) && !reminders.contains(evt.srcElement)) {
    remindersSetter.className = remindersSetter.className.replace(/\s*visible/g, "");
    reminders.className = reminders.className.replace(/\s*changingDate/g, "");
    var focused = document.querySelector("#date span.focused");
    if (focused) {
      focused.className = focused.className.replace(/\s*focused/g, "");
    }
    window.parent.postMessage({ name: "setClipResultHeight", height: calcHeight() }, "*");
  }
});
window.addEventListener("keydown", handleDateTimeKeydown);
window.addEventListener("beforeunload", recordAnalytics);
window.addEventListener("unload", recordAnalytics);

Browser.addMessageHandlers({
  doneSharing: doneSharing,
  handleFailure: handleFailure,
  handleSuccess: handleSuccess,
  sameSiteNotes: receiveSameSiteNotes,
  receiveClipResultInfo: msgHandlerReceiveClipResultInfo,
  relatedNotes: receiveRelatedNotes,
  showSyncing: showSyncing
});

document.addEventListener("keyup", function(e){
  if (e && e.keyCode && e.keyCode == 27) { // ESC
    dismiss();
  }
});
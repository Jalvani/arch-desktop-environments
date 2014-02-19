"use strict";

var baseUrl;
var locale;
var userId;
var shardId;
var client;
var userType;

var analyticsRecorded = false;
var notesClicked = {};
var totalNumNotes = 0;
var numBizNotes = 0;

window.addEventListener("DOMContentLoaded", function() {
  GlobalUtils.localize(document.body);
  document.querySelector("#closeButton").addEventListener("click", toggleCloseOptions);
  document.querySelector("#dismiss").addEventListener("click", dismiss);
  document.querySelector("#dismissForever").addEventListener("click", dismissForever);

  var url = decodeURI(document.location.href);
  var firstRegex = new RegExp("locale=(.+)&baseUrl=([^&]+)");
  var genParams = firstRegex.exec(url);
  locale = genParams[1];
  baseUrl = genParams[2];
  var secondRegex = new RegExp("userId=(.+)&shardId=(.+)&client=(.+)&userType=(.+)");
  genParams = secondRegex.exec(url);
  if (genParams) {
    userId = genParams[1];
    shardId = genParams[2];
    client = genParams[3];
    userType = genParams[4];
  }

  // set China logos
  if (/china/i.test(locale)) {
    document.querySelector(".branding span").className = "china";
  }

  if (userId) {
    Browser.addMessageHandlers({
      simsearch_receiveRelatedNotes: msgHandlerReceiveRelatedNotes,
      tellUserToLogin: tellUserToLogin
    });

    Browser.sendToExtension({name: "simSearch_getNotesRelatedToSearchQuery"});
  }
  else {
    tellUserToLogin();
  }
});
window.addEventListener("unload", recordAnalytics);
window.addEventListener("beforeunload", recordAnalytics);

function msgHandlerReceiveRelatedNotes(request, sender, sendResponse) {
  document.querySelector(".branding").href = baseUrl + "/SetAuthToken.action?auth="
    + encodeURIComponent(request.tokens.pers) + "&targetUrl="
    + encodeURIComponent("/Home.action");

  if (request.relatedNotes) {
    // render related notes
    var notes = request.relatedNotes;
    var attachmentPoint;
    if (request.type === "account") {
      attachmentPoint = document.querySelector("#account .noteSectionNotes");
      var sectionTitle;
      var i18nKey;
      if (request.isBizUser) {
        i18nKey = "searchHelperTopMatchesBiz";
      }
      else {
        i18nKey = "searchHelperTopMatchesPers";
      }
      if (notes.length == 1) {
        i18nKey += "One";
      }
      sectionTitle = Browser.i18n.getMessage(i18nKey, [notes.length]);
      document.querySelector("#account .noteSectionTitle").innerText = sectionTitle;
    }
    else if (request.type === "library") {
      attachmentPoint = document.querySelector("#library .noteSectionNotes");
      if (notes.length == 1) {
        document.querySelector("#library .noteSectionTitle").innerText =
          Browser.i18n.getMessage("searchHelperTopBizLibraryMatchesOne");
      } else {
        document.querySelector("#library .noteSectionTitle").innerText =
          Browser.i18n.getMessage("searchHelperTopBizLibraryMatches", [notes.length]);
      }
    }
    else if (request.type === "all") {
      attachmentPoint = document.querySelector("#all .noteSectionNotes");
      if (notes.length == 1) {
        document.querySelector("#all .noteSectionTitle").innerText =
          Browser.i18n.getMessage("searchHelperTopMatchesPersOne");
      } else {
        document.querySelector("#all .noteSectionTitle").innerText =
          Browser.i18n.getMessage("searchHelperTopMatchesPers", [notes.length]);
      }
    }
    if (notes.length > 0) {
      attachmentPoint.parentNode.style.display = "block";
    }
    else {
      attachmentPoint.parentNode.style.display = "none";
    }
    var noteSnippets = new NoteSnippets(attachmentPoint, baseUrl, userId,
      shardId, client, request.tokens, null, true, function(noteGuid, isBizNote) {
        if (isBizNote) {
          notesClicked[noteGuid] = 2;
        } else {
          notesClicked[noteGuid] = 1;
        }
      });
    noteSnippets.renderBlocks(notes);
    totalNumNotes += notes.length;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].inBusinessNotebook) {
        numBizNotes++;
      }
    }

    var noteSectionShadow = document.createElement("div");
    noteSectionShadow.className = "noteSectionShadow";
    attachmentPoint.parentNode.insertBefore(noteSectionShadow, attachmentPoint);
    attachmentPoint.addEventListener("overflowchanged", function(evt) {
      if (evt.horizontalOverflow) {
        noteSectionShadow.style.display = "block";
      }
      else {
        noteSectionShadow.style.display = "none";
      }
    });

    // clear the no results text if it has been set by the results from the other shard
    if (document.querySelector("#noNotes").style.display == "block") {
      document.querySelector("#noNotes").style.display = "none";
      Browser.sendToExtension({ name: "setPersistentValue", key: userId + "_noSimsearchResultsShown", value: false });
    }

    // Tell the content script on this iframe's parent page the height of this page so that the iframe's height can be
    // resized to fit the content.
    parent.postMessage({ name: "simSearch_sendHeight",
      height: getWindowHeight(noteSnippets.hasAtLeastOneNotebookName()) }, "*");
  }
  else {
    // make sure that this section is hidden
    document.querySelector("#" + request.type + " .noteSectionNotes").parentNode.style.display = "none";
    document.querySelector("#" + request.type + " .noteSectionNotes").innerHTML = "";
    if (getWindowHeight() > 0) {
      // do nothing and use height that was previously set
    }
    else if (!request.noSimsearchResultsShown || request.noSimsearchResultsShown == false) {
      document.querySelector("#noNotes").style.display = "block";
      parent.postMessage({ name: "simSearch_sendHeight", height: getWindowHeight() }, "*");
      // remember not to show in the future if there are no results
      Browser.sendToExtension({ name: "setPersistentValue", key: userId + "_noSimsearchResultsShown", value: true });
    }
    else {
      parent.postMessage({name: "simSearch_sendHeight", height: 0}, "*");
    }
  }
}

function getWindowHeight(hasAtLeastOneNotebookName) {
  var accountSection = document.querySelector("#account .noteSectionNotes");
  var librarySection = document.querySelector("#library .noteSectionNotes");
  var allSection = document.querySelector("#all .noteSectionNotes");
  var noNotes = document.querySelector("#noNotes");
  var height = 0;
  if (accountSection.innerHTML != "") {
    height = 263;
  }
  if (librarySection.innerHTML != "" || allSection.innerHTML != "") {
    height = hasAtLeastOneNotebookName ? 282 : 263;
  }
  if (accountSection.innerHTML != "" && librarySection.innerHTML != "") {
    height = 500;
  }
  if (noNotes.style.display == "block") {
    height = 85;
  }
  return height;
}

function toggleCloseOptions() {
  if (document.querySelector("#closeOptions").style.display == "block") {
    document.querySelector("#closeOptions").style.display = "none";
  }
  else {
    document.querySelector("#closeOptions").style.display = "block";
  }
}

function dismiss() {
  parent.postMessage({name: "simSearch_sendHeight", height: 0}, "*");
  parent.postMessage({name: "temporarilyDisableSimSearch"}, "*");
}

function dismissForever() {
  dismiss();
  Browser.sendToExtension({name: "main_setOption", options: {"useSearchHelper": false}})
}

function tellUserToLogin() {
  document.querySelector("#simSearchNotes").innerHTML = Browser.i18n.getMessage("searchHelperLoginMessage",
    [baseUrl + "/Login.action"]);
  parent.postMessage({name: "simSearch_sendHeight", height: 85}, "*");
}

function recordAnalytics() {
  if (!analyticsRecorded && totalNumNotes) {
    analyticsRecorded = true;
    Browser.sendToExtension({
      name: "trackEvent",
      userId: userId,
      category: "Simsearch",
      action: "general clickthru",
      label: userType,
      value: (Object.keys(notesClicked).length * 100) / totalNumNotes
    });
    if (userType == "business" && numBizNotes > 0) {
      var numBizClicked = 0;
      for (var guid in notesClicked) {
        if (notesClicked[guid] == 2) {
          numBizClicked++;
        }
      }
      Browser.sendToExtension({
        name: "trackEvent",
        userId: userId,
        category: "Simsearch",
        action: "business clickthru",
        label: userType,
        value: (numBizClicked * 100) / Object.keys(notesClicked).length
      });
    }
  }
}
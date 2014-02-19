function ClipResultCoordinator() {
  var clipResult;

  function hideClipResult(fadeout) {
    if (clipResult && clipResult.parentNode) {
      if (fadeout) {
        clipResult.addEventListener("webkitAnimationEnd", function() {
          clipResult.parentNode.removeChild(clipResult);
          clipResult = null;
        }, false);
        clipResult.className = "hide";
      } else {
        clipResult.parentNode.removeChild(clipResult);
        clipResult = null;
      }
    }
  }

  function msgHandlerShowClipResult(request, sender, sendResponse) {
    showClipResult(request.pendingNoteKey, function() {
      document.body.style.overflow = "";
      Browser.sendToExtension({
        name: "clipResultShown",
        pendingNoteKey: request.pendingNoteKey,
        portId: request.portId,
        userId: request.userId,
        userType: request.userType
      });
    });
  }

  function setHeight(height) {
    if (clipResult) {
      clipResult.style.height = height + "px";
    }
  }

  function setInfo(info) {
    if (clipResult) {
      clipResult.contentWindow.postMessage(info, Browser.extension.getURL(""));
    }
  }

  function showClipResult(pendingNoteKey, callback) {
    hideClipResult(false);
    clipResult = document.createElement("iframe");
    clipResult.id = "evernoteClipperResult";
    clipResult.style.cssText += " visibility: visible !important;";
    if (/^frameset$/i.test(document.body.nodeName)) {
      document.body.parentNode.insertBefore(clipResult, null);
    }
    else {
      document.body.insertBefore(clipResult, null);
    }
    clipResult.addEventListener("load", callback);
    clipResult.src = Browser.extension.getURL("content/clip_result/clip_result.html#" + pendingNoteKey);
    window.focus();
  }

  window.addEventListener("click", hideClipResult);

  window.addEventListener("message", function(evt) {
    if (evt.data.name == "setClipResultHeight") {
      setHeight(evt.data.height);
    } else if (evt.data.name == "hideClipResult") {
      hideClipResult(true);
    }
  });

  this.hideClipResult = hideClipResult;
  this.setInfo = setInfo;
  this.showClipResult = showClipResult;

  Browser.addMessageHandlers({
    showClipResult: msgHandlerShowClipResult
  });

  Object.preventExtensions(this);
}
Object.preventExtensions(ClipResultCoordinator);
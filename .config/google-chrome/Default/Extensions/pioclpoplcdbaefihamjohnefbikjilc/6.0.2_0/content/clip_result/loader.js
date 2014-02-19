function ClipResult() {
  "use strict";

  var attrs = null;
  var iframe = null;
  var auth = null;
  var jsonRpc = null;

  window.addEventListener("message", function (msg) {
    if (!msg || !msg.data || !msg.data.name) {
      return;
    }

    var handlers = {
      content_getAttributes: msgHandlerGetAttributes,
      content_frameReady: msgHandlerFrameReady,
    }

    if (msg.data.name && handlers[msg.data.name]) {
      handlers[msg.data.name](msg.data, null, null);
    }
  });

  Browser.addMessageHandlers({
    noteSearchResult: receiveSiteNotes
  });

  function msgHandlerGetAttributes(data) {
    Browser.sendToExtension({name: "bounce", message: {name: "content_getAttributes", attrs: attrs}});
  }

  function msgHandlerFrameReady(request, sender, sendResponse) {
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
  }

  // function waitComplete() {
  //   Browser.sendToExtension({name: "bounce", message: {name: "content_waitComplete"}});
  // }

  // this.waitComplete = waitComplete;
  Object.preventExtensions(this);
}

Object.preventExtensions(ClipResult);
var clipResult;

// Don't load in frames.
if (window.parent === window) {
  var clipResult = new ClipResult();
}

if (!document.head) {
  document.documentElement.insertBefore(document.createElement("head"), document.body);
}

// mark the page as a safari page so that browser-specific css will load
if (SAFARI) {
  document.body.className += " evernoteSafari";
}

Browser.sendToExtension({ name: "getKeyboardShortcuts", shortcuts: ["startWebClipperShortcut"] });

// clipping screenshot by context menu uses this
function msgHandlerHideBodyScrollbar(request, sender, sendResponse) {
  document.body.style.overflow = "hidden";
  Browser.sendToExtension({
    name: "bodyScrollbarHidden",
    portId: request.portId,
    userId: request.userId,
    userType: request.userType
  });
}

function msgHandlerReceiveOption(request, sender, sendResponse) {
  if (request.key == "enableKeyboardShortcuts" && request.value) {
    if (msgHandlerScriptsInjectedAlready) {
      msgHandlerScriptsInjectedAlready({});
    }
  }
}

function msgHandlerReceiveStartShortcut(request, sender, sendResponse) {
  if (request.keys["startWebClipperShortcut"]) {
    window.addEventListener("keypress", function(evt) {
      // ` to start the extension
      if (evt.keyCode == parseInt(request.keys["startWebClipperShortcut"].split(",")[0])) {
        // user isn't typing in a text box
        if (evt.srcElement.nodeName != "INPUT" && evt.srcElement.nodeName != "TEXTAREA") {
          // check if keyboard shortcuts are enabled
          Browser.sendToExtension({ name: "getOption", option: "enableKeyboardShortcuts" });
        }
      }
    });
  }
}

Browser.addMessageHandlers({
  hideBodyScrollbar: msgHandlerHideBodyScrollbar,
  receiveKeyboardShortcuts: msgHandlerReceiveStartShortcut,
  receiveOption: msgHandlerReceiveOption
});
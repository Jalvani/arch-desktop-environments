var injected = false;
Browser.addMessageHandlers({
  isExtensionOpen: isExtensionOpen,
  scriptsInjectedAlready: msgHandlerScriptsInjectedAlready
});

function isExtensionOpen(request, sender, sendResponse) {
  var sidebar = document.querySelector("#evernoteGlobalTools");
  if (sidebar && /evernoteClipperVisible/.test(sidebar.className)) {
    Browser.sendToExtension({ name: "showOpenState" });
  }
}

function msgHandlerScriptsInjectedAlready(request, sender, sendResponse) {
  Browser.sendToExtension({
    name: "scriptsInjectedAlready",
    injected: injected,
    type: request.type,
    source: request.source,
    selectionText: request.selectionText,
    imageUrl: request.imageUrl
  });
}

Browser.sendToExtension({ name: "tabLoaded" });
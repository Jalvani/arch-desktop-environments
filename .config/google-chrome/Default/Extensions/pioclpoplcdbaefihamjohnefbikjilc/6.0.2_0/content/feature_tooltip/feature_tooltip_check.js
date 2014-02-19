// shows the pdf tooltip the first time the user lands on a pdf
if (window == window.parent) {
  var flags = [ "gmailTooltip" ];
  var tooltip;
  var bootstrapInfo;

  function removeGmailTooltip() {
    if (tooltip && tooltip.parentElement) {
      tooltip.parentElement.removeChild(tooltip);
      tooltip = null;
    }
  }

  function init(evt) {
    if (evt && evt.animationName == "nodeInserted") {
      Browser.sendToExtension({
        name: "main_isAuthenticated",
        type: "tooltip",
        bootstrapInfo: { name: null }
      });
    }
  }

  function isGmailThread() {
    if (/^https:\/\/mail\.google\.com\/mail\//.test(document.location.href)) {
      var threadButtons = document.querySelectorAll("span > div > span > [src='images/cleardot.gif']");
      if (threadButtons.length > 0) {
        return true;
      }
    }
    return false;
  }

  function msgHandlerIsAuthenticated(request, sender, sendResponse) {
    if (request.auth) {
      for (var i = 0; i < flags.length; i++) {
        Browser.sendToExtension({
          name: "getPersistentFlag",
          key: flags[i] + request.auth.userId,
          set: true,
          setValue: true
        });
      }
      if (request.bootstrapInfo) {
        bootstrapInfo = request.bootstrapInfo;
      }
    }
  }

  function msgHandlerReceivePersistentFlag(request, sender, sendResponse) {
    if (/^gmailTooltip/.test(request.key) && request.value != true && isGmailThread()) {
      showTooltip("gmailTooltip");
    }
  }

  function showTooltip(type) {
    tooltip = document.createElement("iframe");
    tooltip.style.height = "141px";
    tooltip.style.width = "316px";
    tooltip.style.border = "none";
    tooltip.style.position = "fixed";
    tooltip.style.top = "30px";
    tooltip.style.right = "30px";
    tooltip.style.borderRadius = "5px";
    tooltip.style.border = "2px solid rgba(34, 40, 44, 0.38)";
    tooltip.style.zIndex = "2147483647";
    tooltip.src = Browser.extension.getURL("content/pdf_tooltip/pdf_tooltip.html#" + type);
    document.documentElement.appendChild(tooltip);
  }

  window.addEventListener("message", function(evt) {
    if (evt.data.name == "closePdfTooltip") {
      removeGmailTooltip();
    }
  });

  Browser.addMessageHandlers({
    receivePersistentFlag: msgHandlerReceivePersistentFlag,
    tooltip_isAuthenticated: msgHandlerIsAuthenticated
  });

  document.addEventListener("webkitAnimationStart", init);
}
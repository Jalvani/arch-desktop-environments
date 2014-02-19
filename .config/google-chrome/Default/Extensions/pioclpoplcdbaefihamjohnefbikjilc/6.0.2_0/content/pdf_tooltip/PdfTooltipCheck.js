// shows the pdf tooltip the first time the user lands on a pdf
if (window == window.parent) {
  function msgHandlerIsAuthenticated(request, sender, sendResponse) {
    if (request.auth && !request.pdfTooltipShown) {
      var tooltip = document.createElement("iframe");
      document.body.appendChild(tooltip);
      tooltip.id = "evernotePdfTooltip";
      tooltip.style.position = "absolute";
      tooltip.style.top = "30px";
      tooltip.style.right = "30px";
      tooltip.style.width = "310px";
      tooltip.style.height = "145px";
      tooltip.style.borderRadius = "5px";
      tooltip.style.border = "2px solid rgba(34, 40, 44, 0.38)";
      tooltip.src = Browser.extension.getURL("content/pdf_tooltip/pdf_tooltip.html?userId="
        + request.auth.userId);
    }
  }

  function removePdfTooltip() {
    var tooltip = document.querySelector("#evernotePdfTooltip");
    if (tooltip) {
      tooltip.parentElement.removeChild(tooltip);
    }
  }

  var domLoaded = false;

  function init() {
    if (!domLoaded) {
      domLoaded = true;

      Browser.addMessageHandlers({
        pdfTooltip_isAuthenticated: msgHandlerIsAuthenticated
      });
      window.addEventListener("message", function(evt) {
        if (new RegExp(evt.origin, "i").test(Browser.extension.getURL(""))) {
          if (evt.data.name == "clipPdf") {
            removePdfTooltip();
            Browser.sendToExtension(evt.data);
          } else if (evt.data.name == "closePdfTooltip") {
            removePdfTooltip();
          }
        }
      });

      var embed = document.querySelector("embed");
      if (embed && /application\/pdf/i.test(embed.type)) {
        Browser.sendToExtension({ name: "main_isAuthenticated", type: "pdfTooltip" });
      } else if (/^https?:\/\/docs\.google\.com\/viewer\?url=.+/.test(document.location.href)) {
        for (var s = 0; s < document.scripts.length; s++) {
          if (/gviewApp\.setFileData/.test(document.scripts[s].innerText)) {
            if (/mimeType.+application\/pdf/.test(document.scripts[s].innerText)) {
              Browser.sendToExtension({ name: "main_isAuthenticated", type: "pdfTooltip" });
            }
            break;
          }
        }
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  document.onreadystatechange = function() {
    if (document.readyState == "complete") {
      init();
    }
  }
}
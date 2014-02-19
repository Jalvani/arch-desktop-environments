(function() {
  var fle;
  var marketingUrl = "";
  function isTourPage() {
    return document.location.search && document.location.search.toLowerCase() === '?firstlaunch';
  }

  function msgHandlerConfig(request, sender, sendResponse) {
    marketingUrl = request.bootstrapInfo && request.bootstrapInfo.marketingUrl || marketingUrl;
  }

  function msgHandlerStartTour(request, sender, sendResponse) {
    document.querySelector("#evernoteGlobalTools").style.zIndex = "0";
    fle = document.createElement("IFRAME");
    fle.id = "evernoteFlePage";
    fle.src = Browser.extension.getURL("content/fle/fle.html");
    fle.seamless = true;
    document.documentElement.appendChild(fle);
  }

  function msgHandlerTaskFinished(request, sender, sendResponse) {
    fle.contentWindow.postMessage({ name: "taskFinished", type: request.type }, Browser.extension.getURL(""));
  }

  function msgHandlerScreenshotDone(request, sender, sendResponse) {
    fle.contentWindow.postMessage({ name: "taskFinished", type: "screenshot" }, Browser.extension.getURL(""));
  }


  function msgHandlerFleMarkUp() {
    var clickCount;
    var finished = false;
    function fleMarkUpFinished() {
      skitchSurface.removeEventListener("click", onclick);
      if (finished) return;
      //@TODO(odopertchouk): horrible hack. bypassing the coordinator API
      // and adjusting CSS manually so that
      // the side bar doesn't move away.
      document.querySelector("#evernoteGlobalTools").className = "canFit evernoteClipperVisible";
      skitchSurface.style.visibility = "visible";
      fle.style.display = "block";
      fle.contentWindow.postMessage({ name: "taskFinished", type: "markup" },
          Browser.extension.getURL(""));
      finished = true;
    }

    function onClick() {
      this.removeEventListener("click", arguments.callee);
      var div = document.querySelector("#webclipper-fle-markup");
      div.addEventListener("webkitTransitionEnd", onTransitionEnd);
      div.style.opacity = "0";
    }

    function onTransitionEnd() {
      this.removeEventListener("webkitTransitionEnd", arguments.callee);
      this.style.display = "none";
      fleMarkUpFinished();
    }

    if (!fle || !isTourPage()) {
      return;
    }
    var skitchSurface = document.querySelector(".skitch-surface");
    if (!skitchSurface) {
      fleMarkUpFinished();
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        var div = document.createElement("DIV"); // Blurb
        div.id = "webclipper-fle-markup";
        div.innerHTML = xhr.responseText;
        GlobalUtils.localize(div);
        document.documentElement.appendChild(div);
        div.style.opacity = "1";
        div.querySelector(".next-button").addEventListener("click", onClick);
      }
    }
    xhr.open('GET', Browser.extension.getURL('content/fle/flemarkup.html'), true);
    xhr.send(null);  // No data need to send along with the request.

    fle.style.display = "none";
  }

  if (!isTourPage()) return;

  Browser.addMessageHandlers({
    config: msgHandlerConfig,
    startTour: msgHandlerStartTour,
    taskFinished: msgHandlerTaskFinished,
    receiveScreenshot: msgHandlerScreenshotDone
  });

  window.addEventListener("message", function(evt) {
    if (evt.data.name == "eventDetected" ) {
      fle.contentWindow.postMessage(evt.data, Browser.extension.getURL(""));
    } else if (evt.data.name == "fleMarkUp") {
      msgHandlerFleMarkUp();
    } else if (evt.data.name == "redirect") {
      var url = document.location.protocol + '//'
          + document.location.host
          + document.location.pathname
          + "?firstlaunchreturn";
      document.location.replace(url);
    } else if (evt.data.name == "getLocation") {
      var response = {name: "getLocationReply", "location": {}};
      for (k in location) {
        var v = location[k];
        if (typeof(v) == 'string') {
          response.location[k] = v;
        }
      }
      fle.contentWindow.postMessage(response, Browser.extension.getURL(""));
    }
  });

  Browser.sendToExtension({ name: "tourLoaded" });

})();

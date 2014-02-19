(function() {
  var parentLocation;
  var sharedUrl;
  var expected;

  function phase1Start() {

    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools", allowed: {"clearly": true} }, "*");
    window.parent.postMessage({ name: "setNotebook", notebook: Browser.i18n.getMessage("fleFakeNotebook") }, "*");

    var p = document.querySelector("#clipper-tour-phase1");
    p.style.visibility = "visible";
    p.style.opacity = "1";
    p.querySelector(".next-button").addEventListener("click", phase1Click);
    expected = {
      event: {name: "eventDetected", type: "clearly"},
      action: phase1BodyStart
    };
  }

  function phase1Click() {
    window.parent.postMessage({ name: "eventClick", wnd: "globalTools", select: "#clearly" }, "*");
  }

  function phase1BodyStart() {
    expected = null;
    var p = document.querySelector("#clipper-tour-phase1");
    p.querySelector(".next-button").removeEventListener("click", phase1Click);
    p.style.opacity = "0";
    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools", "allowed": {} }, "*");
    document.querySelector("#clipper-tour-phase2").style.visibility = "visible";
    expected = {
      event: {name: "taskFinished", type: "clearly"},
      action: phase1BodyEnd
    };
  }

  function phase1BodyEnd() {
    expected = null;
    document.querySelector("#clipper-tour-phase1").style.visibility = "hidden";
    phase2Start();
  }

  function phase2Start() {
    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools",
      "allowed": {"arrow": true, "screenshot": true } }, "*");
    var p = document.querySelector("#clipper-tour-phase2");
    p.style.visibility = "visible";
    p.style.opacity = "1";
    p.querySelector(".next-button").addEventListener("click", phase2Click);
    expected = {
      event: {name: "eventDetected", type: "arrow"},
      action: phase2BodyStart
    };
  }

  function phase2Click() {
    window.parent.postMessage({ name: "eventClick", wnd: "globalTools", select: "#screenshot" }, "*");
  }

  function phase2BodyStart() {
    expected = null;
    var p = document.querySelector("#clipper-tour-phase2");
    p.querySelector(".next-button").removeEventListener("click", phase2Click);
    p.style.opacity = "0";
    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools", "allowed": {} }, "*");
    document.querySelector("#clipper-tour-phase3").style.visibility = "visible";
    expected = {
      event: {name: "taskFinished", type: "screenshot"},
      action: phase2BodyEnd
    };
  }

  function phase2BodyEnd() {
    document.querySelector("#clipper-tour-phase2").style.visibility = "hidden";
    expected = null;
    phase3Start();
  }

  function phase3Start() {
    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools",
        allowed:{
          "arrow": true, "text": true, "line": true,
          "ellipse": true, "roundedRectangle": true, "rectangle": true,
          "stampReject": true, "stampExclaim": true, "stampQuestion": true,
          "stampAccept": true, "stampPerfect": true, "pixelate": true,
          "highlighter": true, "marker": true
        }}, "*");
    window.parent.postMessage({name: "fleMarkUp" }, "*");
    var p = document.querySelector("#clipper-tour-phase3");
    p.style.visibility = "visible";
    expected = {
      event: {name: "taskFinished", type: "markup"},
      action: phase4Start
    };
  }

  function phase3BodyEnd() {
    expected = null;
    var p = document.querySelector("#clipper-tour-phase3");
    p.style.opacity = "1";
    p.querySelector(".next-button").addEventListener("click", phase3Click);
  }

  function phase3Click() {
    var p = document.querySelector("#clipper-tour-phase3");
    p.querySelector(".next-button").removeEventListener("click", phase3Click);
    document.querySelector("#clipper-tour-phase4").style.visibility = "visible";
    p.addEventListener("webkitTransitionEnd", phase3End);
    p.style.opacity = "0";
    phase3End();
  }

  function phase3End() {
    var p = document.querySelector("#clipper-tour-phase3");
    p.removeEventListener("webkitTransitionEnd", phase3End);
    p.style.visibility = "hidden";
    phase4Start();
  }

  function phase4Start() {
    expected = null;
    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools",
      allowed: {"shareButton": true} }, "*");
    var p = document.querySelector("#clipper-tour-phase4");
    p.style.visibility = "visible";
    p.style.opacity = "1";
    p.querySelector(".next-button").addEventListener("click", phase4Click);
    window.parent.postMessage({ name: "createTag", tagName: Browser.i18n.getMessage("fleFakeTag1") }, "*");
    window.parent.postMessage({ name: "createTag", tagName: Browser.i18n.getMessage("fleFakeTag2") }, "*");

    expected = {
      event: {name: "eventDetected", type: "shareButton"},
      action: phase4BodyStart
    };
  }

  function phase4Click() {
    window.parent.postMessage({ name: "eventClick", wnd: "globalTools", select: "#shareButton" }, "*");
  }

  function phase4BodyStart() {
    expected = null;
    var p = document.querySelector("#clipper-tour-phase4");
    p.querySelector(".next-button").removeEventListener("click", phase4Click);
    p.addEventListener("webkitTransitionEnd", phase4End);
    p.style.opacity = "0";
    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools", "allowed": {} }, "*");
    document.querySelector("#clipper-tour-phase5").style.visibility = "visible";
    Browser.sendToExtension({name: "bounce", message: { name: "doneSharing", guid: "12345", url: sharedUrl} });
  }

  function phase4End() {
    var p = document.querySelector("#clipper-tour-phase4");
    p.removeEventListener("webkitTransitionEnd", phase4End);
    p.style.visibility = "hidden";
    phase5Start();
  }

  function phase5Start() {
    var p = document.querySelector("#clipper-tour-phase5");
    p.querySelector(".finish-button").addEventListener("click", phase5Click);
    p.style.opacity = "1";
  }

  function phase5Click() {
    var p = document.querySelector("#clipper-tour-phase5");
    p.querySelector(".finish-button").removeEventListener("click", phase5Click);
    p.addEventListener("webkitTransitionEnd", phase5End);
    p.style.opacity = "0";
    document.querySelector("#clipper-tour-phase6").style.visibility = "visible";
  }

  function phase5End() {
    var p = document.querySelector("#clipper-tour-phase5");
    p.removeEventListener("webkitTransitionEnd", phase5End);
    p.style.visibility = "hidden";
    phase6Start();
  }

  function phase6Start() {
    var p = document.querySelector("#clipper-tour-phase6");
    var sharedTitle =  Browser.i18n.getMessage("fleSharedTitle");

    var linkedinUrl = "http://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(sharedUrl)
        + "&title=" + encodeURIComponent(sharedTitle);
    p.querySelector(".done-button").addEventListener("click", phase6Click);
    p.querySelector(".facebook").addEventListener("click", function() {
      Browser.sendToExtension({
        name: "main_openWindow",
        width: 626,
        height: 436,
        url: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(sharedUrl),
        type: "popup"
      });
    });
    p.querySelector(".twitter").addEventListener("click", function() {
      Browser.sendToExtension({
        name: "main_openWindow",
        width: 550,
        height: 420,
        url: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(sharedTitle)
             + "&url=" + encodeURIComponent(sharedUrl),
        type: "popup"
      });
    });
    p.querySelector(".linkedin").addEventListener("click", function() {
      Browser.sendToExtension({
        name: "main_openWindow",
        width: 520,
        height: 570,
        url: "http://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(sharedUrl)
        + "&title=" + encodeURIComponent(sharedTitle),
        type: "popup"
      });
    });
    p.style.opacity = "1";
  }

  function phase6Click() {
    var p = document.querySelector("#clipper-tour-phase6");
    p.querySelector(".done-button").removeEventListener("click", phase6Click);
    p.addEventListener("webkitTransitionEnd", phase6End);
    p.style.opacity = "0";
  }

  function phase6End() {
    var p = document.querySelector("#clipper-tour-phase6");
    p.removeEventListener("webkitTransitionEnd", phase5End);
    // Do something useful here.
    window.parent.postMessage({name: "redirect"}, "*")
  }

  function startTour() {
    phase1Start();
  }

  window.addEventListener("message", function(evt) {
    if (evt.data.name === "getLocationReply") {
      parentLocation =  evt.data.location;
      sharedUrl =  parentLocation.protocol + '//' + parentLocation.host + parentLocation.pathname;
      return;
    }
    if (!expected
        || expected.event.name !== evt.data.name
        || typeof(evt.data.type) === 'undefined'
        || expected.event.type !== evt.data.type)
    {
      return;
    }
    expected.action(evt.data);
  });

  window.addEventListener("DOMContentLoaded", function() {
    GlobalUtils.localize(document.body);
    window.parent.postMessage({ name: "eventFilter", wnd: "globalTools", "allowed": {} }, "*");
    window.parent.postMessage({ name: "getLocation"}, "*");
    startTour();
  });
})();

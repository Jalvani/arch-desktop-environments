var tooltipTimeout;
var skitchStarted = false;
var subtoolPanelWasOpen = false;

var article;
var clearly;
var fullPage;
var selection;
var pdf;
var email;
var url;

var hideTab;
var notebook;
var tags;
var shareButton;
var saveButton;
var filingDialogArrow, filingDialogSliver;
var shareDialogArrow, shareDialogSliver;
var userToolsArrow, userToolsSliver;

var eventFilter;

function isAllowed(eventType) {
  if (typeof(eventFilter) !== "object" || (eventType in eventFilter && eventFilter[eventType])) {
    window.parent.postMessage({ name: "eventDetected", wnd: "globalTools", type: eventType  }, "*");
    return true;
  }
  return false;
}

window.addEventListener("DOMContentLoaded", function() {
  // setup variables
  article = document.querySelector(".clipper#article");
  clearly = document.querySelector(".clipper#clearly");
  fullPage = document.querySelector(".clipper#fullPage");
  selection = document.querySelector(".clipper#selection");
  pdf = document.querySelector(".clipper#pdf");
  email = document.querySelector(".clipper#email");
  url = document.querySelector(".clipper#url");
  hideTab = document.querySelector("#hideTab");
  notebook = document.querySelector("#notebook");
  tags = document.querySelector("#tags");
  shareButton = document.querySelector("#shareButton");
  saveButton = document.querySelector("#saveButton");
  filingDialogArrow = document.querySelector("#filingDialogArrow");
  filingDialogSliver = document.querySelector("#filingDialogSliver");
  shareDialogArrow = document.querySelector("#shareDialogArrow");
  shareDialogSliver = document.querySelector("#shareDialogSliver");
  userToolsArrow = document.querySelector("#userToolsArrow");
  userToolsSliver = document.querySelector("#userToolsSliver");

  // localize
  GlobalUtils.localize(document.body);
  tags.setAttribute("data-placeholder", Browser.i18n.getMessage("quickNote_addTags"));

  // Clipper tools
  var clipperTools = document.querySelectorAll(".clipper");
  for (var i = 0; i < clipperTools.length; i++) {
    clipperTools.item(i).addEventListener("click", handleClipperToolClick);
  }

  // Skitch tools
  var skitchTools = document.querySelectorAll(".skitch");
  for (var i = 0; i < skitchTools.length; i++) {
    if (skitchTools.item(i).id == "highlighter") {
      skitchTools.item(i).addEventListener("click", handleHighlighterClick);
    } else {
      skitchTools.item(i).addEventListener("click", handleSkitchToolClick);
    }
    skitchTools.item(i).addEventListener("mousemove", handleSkitchToolMousemove);
    skitchTools.item(i).addEventListener("mouseout", handleSkitchToolMouseout);
    var toolType = skitchTools.item(i).id;
    if (toolType == "highlighter") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("htmlHighlighter"));
    } else if (toolType == "arrow") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("arrowTool"));
    } else if (/^stamp/.test(toolType)) {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("stampTool"));
    } else if (["rectangle", "line", "ellipse", "roundedRectangle", "rectangle"].indexOf(toolType) > -1) {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("shapeTool"));
    } else if (toolType == "text") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("typeTool"));
    } else if (toolType == "pixelate") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("pixelatorTool"));
    } else if (toolType == "marker") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("markerTool"));
    } else if (toolType == "color") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("colors"));
    } else if (toolType == "crop") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("crop"));
    } else if (toolType == "zoomin") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("zoomin"));
    } else if (toolType == "zoomout") {
      skitchTools.item(i).setAttribute("tooltip", Browser.i18n.getMessage("zoomout"));
    }
  }
  var subtools = document.querySelectorAll(".subtool");
  for (var i = 0; i < subtools.length; i++) {
    subtools.item(i).addEventListener("click", handleSubtoolClick);
  }

  hideTab.addEventListener("click", function() {
    if (/tempHidden/.test(document.body.className)) {
      document.body.className = document.body.className.replace(/\s*tempHidden/g, "");
      window.parent.postMessage({ name: "untempHideGlobalTools" }, "*");
    } else {
      tempHide();
    }
  });
  notebook.addEventListener("click", toggleFilingTools);
  tags.addEventListener("click", toggleFilingTools);
  shareButton.addEventListener("click", share);
  saveButton.addEventListener("click", save);
  Browser.sendToExtension({ name: "getPersistentValue", key: "lastSkitchStamp" });
  document.querySelector("#userMenu").addEventListener("click", function() {
    if (!isAllowed("userMenu")) {
      return;
    }
    window.parent.postMessage({ name: "toggleUserTools" }, "*");
  });

  window.parent.postMessage({ name: "uiReady" }, "*");
});

window.addEventListener("click", function(evt) {
  if (!notebook.contains(evt.srcElement) && !tags.contains(evt.srcElement)
    && !shareButton.contains(evt.srcElement) && !saveButton.contains(evt.srcElement)
    && !userMenu.contains(evt.srcElement)) {
      if (!isAllowed("hideAllTools")) {
        return;
      }
      window.parent.postMessage({ name: "hideAllTools" }, "*");
  }
});

window.addEventListener("mousedown", function(evt) {
  var x = window.innerWidth - evt.pageX;
  var y = window.innerHeight - evt.pageY;
  var visiblePanel = document.querySelector(".subtool_panel.visible");
  if (visiblePanel && !visiblePanel.contains(evt.srcElement) && (x > 154)) {
    subtoolPanelWasOpen = true;
    window.parent.postMessage({ name: "setToolbarWidth", width: calcBodyWidth() + "px" }, "*");
    window.parent.postMessage({ name: "dispatchEvent", type: "pointerdown",
      x: x, y: y }, "*");
    window.parent.postMessage({ name: "dispatchEvent", type: "transformstart",
      x: x, y: y }, "*");
    closeSubtools();
  }
});

window.addEventListener("mousemove", function(evt) {
  if (subtoolPanelWasOpen) {
    window.parent.postMessage({ name: "dispatchEvent", type: "pointermove",
      x: document.width - evt.pageX, y: document.height - evt.pageY }, "*");
    window.parent.postMessage({ name: "dispatchEvent", type: "transform",
      x: document.width - evt.pageX, y: document.height - evt.pageY }, "*");
  }
});

window.addEventListener("mouseup", function(evt) {
  if (subtoolPanelWasOpen) {
    window.parent.postMessage({ name: "dispatchEvent", type: "pointerup",
      x: document.width - evt.pageX, y: document.height - evt.pageY }, "*");
    window.parent.postMessage({ name: "dispatchEvent", type: "transformend",
      x: document.width - evt.pageX, y: document.height - evt.pageY }, "*");
  }
  subtoolPanelWasOpen = false;
});

window.addEventListener("message", function(evt) {
  if (evt.data.name == "setUsername") {
    document.querySelector("#userMenu").innerText = evt.data.fullName;
    if (evt.data.premium) {
      document.querySelector("#userMenu").className += " premium";
    } else {
      document.querySelector("#userMenu").className = document.querySelector("#userMenu").className.replace(/\s*premium/g, "");
    }
  } else if (evt.data.name == "stopSkitch") {
    stopSkitch();
  } else if (evt.data.name == "closeSubtools") {
    closeSubtools();
  } else if (evt.data.name == "setPossibleClipTypes") {
    setPossibleClipTypes(evt.data);
  } else if (evt.data.name == "hideExtras") {
    hideExtras();
  } else if (evt.data.name == "postCrop") {
    // reselect tool we used before cropping
    var precrop = document.querySelector(".precrop");
    precrop.className = precrop.className.replace(/\s*precrop/g, "");
    handleSkitchToolClick({ srcElement: precrop, clickFromKeyboard: evt.data.fromKeyboard });
  } else if (evt.data.name == "switchMode") {
    switchMode(evt.data);
  } else if (evt.data.name == "save") {
    save();
  } else if (evt.data.name == "switchSkitchTool") {
    if (evt.data.tool == "shape") {
      document.querySelector("[tool='" + evt.data.subtool + "']").click();
      handleSkitchToolClick({
        srcElement: document.querySelector("#" + evt.data.subtool),
        clickFromKeyboard: true
      });
    } else {
      handleSkitchToolClick({
        srcElement: document.querySelector("[id^='" + evt.data.tool + "']"),
        clickFromKeyboard: true,
        location: evt.data.location,
        charCode: evt.data.charCode
      });
    }
  } else if (evt.data.name == "setNotebook") {
    msgHandlerSetNotebook(evt.data);
  } else if (evt.data.name == "createTag") {
    var html = "<span";
    if (tags.innerHTML != "") {
      html = ", " + html;
    }
    if (evt.data.smart) {
      html += " class=\"smart\"";
    }
    html += ">" + evt.data.tagName + "</span>";
    tags.innerHTML += html;
    if (tags.scrollHeight > 50) {
      tags.className += " overflow";
    }
  } else if (evt.data.name == "clearTag") {
    var regex = new RegExp(",?\\s?<span[^,]*>" + evt.data.tagName + "<\/span>");
    tags.innerHTML = tags.innerHTML.replace(regex, "").replace(/^,\s/, "");
    if (tags.scrollHeight <= 50) {
      tags.className = tags.className.replace(/\s*overflow/g, "");
    }
  } else if (evt.data.name == "clearTags") {
    tags.innerHTML = "";
    tags.className = tags.className.replace(/\s*overflow/g, "");
  } else if (evt.data.name == "showFilingDialogHacks") {
    filingDialogArrow.className += " visible";
    filingDialogSliver.className += " visible";
    filingDialogArrow.style.top = notebook.offsetTop + "px";
    filingDialogSliver.style.height = evt.data.height + "px";
  } else if (evt.data.name == "hideFilingDialogHacks") {
    filingDialogArrow.className = filingDialogArrow.className.replace(/\s*visible/g, "");
    filingDialogSliver.className = filingDialogSliver.className.replace(/\s*visible/g, "");
  } else if (evt.data.name == "showShareDialogHacks") {
    shareDialogArrow.className += " visible";
    shareDialogSliver.className += " visible";
    shareDialogArrow.style.bottom = window.innerHeight - shareButton.offsetTop - 28 + "px";
    shareDialogSliver.style.height = evt.data.height + "px";
  } else if (evt.data.name == "hideShareDialogHacks") {
    shareDialogArrow.className = filingDialogArrow.className.replace(/\s*visible/g, "");
    shareDialogSliver.className = filingDialogSliver.className.replace(/\s*visible/g, "");
  } else if (evt.data.name == "showUserToolsHacks") {
    userToolsArrow.className += " visible";
    userToolsSliver.className += " visible";
    userToolsSliver.style.height = evt.data.height + "px";
  } else if (evt.data.name == "hideUserToolsHacks") {
    userToolsArrow.className = userToolsArrow.className.replace(/\s*visible/g, "");
    userToolsSliver.className = userToolsSliver.className.replace(/\s*visible/g, "");
  } else if (evt.data.name == "reset") {
    reset();
  } else if (evt.data.name == "reactivateClipperTool") {
    handleClipperToolClick({ srcElement: document.querySelector(".clipper.active") });
  } else if (evt.data.name == "makeHidable") {
    makeHidable();
  } else if (evt.data.name == "unmakeHidable") {
    unmakeHidable();
  } else if (evt.data.name == "tempHide") {
    tempHide();
  } else if (evt.data.name == "eventFilter") {
    eventFilter = evt.data.allowed;
  } else if (evt.data.name == "eventClick") {
    document.querySelector(evt.data.select).click();
  }
});

// window.addEventListener("click", function() {
//   window.parent.postMessage({ name: "closeNotebookSelector" }, "*");
// });

Browser.addMessageHandlers({
  doneSharing: doneSharing,
  receiveOption: receiveOption,
  receivePersistentValue: receivePersistentValue,
  receiveScreenshot: msgHandlerScreenshotDone
});

function calcBodyWidth() {
  var baseWidth = 154;
  if (/hidable/.test(document.body.className)) {
    baseWidth = 172;
  }
  var peek = 0;
  var tooltip = document.querySelector(".tooltipon:first-child");
  if (tooltip) {
    var ttWidth = parseInt(window.getComputedStyle(tooltip, ":before").width) + 14;
    peek = ttWidth - 16;
  }
  tooltip = document.querySelector(".tooltipon:last-child");
  if (tooltip) {
    var ttWidth = parseInt(window.getComputedStyle(tooltip, ":before").width) + 14;
    peek = Math.max(ttWidth - 58, 0);
  }
  var panel = document.querySelector(".subtool_panel.visible");
  if (panel) {
    return Math.max(baseWidth + peek, 315);
  }
  return baseWidth + peek;
}

function closeSubtools() {
  var visiblePanel = document.querySelector(".subtool_panel.visible");
  if (visiblePanel) {
    visiblePanel.className = visiblePanel.className.replace(/\s*visible/g, "");
  }
}

function doneSharing(request, sender, sendResponse) {
  shareButton.className += " doneSharing";
  saveButton.innerText = Browser.i18n.getMessage("update");
}

function handleClipperToolClick(evt) {
  var active = document.querySelector(".clipper.active");
  if (active) {
    active.className = active.className.replace(/\s*active/g, "");
  }
  evt.srcElement.className += " active";

  if (!isAllowed(evt.srcElement.id)) {
    window.parent.focus();
    return;
  }

  switch (evt.srcElement.id) {
    case "article":
      Browser.sendToExtension({ name: "setPersistentValue", key: "lastUsedAction", value: "ARTICLE" });
      pauseSkitch();
      window.parent.postMessage({ name: "hideSkitch" }, "*");
      window.parent.postMessage({ name: "hideClearly", after: "previewArticle" }, "*");
      break;
    case "clearly":
      Browser.sendToExtension({ name: "setPersistentValue", key: "lastUsedAction", value: "CLEARLY" });
      window.parent.postMessage({ name: "clearPreview" }, "*");
      pauseSkitch();
      window.parent.postMessage({ name: "hideSkitch" }, "*");
      window.parent.postMessage({ name: "showClearly" }, "*");
      break;
    case "fullPage":
      Browser.sendToExtension({ name: "setPersistentValue", key: "lastUsedAction", value: "FULL_PAGE" });
      pauseSkitch();
      window.parent.postMessage({ name: "hideSkitch" }, "*");
      window.parent.postMessage({ name: "hideClearly", after: "previewFullPage" }, "*");
      break;
    case "pdf":
      window.parent.postMessage({ name: "clearPreview" }, "*");
      pauseSkitch();
      window.parent.postMessage({ name: "hideSkitch" }, "*");
      break;
    case "url":
      Browser.sendToExtension({ name: "setPersistentValue", key: "lastUsedAction", value: "URL" });
      pauseSkitch("url");
      window.parent.postMessage({ name: "hideSkitch" }, "*");
      window.parent.postMessage({ name: "hideClearly", after: "previewUrl" }, "*");
      break;
    case "screenshot":
      Browser.sendToExtension({ name: "setPersistentValue", key: "lastUsedAction", value: "SKITCH" });
      // will turn off clearly after the screenshot has been taken, in coord
      handleSkitchToolClick({ srcElement: document.querySelector(".subtool_panel.shapes").previousElementSibling });
      break;
    case "email":
      pauseSkitch();
      window.parent.postMessage({ name: "hideSkitch" }, "*");
      window.parent.postMessage({ name: "hideClearly", after: "previewEmail" }, "*");
      break;
    case "selection":
      pauseSkitch();
      window.parent.postMessage({ name: "hideSkitch" }, "*");
      window.parent.postMessage({ name: "hideClearly", after: "previewSelection" }, "*");
      break;
  }
  window.parent.focus();
}

function handleHighlighterClick() {
  if (!isAllowed("highlighter"))  {
    return;
  }
  var active = document.querySelector(".skitch.active");
  if (active) {
    active.className = active.className.replace(/\s*active/g, "");
  }
  this.className += " active";
  window.parent.postMessage({ name: "useHighlighter" }, "*");
}

function handleSkitchToolClick(evt) {
  if (!isAllowed(evt.srcElement.id)) {
    window.parent.focus();
    return;
  }
  if (!evt.clickFromKeyboard) {
    var active = document.querySelector(".clipper.active");
    if (active) {
      active.className = active.className.replace(/\s*active/g, "");
    }
    document.querySelector("#screenshot").className += " active";
  }
  if (evt.srcElement.id != "color") {
    active = document.querySelector(".skitch.active");
    if (active) {
      active.className = active.className.replace(/\s*active/g, "");
      // save the tool used before crop so we can go back to it after cropping
      if (evt.srcElement.id == "crop") {
        active.className += " precrop";
      }
    }
    evt.srcElement.className += " active";
  }
  if (!evt.clickFromKeyboard) {
    window.parent.postMessage({ name: "clearPreview" }, "*");
  }
  var tool = evt.srcElement.id;
  if (skitchStarted) {
    var visiblePanel = document.querySelector(".subtool_panel.visible");
    if (visiblePanel && evt.srcElement.nextElementSibling != visiblePanel) {
      visiblePanel.className = visiblePanel.className.replace(/\s*visible/g, "");
    }
    if ([ "color", "zoomin", "zoomout" ].indexOf(tool) < 0) {
      window.parent.postMessage({
        name: "useSkitchTool",
        tool: tool,
        location: evt.location,
        charCode: evt.charCode
      }, "*");
    } else if (/zoom/.test(tool)) {
      window.parent.postMessage({ name: tool }, "*");
    }
    if (!evt.clickFromKeyboard) {
      msgHandlerScreenshotDone({ tool: tool, showSubtools: (evt.constructor && evt.constructor == MouseEvent) });
    }
    makeHidable();
  } else {
    skitchStarted = true;
    // hide the hide-tab for now since it would be visible when taking a
    // screenshot of clearly and we don't want it in the picture
    unmakeHidable();
    Browser.sendToExtension({
      name: "prepareScreenshot",
      tool: tool,
      showSubtools: (/skitch/.test(evt.srcElement.className) && evt.constructor && evt.constructor == MouseEvent)
    });
  }
  window.parent.focus();
}

function handleSkitchToolMousemove() {
  clearTimeout(tooltipTimeout);
  var ctx = this;
  tooltipTimeout = setTimeout(function() {
    if (!document.querySelector("#" + ctx.id + "+.subtool_panel.visible")) {
      ctx.className += " tooltipon";
      window.parent.postMessage({ name: "setToolbarWidth", width: calcBodyWidth() + "px" }, "*");
    }
  }, 250);
}

function handleSkitchToolMouseout() {
  clearTimeout(tooltipTimeout);
  this.className = this.className.replace(/\s*tooltipon/g, "");
  window.parent.postMessage({ name: "setToolbarWidth", width: calcBodyWidth() + "px" }, "*");
}

function handleSubtoolClick(evt) {
  var tool = evt.srcElement.getAttribute("tool");
  if (isAllowed(tool)) {
    if (/colors/.test(evt.srcElement.parentNode.className)) {
      evt.srcElement.parentNode.previousElementSibling.setAttribute("color", tool);
      Browser.sendToExtension({ name: "setPersistentValue", key: "lastSkitchColor", value: tool });
      window.parent.postMessage({ name: "useSkitchColor", color: tool }, "*");
    } else {
      evt.srcElement.parentNode.previousElementSibling.id = tool;
      if (/stamps/.test(evt.srcElement.parentNode.className)) {
        Browser.sendToExtension({ name: "setPersistentValue", key: "lastSkitchStamp", value: tool });
      } else if (/shapes/.test(evt.srcElement.parentNode.className)) {
        if (tool == "arrow") {
          evt.srcElement.parentNode.previousElementSibling.setAttribute("tooltip", Browser.i18n.getMessage("arrowTool"));
        } else {
          evt.srcElement.parentNode.previousElementSibling.setAttribute("tooltip", Browser.i18n.getMessage("shapeTool"));
        }
      }
      window.parent.postMessage({ name: "useSkitchTool", tool: tool }, "*");
    }
  }
  evt.srcElement.parentNode.className = evt.srcElement.parentNode.className.replace(/\s*visible/g, "");
  window.parent.postMessage({ name: "setToolbarWidth", width: calcBodyWidth() + "px" }, "*");
  window.parent.focus();
}

function hideExtras() {
  clearTimeout(tooltipTimeout);
  var subtools = document.querySelectorAll(".subtool_panel.visible");
  for (var i = 0; i < subtools.length; i++) {
    subtools.item(i).className = subtools.item(i).className.replace(/\s*visible/g, "");
  }
  var tooltips = document.querySelectorAll(".tooltipon");
  for (var i = 0; i < tooltips.length; i++) {
    tooltips.item(i).className = tooltips.item(i).className.replace(/\s*tooltipon/g, "");
  }
}

function makeHidable() {
  if (!/hidable/.test(document.body.className)) {
    document.body.className += " hidable";
    window.parent.postMessage({ name: "makeGlobalToolsHidable" }, "*");
  }
}

function receiveOption(request, sender, sendResponse) {
  if (request.key == "clipAction") {
    if (document.querySelector("#selection:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#selection") });
    } else if (document.querySelector("#email:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#email") });
    } else if (request.value == "ARTICLE" && document.querySelector("#article:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#article") });
    } else if (request.value == "CLEARLY" && document.querySelector("#clearly:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#clearly") });
    } else if (request.value == "FULL_PAGE" && document.querySelector("#fullPage:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#fullPage") });
    } else if (request.value == "URL" && document.querySelector("#url:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#url") });
    } else if (request.value == "SKITCH" && document.querySelector("#screenshot:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#screenshot") });
    } else if (document.querySelector("#pdf:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#pdf")});
    } else if (document.querySelector("#article:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#article")});
    } else if (document.querySelector("#fullPage:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#fullPage")});
    } else if (document.querySelector("#url:not(.hidden)")) {
      handleClipperToolClick({ srcElement: document.querySelector("#url")});
    }
  }
}

function receivePersistentValue(request, sender, sendResponse) {
  if (request.key == "lastSkitchStamp" && request.value) {
    document.querySelector(".stamps").previousElementSibling.id = request.value;
  } else if (request.key == "lastSkitchColor" && request.value) {
    document.querySelector("#color").setAttribute("color", request.value);
    window.parent.postMessage({ name: "useSkitchColor", color: request.value }, "*");
  }
}

function reset() {
  // clip options
  article.className = article.className.replace(/\s*hidden/g, "");
  clearly.className = clearly.className.replace(/\s*hidden/g, "");
  fullPage.className = fullPage.className.replace(/\s*hidden/g, "");
  selection.className = selection.className.replace(/\s*hidden/g, "");
  pdf.className = pdf.className.replace(/\s*hidden/g, "");
  email.className = email.className.replace(/\s*hidden/g, "");
  url.className = url.className.replace(/\s*hidden/g, "");
  var active = document.querySelector(".clipper.active");
  if (active) {
    active.className = active.className.replace(/\s*active/g, "");
  }
  // share and save buttons
  shareButton.className = shareButton.className.replace(/\s*doneSharing/g, "");
  saveButton.innerText = Browser.i18n.getMessage("quickNote_submit");
}

function msgHandlerScreenshotDone(request, sender, sendResponse) {
  // show color selector, crop tool, and zoom tools
  var pairs = document.querySelectorAll(".skitch_pair.conditional");
  for (var i = 0; i < pairs.length; i++) {
    pairs.item(i).className = pairs.item(i).className.replace(/\s*hidden/g, "");
  }
  if (request.showSubtools) {
    showSubtoolChooser(request);
  }
  document.querySelector("#highlighter").setAttribute("tooltip", Browser.i18n.getMessage("imageHighlighter"));
  Browser.sendToExtension({ name: "getPersistentValue", key: "lastSkitchColor" });
}

function msgHandlerSetNotebook(request) {
  var html = "<span";
  if (request.smart) {
    html += " class=\"smart\"";
  }
  html += " title=\"" + request.notebook + "\">" + request.notebook + "</span>";
  notebook.innerHTML = html;
}

function pauseSkitch(switchTo) {
  // disactivate active skitch tool unless it's the html highlighter
  var active = document.querySelector(".skitch.active");
  if (active) {
    if (active.id == "highlighter") {
      window.parent.postMessage({ name: "turnOffHTMLHighlighter" }, "*");
    }
    active.className = active.className.replace(/\s*active/g, "");
  }
  // remove color picker, crop tool, and zoom tools
  var pairs = document.querySelectorAll(".skitch_pair.conditional");
  for (var i = 0; i < pairs.length; i++) {
    pairs.item(i).className += " hidden";
  }
  document.querySelector("#highlighter").setAttribute("tooltip", Browser.i18n.getMessage("htmlHighlighter"));
  // remove the tab that expands/contracts the sidebar
  document.body.className = document.body.className.replace(/\s*tempHidden/g, "");
  unmakeHidable();
}

function save() {
  if (!isAllowed("saveButton")) {
    return;
  }
  stopSkitch();
  window.parent.postMessage({
    name: "startSubmission",
    type: document.querySelector(".clipper.active").id
  }, "*");
}

function setPossibleClipTypes(request) {
  if (request.pageInfo.pdf || request.pageInfo.gmail) {
    article.className += " hidden";
    clearly.className += " hidden";
    fullPage.className += " hidden";
    selection.className += " hidden";
    if (request.pageInfo.pdf || (request.pageInfo.gmail && !request.pageInfo.gmailThread)) {
      email.className += " hidden";
    }
    if (request.pageInfo.gmail) {
      pdf.className += " hidden";
      url.className += " hidden";
    }
  } else {
    pdf.className += " hidden";
    email.className += " hidden";
    if (request.pageInfo.documentIsFrameset) {
      fullPage.className += " hidden";
    }
    if (!request.pageInfo.selection) {
      selection.className += " hidden";
    }
  }
}

function share() {
  if (!isAllowed("shareButton")) {
    return;
  }
  window.parent.postMessage({
    name: "startSubmission",
    type: document.querySelector(".clipper.active").id,
    share: true
  }, "*");
}

function showSubtoolChooser(request, sender, sendResponse) {
  var tool = document.querySelector("#" + request.tool);
  if (/expandable/.test(tool.className)) {
    var subtools = document.querySelector("#" + request.tool + "+.subtool_panel");
    if (/visible/.test(subtools.className)) {
      subtools.className = subtools.className.replace(/\s*visible/g, "");
    } else {
      subtools.className += " visible";
      tool.className = tool.className.replace(/\s*tooltipon/g, "");
    }
    window.parent.postMessage({ name: "setToolbarWidth", width: calcBodyWidth() + "px" }, "*");
  }
}

function stopSkitch() {
  skitchStarted = false;
  pauseSkitch();
}

function switchMode(request) {
  if (request.mode) {
    var modeButton = document.querySelector("#" + request.mode + ":not(.hidden)");
    if (modeButton) {
      modeButton.click();
    }
  } else if (request.direction) {
    if (request.direction == "next") {
      var next = document.querySelector(".clipper.active~.clipper:not(.hidden)");
      if (next) {
        next.click();
      } else {
        // at the end of this list, go back to the beginning
        next = document.querySelector(".clipper:not(.hidden)");
        if (next) {
          next.click();
        }
      }
    }
  }
}

function tempHide() {
  document.body.className += " tempHidden";
  window.parent.postMessage({ name: "tempHideGlobalTools" }, "*");
}

function toggleFilingTools() {
  if (!isAllowed("toggleFilingTools")) {
    return;
  }
  window.parent.postMessage({ name: "toggleFilingTools", focus: this.id }, "*");
}

function unmakeHidable() {
  document.body.className = document.body.className.replace(/\s*hidable/g, "");
}

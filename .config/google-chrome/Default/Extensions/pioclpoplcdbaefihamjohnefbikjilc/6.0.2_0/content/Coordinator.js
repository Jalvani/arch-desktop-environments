function Coordinator() {
  // DOM objects
  var globalTools;
  var filingTools;
  var optionsPage;
  var clearlyFrame;
  var authTools;
  var userTools;
  var emailSharing;
  var shareTools;

  // Skitch
  var surface;
  var usedTools = {};
  var cropOn = false;

  // Clearly
  var maxScrollY = 0;
  var scrollLeft = 0;
  var scrollTop = 0;

  // user info
  var username;
  var userId;
  var authTokens;
  var premium;
  var userType;

  // options
  var keyboardShortcutsEnabled = true;
  var keyboardHandlers = {};
  var filingToolsShortcuts = {};

  var pendingNoteKey;
  var numTextHighlights = 0;
  var readyUI = 0;
  var screenshotting = false;
  var tempTool;
  var tempShowSubtools = false;
  var filingToolsDoneHiding = false;
  var globalToolsDoneHiding = false;
  var recordedClearlyScrollStat = false;
  var recordedClearlySaveStat = false;
  var demoMode = false;
  var setFilingToolsShortcuts = false;

  var updateGuid = null; // for updated shared notes
  var previousToken = null; // token of the previous note, in case user tries to change shard

  function buildTooltip() {
    var elt = document.createElement("span");
    elt.className = "evernoteTooltip";
    return elt;
  }

  function centerSkitch(imgWidth) {
    var leftoverX = window.innerWidth - imgWidth;
    var eltWidth;
    if (leftoverX >= 20) { // partial sidebar doesn't overlap the image
      eltWidth = window.innerWidth - 20;
      filingTools.className = filingTools.className.replace(/\s*evernoteClipperVisible/g, "");
      globalTools.contentWindow.postMessage({
        name: "hideFilingDialogHacks",
        height: filingTools.offsetHeight - 12
      }, Browser.extension.getURL(""));
      hideShareTools();
      userTools.className = userTools.className.replace(/\s*evernoteClipperVisible/g, "");
      globalTools.contentWindow.postMessage({
        name: "hideUserToolsHacks"
      }, Browser.extension.getURL(""));
    } else {
      eltWidth = window.innerWidth;
    }
    surface.setSize(eltWidth, window.innerHeight);
    surface.center();
  }

  function clearSkitch() {
    if (surface) {
      surface.getElement().parentNode.removeChild(surface.getElement());
      surface.destroy();
      msgHandlerShowScrollbar();
    }
    surface = null;
    usedTools = {};
    document.body.className = document.body.className.replace(/\s*skitchon/g, "");
  }

  function dispatchEventToSkitch(type, x, y, reverse) {
    var mevt = document.createEvent("MouseEvents");
    var _x = x;
    var _y = y;
    if (reverse) {
      _x = window.innerWidth - _x;
      _y = window.innerHeight - _y;
    }
    mevt.initMouseEvent(type, true, true, window, 1, null, null, _x, _y, false,
      false, false, false, 1, null);
    document.querySelector(".skitch-layer-tool").dispatchEvent(mevt);
  }

  function doneSharing(request, sender, sendResponse) {
    updateGuid = request.guid;
    previousToken = request.token;
  }

  function handleEscape() {
    if (/skitchon/.test(document.body.className) && cropOn) {
      showCoordinator();
      globalTools.contentWindow.postMessage({ name: "postCrop", fromKeyboard: true }, Browser.extension.getURL(""));
      cropOn = false;
    } else if (/evernoteClipperVisible/.test(filingTools.className)) {
      toggleFilingTools();
    } else if (/evernoteClipperVisible/.test(globalTools.className)) {
      msgHandlerToggleCoordinator();
    }
  }

  function handleFilingToolsShortcut(focus) {
    if (/evernoteClipperVisible/.test(globalTools.className) && !/skitchon/.test(document.body.className)) {
      toggleFilingTools({ data: { focus: focus }});
    }
  }

  function handlePreviewShortcut(mode) {
    if (/evernoteClipperVisible/.test(globalTools.className) && !/skitchon/.test(document.body.className)) {
      if (mode == "expand") {
        contentPreview.expandPreview();
      } else if (mode == "contract") {
        contentPreview.contractPreview();
      } else if (mode == "up") { // up the page's elements
        contentPreview.moveToElementAbove();
      } else if (mode == "down") { // down the page's elements
        contentPreview.moveToElementBelow();
      }
    }
  }

  function handleShortcut(keys) {
    if (keyboardShortcutsEnabled) {
      keyboardHandlers[keys]();
    }
  }

  function hideAllTools() {
    hideShareTools();
    filingTools.className = filingTools.className.replace(/\s*evernoteClipperVisible/g, "");
    emailSharing.className = emailSharing.className.replace(/\s*evernoteClipperVisible/g, "");
    userTools.className = userTools.className.replace(/\s*evernoteClipperVisible/g, "");
    globalTools.contentWindow.postMessage({
      name: "hideFilingDialogHacks"
    }, Browser.extension.getURL(""));
    globalTools.contentWindow.postMessage({
      name: "hideUserToolsHacks"
    }, Browser.extension.getURL(""));
    window.focus();
  }

  function hideClearly(after) {
    if (clearlyFrame) {
      var _width = clearlyFrame.scrollWidth;
      // window.parent.document.removeEventListener("scroll", scrollParentToTop);
      hideClearlyArticleContent();
      clearlyFrame.contentDocument.documentElement.className =
        clearlyFrame.contentDocument.documentElement.className.replace(/\s*clearlyVisible/g, "");
      document.body.className = document.body.className.replace(/\s*clearlyVisible/g, "");
      document.documentElement.className = document.documentElement.className.replace(/\s*clearlyVisible/g, "");
      document.body.scrollLeft = scrollLeft;
      document.body.scrollTop = scrollTop;
      window.ClearlyComponent__reformat.$iframeBackground.animate(
        { right: _width + "px" },
        500,
        "clearlyEasingForBackground",
        function() {
          document.body.className = document.body.className.replace(/\s*clearlyBeforeVisible/g, "");
          document.documentElement.className = document.documentElement.className.replace(/\s*clearlyBeforeVisible/g, "");
          clearlyFrame.style.top = "-100%";
          clearlyFrame.style.left = "-100%";
          clearlyFrame.style.height = document.body.clientHeight + "px";
          // window.focus();
          if (after) {
            if (after == "previewArticle") {
              contentPreview.previewArticle();
            } else if (after == "previewFullPage") {
              contentPreview.previewFullPage();
            } else if (after == "previewUrl") {
              contentPreview.previewUrl();
            } else if (after == "previewEmail") {
              contentPreview.previewEmail();
            } else if (after == "previewSelection") {
              contentPreview.previewSelection();
            }
          }
        }
      );
    } else if (after) {
      if (after == "previewArticle") {
        contentPreview.previewArticle();
      } else if (after == "previewFullPage") {
        contentPreview.previewFullPage();
      } else if (after == "previewUrl") {
        contentPreview.previewUrl();
      } else if (after == "previewEmail") {
        contentPreview.previewEmail();
      } else if (after == "previewSelection") {
        contentPreview.previewSelection();
      }
    }
  }

  function hideClearlyArticleContent() {
    window.ClearlyComponent__reformat.$iframeBox[0].style.display = "none";
    clearlyFrame.contentDocument.querySelector("#loading").style.display = "none";
  }

  function hideCoordinator(request, excludeOptions) {
    if (request && request.for && request.for == "screenshot") {
      screenshotting = true;
      tempTool = request.tool;
      tempShowSubtools = request.showSubtools;
      if (!/evernoteClipperVisible/.test(filingTools.className)) {
        filingToolsDoneHiding = true;
      }
    }
    globalTools.contentWindow.postMessage({ name: "hideExtras" }, Browser.extension.getURL(""));
    globalTools.className = globalTools.className.replace(/\s*evernoteClipperVisible/g, "");
    if (!excludeOptions && optionsPage) {
      optionsPage.className = optionsPage.className.replace(/\s*evernoteClipperVisible/g, "");
    }
    hideAllTools();
  }

  function hideShareTools() {
    shareTools.className = shareTools.className.replace(/\s*evernoteClipperVisible/g, "");
    globalTools.contentWindow.postMessage({
      name: "hideShareDialogHacks",
      height: shareTools.offsetHeight - 12
    }, Browser.extension.getURL(""));
  }

  function hideSkitch() {
    if (surface) {
      surface.disableEvents();
    }
    document.body.className = document.body.className.replace(/\s*skitchon/g, "");
    globalTools.className = globalTools.className.replace(/\s*(tempHidden|hidable)/g, "");
    msgHandlerShowScrollbar();
  }

  function init() {
    filingTools = document.createElement("iframe");
    filingTools.id = "evernoteFilingTools";
    filingTools.src = Browser.extension.getURL("content/filing_tools/filing_tools.html");
    filingTools.addEventListener("webkitTransitionEnd", function() {
      if (screenshotting) {
        filingToolsDoneHiding = true;
        if (globalToolsDoneHiding) {
          Browser.sendToExtension({ name: "captureScreenshot", tool: tempTool });
          filingToolsDoneHiding = false;
          globalToolsDoneHiding = false;
        }
      }
    });
    userTools = document.createElement("iframe");
    userTools.id = "evernoteUserTools";
    userTools.src = Browser.extension.getURL("content/user_tools/user_tools.html");
    shareTools = document.createElement("iframe");
    shareTools.id = "evernoteShareTools";
    shareTools.src = Browser.extension.getURL("content/share_tools/share_tools.html");
    emailSharing = document.createElement("iframe");
    emailSharing.id = "evernoteEmailSharing";
    emailSharing.src = Browser.extension.getURL("content/share_tools/email_sharing.html");
    globalTools = document.createElement("iframe");
    globalTools.id = "evernoteGlobalTools";
    globalTools.src = Browser.extension.getURL("content/global_tools/global_tools.html");
    globalTools.addEventListener("webkitTransitionEnd", function() {
      if (screenshotting) {
        globalToolsDoneHiding = true;
        if (filingToolsDoneHiding) {
          Browser.sendToExtension({ name: "captureScreenshot", tool: tempTool, showSubtools: tempShowSubtools });
          filingToolsDoneHiding = false;
          globalToolsDoneHiding = false;
        }
      }
      if (/needToLoadRest/.test(globalTools.className)) {
        globalTools.className = globalTools.className.replace(/\s*needToLoadRest/g, "");
        Browser.sendToExtension({ name: "getOption", option: "defaultClipAction" });
      }
    });
    readyUI++;

    document.documentElement.appendChild(filingTools);
    document.documentElement.appendChild(userTools);
    document.documentElement.appendChild(shareTools);
    document.documentElement.appendChild(emailSharing);
    document.documentElement.appendChild(globalTools);

    // initialize highlighter
    window.ClearlyComponent__highlight = {
      callbacks: {
        highlightAdded: function() {
          numTextHighlights++;
        },
        highlightDeleted: function() {
          numTextHighlights--;
        }
      },
      settings: {
        imgPath: Browser.extension.getURL("clearly/images/")
      },
      window: window,
      document: document,
      jQuery: window.jQuery
    };
    window.ClearlyComponent__highlight = initClearlyComponent__highlight(window.ClearlyComponent__highlight);
    window.ClearlyComponent__highlight.insertCSS();
    window.ClearlyComponent__highlight.addMouseHandlers();
  }

  function loadRegistration(request, sender, sendResponse) {
    authTools.className = "reg";
    authTools.addEventListener("load", function() {
      if (/registration/.test(this.src)) {
        authTools.contentWindow.postMessage({
          name: "setupReg",
          baseUrl: request.baseUrl,
          captcha: request.captcha,
          locale: request.locale,
          submit: request.submit
        }, "*");
      }
    });
    authTools.src = Browser.extension.getURL("content/auth_tools/registration.html");
  }

  function msgHandlerHideScrollbar(request, sender, sendResponse) {
    document.body.style.overflow = "hidden";
    if (clearlyFrame) {
      clearlyFrame.contentDocument.body.style.overflow = "hidden";
    }
  }

  function msgHandlerInjectedScript(request, sender, sendResponse) {
    if (request.script == "clearly/js/reformat.js") {
      startClearly();
    }
  }

  function msgHandlerLogoutCallback(request, sender, sendResponse) {
    if (request.userId) {
      showCoordinator(request);
    } else {
      hideCoordinator();
      contentPreview.clear();
      globalTools.contentWindow.postMessage({ name: "stopSkitch" }, Browser.extension.getURL(""));
      clearSkitch();
      hideClearly();
    }
  }

  function msgHandlerReceiveKeyboardShortcuts(request, sender, sendResponse) {
    var handlers = {};
    for (var k in request.keys) {
      var keycode;
      var keys = [];
      if (request.keys[k].indexOf("|") > -1) { // multikey shortcut
        keys = request.keys[k].split("|").map(function(mk) { return mk.split(",")[0]; });
        keycode = keys.join(" + ");
      } else {
        keycode = request.keys[k].split(",")[0];
        keys.push(keycode);
      }
      handlers[keycode] = handleShortcut;
      if (k == "closeWebClipperShortcut") {
        keyboardHandlers[keycode] = handleEscape;
        filingToolsShortcuts[k] = [ keycode ];
      } else if (k == "previewArticleShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("article"); };
      } else if (k == "previewFullPageShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("fullPage"); };
      } else if (k == "previewUrlShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("url"); };
      } else if (k == "selectionModeShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("selection"); };
      } else if (k == "takeScreenshotShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("screenshot"); };
      } else if (k == "clearlyShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("clearly"); };
      } else if (k == "pdfShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("pdf"); };
      } else if (k == "emailShortcut") {
        keyboardHandlers[keycode] = function() { switchMode("email"); };
      } else if (k == "expandArticleShortcut") {
        keyboardHandlers[keycode] = function() { handlePreviewShortcut("expand"); };
      } else if (k == "contractArticleShortcut") {
        keyboardHandlers[keycode] = function() { handlePreviewShortcut("contract"); };
      } else if (k == "moveArticleUpShortcut") {
        keyboardHandlers[keycode] = function() { handlePreviewShortcut("up"); };
      } else if (k == "moveArticleDownShortcut") {
        keyboardHandlers[keycode] = function() { handlePreviewShortcut("down"); };
      // } else if (k == "cyclePreviewsShortcut") {
      //   keyboardHandlers[keycode] = function() { switchMode(null, "next"); };
      } else if (k == "selectNotebookShortcut") {
        keyboardHandlers[keycode] = function() { handleFilingToolsShortcut("notebook"); };
      } else if (k == "addTagsShortcut") {
        keyboardHandlers[keycode] = function() { handleFilingToolsShortcut("tags"); };
      } else if (k == "saveShortcut") {
        keyboardHandlers[keycode] = save;
      } else if (k == "arrowShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("shape", "arrow"); };
      } else if (k == "textShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("text"); };
      } else if (k == "rectangleShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("shape", "rectangle"); };
      } else if (k == "roundedRectangleShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("shape", "roundedRectangle"); };
      } else if (k == "ellipseShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("shape", "ellipse"); };
      } else if (k == "lineShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("shape", "line"); };
      } else if (k == "markerShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("marker"); };
      } else if (k == "highlighterShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("highlighter"); };
      } else if (k == "stampShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("stamp"); };
      } else if (k == "pixelateShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("pixelate"); };
      } else if (k == "cropShortcut") {
        keyboardHandlers[keycode] = function() { switchSkitchTool("crop"); };
      }
      // the keycode we save uses the left cmd key on mac. expand it to use the
      // right cmd key and change it to Windows ctrl key
      if (keys.indexOf("91") > -1) {
        var newKeys = JSON.parse(JSON.stringify(keys));
        if (/windows/i.test(window.navigator.userAgent)) {
          newKeys[keys.indexOf("91")] = "17";
          newKeys.sort(function(a, b) { return a - b; });
          keyboardHandlers[newKeys.join(" + ")] = keyboardHandlers[keycode];
          delete keyboardHandlers[keycode];
          handlers[newKeys.join(" + ")] = handlers[keycode];
          delete handlers[keycode];
          if (filingToolsShortcuts[k]) {
            filingToolsShortcuts[k][0] = newKeys.join(" + ");
          }
        } else {
          newKeys[keys.indexOf("91")] = "93";
          newKeys.sort(function(a, b) { return a - b; });
          keyboardHandlers[newKeys.join(" + ")] = keyboardHandlers[keycode];
          handlers[newKeys.join(" + ")] = handlers[keycode];
          if (filingToolsShortcuts[k]) {
            filingToolsShortcuts[k].push(newKeys.join(" + "));
          }
        }
      }
    }
    Browser.addKeyboardHandlers(handlers);
    if (readyUI == 4) {
      setFilingToolsShortcuts = true;
      // filing dialog also needs to handle some shortcuts
      filingTools.contentWindow.postMessage({
        name: "setKeyboardHandlers", handlers: filingToolsShortcuts
      }, Browser.extension.getURL(""));
    }
  }

  function msgHandlerReceiveScreenshot(request, sender, sendResponse) {
    surface = Skitch.createSurface({ width: window.innerWidth, allowZoom: false,
      height: window.innerHeight, url: request.url, top: 0, left: 0, margin: 0,
      success: function() {
        document.body.appendChild(surface.getElement());
        surface.getElement().addEventListener("mousedown", function() {
          globalTools.contentWindow.postMessage({ name: "closeSubtools" },
            Browser.extension.getURL(""));
          globalTools.style.width = "";
        });
        surface.useTool(request.tool);
        surface.enableEvents();
        document.body.className += " skitchon";
        globalTools.contentWindow.postMessage({ name: "makeHidable" }, Browser.extension.getURL(""));
        scrollToTop();
        contentPreview.clear();
        hideClearly();
        surface.toast(Browser.i18n.getMessage("screenshotToast"));
        showCoordinator();
      }
    });
    surface.on("toolStarted", function(tool) {
      if (!usedTools[tool]) {
        usedTools[tool] = 0;
      }
      usedTools[tool]++;
    });
    surface.on("toolStopped", function(tool) {
      if (tool == "crop") {
        cropOn = false;
        showCoordinator();
        globalTools.contentWindow.postMessage({ name: "postCrop" }, Browser.extension.getURL(""));
      }
    });
    surface.localize({
      CROP_APPLY_TEXT: Browser.i18n.getMessage("apply"),
      CROP_CANCEL_TEXT: Browser.i18n.getMessage("regForm_cancel"),
      ZOOM_RESET_TEXT: Browser.i18n.getMessage("reset"),
      ZOOM_TIP_TEXT: Browser.i18n.getMessage("panInstruction")
    });
  }

  function msgHandlerShowScrollbar(request, sender, sendResponse) {
    document.body.style.overflow = "";
    if (clearlyFrame) {
      clearlyFrame.contentDocument.body.style.overflow = "";
    }
  }

  function msgHandlerStartSubmission(request, sender, sendResponse) {
    startSubmission({ data: request });
  }

  function msgHandlerToggleCoordinator(request, sender, sendResponse) {
    // Disable selecting preview type (for cases such as first time lanch experience)
    demoMode = !!(request && request.dontStartPreview);

    if (!/evernoteClipperVisible/.test(globalTools.className)) {
      clipResultCoordinator.hideClipResult(false);
      showCoordinator(request);
      Browser.sendToExtension({ name: "showOpenState" });
    } else {
      hideCoordinator();
      Browser.sendToExtension({ name: "showLoggedInState" });
      contentPreview.clear();
      contentPreview.reset();
      updateGuid = null;
      previousToken = null;
      globalTools.contentWindow.postMessage({ name: "stopSkitch" }, Browser.extension.getURL(""));
      clearSkitch();
      numTextHighlights = 0;
      if (clearlyFrame) {
        if (!recordedClearlyScrollStat) {
          recordedClearlyScrollStat = true;
          var maxScrollY = clearlyFrame.getAttribute("maxScrollY") || "0";
          Browser.sendToExtension({
            name: "trackEvent",
            userId: userId,
            category: "Clearly",
            action: "scroll",
            label: userType,
            value: parseInt(maxScrollY) * 100 / (clearlyFrame.contentWindow.document.body.scrollHeight - clearlyFrame.contentWindow.innerHeight)
          });
        }
        if (!recordedClearlySaveStat) {
          recordedClearlySaveStat = true;
          Browser.sendToExtension({
            name: "trackEvent",
            userId: userId,
            category: "Clearly",
            action: "saved",
            label: userType
          });
        }
      }
      hideClearly();
    }
  }

  function save() {
    if (/evernoteClipperVisible/.test(globalTools.className)) {
      globalTools.contentWindow.postMessage({ name: "save" }, Browser.extension.getURL(""));
    }
  }

  function scrollToTop() {
    window.scrollTo(0, 0);
  }

  function showClearly() {
    window.ClearlyComponent__reformat.applyOptions(window.ClearlyComponent__reformat.availableThemes["newsprint"]);
    window.ClearlyComponent__reformat.loadGoogleFontsRequiredByAppliedOptions();
    // window.addEventListener("scroll", scrollToTop);
    var _width = clearlyFrame.scrollWidth;
    document.body.className += " clearlyBeforeVisible";
    document.documentElement.className += " clearlyBeforeVisible";
    window.ClearlyComponent__reformat.$iframeBox[0].style.display = "none";
    window.ClearlyComponent__reformat.$iframeBackground[0].style.right = _width + "px";
    scrollLeft = document.body.scrollLeft;
    scrollTop = document.body.scrollTop;
    clearlyFrame.style.top = "0px";
    clearlyFrame.style.left = "0px";
    clearlyFrame.style.height = document.body.scrollHeight + "px";
    // window.ClearlyComponent__reformat.clearAllPages();
    window.ClearlyComponent__reformat.$iframeBackground.animate(
      { right: "0px" },
      500,
      "clearlyEasingForBackground",
      function() {
        // loading
        clearlyFrame.contentDocument.querySelector("#loading").style.display = "block";
        // end animation
        document.body.className += " clearlyVisible";
        document.documentElement.className += " clearlyVisible";
        clearlyFrame.contentDocument.documentElement.className += " clearlyVisible";
        // hide the sidebar
        if (!demoMode) {
            globalTools.contentWindow.postMessage({ name: "makeHidable" }, Browser.extension.getURL(""));
            globalTools.contentWindow.postMessage({ name: "tempHide" }, Browser.extension.getURL(""));
        }
        window.focus();
        // clearlyFrame.contentWindow.focus();
        if (window.ClearlyComponent__reformat.pagesCount == 0) {
          pageInfo.getCleanArticle(function(htmls) {
            if (htmls && htmls.length > 0) {
              window.ClearlyComponent__reformat.addNewPage(htmls[0], window.location.href);
              showClearlyArticleContent();
              for (var i = 1; i < htmls.length; i++) {
                window.ClearlyComponent__reformat.addNewPage(htmls[i], window.location.href);
              }
              var maxHeight = Math.max(document.body.scrollHeight, clearlyFrame.contentDocument.body.scrollHeight);
              clearlyFrame.style.height = maxHeight + "px";
            } else {
              pageInfo.getDefaultArticle(function(article) {
                if (article) {
                  window.ClearlyComponent__reformat.addNewPage(article.outerHTML, window.location.href);
                  showClearlyArticleContent();
                }
              });
            }
          },
          function(html, url) {
            window.ClearlyComponent__reformat.addNewPage(html, url);
            var maxHeight = Math.max(document.body.scrollHeight, clearlyFrame.contentDocument.body.scrollHeight);
            clearlyFrame.style.height = maxHeight + "px";
          });
        } else {
          showClearlyArticleContent();
        }
      }
    );
  }

  function showClearlyArticleContent() {
    window.ClearlyComponent__reformat.$iframeBox[0].style.display = "block";
    clearlyFrame.contentDocument.querySelector("#loading").style.display = "none";
    scrollToTop();
    var maxHeight = Math.max(document.body.scrollHeight, clearlyFrame.contentDocument.body.scrollHeight);
    clearlyFrame.style.height = maxHeight + "px";

    // Notify the UI that the Simple Article preview was successfully completed.
    // TODO(odopertchouk): really these should always appear in pairs:
    // taskStarted/taskFinished for every significant user action.
    Browser.sendToExtension({name: "bounce", message: { name: "taskFinished", type: "clearly"} });
  }

  function showCoordinator(request) {
    if (request) {
      Browser.sendToExtension({ name: "main_recordActivity" });
      filingTools.contentWindow.postMessage({ name: "reset" }, Browser.extension.getURL(""));
      userTools.contentWindow.postMessage({ name: "reset" }, Browser.extension.getURL(""));
      globalTools.contentWindow.postMessage({ name: "reset" }, Browser.extension.getURL(""));
      username = request.username;
      userId = request.userId;
      authTokens = request.authTokens;
      premium = request.premium;
      keyboardShortcutsEnabled = request.keyboardShortcutsEnabled;
      userType = "free";
      if (authTokens.biz) {
        userType = "business";
      } else if (premium) {
        userType = "premium";
      }
      filingTools.contentWindow.postMessage({
        name: "initialize",
        alwaysTags: request.alwaysTags,
        gmailThread: pageInfo.isGmailThread(),
        keyboardShortcutsEnabled: keyboardShortcutsEnabled,
        title: document.title.trim(),
        url: pageInfo.getCanonicalUrl() || document.location.href,
        userId: userId,
        userType: userType
      }, Browser.extension.getURL(""));
      if (!setFilingToolsShortcuts) {
        setFilingToolsShortcuts = true;
        filingTools.contentWindow.postMessage({
          name: "setKeyboardHandlers", handlers: filingToolsShortcuts
        }, Browser.extension.getURL(""));
      }
      Browser.sendToExtension({
        name: "getSmartFilingInfo",
        authTokens: authTokens,
        query: pageInfo.getSearchQuery(),
        recText: pageInfo.getRecommendationText(false),
        userId: userId
      });
      Browser.sendToExtension({
        name: "getNotebooks",
        authTokens: authTokens,
        userId: userId,
        username: username
      });
      Browser.sendToExtension({
        name: "getTags",
        authTokens: authTokens,
        userId: userId
      });
      globalTools.contentWindow.postMessage({
        name: "setUsername",
        premium: premium,
        fullName: request.fullName
      }, Browser.extension.getURL(""));
      globalTools.contentWindow.postMessage({
        name: "setPossibleClipTypes",
        pageInfo: {
          pdf: pageInfo.getPdfUrl(),
          documentIsFrameset: pageInfo.documentIsFrameset,
          selection: pageInfo.getSelection() ? true : false,
          gmail: pageInfo.isGmail(),
          gmailThread: pageInfo.isGmailThread()
        }
      }, Browser.extension.getURL(""));
      globalTools.className += " needToLoadRest";
      userTools.contentWindow.postMessage({
        name: "setup",
        auth: request.authTokens.pers,
        baseUrl: request.baseUrl,
        currentUser: request.fullName,
        locale: request.locale,
        loggedInUsers: request.loggedInUsers,
        numServices: request.numServices,
        premium: premium
      }, Browser.extension.getURL(""));
      userTools.style.height = (185 + request.loggedInUsers.length * 34
        + (request.loggedInUsers.length ? 1 : 0) * 34 + (premium ? 0 : 1) * 46) + "px";
    }
    globalTools.className = globalTools.className.replace(/\s*tempHidden/g, "");
    globalTools.className += " evernoteClipperVisible";
    screenshotting = false;
  }

  function showAuthTools(request, sender, sendResponse) {
    if (authTools && authTools.parentNode) {
      authTools.contentWindow.postMessage({
        name: "setupLogin",
        addAccount: request.addAccount,
        baseUrl: request.baseUrl,
        locale: request.locale,
        numServices: request.numServices
      }, Browser.extension.getURL(""));
      if (request.numServices > 1 && !request.addAccount) {
        authTools.className += " switchable";
      } else {
        authTools.className = authTools.className.replace(/\s*switchable/g, "");
      }
      if (request.addAccount) {
        authTools.className += " addAccount";
      } else {
        authTools.className = authTools.className.replace(/\s*addAccount/g, "");
      }
    } else {
      authTools = document.createElement("iframe");
      authTools.id = "evernoteAuthTools";
      authTools.addEventListener("load", function() {
        if (/login/.test(this.src)) {
          authTools.contentWindow.postMessage({
            name: "setupLogin",
            addAccount: request.addAccount,
            baseUrl: request.baseUrl,
            locale: request.locale,
            numServices: request.numServices
          }, Browser.extension.getURL(""));
          if (request.numServices > 1 && !request.addAccount) {
            authTools.className += " switchable";
          } else {
            authTools.className = authTools.className.replace(/\s*switchable/g, "");
          }
          if (request.addAccount) {
            authTools.className += " addAccount";
          } else {
            authTools.className = authTools.className.replace(/\s*addAccount/g, "");
          }
        }
      });
      authTools.src = Browser.extension.getURL("content/auth_tools/login.html");
      document.body.appendChild(authTools);
    }
    authTools.focus();
  }

  function showEmailDialog(request) {
    hideAllTools();
    emailSharing.className += " evernoteClipperVisible";
    emailSharing.contentWindow.postMessage({
      name: "setup",
      auth: request.auth,
      noteGuid: request.noteGuid,
      persAuth: request.persAuth,
      sharedAuth: request.sharedAuth,
      subject: request.subject,
      userId: request.userId
    }, Browser.extension.getURL(""));
    globalTools.contentWindow.postMessage({
      name: "showShareDialogHacks",
      height: emailSharing.offsetHeight - 12
    }, Browser.extension.getURL(""));
  }

  function showLogin(request) {
    authTools.className = authTools.className.replace(/\s*tfa/g, "").replace(/\s*reg/g, "");
    if (request && request.error) {
      var showError = function() {
        if (/login/.test(this.src)) {
          authTools.contentWindow.postMessage({
            name: "setGlobalError",
            error: request.error
          }, Browser.extension.getURL(""));
          authTools.removeEventListener("load", showError);
        }
      };
      authTools.addEventListener("load", showError);
    }
    authTools.src = Browser.extension.getURL("content/auth_tools/login.html");
  }

  function startClearly() {
    window.ClearlyComponent__reformat = {
      callbacks: {
        frameCreated: function () {
          clearlyFrame = window.ClearlyComponent__reformat.iframe;
          // track how much they scroll
          clearlyFrame.contentWindow.addEventListener("scroll", function() {
            var scrollY = clearlyFrame.contentWindow.scrollY;
            if (scrollY > maxScrollY) {
              maxScrollY = scrollY;
              clearlyFrame.contentWindow.frameElement.setAttribute("maxScrollY", maxScrollY);
            }
          });
          // add loading sign
          var _loading = clearlyFrame.contentDocument.createElement("div");
          var _loading_spinner = clearlyFrame.contentDocument.createElement("div");
          _loading.setAttribute("id", "loading");
          _loading_spinner.setAttribute("id", "loading_spinner");
          _loading.appendChild(_loading_spinner);
          clearlyFrame.contentDocument.body.appendChild(_loading);
          var _loading_css_element = clearlyFrame.contentDocument.createElement("style");
          _loading_css_element.setAttribute("id", "loading_sign_css");
          _loading_css_element.setAttribute("type", "text/css");
          var cssText = "#loading { "
            + "position: fixed; top: 0; right: 0; width: 100%; height: 100%; z-index: 300; ";
          if (window.devicePixelRatio < 1.5) {
            cssText += "background-image: url('" + Browser.extension.getURL("clearly/images/loading--background.png") + "'); ";
          } else {
            cssText += "background-image: url('" + Browser.extension.getURL("clearly/images/loading--background@2x.png") + "'); ";
          }
          cssText += "background-position: center center; background-repeat: no-repeat; "
            + "} "
            + "#loading_spinner { "
            + "position: absolute; top: 0; left: 0; width: 100%; height: 100%; ";
          if (window.devicePixelRatio < 1.5) {
            cssText += "background-image: url('" + Browser.extension.getURL("clearly/images/loading--big.gif") + "'); ";
          } else {
            cssText += "background-image: url('" + Browser.extension.getURL("clearly/images/loading--big@2x.gif") + "'); ";
          }
          cssText += "background-position: center center; background-repeat: no-repeat; }";
          _loading_css_element.innerText = cssText;
          clearlyFrame.contentDocument.body.appendChild(_loading_css_element);
          // initialize highlighter
          clearlyFrame.contentWindow.ClearlyComponent__highlight = {
            callbacks: {},
            settings: {
              imgPath: Browser.extension.getURL("clearly/images/")
            },
            window: clearlyFrame.contentWindow,
            document: clearlyFrame.contentDocument,
            jQuery: window.jQuery
          };
          clearlyFrame.contentWindow.ClearlyComponent__highlight = initClearlyComponent__highlight(clearlyFrame.contentWindow.ClearlyComponent__highlight);
          clearlyFrame.contentWindow.ClearlyComponent__highlight.insertCSS();
          clearlyFrame.contentWindow.ClearlyComponent__highlight.addMouseHandlers();
          showClearly();
        }
      },
      settings: {
        cssPath: Browser.extension.getURL("clearly/css/"),
        pageLabel: Browser.i18n.getMessage("page") + " ",
        onCreateFrameUseThisId: "evernoteClearlyArticle",
        onCreateFrameDoNotInsertCSS: true
      },
      window: window,
      document: document,
      jQuery: window.jQuery
    };
    window.ClearlyComponent__reformat = initClearlyComponent__reformat(window.ClearlyComponent__reformat);
    // add custom easing algorithm
    $.easing["clearlyEasingForBackground"] = function(x, t, b, c, d) {
      /* out cubic :: variation */
      var ts = (t /= d) * t;
      var tc = ts * t;
      return b + c * (-2.5 * tc * ts + 10 * ts * ts -14 * tc + 7 * ts + 0.5 * t);
    }
    window.ClearlyComponent__reformat.createFrame();
  }

  function startSubmission(evt) {
    // Turn sharing off because for demo mode the data is not real.
    if (demoMode) {
      shareTools.className += " evernoteClipperVisible";
      filingTools.contentWindow.postMessage({ name: "getClipResultInfo" }, Browser.extension.getURL(""));
      return;
    }

    var portId = Browser.openPort();
    pendingNoteKey = UUID.generateGuid();

    function complete(html, width) {
      var msg = {
        name: "receiveNoteContent",
        clipType: evt.data.type,
        html: html,
        pendingNoteKey: pendingNoteKey,
        recommendationText: pageInfo.getRecommendationText(false),
        share: evt.data.share,
        hasTextHighlights: numTextHighlights > 0,
        userId: userId,
        userType: userType,
        width: width
      };
      if (updateGuid) {
        msg.updateGuid = updateGuid;
      }
      if (previousToken) {
        msg.previousToken = previousToken;
      }
      Browser.sendToExtension(msg, portId);
      if (!evt.data.share) {
        contentPreview.reset();
        numTextHighlights = 0;
        updateGuid = null;
        previousToken = null;
      }
    }

    function gatherParts() {
      if (typeof MessageChannel != "undefined") {
        // set up message channel to filing dialog to securely get the filing info
        var filChannel = new MessageChannel();
        filChannel.port1.addEventListener("message", function(evt) {
          Browser.sendToExtension(evt.data, portId);
          filChannel.port1.close();
        });
        filChannel.port1.start();
        filingTools.contentWindow.postMessage({
          name: "sendFilingInfo",
          pendingNoteKey: pendingNoteKey,
          useDefaultNotebook: evt.data.contextMenu
        }, Browser.extension.getURL(""), [ filChannel.port2 ]);
      } else { // doesn't support MessageChannels. bounce it through background
        filingTools.contentWindow.postMessage({
          name: "sendFilingInfo",
          pendingNoteKey: pendingNoteKey,
          useDefaultNotebook: evt.data.contextMenu
        }, Browser.extension.getURL(""));
      }
      if (evt.data.type == "screenshot") {
        if (evt.data.contextMenu) {
          // if (/evernoteClipperVisible/.test(globalTools.className)) {
          //   msgHandlerToggleCoordinator();
          // }
        } else {
          surface.getFile(function(file) {
            var msg = {
              name: "receiveNoteContent",
              clipType: "skitch",
              content: "<img src=\"resource:0\"></img>",
              contentClass: "evernote.skitch",
              pendingNoteKey: pendingNoteKey,
              recommendationText: pageInfo.getRecommendationText(false),
              resources: [ { bytes: file.bytes, mime: file.mime } ],
              share: evt.data.share,
              userId: userId,
              userType: userType
            };
            if (updateGuid) {
              msg.updateGuid = updateGuid;
            }
            if (previousToken) {
              msg.previousToken = previousToken;
            }
            Browser.sendToExtension(msg, portId);
            for (var tool in usedTools) {
              Browser.sendToExtension({
                name: "trackEvent",
                userId: userId,
                category: "Skitch Tool",
                action: tool,
                label: userType,
                value: usedTools[tool]
              });
            }
          });
        }
        if (!evt.data.share) {
          contentPreview.reset();
          numTextHighlights = 0;
          updateGuid = null;
          previousToken = null;
          clearSkitch();
        }
      } else if (evt.data.type == "clearly") {
        clipper.clipClearly(window.ClearlyComponent__reformat.$iframePages[0],
          clearlyFrame.contentWindow, function(html, width) {
          complete(html, width);
        });
        if (!evt.data.share) {
          hideClearly();
        }
        recordedClearlySaveStat = true;
        Browser.sendToExtension({
          name: "trackEvent",
          userId: userId,
          category: "Clearly",
          action: "saved",
          label: userType
        });
      } else { // clipper
        if (evt.data.type == "article") {
          clipper.clipArticle(true, complete);
        } else if (evt.data.type == "fullPage") {
          clipper.clipFullPage(true, complete);
        } else if (evt.data.type == "selection") {
          clipper.clipSelection(true, evt.data.selectionText, complete);
        } else if (evt.data.type == "url") {
          clipper.clipUrl(complete);
        } else if (evt.data.type == "pdf") {
          clipper.clipPdf(complete);
        } else if (evt.data.type == "email") {
          clipper.clipEmail(complete);
        } else if (evt.data.type == "image") {
          clipper.clipImage(evt.data.imageUrl, complete);
        }
        if (!evt.data.share) {
          // don't reset preview state yet. wait until it's scraped it
          contentPreview.clear();
          clearSkitch();
        }
      }
      if (evt.data.contextMenu) {
        globalTools.contentWindow.postMessage({ name: "stopSkitch" }, Browser.extension.getURL(""));
      }
    }

    if (evt.data.share) {
      hideAllTools();
      shareTools.className += " evernoteClipperVisible";
      gatherParts();
    } else {
      hideCoordinator();
      Browser.sendToExtension({ name: "showLoggedInState" });
      clipResultCoordinator.showClipResult(pendingNoteKey, gatherParts);
      if (clearlyFrame) {
        if (!recordedClearlyScrollStat) {
          recordedClearlyScrollStat = true;
          var maxScrollY = clearlyFrame.getAttribute("maxScrollY") || "0";
          Browser.sendToExtension({
            name: "trackEvent",
            userId: userId,
            category: "Clearly",
            action: "scroll",
            label: userType,
            value: parseInt(maxScrollY) * 100 / (clearlyFrame.contentWindow.document.body.scrollHeight - clearlyFrame.contentWindow.innerHeight)
          });
        }
      }
    }

    if (clearlyFrame && evt.data.type != "clearly") {
      recordedClearlySaveStat = true;
      Browser.sendToExtension({
        name: "trackEvent",
        userId: userId,
        category: "Clearly",
        action: "didn't save",
        label: userType
      });
    }
  }

  function switchMode(mode, direction) {
    if (/evernoteClipperVisible/.test(globalTools.className) && !/skitchon/.test(document.body.className)) {
      if (mode) {
        globalTools.contentWindow.postMessage({ name: "switchMode", mode: mode }, Browser.extension.getURL(""));
      } else if (direction) {
        globalTools.contentWindow.postMessage({ name: "switchMode", direction: direction }, Browser.extension.getURL(""));
      }
    }
  }

  function switchSkitchTool(tool, subtool, location, charCode) {
    if (/skitchon/.test(document.body.className)) {
      globalTools.contentWindow.postMessage({
        name: "switchSkitchTool",
        tool: tool,
        subtool: subtool,
        location: location,
        charCode: charCode
      }, Browser.extension.getURL(""));
    }
  }

  function toggle(domElement) {
    if (/evernoteClipperVisible/.test(domElement.className)) {
      domElement.className = domElement.className.replace(/\s*evernoteClipperVisible/g, "");
      return false;
    } else {
      hideAllTools();
      domElement.className += " evernoteClipperVisible";
      return true;
    }
  }

  function toggleFilingTools(evt) {
    var visible = toggle(filingTools);
    if (visible) {
      filingTools.focus();
      filingTools.contentWindow.postMessage({
        name: "setFocus",
        focus: evt.data.focus
      }, Browser.extension.getURL(""));
      globalTools.contentWindow.postMessage({
        name: "showFilingDialogHacks",
        height: filingTools.offsetHeight - 12
      }, Browser.extension.getURL(""));
    } else {
      globalTools.contentWindow.postMessage({
        name: "hideFilingDialogHacks"
      }, Browser.extension.getURL(""));
    }
  }

  function turnOffHTMLHighlighter() {
    if (/clearlyVisible/.test(document.documentElement.className)) {
      clearlyFrame.contentWindow.ClearlyComponent__highlight.disable();
    } else {
      window.ClearlyComponent__highlight.disable();
    }
  }

  function useSkitchTool(evt) {
    surface.enableEvents();
    document.body.className += " skitchon";
    document.body.style.overflow = "hidden";
    scrollToTop();

    surface.useTool(evt.data.tool);
    if (evt.data.tool == "crop") {
      cropOn = true;
      hideCoordinator();
      globalTools.contentWindow.postMessage({ name: "unmakeHidable" }, Browser.extension.getURL(""));
    } else if (evt.data.tool == "text" && evt.data.location) {
      surface.startActiveTool(evt.data.location, {
        value: String.fromCharCode(evt.data.charCode),
        selectOnFocus: false
      });
    }
    turnOffHTMLHighlighter();
  }

  function zoomIn() {
    if (/skitchon/.test(document.body.className)) {
      surface.zoom(1.1, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      centerSkitch(surface.getBox().width);
    }
  }

  function zoomOut() {
    if (/skitchon/.test(document.body.className)) {
      surface.zoom(1/1.1, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      centerSkitch(surface.getBox().width);
    }
  }

  function msgHandlerPauseSkitch() {
    if (/skitchon/.test(document.body.className)) {
      globalTools.contentWindow.postMessage({ name: "stopSkitch" }, Browser.extension.getURL(""));
    }
  }
  // function toggle(domElement, wait) {
  // function toggle(domElement) {
  //   if (window.getComputedStyle(domElement).display == "none") {
  //     domElement.style.display = "block";
  //     domElement.setAttribute("open");
  //   } else {
  //     // if (!wait) {
  //     domElement.style.display = "none";
  //     // }
  //     domElement.removeAttribute("open");
  //   }
  // }

  Browser.addMessageHandlers({
    doneSharing: doneSharing,
    hideCoordinator: hideCoordinator,
    hideScrollbar: msgHandlerHideScrollbar,
    injectedScript: msgHandlerInjectedScript,
    loadReg: loadRegistration,
    logoutCallback: msgHandlerLogoutCallback,
    receiveKeyboardShortcuts: msgHandlerReceiveKeyboardShortcuts,
    receiveScreenshot: msgHandlerReceiveScreenshot,
    showAuthTools: showAuthTools,
    showCoordinator: showCoordinator,
    startSubmission: msgHandlerStartSubmission,
    toggleCoordinator: msgHandlerToggleCoordinator,
    pauseSkitch: msgHandlerPauseSkitch
  });

  window.addEventListener("message", function(evt) {
    if (new RegExp(evt.origin, "i").test(Browser.extension.getURL(""))) {
      if (evt.data.name == "userDropdownHeader") {
        handleUserDropdownHeaderEvents(evt);
      } else if (evt.data.name == "setFilingToolsHeight") {
        filingTools.style.height = evt.data.height + "px";
        if (/evernoteClipperVisible/.test(filingTools.className)) {
          globalTools.contentWindow.postMessage({
            name: "showFilingDialogHacks",
            height: filingTools.offsetHeight - 12
          }, Browser.extension.getURL(""));
        }
      } else if (evt.data.name == "startSubmission") {
        startSubmission(evt);
      } else if (evt.data.name == "toggleCoordinator") {
        msgHandlerToggleCoordinator(evt.data);
      } else if (evt.data.name == "showOptions") {
        if (!optionsPage) {
          optionsPage = document.createElement("iframe");
          optionsPage.id = "evernoteOptionsPage";
          document.documentElement.appendChild(optionsPage);
          optionsPage.src = Browser.extension.getURL("options.html#iframe");
          optionsPage.className = "evernoteClipperVisible";
        } else {
          optionsPage.className += " evernoteClipperVisible";
          optionsPage.contentWindow.postMessage({ name: "showYourself" }, Browser.extension.getURL(""));
        }
        hideCoordinator(null, true);
        hideSkitch();
        hideClearly();
        contentPreview.gray();
      } else if (evt.data.name == "hideOptions") {
        optionsPage.className = optionsPage.className.replace(/\s*evernoteClipperVisible/g, "");
        showCoordinator();
        globalTools.contentWindow.postMessage({
          name: "reactivateClipperTool"
        }, Browser.extension.getURL(""));
      } else if (evt.data.name == "useSkitchTool") {
        useSkitchTool(evt);
      } else if (evt.data.name == "useSkitchColor") {
        surface.updateSelectedElementsColor(evt.data.color);
        surface.useColor(evt.data.color);
      } else if (evt.data.name == "setToolbarWidth") {
        globalTools.style.width = evt.data.width;
      } else if (evt.data.name == "dispatchEvent") {
        dispatchEventToSkitch(evt.data.type, evt.data.x, evt.data.y, true);
      } else if (evt.data.name == "hideSkitch") {
        hideSkitch();
      } else if (evt.data.name == "toggleFilingTools") {
        toggleFilingTools(evt);
      } else if (evt.data.name == "uiReady") {
        readyUI++;
        if (readyUI == 4) {
          Browser.sendToExtension({ name: "uiReady" });
        }
      } else if (evt.data.name == "showClearly") {
        if (clearlyFrame) {
          showClearly();
        } else {
          Browser.sendToExtension({ name: "injectScript", script: "clearly/js/reformat.js" });
        }
      } else if (evt.data.name == "hideClearly") {
        hideClearly(evt.data.after);
      } else if (evt.data.name == "closeAuthTools") {
        authTools.parentNode.removeChild(authTools);
      } else if (evt.data.name == "loadTFa") {
        authTools.className = "tfa";
        authTools.addEventListener("load", function() {
          if (/two_factor/.test(this.src)) {
            authTools.contentWindow.postMessage({
              name: "setupTFa",
              auth: evt.data.auth,
              baseUrl: evt.data.baseUrl,
              expiration: evt.data.expiration,
              locale: evt.data.locale,
              sms: evt.data.sms
            }, "*");
          }
        });
        authTools.src = Browser.extension.getURL("content/auth_tools/two_factor.html");
      } else if (evt.data.name == "showLogin") {
        showLogin(evt.data);
      } else if (evt.data.name == "toggleUserTools") {
        if (toggle(userTools)) {
          globalTools.contentWindow.postMessage({
            name: "showUserToolsHacks",
            height: parseFloat(userTools.style.height)
          }, Browser.extension.getURL(""));
        } else {
          globalTools.contentWindow.postMessage({
            name: "hideUserToolsHacks"
          }, Browser.extension.getURL(""));
        }
      } else if (evt.data.name == "showAuthTools") {
        showAuthTools(evt.data);
      } else if (evt.data.name == "showCoordinator") {
        showCoordinator();
      } else if (evt.data.name == "showEmailDialog") {
        showEmailDialog(evt.data);
      } else if (evt.data.name == "hideEmailDialog") {
        shareTools.className += " evernoteClipperVisible";
        shareTools.contentWindow.postMessage(evt.data, Browser.extension.getURL(""));
        emailSharing.className = emailSharing.className.replace(/\s*evernoteClipperVisible/g, "");
        globalTools.contentWindow.postMessage({
          name: "showShareDialogHacks",
          height: shareTools.offsetHeight - 12
        }, Browser.extension.getURL(""));
      } else if (evt.data.name == "zoomin") {
        zoomIn();
      } else if (evt.data.name == "zoomout") {
        zoomOut();
      } else if (["setNotebook", "createTag", "clearTag", "clearTags"].indexOf(evt.data.name) > -1) {
        globalTools.contentWindow.postMessage(evt.data, Browser.extension.getURL(""));
      } else if (evt.data.name == "setShareToolsHeight") {
        shareTools.style.height = evt.data.height + "px";
        if (/evernoteClipperVisible/.test(shareTools.className)) {
          globalTools.contentWindow.postMessage({
            name: "showShareDialogHacks",
            height: shareTools.offsetHeight - 12
          }, Browser.extension.getURL(""));
        }
      } else if (evt.data.name == "hideAllTools") {
        hideAllTools();
        clipResultCoordinator.hideClipResult(true);
      } else if (evt.data.name == "hideShareTools") {
        hideShareTools();
      } else if (evt.data.name == "useHighlighter") {
        if (/skitchon/.test(document.body.className)) {
          useSkitchTool({ data: { tool: "highlighter" } });
        } else {
          if (/clearlyVisible/.test(document.documentElement.className)) {
            clearlyFrame.contentWindow.ClearlyComponent__highlight.enable();
          } else {
            window.ClearlyComponent__highlight.enable();
          }
        }
      } else if (evt.data.name == "turnOffHTMLHighlighter") {
        turnOffHTMLHighlighter();
      } else if (evt.data.name == "setOptionsHeight") {
        // if the window is too tall for the window, make the options page
        // shorter by making the inner part scrollable
        if (evt.data.height > window.innerHeight) {
          optionsPage.style.height = window.innerHeight + "px";
          optionsPage.style.top = "calc(50% - " + (window.innerHeight / 2) + "px)";
          optionsPage.contentWindow.postMessage({
            name: "setPinchHeight", totalHeight: window.innerHeight
          }, Browser.extension.getURL(""));
        } else {
          optionsPage.style.height = evt.data.height + "px";
          optionsPage.style.top = "calc(50% - " + (evt.data.height / 2) + "px)";
        }
      } else if (evt.data.name == "tempHideGlobalTools") {
        globalTools.className += " tempHidden";
      } else if (evt.data.name == "untempHideGlobalTools") {
        globalTools.className = globalTools.className.replace(/\s*tempHidden/g, "");
      } else if (evt.data.name == "makeGlobalToolsHidable") {
        globalTools.className += " hidable";
        globalTools.style.width = "";
      } else if (evt.data.name == "incAuthToolsHeight") {
        if (evt.data.height) {
          authTools.style.height = (authTools.clientHeight + evt.data.height) + "px";
        } else {
          authTools.style.height = "";
        }
      } else if (evt.data.name == "eventFilter" || evt.data.name == "eventClick" ) {
        if (evt.data.wnd === "globalTools") {
          globalTools.contentWindow.postMessage(evt.data, Browser.extension.getURL(""));
        }
      }
    }
  });

  window.addEventListener("keydown", function(evt) {
    if (/evernoteClipperVisible/.test(globalTools.className)) {
      if (/Mac OS X/.test(window.navigator.userAgent)) {
        if (evt.metaKey) {
          evt.preventDefault();
        }
      } else if (/Windows/.test(window.navigator.userAgent)) {
        if (evt.ctrlKey) {
          evt.preventDefault();
        }
      }
      if ([8, 13, 27, 39, 37, 65, 70, 66, 83, 77, 80, 69, 67].indexOf(evt.keyCode) > -1) {
        if (!/skitchon/.test(document.body.className)) {
          evt.preventDefault();
        }
      }
    }
  });

  window.addEventListener("keypress", function(evt) {
    if (/skitchon/.test(document.body.className)) {
      // typing automatically goes into text tool in skitch
      // put textbox in the center
      if (!document.querySelector("textarea.skitch-tool-element-text-editor")) {
        var centerX = surface.getElement().offsetWidth / 2;
        var centerY = surface.getElement().offsetHeight / 2;
        switchSkitchTool("text", null, { x: centerX, y: centerY }, evt.charCode);
        evt.preventDefault();
      }
    }
  });

  Browser.sendToExtension({
    name: "getKeyboardShortcuts", shortcuts: [
      "closeWebClipperShortcut", "previewArticleShortcut",
      "previewFullPageShortcut", "previewUrlShortcut", "selectionModeShortcut",
      "takeScreenshotShortcut", "clearlyShortcut", "pdfShortcut", "emailShortcut",
      "expandArticleShortcut", "contractArticleShortcut", "moveArticleUpShortcut",
      "moveArticleDownShortcut", "selectNotebookShortcut", "addTagsShortcut",
      "saveShortcut", "arrowShortcut", "textShortcut", "rectangleShortcut",
      "roundedRectangleShortcut", "ellipseShortcut", "lineShortcut", "markerShortcut",
      "highlighterShortcut", "stampShortcut", "pixelateShortcut", "cropShortcut"
    ]
  });

  window.addEventListener("click", hideAllTools);
  window.addEventListener("mousedown", function(evt) {
    if (/evernoteClipperVisible/.test(globalTools.className)) {
      // don't select text with the html highlighter if it's in the white part
      // of the veil
      if (contentPreview.isPointOnVeil(evt.pageX, evt.pageY)) {
        evt.preventDefault();
      }
    } else if (optionsPage && /evernoteClipperVisible/.test(optionsPage.className)) {
      evt.preventDefault();
    }
  });

  window.addEventListener("resize", function() {
    if (/skitchon/.test(document.body.className)) {
      centerSkitch(surface.getBox().width);
    }
  });

  // record clearly engagement stats
  window.addEventListener("unload", function() {
    Browser.sendToExtension({ name: "showLoggedInOrOutState" });
    if (!recordedClearlyScrollStat) {
      if (clearlyFrame) {
        var maxScrollY = clearlyFrame.getAttribute("maxScrollY") || "0";
        Browser.sendToExtension({
          name: "trackEvent",
          userId: userId,
          category: "Clearly",
          action: "scroll",
          label: userType,
          value: parseInt(maxScrollY) * 100 / (clearlyFrame.contentWindow.document.body.scrollHeight - clearlyFrame.contentWindow.innerHeight)
        });
        recordedClearlyScrollStat = true;
        if (!recordedClearlySaveStat) {
          recordedClearlySaveStat = true;
          Browser.sendToExtension({
            name: "trackEvent",
            userId: userId,
            category: "Clearly",
            action: "didn't save",
            label: userType
          });
        }
      }
    }
  });

  init();

  Object.preventExtensions(this);
}
Object.preventExtensions(Coordinator);

injected = true;
new Coordinator();

// Content script for handling evernote.com pages.

var enContentScripts = {
  notifyWeb: {
    regexp: /^https?:\/\/(www|stage|stage-china|app)\.(evernote|yinxiang)\.com\/Home\.action/,
    func: notifyWeb
  },
  notifyInstalled: {
    regexp: /^https?:\/\/([A-Za-z0-9-]+\.)*(evernote|yinxiang)\.com\//,
    func: notifyInstalled
  }
}

function runEnContentScripts() {
  for (var i in enContentScripts) {
    if (enContentScripts[i].regexp.test(document.location.href)) {
      enContentScripts[i].func();
    }
  }
}

window.addEventListener("DOMContentLoaded", runEnContentScripts);

function notifyWeb() {
  /* Appends a div with a special ID to the body of the current page. The page can then check
   * for this special div and do something. */

  var clipperdiv = document.createElement("div");
  if (SAFARI) {
    clipperdiv.setAttribute("id", "__en_safari_extension");
  }
  else {
    clipperdiv.setAttribute("id", "__en_chrome_extension");
  }
  clipperdiv.style.display = "none";
  document.body.appendChild(clipperdiv);
}

function notifyInstalled() {
  var meta = document.createElement("meta");
  meta.name = "evernote-webclipper-extension";
  meta.content = "installed";
  document.head.appendChild(meta);

  if (!document.body) return;

  var classes = document.body.className ? document.body.className : "";
  classes = classes.replace(/(^|\s+)evernote-webclipper-extension($|\s+)/, " ");
  var classList = classes.trim().split(/\s+/);
  classList.push("evernote-webclipper-extension");
  document.body.className = classList.join(" ");
}

// Register keyboard shortcuts.
var mac = navigator.userAgent.match(/Mac OS X/);
if (Browser && Browser.addKeyboardHandlers) {
  if (mac) {
    Browser.addKeyboardHandlers({
      "17 + 65 + 91": switchUser // ctrl + a + cmd
    });
  }
  else {
     Browser.addKeyboardHandlers({
        "17 + 18 + 65": switchUser // ctrl + alt + a
     });
  }
}
else {
  if (document.location.href.match(/^http/i) && (window.parent == window)) {
    log.warn("Skipping keyboard handlers on " + document.location.href);
  }
}

function switchUser() {
  Browser.sendToExtension({name: "main_incrementUser"});
}

if (Browser && Browser.addMessageHandlers) {
  Browser.addMessageHandlers({
    content_userChanged: showUserChanged
  });
}
else {
  if (document.location.href.match(/^http/i) && (window.parent == window)) {
    log.warn("Skipping message handlers on " + document.location.href);
  }
}

var iframe;
var showUserTimeout = null;
window.addEventListener("message", function(evt){
  if (evt && evt.data && evt.data === "en_clipper_frame_loaded") {
    if (iframe) iframe.className = "visible";
  }
}, false);

function showUserChanged(message, sender, sendResponse) {
  var style = document.querySelector("#evernote-clipper-user-switcher");
  if (!style) {
    style = document.createElement("link");
    style.id = "evernote-clipper-user-switcher";
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = Browser.extension.getURL("content/user_changed.css");
    style.onload = function() {
      finishUserChanged(message, sender, sendResponse);
    }
    document.head.appendChild(style);
    return;
  }
  finishUserChanged(message, sender, sendResponse);
}

function finishUserChanged(message, sender, sendResponse) {
  iframe = document.querySelector("#evernote_clipper_user_changed");
  if (iframe) iframe.parentNode.removeChild(iframe);

  iframe = document.createElement("iframe");
  iframe.id = "evernote_clipper_user_changed";
  iframe.src = Browser.extension.getURL("content/user_changed.html") + "?" + message.username;
  document.body.appendChild(iframe);

  function hideUserFrame() {
    iframe.addEventListener("webkitTransitionEnd", function(evt) {
      if (evt && evt.srcElement && evt.srcElement === iframe) {
        iframe.parentNode.removeChild(iframe);
        var style = document.querySelector("#evernote-clipper-user-switcher");
        if (style) {
          style.parentNode.removeChild(style);
        }
      }
    }, false);
    iframe.className = "hidden";
  }
  if (showUserTimeout) {
    clearTimeout(showUserTimeout);
    showUserTimeout = null;
  }
  showUserTimeout = setTimeout(hideUserFrame, 3000);
}



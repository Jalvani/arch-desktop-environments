var tutorial;
var addAccount;
var logout;
var logoutAll;
var premium;
var options;

var baseUrl;
var locale;
var numServices;

function addAnotherAccount() {
  window.parent.postMessage({ name: "toggleCoordinator" }, "*");
  window.parent.postMessage({
    name: "showAuthTools",
    addAccount: true,
    baseUrl: baseUrl,
    locale: locale,
    numServices: numServices
  }, "*");
}

function addLoggedInUsers(users) {
  for (var i = 0; i < users.length; i++) {
    var u = document.createElement("div");
    u.className = "switchToUser";
    u.innerText = Browser.i18n.getMessage("switchToAccount", [ users[i].name ]);
    u.setAttribute("data-id", users[i].id);
    u.addEventListener("click", switchToUser);
    addAccount.parentNode.insertBefore(u, addAccount);
  }
}

function openGuide() {
  Browser.sendToExtension({ name: "main_openTab", url: baseUrl + "/webclipper/guide/" });
}

function receivePersistentValue(request, sender, sendResponse) {
  if (request.key == "EVERNOTE_VERSION") {
    document.querySelector("#version").innerText =
      Browser.i18n.getMessage("version", [ request.value, BUILD_VERSION + "/" + SKITCH_BUILD_VERSION ]);
  }
}

function removeLoggedInUsers() {
  var users = document.querySelectorAll(".switchToUser");
  for (var i = 0; i < users.length; i++) {
    users.item(i).parentNode.removeChild(users.item(i));
  }
}

function signout() {
  Browser.sendToExtension({ name: "LOGOUT" });
}

function signoutAll() {
  Browser.sendToExtension({ name: "LOGOUT", all: true });
}

function switchToUser() {
  Browser.sendToExtension({ name: "setCurrentUser", user: this.getAttribute("data-id") });
}

window.addEventListener("DOMContentLoaded", function() {
  // setup variables
  tutorial = document.querySelector("#tutorial");
  addAccount = document.querySelector("#addAccount");
  logout = document.querySelector("#logout");
  logoutAll = document.querySelector("#logoutAll");
  premium = document.querySelector("#premium");
  options = document.querySelector("#options");
  // localize
  GlobalUtils.localize(document.body);
  Browser.sendToExtension({ name: "getPersistentValue", key: "EVERNOTE_VERSION" });
  // event handlers
  tutorial.addEventListener("click", openGuide);
  addAccount.addEventListener("click", addAnotherAccount);
  logout.addEventListener("click", signout);
  logoutAll.addEventListener("click", signoutAll);
  options.addEventListener("click", function() {
    window.parent.postMessage({ name: "showOptions" }, "*");
  });
  window.parent.postMessage({ name: "uiReady" }, "*");
});

window.addEventListener("message", function(evt) {
  if (evt.data.name == "setup") {
    baseUrl = evt.data.baseUrl;
    locale = evt.data.locale;
    numServices = evt.data.numServices;
    addLoggedInUsers(evt.data.loggedInUsers);
    logout.innerText = Browser.i18n.getMessage("signOutAccount", [ evt.data.currentUser ]);
    if (evt.data.loggedInUsers.length) {
      logout.className = logout.className.replace(/\s*last/g, "");
      logoutAll.className += " visible";
    } else {
      logout.className += " last";
      logoutAll.className = logoutAll.className.replace(/\s*visible/g, "");
    }
    if (evt.data.premium) {
      premium.className = premium.className.replace(/\s*visible/g, "");
    } else {
      premium.className += " visible";
      var origin = "clipper-chrome";
      if (SAFARI) {
        origin = "clipper-safari";
      } else if (OPERA) {
        origin = "clipper-opera";
      }
      premium.href = baseUrl + "/SetAuthToken.action?auth=" + encodeURIComponent(evt.data.auth) + "&targetUrl=" + encodeURIComponent("/Checkout.action?origin=" + origin + "&offer=settings");
    }
  } else if (evt.data.name == "reset") {
    baseUrl = null;
    locale = null;
    numServices = 0;
    removeLoggedInUsers();
  }
});

Browser.addMessageHandlers({
  receivePersistentValue: receivePersistentValue
});
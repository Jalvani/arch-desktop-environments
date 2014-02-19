var logo;
var close;
var cancel;
var explanation;
var code;
var continueButton;
var help;

var auth;
var expiration;
var baseUrl;

function clearError(elt) {
  elt.className = elt.className.replace(/\s*error/g, "");
  elt.nextElementSibling.removeAttribute("data-error");
}

function goBackToLogin(error) {
  window.parent.postMessage({ name: "showLogin", error: typeof error == "string" ? error : null }, "*");
}

function msgHandlerTwoStepResponse(request, sender, sendResponse) {
  if (request.response.error == "INVALID_TWO_STEP_CODE") {
    setError(code, Browser.i18n.getMessage("incorrectCode"));
  } else if (request.response.error == "EXPIRED_AUTHENTICATION_TOKEN") {
    goBackToLogin(Browser.i18n.getMessage("expiredTwoStepCode"));
  } else {
    var authTokens = {
      pers: request.response.authenticationToken,
      biz: request.response.bizAuthenticationToken
    };
    window.parent.postMessage({
      name: "toggleCoordinator",
      baseUrl: request.response.baseUrl,
      locale: request.response.locale,
      loggedInUsers: request.response.loggedInUsers,
      numServices: request.response.numServices,
      userId: request.response.userId,
      username: request.response.username,
      authTokens: authTokens,
      premium: request.response.premium,
      favIconUrl: request.response.favIconUrl,
      type: request.response.type,
      fullName: request.response.fullName
    }, "*");
    window.parent.postMessage({ name: "closeAuthTools" }, "*");
  }
}

function setError(elt, error) {
  elt.className += " error";
  elt.nextElementSibling.setAttribute("data-error", error);
}

function submitCode() {
  var c = code.value.replace(/-/g, "");
  if (new Date() > expiration) {
    goBackToLogin(Browser.i18n.getMessage("expiredTwoStepCode"));
  } else if (/^(\d{6}|\d{16})$/.test(c)) {
    Browser.sendToExtension({ name: "submitTwoStepCode", auth: auth, code: c });
  } else {
    setError(code, Browser.i18n.getMessage("incorrectCode"));
  }
}

window.addEventListener("DOMContentLoaded", function() {
  // setup variables
  logo = document.querySelector("#logo");
  close = document.querySelector("#close");
  cancel = document.querySelector("#cancel");
  explanation = document.querySelector("#explanation");
  code = document.querySelector("#code");
  continueButton = document.querySelector("#continue");
  help = document.querySelector("#help");
  // localize
  GlobalUtils.localize(document.body);
  code.placeholder = Browser.i18n.getMessage("sixDigitCode");
  // event handlers
  logo.addEventListener("click", function() {
    Browser.sendToExtension({ name: "main_openTab", url: baseUrl + "/Home.action" });
  });
  close.addEventListener("click", function() {
    window.parent.postMessage({ name: "closeAuthTools" }, "*");
  });
  close.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      window.parent.postMessage({ name: "closeAuthTools" }, "*");
    }
  });
  cancel.addEventListener("click", goBackToLogin);
  cancel.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      goBackToLogin();
    }
  })
  code.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      submitCode();
    }
  });
  code.addEventListener("input", function() {
    clearError(code);
  });
  continueButton.addEventListener("click", submitCode);
  continueButton.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      submitCode();
    }
  });
  help.addEventListener("click", function(evt) {
    if (new Date() > expiration) {
      evt.preventDefault();
      goBackToLogin(Browser.i18n.getMessage("expiredTwoStepCode"));
    }
  });
});

window.addEventListener("message", function(evt) {
  if (evt.data.name == "setupTFa") {
    if (evt.data.sms) {
      explanation.innerText = Browser.i18n.getMessage("smsMessage", [ evt.data.sms ]);
    } else {
      explanation.innerText = Browser.i18n.getMessage("gaMessage");
    }
    if (/china/i.test(evt.data.locale)) {
      logo.className += " china";
    } else {
      logo.className = logo.className.replace(/\s*china/g, "");
    }
    expiration = evt.data.expiration;
    baseUrl = evt.data.baseUrl;
    auth = evt.data.auth;
    help.href = baseUrl + "/TwoStepHelp.action?auth=" + encodeURIComponent(auth);
  }
});

Browser.addMessageHandlers({
  twoStepResponse: msgHandlerTwoStepResponse
});
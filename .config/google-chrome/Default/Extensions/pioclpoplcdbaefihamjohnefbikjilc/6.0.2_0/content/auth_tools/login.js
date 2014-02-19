var logo;
var close;
var globalError;
var switcher;
var username;
var password;
var loginButton;
var regButton;
var forgotPassword;

var baseUrl;
var locale;
var addAccount;

function clearError(elt) {
  elt.className = elt.className.replace(/\s*error/g, "");
  elt.nextElementSibling.removeAttribute("data-error");
}

function clearGlobalError() {
  globalError.innerHTML = "";
  window.parent.postMessage({ name: "incAuthToolsHeight", height: 0 }, "*");
}

function handleCloseClick() {
  window.parent.postMessage({ name: "closeAuthTools" }, "*");
  if (addAccount) {
    window.parent.postMessage({ name: "showCoordinator" }, "*");
  }
}

function handleInputKeypress(evt) {
  if (evt.keyCode == 13) { // enter
    login();
  }
}

function login() {
  Browser.sendToExtension({ name: "setPersistentValue", key: "popup_savedUsername", value: username.value });
  clearError(username);
  clearError(password);
  clearGlobalError();
  if (validateUsername() && validatePassword()) {
    Browser.sendToExtension({
      name: "main_login",
      username: username.value,
      password: password.value
    });
  }
}

function msgHandlerLoginResponse(request, sender, sendResponse) {
  if (request.response.error) {
    var globalErrors = {
      "UNKNOWN": ["EDAMError_1"],
      "DATA_REQUIRED": ["loginForm_usernameError_8"],
      "INVALID_AUTH": ["loginForm_usernameError_8"],
      "HTTP/503": ["Error_HTTP_Transport", ['503']],
      "NETWORK": ["Error_Network_Unavailable"],
      "TOO_MANY_FAILURES": ["EDAMError_3_User_tooManyFailuresTryAgainLater"],
      "TIMEOUT": ["popup_loginCheckTimeout"]
    };
    if (request.response.error == "INVALID_PASSWORD") {
      setError(password, Browser.i18n.getMessage("loginForm_passwordInvalidError"));
    } else if (request.response.error == "PASSWORD_REQUIRED") {
      setError(password, Browser.i18n.getMessage("loginForm_passwordError_5"));
    } else if (request.response.error == "USERNAME_REQUIRED") {
      setError(username, Browser.i18n.getMessage("loginForm_usernameError_5"));
    } else if (request.response.error == "INVALID_USERNAME") {
      setError(username, Browser.i18n.getMessage("loginForm_usernameInvalidError"));
    } else if (request.response.error == "ACCOUNT_DEACTIVATED") {
      setError(username, Browser.i18n.getMessage("EDAMError_3_User_active"));
    } else if (request.response.error == "EXPIRED_PASSWORD") {
      var message = "Your password has expired. Please reset it now.";
      if (!/en/.test(navigator.language)) {
        message = Browser.i18n.getMessage("expiredV1Password");
      }
      setGlobalError(message, true);
      var okButton = document.createElement("button");
      okButton.innerText = Browser.i18n.getMessage("ok");
      okButton.addEventListener("click", function() {
        // need to logout of web client in the case of user switching.
        // otherwise the second user will be directed to the first user's
        // password change page. but don't log out the user in the clipper.
        Browser.sendToExtension({ name: "logoutWebClient", reason: "v1", username: username.value });
      });
      globalError.insertBefore(okButton, globalError.firstChild);
      window.parent.postMessage({ name: "incAuthToolsHeight", height: globalError.offsetHeight + 15 }, "*");
    } else if (globalErrors[request.response.error]) {
      setGlobalError(Browser.i18n.getMessage(globalErrors[request.response.error][0], globalErrors[request.response.error][1]));
    }
  } else if (request.response.secondFactorDeliveryHint) {
    window.parent.postMessage({
      name: "loadTFa",
      auth: request.response.authenticationToken,
      baseUrl: baseUrl,
      locale: locale,
      expiration: request.response.expiration,
      sms: request.response.secondFactorDeliveryHint
    }, "*");
  } else if (request.response.username) {
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
  } else {
    window.parent.postMessage({
      name: "loadTFa",
      baseUrl: baseUrl,
      auth: request.response.authenticationToken,
      expiration: request.response.expiration,
      locale: locale
    }, "*");
  }
}

function receivePersistentValue(request, sender, sendResponse) {
  if (request.key == "popup_savedUsername") {
    username.value = request.value;
  }
}

function register() {
  Browser.sendToExtension({ name: "getRegistrationLinks", baseUrl: baseUrl, locale: locale });
}

function setError(elt, error) {
  elt.className += " error";
  elt.nextElementSibling.setAttribute("data-error", error);
}

function setGlobalError(error, doNotSetWindowHeight) {
  globalError.innerHTML = error;
  if (!doNotSetWindowHeight) {
    window.parent.postMessage({ name: "incAuthToolsHeight", height: globalError.offsetHeight + 15 }, "*");
  }
}

function switchService() {
  if (bootstrapInfo.getLength() > 1) {
    var idx = bootstrapInfo.getIndex();
    idx = (idx + 1) % 2;
    bootstrapInfo.setIndex(idx);
  }
  initJsonRpc(); // We need a new one of these with new URLs.
  showLogin();
}

function validatePassword() {
  var regex = new RegExp("^[A-Za-z0-9!#$%&'()*+,./:;<=>?@^_`{|}~\\[\\]\\\\-]{6,64}$");
  if (password.value.length == "") {
    setError(password, Browser.i18n.getMessage("loginForm_passwordError_5"));
    return false;
  } else if (!regex.test(password.value)) {
    setError(password, Browser.i18n.getMessage("loginForm_passwordInvalidError"));
    return false;
  }
  return true;
}

function validateUsername() {
  if (username.value.length == 0) {
    setError(username, Browser.i18n.getMessage("loginForm_usernameError_5"));
    return false;
  }
  return true;
}

window.addEventListener("DOMContentLoaded", function() {
  // setup variables
  logo = document.querySelector("#logo");
  close = document.querySelector("#close");
  globalError = document.querySelector("#globalError");
  switcher = document.querySelector("#switcher");
  username = document.querySelector("#username");
  password = document.querySelector("#password");
  loginButton = document.querySelector("#login");
  regButton = document.querySelector("#reg");
  forgotPassword = document.querySelector("#forgotPw");
  // localize
  GlobalUtils.localize(document.body);
  username.placeholder = Browser.i18n.getMessage("loginForm_username");
  password.placeholder = Browser.i18n.getMessage("loginForm_password");
  // event handlers
  close.addEventListener("click", handleCloseClick);
  close.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      handleCloseClick();
    }
  });
  logo.addEventListener("click", function() {
    Browser.sendToExtension({ name: "main_openTab", url: baseUrl + "/Home.action" });
  });
  switcher.addEventListener("click", function() {
    Browser.sendToExtension({ name: "switchService" });
  });
  switcher.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      Browser.sendToExtension({ name: "switchService" });
    }
  });
  username.addEventListener("keypress", handleInputKeypress);
  username.addEventListener("input", function() {
    clearError(username);
    clearGlobalError();
  });
  password.addEventListener("keypress", handleInputKeypress);
  password.addEventListener("input", function() {
    clearError(password);
    clearGlobalError();
  })
  loginButton.addEventListener("click", login);
  loginButton.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      login();
    }
  });
  regButton.addEventListener("click", register);
  regButton.addEventListener("keypress", function(evt) {
    if (evt.keyCode == 13) {
      register();
    }
  });
});

window.addEventListener("message", function(evt) {
  if (evt.data.name == "setupLogin") {
    Browser.sendToExtension({ name: "getPersistentValue", key: "popup_savedUsername" });
    if (/china/i.test(evt.data.locale)) {
      logo.className += " china";
      regButton.innerHTML = Browser.i18n.getMessage("header_register");
    } else {
      logo.className = logo.className.replace(/\s*china/g, "");
      if (/zh-cn/i.test(navigator.language)) {
        regButton.innerHTML = "\u5efa\u7acb Evernote \u5e33\u6236";
      }
    }
    if (evt.data.numServices > 1 && !evt.data.addAccount) {
      switcher.className = "visible";
      if (/china/i.test(evt.data.locale)) {
        switcher.innerHTML = "\u5207\u6362\u5230Evernote International";
      } else {
        switcher.innerHTML = "\u5207\u6362\u5230\u5370\u8C61\u7B14\u8BB0";
      }
    } else {
      switcher.className = switcher.className.replace(/\s*visible/g, "");
    }
    addAccount = evt.data.addAccount;
    if (evt.data.addAccount) {
      document.querySelector("#addAccountMessage").className += " visible";
    } else {
      document.querySelector("#addAccountMessage").className =
        document.querySelector("#addAccountMessage").className.replace(/\s*visible/g, "");
    }
    forgotPassword.href = evt.data.baseUrl + "/ForgotPassword.action";
    baseUrl = evt.data.baseUrl;
    locale = evt.data.locale;
  } else if (evt.data.name == "setGlobalError") {
    setGlobalError(evt.data.error);
  }
});

Browser.addMessageHandlers({
  loginResponse: msgHandlerLoginResponse,
  receivePersistentValue: receivePersistentValue
});
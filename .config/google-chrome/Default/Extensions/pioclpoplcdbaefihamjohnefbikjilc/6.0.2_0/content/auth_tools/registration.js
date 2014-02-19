var logo;
var leftLogo;
var close;
var cancel;
var email;
var username;
var password;
var captcha;
var captchaImg;
var registerButton;
var legal;

var baseUrl;
var submit;
var locale;

var usernameCheckTimeout;

function checkEmail() {
  if (validateEmail()) {
    var x = new XMLHttpRequest();
    x.open("GET", baseUrl + "/RegistrationCheck.action?email="
      + encodeURIComponent(email.value) + "&checkEmail=true", true);
    x.onreadystatechange = function() {
      if (x.readyState == 4) {
        if (x.status == 200) {
          markValid(email);
        } else if (x.status == 400) {
          setError(email, Browser.i18n.getMessage("regForm_invalid_email"));
        } else if (x.status == 409) {
          setError(email, Browser.i18n.getMessage("regForm_taken_email"));
        } else if (x.status == 500) {
          setError(email, Browser.i18n.getMessage("EDAMError_1"));
        } else if (x.status == 0) {
          // TODO
        }
      }
    };
    x.send();
  }
}

function checkPassword() {
  if (validatePassword()) {
    markValid(password);
  }
}

function checkUsername() {
  if (validateUsername()) {
    var x = new XMLHttpRequest();
    x.open("GET", baseUrl + "/RegistrationCheck.action?username="
      + encodeURIComponent(username.value) + "&checkUsername=true", true);
    x.onreadystatechange = function() {
      if (x.readyState == 4) {
        if (x.status == 200) {
          markValid(username);
        } else if (x.status == 400) {
          setError(username, Browser.i18n.getMessage("regForm_invalid_username"));
        } else if (x.status == 409) {
          setError(username, Browser.i18n.getMessage("regForm_taken_username"));
        } else if (x.status == 412) {
          setError(username, Browser.i18n.getMessage("regForm_deactivated_username", [baseUrl + "/AccountReactivation.action"]));
        } else if (x.status == 500) {
          setError(username, Browser.i18n.getMessage("EDAMError_1"));
        } else if (x.status == 0) {
          // TODO showGlobalError("Error_Network_Unavailable");
        }
      }
    };
    x.send();
  }
}

function clearError(elt) {
  elt.className = elt.className.replace(/\s*error/g, "");
  elt.nextElementSibling.removeAttribute("data-error");
}

function clearValid(elt) {
  elt.className = elt.className.replace(/\s*valid/g, "");
}

function goBackToLogin() {
  window.parent.postMessage({ name: "showLogin" }, "*");
}

function markValid(elt) {
  elt.className += " valid";
}

function msgHandlerLoginResponse(request, sender, sendResponse) {
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

function msgHandlerRefreshCaptcha(request, sender, sendResponse) {
  captchaImg.src = baseUrl + request.captcha;
  submit = request.submit;
}

function register() {
  var e = validateEmail();
  var u = validateUsername();
  var p = validatePassword();
  var c = validateCaptcha();
  if (e && u && p && c) {
    var code = "clipper_chr";
    if (SAFARI) {
      code = "clipper_saf";
    } else if (OPERA) {
      code = "clipper_op";
    }
    var form = new FormData();
    form.append("email", email.value);
    form.append("username", username.value);
    form.append("password", password.value);
    form.append("captcha", captcha.value);
    form.append("code", code);
    form.append("terms", true);
    form.append("create", true);

    var x = new XMLHttpRequest();
    x.open("POST", baseUrl + submit, true);
    x.onreadystatechange = function() {
      if (x.readyState == 4 && x.status == 200) {
        var result = JSON.parse(x.response);
        if (result.success) {
          Browser.sendToExtension({
            name: "main_login",
            username: username.value,
            password: password.value,
            useSearchHelper: true
          });
        } else {
          for (var i = 0; i < result.errors.length; i++) {
            var error = result.errors[i];
            if (error["field-name"] == "captcha") {
              Browser.sendToExtension({
                name: "getRegistrationLinks",
                baseUrl: baseUrl,
                locale: locale,
                refresh: true
              });
              setError(captcha, Browser.i18n.getMessage("regForm_invalid_captcha"));
            }
          }
        }
      }
      else if (x.status == 0) {
        // TODO
      }
    };
    x.send(form);
  }
}

function registerFromKeyboard(evt) {
  if (evt.keyCode == 13) {
    register();
  }
}

function setError(elt, error) {
  elt.className += " error";
  elt.nextElementSibling.setAttribute("data-error", error);
}

function validateCaptcha() {
  if (captcha.value.length == 0) {
    setError(captcha, Browser.i18n.getMessage("regForm_invalid_captcha"));
    return false;
  }
  return true;
}

function validateEmail() {
  var regex = new RegExp("^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.([A-Za-z]{2,})$");
  if (email.value.length == 0) {
    setError(email, Browser.i18n.getMessage("regForm_email_required"));
    return false;
  } else if (!regex.test(email.value)) {
    setError(email, Browser.i18n.getMessage("regForm_invalid_email"));
    return false;
  }
  return true;
}

function validatePassword() {
  var regex = new RegExp("^[A-Za-z0-9!#$%&'()*+,./:;<=>?@^_`{|}~\\[\\]\\\\-]{6,64}$");
  if (password.value.length == 0) {
    setError(password, Browser.i18n.getMessage("regForm_password_required"));
    return false;
  } else if (!regex.test(password.value)) {
    setError(password, Browser.i18n.getMessage("regForm_invalid_password"));
    return false;
  }
  return true;
}

function validateUsername() {
  var regex = new RegExp("^[a-z0-9]([a-z0-9_-]{0,62}[a-z0-9])?$");
  if (!regex.test(username.value)) {
    setError(username, Browser.i18n.getMessage("regForm_invalid_username"));
    return false;
  }
  return true;
}

window.addEventListener("DOMContentLoaded", function() {
  // setup variables
  logo = document.querySelector("#logo");
  leftLogo = document.querySelector("#left .inner .top");
  close = document.querySelector("#close");
  cancel = document.querySelector("#cancel");
  email = document.querySelector("#email");
  username = document.querySelector("#username");
  password = document.querySelector("#password");
  captcha = document.querySelector("#captcha");
  captchaImg = document.querySelector("#captchaContainer img");
  registerButton = document.querySelector("#register");
  legal = document.querySelector("#legal");
  // localize
  GlobalUtils.localize(document.body);
  email.placeholder = Browser.i18n.getMessage("email");
  username.placeholder = Browser.i18n.getMessage("registrationForm_username");
  password.placeholder = Browser.i18n.getMessage("loginForm_password");
  captcha.placeholder = Browser.i18n.getMessage("captcha_instruction");
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
  });
  email.addEventListener("blur", checkEmail);
  email.addEventListener("input", function() {
    clearError(email);
    clearValid(email);
  });
  email.addEventListener("keypress", registerFromKeyboard);
  username.addEventListener("input", function() {
    clearTimeout(usernameCheckTimeout);
    clearError(username);
    clearValid(username);
    usernameCheckTimeout = setTimeout(checkUsername, 800);
  });
  username.addEventListener("blur", function() {
    clearTimeout(usernameCheckTimeout);
    checkUsername();
  });
  username.addEventListener("keypress", registerFromKeyboard);
  password.addEventListener("input", function() {
    clearError(password);
    clearValid(password);
  });
  password.addEventListener("blur", checkPassword);
  password.addEventListener("keypress", registerFromKeyboard);
  captcha.addEventListener("input", function() {
    clearError(captcha);
  });
  captcha.addEventListener("blur", validateCaptcha);
  captcha.addEventListener("keypress", registerFromKeyboard);
  registerButton.addEventListener("click", register);
  registerButton.addEventListener("keypress", registerFromKeyboard);
});

window.addEventListener("message", function(evt) {
  if (evt.data.name == "setupReg") {
    if (/china/i.test(evt.data.locale)) {
      logo.className += " china";
      leftLogo.className += " china";
    } else {
      logo.className = logo.className.replace(/\s*china/g, "");
      leftLogo.className = leftLogo.className.replace(/s*china/g, "");
    }
    legal.innerHTML = Browser.i18n.getMessage("registration_terms",
      [ evt.data.baseUrl + "/tos", evt.data.baseUrl + "/privacy" ]);
    captchaImg.src = evt.data.baseUrl + evt.data.captcha;
    baseUrl = evt.data.baseUrl;
    submit = evt.data.submit;
    locale = evt.data.locale;
  }
});

Browser.addMessageHandlers({
  loginResponse: msgHandlerLoginResponse,
  refreshCaptcha: msgHandlerRefreshCaptcha
});
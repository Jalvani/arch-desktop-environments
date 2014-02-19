var subject;
var sender;
var recipients;
var contacts;
var message;
var sendButton;
var cancelButton;

var auth;
var noteGuid;
var persAuth;
var sharedAuth;
var userId;
var recs;
var hoveringOverContacts = false;

window.addEventListener("DOMContentLoaded", function() {
  // setup variables
  subject = document.querySelector("#subject");
  sender = document.querySelector("#sender");
  recipients = document.querySelector("#recipients");
  contacts = document.querySelector("#contacts");
  message = document.querySelector("#message");
  sendButton = document.querySelector("#send");
  cancelButton = document.querySelector("#cancel");
  // localize
  GlobalUtils.localize(document.body);
  contacts.style.width = recipients.scrollWidth + 10 + "px";
  // event handlers
  recipients.addEventListener("blur", function() {
    if (!hoveringOverContacts) {
      contacts.innerHTML = "";
    }
  });
  recipients.addEventListener("input", handleRecipientsInput);
  recipients.addEventListener("keydown", handleRecipientsKeydown);
  recipients.addEventListener("keypress", handleRecipientsKeypress);
  contacts.addEventListener("mouseover", function(evt) {
    hoveringOverContacts = true;
  });
  contacts.addEventListener("mouseout", function(evt) {
    hoveringOverContacts = false;
  });
  sendButton.addEventListener("click", function() {
    if (!/disabled/.test(sendButton.className)) {
      Browser.sendToExtension({
        name: "emailNote",
        auth: auth,
        message: message.value,
        noteGuid: noteGuid,
        persAuth: persAuth,
        recipients: recs,
        sharedAuth: sharedAuth
      });
      window.parent.postMessage({ name: "hideEmailDialog" }, "*");
    }
  });
  cancelButton.addEventListener("click", function() {
    window.parent.postMessage({ name: "hideEmailDialog" }, "*");
  });
});
window.addEventListener("message", function(evt) {
  if (evt.data.name == "setup") {
    auth = evt.data.auth;
    noteGuid = evt.data.noteGuid;
    persAuth = evt.data.persAuth;
    sharedAuth = evt.data.sharedAuth;
    userId = evt.data.userId;
    Browser.sendToExtension({ name: "getPersistentValue", key: "savedAuthInfo" });
    subject.innerHTML = Browser.i18n.getMessage("emailNote", [ evt.data.subject ]);
  }
});

Browser.addMessageHandlers({
  receiveContacts: receiveContacts,
  receivePersistentValue: receivePersistentValue
});

function addRecipient(email) {
  recipients.value = recipients.value.replace(/([^,\s]+)$/, "") + email + ", ";
  validateRecipients();
  recipients.blur();
  recipients.focus();
}

function handleKeypress(evt) {
  if (evt.keyCode == 13) {
    sendButton.click();
  }
}

function handleRecipientsInput(evt) {
  validateRecipients();
  var r = recipients.value.split(/,\s*/);
  // autocomplete against the last thing in the list
  contacts.innerHTML = "";
  if (r[r.length - 1] != "") {
    Browser.sendToExtension({ name: "findContacts", auth: persAuth, prefix: r[r.length - 1] }, "*");
  }
}

function handleRecipientsKeydown(evt) {
  if ([38, 40].indexOf(evt.keyCode) > -1 && contacts.innerHTML != "") {
    var hover = contacts.querySelector(".hover");
    if (evt.keyCode == 38) {
      if (hover.previousElementSibling) {
        hover.className = hover.className.replace(/\s*hover/g, "");
        hover.previousElementSibling.className += " hover";
      }
    } else {
      if (hover.nextElementSibling) {
        hover.className = hover.className.replace(/\s*hover/g, "");
        hover.nextElementSibling.className += " hover";
      }
    }
    evt.preventDefault();
  }
}

function handleRecipientsKeypress(evt) {
  if (evt.keyCode == 13) {
    if (contacts.innerHTML == "") {
      handleKeypress(evt);
    } else {
      selectContact.call(contacts.querySelector(".hover"));
    }
  }
}

function receiveContacts(request, sender, sendResponse) {
  contacts.innerHTML = "";
  for (var i = 0; i < request.contacts.length; i++) {
    var contact = document.createElement("div");
    contact.className = "contact";
    if (i == 0) {
      contact.className += " hover";
    }
    if (request.contacts[i].name) {
      contact.innerText = request.contacts[i].name + " (" + request.contacts[i].email + ")";
    } else {
      contact.innerText = request.contacts[i].email;
    }
    contact.setAttribute("email", request.contacts[i].email);
    contact.addEventListener("click", selectContact);
    contact.addEventListener("mouseover", function() {
      var hover = contacts.querySelector(".hover");
      hover.className = hover.className.replace(/\s*hover/g, "");
      this.className += " hover";
    });
    contacts.appendChild(contact);
  }
}

function receivePersistentValue(request, send, sendResponse) {
  if (request.key == "savedAuthInfo") {
    sender.innerHTML = Browser.i18n.getMessage("from", [ request.value.userInfo[userId].email ]);
  }
}

function selectContact() {
  addRecipient(this.getAttribute("email"));
  contacts.innerHTML = "";
}

function validateRecipients() {
  var entry = recipients.value.trim();
  if (entry == "") {
    sendButton.className += " disabled";
    return;
  }
  var emailRegex = new RegExp(EDAM_EMAIL_REGEX);
  var prelim = entry.split(/,\s*/);
  recs = [];
  for (var i = 0; i < prelim.length; i++) {
    if (prelim[i] == "") {
      continue;
    }
    if (emailRegex.test(prelim[i])) {
      recs.push(prelim[i]);
    } else {
      sendButton.className += " disabled";
      return;
    }
  }
  sendButton.className = sendButton.className.replace(/\s*disabled/g, "");
}
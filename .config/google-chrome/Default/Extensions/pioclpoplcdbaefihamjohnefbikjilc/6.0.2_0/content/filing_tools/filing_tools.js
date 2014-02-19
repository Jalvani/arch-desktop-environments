var title;
var notebookControl;
var tags;
var comment;
var url;

var notebooks, persNotebooks, sharedNotebooks;
var persNotebookElts, sharedNotebookElts;
var stackElts;
var tagControl;

var linkedAuths = {};
var persTags, bizTags;
var currentAutoCompleteTagType;
var relatedNotes;
var userId;
var userType;
var defaultNB;
var recNB;
var recentNotebooks;
var smartFilingNB;
var smartFilingNBType;
var keyboardShortcutsEnabled;

function addNotebook(type, notebook, recentNotebookGuid, stack) {
  var owner;
  if (notebook.bizUsername) {
    owner = notebook.bizUsername;
  } else if (notebook.linkedUsername) {
    owner = notebook.linkedUsername;
  }
  var elt;
  if (stack) {
    elt = notebookControl.addNotebookToStack(notebook.name, notebook.guid,
      notebook.type, owner, notebook.shareKey, notebook.linkedNotebookGuid, stack);
  } else {
    elt = notebookControl.addNotebookToAll(notebook.name, notebook.guid,
      notebook.type, owner, notebook.shareKey, notebook.linkedNotebookGuid);
  }
  if (type == "pers") {
    persNotebookElts.push(elt);
  } else if (type == "shared") {
    sharedNotebookElts.push(elt);
  }
  if (notebook.defaultNotebook) {
    defaultNB = elt;
  }
  if (recentNotebookGuid && recentNotebookGuid == notebook.guid) {
    recNB = elt;
  }
  // save auth tokens for linked notebooks
  if (type == "shared" && notebook.auth) {
    linkedAuths[notebook.guid] = notebook.auth;
  }
}

function buildNote(useDefaultNotebook) {
  var note = {};
  // if (pageInfo && pageInfo.favIconUrl) {
  //   note.favIconUrl = pageInfo.favIconUrl;
  // }
  var t = GlobalUtils.removeControlCharacters(title.value);
  note.title = t.trim();
  if (!note.title) {
    note.title = Browser.i18n.getMessage("quickNote_untitledNote");
  }
  var c = GlobalUtils.removeControlCharacters(comment.value).trim();
  if (c) {
    note.comment = GlobalUtils.escapeXML(c).replace(/\n/g, "<br/>");
  }
  if (useDefaultNotebook) {
    note.notebookGuid = defaultNB.id;
    note.notebookName = defaultNB.textContent || defaultNB.innerText;
    note.type = defaultNB.getAttribute("pers") || "pers";
  } else {
    note.notebookGuid = notebookControl.getSelected().guid;
    note.notebookName = notebookControl.getSelected().name;
    note.type = notebookControl.getSelected().type;
  }
  if (note.type == "linked") {
    note.auth = linkedAuths[note.notebookGuid];
    note.shareKey = notebookControl.getSelected().shareKey;
  }
  if (note.type == "linked" || note.type == "biz") {
    note.linkedNotebookGuid = notebookControl.getSelected().linkedGuid;
  }
  // We won't bother trying to set a notebook if we haven't gotten any back from the server. In this case the
  // submitter will pick a notebook (which should be the last used notebook or the user's default.
  // if (notebookControl.selectedIndex !== -1) {
    // If the first notebook is shared, then we haven't received the user's notebook list yet, and have only received
    // his shared notebooks. This means that the selectedIndex will be wrong, and we will act as if the list was
    // empty, letting the submitter pick a notebook.
  //   if (!notebookControl.options[0].value.match(/^shared_/)) {
  //     var notebookGuid = notebookControl.options[notebookControl.selectedIndex].value;
  //     if (notebookGuid) note.notebookGuid = notebookGuid;
  //   }
  // }
  if (note.type != "linked") {
    note.tagNames = tagControl.getSelectedTags();
  }
  note.relatedNotes = relatedNotes;
    // if (pageInfo && pageInfo.pdf) {
  //   note.pdf = pageInfo.pdf
  // }
  note.url = url.innerText;
  return note;
}

function calcBodyHeight() {
  var base = document.querySelector("#main").offsetHeight + 10;
  var availableSpace = base - document.querySelector("#tags").offsetTop;
  var tagsAutocomplete = document.querySelector("#tagsAutocompleteContainer");
  var taH = tagsAutocomplete.offsetHeight + tagsAutocomplete.offsetTop + 7;
  return Math.max(base + taH - availableSpace, base);
}

function handleEscape() {
  window.parent.focus();
  window.parent.postMessage({ name: "toggleFilingTools" }, "*");
}

function handleShortcut(func) {
  if (keyboardShortcutsEnabled) {
    func();
  }
}

function insertNotebook(type, index, notebook, recentNotebookGuid, stack) {
  var owner = null;
  if (notebook.bizUsername) {
    owner = notebook.bizUsername;
  } else if (notebook.linkedUsername) {
    owner = notebook.linkedUsername;
  }
  var elt;
  if (stack) {
    elt = notebookControl.insertNotebookIntoStack(index, notebook.name,
      notebook.guid, notebook.type, owner, notebook.shareKey,
      notebook.linkedNotebookGuid, stack);
  } else {
    elt = notebookControl.insertNotebook(index, notebook.name, notebook.guid,
      notebook.type, owner, notebook.shareKey, notebook.linkedNotebookGuid);
  }
  if (type == "pers") {
    persNotebookElts.push(elt);
  } else if (type == "shared") {
    sharedNotebookElts.push(elt);
  }
  if (notebook.defaultNotebook) {
    defaultNB = elt;
  }
  if (recentNotebookGuid && recentNotebookGuid == notebook.guid) {
    recNB = elt;
  }
}

function mergeNotebooks(newNotebooks, type) {
  if (newNotebooks.length > 0) {
    notebooks = newNotebooks.concat(notebooks).sort(sortAlphabetically);
    var indices = [];
    for (var i = 0; i < newNotebooks.length; i++) {
      var index = notebooks.indexOf(newNotebooks[i]);
      if (index > -1) {
        indices.push(index);
      }
    }
    indices = indices.sort(function(a, b) {
      if (a > b) {
        return 1;
      } else if (a == b) {
        return 0;
      } else {
        return -1;
      }
    });
    var recentNotebookGuid;
    if (recentNotebooks && recentNotebooks[userId]) {
      recentNotebookGuid = recentNotebooks[userId];
    }
    // if one of the objects is a stack which already exists, then the
    // subsequent indices should be decremented since we're not actually
    // inserting a notebook/stack in that list
    var indexDec = 0;
    for (var i = 0; i < indices.length; i++) {
      var index = indices[i];
      if (notebooks[index].class == "notebook") {
        insertNotebook(type, index - indexDec, notebooks[index], recentNotebookGuid);
      } else if (notebooks[index].class == "stack") {
        // stack could already exist. check the object before and after this
        // stack's location to see if the stack already exists
        if (notebooks[index - 1] && notebooks[index - 1].class == "stack" && notebooks[index - 1].name == notebooks[index].name) {
          indexDec++;
          mergeStacks(notebooks[index - 1], notebooks[index], type, recentNotebookGuid);
        } else if (notebooks[index + 1] && notebooks[index + 1].class == "stack" && notebooks[index + 1].name == notebooks[index].name) {
          indexDec++;
          mergeStacks(notebooks[index + 1], notebooks[index], type, recentNotebookGuid);
        } else { // stack doesn't already exist
          var elt = notebookControl.insertStackIfNeeded(index - indexDec, notebooks[index].name);
          if (elt) {
            stackElts.push(elt);
          }
          notebooks[index].notebooks = notebooks[index].notebooks.sort(sortAlphabetically);
          for (var j = 0; j < notebooks[index].notebooks.length; j++) {
            addNotebook(type, notebooks[index].notebooks[j], recentNotebookGuid, notebooks[index].name);
          }
        }
      }
    }
  }
}

function mergeStacks(existingStack, newStack, newType, recentNotebookGuid) {
  var combinedNotebooks = existingStack.notebooks.concat(newStack.notebooks).sort(sortAlphabetically);
  var stackIndices = [];
  for (var i = 0; i < newStack.notebooks.length; i++) {
    var stackIndex = combinedNotebooks.indexOf(newStack.notebooks[i]);
    if (stackIndex > -1) {
      stackIndices.push(stackIndex);
    }
  }
  stackIndices = stackIndices.sort(function(a, b) {
    if (a > b) {
      return 1;
    } else if (a == b) {
      return 0;
    } else {
      return -1;
    }
  });
  for (var i = 0; i < stackIndices.length; i++) {
    var stackIndex = stackIndices[i];
    insertNotebook(newType, stackIndex, combinedNotebooks[stackIndex], recentNotebookGuid, newStack.name);
  }
}

function notebookSelectorCallback(evt) {
  if (evt.name == "selectedNotebook") {
    if (evt.type == "biz") {
      tagControl.setDisabled(false);
      if (bizTags && currentAutoCompleteTagType != "biz") {
        currentAutoCompleteTagType = "biz";
        tagControl.setAutoCompleteList(bizTags);
      }
    } else if (evt.type == "linked") {
      tagControl.setDisabled(true);
    } else { // if it's undefined, it's personal
      tagControl.setDisabled(false);
      if (persTags && currentAutoCompleteTagType != "pers") {
        currentAutoCompleteTagType = "pers";
        tagControl.setAutoCompleteList(persTags);
      }
    }
    window.parent.postMessage({ name: "setNotebook", notebook: evt.notebookName, smart: evt.smart }, "*");
  }
}

function receiveBizTags(request, sender, sendResponse) {
  bizTags = request.tags;
  if (notebookControl.getSelected() && notebookControl.getSelected().type == "biz") {
    currentAutoCompleteTagType = "biz";
    tagControl.setAutoCompleteList(bizTags);
  }
}

function receivePersNotebooks(request, sender, sendResponse) {
  request.notebooks = request.notebooks.sort(sortAlphabetically);
  recentNotebooks = request.recentNotebooks;
  if (persNotebooks) {
    var changed = false;
    if (persNotebooks.length == request.notebooks.length) {
      for (var i = 0; i < request.notebooks.length; i++) {
        if (persNotebooks[i].class !== request.notebooks[i].class
          || persNotebooks[i].name !== request.notebooks[i].name) {
            changed = true;
            break;
        } else {
          if (persNotebooks[i].class === "notebook") {
            if (persNotebooks[i].guid !== request.notebooks[i].guid) {
              changed = true;
              break;
            }
          } else if (persNotebooks[i].class === "stack") {
            if (persNotebooks[i].notebooks.length == request.notebooks[i].notebooks.length) {
              for (var j = 0; j < request.notebooks[i].notebooks.length; j++) {
                if (persNotebooks[i].notebooks[j].name !== request.notebooks[i].notebooks[j].name
                  || persNotebooks[i].notebooks[j].guid !== request.notebooks[i].notebooks[j].guid) {
                    changed = true;
                    break;
                }
              }
            } else {
              changed = true;
              break;
            }
          }
        }
      }
    } else {
      changed = true;
    }
    if (changed) {
      var elt = persNotebookElts.pop();
      while (elt) {
        if (elt.parentNode) {
          elt.parentNode.removeChild(elt);
        }
        elt = persNotebookElts.pop();
      }
      var j = notebooks.length - 1;
      for (var i = persNotebooks.length - 1; i >= 0; i--) {
        while (j >= 0) {
          if (persNotebooks[i].name == notebooks[j].name && persNotebooks[i].guid == notebooks[j].guid) {
            notebooks.splice(j, 1);
            j--;
            break;
          } else {
            j--;
          }
        }
      }
    } else {
      return;
    }
  } else {
    persNotebooks = request.notebooks.concat();
    persNotebookElts = [];
  }

  if (notebooks) {
    mergeNotebooks(request.notebooks, "pers");
  } else {
    notebooks = request.notebooks;
    var recentNotebookGuid;
    if (recentNotebooks && recentNotebooks[userId]) {
      recentNotebookGuid = recentNotebooks[userId];
    }
    stackElts = [];
    for (var i = 0; i < notebooks.length; i++) {
      if (notebooks[i].class == "notebook") {
        addNotebook("pers", notebooks[i], recentNotebookGuid);
      } else if (notebooks[i].class == "stack") {
        var elt = notebookControl.addStackIfNeeded(notebooks[i].name);
        if (elt) {
          stackElts.push(elt);
        }
        notebooks[i].notebooks = notebooks[i].notebooks.sort(sortAlphabetically);
        for (var j = 0; j < notebooks[i].notebooks.length; j++) {
          addNotebook("pers", notebooks[i].notebooks[j], recentNotebookGuid, notebooks[i].name);
        }
      }
    }
  }
  // select default or last clipped notebook if it's allowed
  if (notebookControl.overridable()) {
    if (recNB) {
      notebookControl.select(recNB, false);
    } else if (defaultNB) {
      notebookControl.select(defaultNB, false);
    }
  } else if (notebookControl.hasNotChangedSmartFiling()) {
    // select smart filed notebook in the list
    selectSmartNotebookInList();
  }
}

function receivePersTags(request, sender, sendResponse) {
  persTags = request.tags;
  if (notebookControl.getSelected() && notebookControl.getSelected().type == "pers") {
    currentAutoCompleteTagType = "pers";
    tagControl.setAutoCompleteList(persTags);
  }
}

function receiveSharedNotebooks(request, sender, sendResponse) {
  request.notebooks = request.notebooks.sort(sortAlphabetically);
  if (sharedNotebooks) {
    var changed = false;
    if (sharedNotebooks.length == request.notebooks.length) {
      for (var i = 0; i < request.notebooks.length; i++) {
        if (sharedNotebooks[i].guid != request.notebooks[i].guid || sharedNotebooks[i].name != request.notebooks[i].name) {
          changed = true;
          break;
        }
      }
    } else {
      changed = true;
    }
    if (changed) {
      var elt = sharedNotebookElts.pop();
      while (elt) {
        if (elt.parentNode) {
          elt.parentNode.removeChild(elt);
        }
        elt = sharedNotebookElts.pop();
      }
      var j = notebooks.length - 1;
      for (var i = sharedNotebooks.length - 1; i >= 0; i--) {
        while (j >= 0) {
          if (sharedNotebooks[i].name == notebooks[j].name && sharedNotebooks[i].guid == notebooks[j].guid) {
            notebooks.splice(j, 1);
            j--;
            break;
          } else {
            j--;
          }
        }
      }
    } else {
      return;
    }
  } else {
    sharedNotebooks = request.notebooks.concat();
    sharedNotebookElts = [];
  }

  if (notebooks) {
    mergeNotebooks(request.notebooks, "shared");
    // save auth tokens for linked notebooks
    for (var i = 0; i < request.notebooks.length; i++) {
      if (request.notebooks[i].auth) {
        linkedAuths[request.notebooks[i].guid] = request.notebooks[i].auth;
      }
    }
  } else {
    notebooks = request.notebooks.sort(sortAlphabetically);
    var recentNotebookGuid;
    if (recentNotebooks && recentNotebooks[userId]) {
      recentNotebookGuid = recentNotebooks[userId];
    }
    stackElts = [];
    for (var i = 0; i < notebooks.length; i++) {
      if (notebooks[i].class == "notebook") {
        addNotebook("shared", notebooks[i], recentNotebookGuid);
      } else if (notebooks[i].class == "stack") {
        var elt = notebookControl.addStackIfNeeded(notebooks[i].name);
        if (elt) {
          stackElts.push(elt);
        }
        notebooks[i].notebooks = notebooks[i].notebooks.sort(sortAlphabetically);
        for (var j = 0; j < notebooks[i].notebooks.length; j++) {
          addNotebook("shared", notebooks[i].notebooks[j], recentNotebookGuid, notebooks[i].name);
        }
      }
    }
  }

  if (notebookControl.overridable()) {
    if (recNB) {
      notebookControl.select(recNB, false);
    } else if (defaultNB) {
      notebookControl.select(defaultNB, false);
    }
  } else if (notebookControl.hasNotChangedSmartFiling()) {
    selectSmartNotebookInList();
  }
}

function receiveSmartFilingInfo(request, sender, sendResponse) {
  if (notebookControl.overridable() && request.filingInfo.notebook) {
    smartFilingNB = request.filingInfo.notebook.guid;
    var notebook = {
      id: request.filingInfo.notebook.guid,
      innerText: request.filingInfo.notebook.name
    };
    if (request.filingInfo.notebook.biz) {
      smartFilingNBType = "business";
      notebook.type = "biz";
    } else {
      smartFilingNBType = "personal";
      notebook.type = "pers";
    }
    notebookControl.select(notebook, true);
  }

  if (request.filingInfo.tags && request.filingInfo.tags.list) {
    for (var i = 0; i < request.filingInfo.tags.list.length; i++) {
      tagControl.addTag(request.filingInfo.tags.list[i].name, false, true);
    }
  }

  // save related notes to send to clip result box later
  if (request.filingInfo.relatedNotes && request.filingInfo.relatedNotes.list
      && request.filingInfo.relatedNotes.list.length > 0) {
    relatedNotes = request.filingInfo.relatedNotes.list;
  }
}

function reset() {
  // remove notebooks
  notebookControl.reset();
  notebooks = null;
  persNotebooks = null;
  sharedNotebooks = null;
  persNotebookElts = null;
  sharedNotebookElts = null;
  stackElts = null;
  defaultNB = null;
  recNB = null;
  smartFilingNB = null;
  smartFilingNBType = null;
  // clear tags, but no need to remove autocomplete tags
  tagControl.clearAll();
  persTags = null;
  bizTags = null;
  currentAutoCompleteTagType = null;
  relatedNotes = null;
  // clear comment
  comment.value = "";
  setDialogHeight();
}

function saveLastNotebook() {
  if (!recentNotebooks) {
    recentNotebooks = {};
  }
  recentNotebooks[userId] = notebookControl.getSelected().guid;
  Browser.sendToExtension({ name: "setPersistentValue", key: "recentNotebooks", value: recentNotebooks });
}

function selectSmartNotebookInList() {
  var selectedNbGuid = notebookControl.getSelected().guid;
  if (selectedNbGuid) {
    var listNb = notebookControl.getNotebook(selectedNbGuid);
    if (listNb) {
      notebookControl.select(listNb, true);
    }
  }
}

function setDialogHeight() {
  window.parent.postMessage({ name: "setFilingToolsHeight", height: calcBodyHeight() }, "*");
}

function sortAlphabetically(a, b) {
  var an = a.name.toLowerCase();
  var bn = b.name.toLowerCase();
  return an.localeCompare(bn);
}

function tagControlCallback(evt) {
  setDialogHeight();
  if (["createTag", "clearTag", "clearTags"].indexOf(evt.name) > -1) {
    window.parent.postMessage(evt, "*");
  }
}

window.addEventListener("DOMContentLoaded", function() {
  title = document.querySelector("#title textarea");
  notebookControl = new NotebookSelector(
    document.querySelector("#notebook .search input"),
    document.querySelector("#notebook .search .cancel"),
    document.querySelector("#notebook .list"), notebookSelectorCallback);
  tags = document.querySelector("#tags input");
  tagControl = new TagEntryBox(document.querySelector("#existingTags"),
    tags, document.querySelector("#clearTags"),
    document.querySelector("#tagsAutocomplete"),
    document.querySelector("#tagsAutocompleteContainer"), tagControlCallback);
  comment = document.querySelector("#comment textarea");
  url = document.querySelector("#url");

  GlobalUtils.localize(document.body);
  title.placeholder = Browser.i18n.getMessage("quickNote_untitledNote");
  comment.placeholder = Browser.i18n.getMessage("commentIconTooltip");
  document.querySelector("#notebook input").placeholder = Browser.i18n.getMessage("findANotebook");

  title.addEventListener("input", function() {
    title.value = title.value.replace(/\n/g, "");
    document.querySelector("#title .expandingArea pre span").innerText = title.value;
    setDialogHeight();
  });
  title.addEventListener("blur", function() {
    title.scrollTop = 0;
  });
  comment.addEventListener("input", function() {
    document.querySelector("#comment .expandingArea pre span").innerText = comment.value;
    setDialogHeight();
  });
  comment.addEventListener("blur", function() {
    comment.scrollTop = 0;
  });

  window.parent.postMessage({ name: "uiReady" }, "*");
});

Browser.addMessageHandlers({
  receiveBizTags: receiveBizTags,
  receivePersNotebooks: receivePersNotebooks,
  receivePersTags: receivePersTags,
  receiveSharedNotebooks: receiveSharedNotebooks,
  receiveSmartFilingInfo: receiveSmartFilingInfo
});

window.addEventListener("message", function(evt) {
  if (evt.data.name == "initialize") {
    title.value = evt.data.title;
    if (evt.data.gmailThread && /^(.+) - (.+) - (.+)$/.test(title.value)) {
      title.value = /^(.+) - (.+) - (.+)$/.exec(title.value)[1];
    }
    title.value = title.value.slice(0, 255);
    document.querySelector("#title .expandingArea pre span").innerText = title.value;
    setDialogHeight();
    url.innerText = evt.data.url;
    userId = evt.data.userId;
    userType = evt.data.userType;
    if (evt.data.alwaysTags) {
      var alwaysTags = evt.data.alwaysTags.split(/\s*,\s*/);
      for (var i = 0; i < alwaysTags.length; i++) {
        if (alwaysTags[i].trim() != "") {
          tagControl.addTag(alwaysTags[i]);
        }
      }
    }
    keyboardShortcutsEnabled = evt.data.keyboardShortcutsEnabled;
  } else if (evt.data.name == "sendFilingInfo") {
    if (notebookControl.changedNotebook()) {
      saveLastNotebook();
    }
    var note = buildNote(evt.data.useDefaultNotebook);
    // if this browser supports MessageChannel and MessagePort, use the port to
    // send this info to the Coordinator. Otherwise, it probably doesn't use
    // event pages in the background either, so can just send filing info
    // straight to the background
    var msg = {
      name: "receiveNoteFilingInfo",
      noteFilingInfo: note,
      pendingNoteKey: evt.data.pendingNoteKey,
      userId: userId,
      userType: userType
    };
    if (!SAFARI && evt.ports && evt.ports.length > 0) {
      evt.ports[0].postMessage(msg);
    } else {
      Browser.sendToExtension(msg);
    }
    // track smart filing performance
    var compareNB = recNB;
    if (!compareNB) {
      compareNB = defaultNB;
    }
    if (smartFilingNB && compareNB.id != smartFilingNB) {
      var finalAction;
      if (note.notebookGuid == smartFilingNB) {
        finalAction = "kept suggestion";
      } else if (note.notebookGuid == compareNB.id) {
        if (note.type == "biz") {
          finalAction = "changed to default or last selected notebook (business)";
        } else {
          finalAction = "changed to default or last selected notebook (personal)";
        }
      } else {
        if (note.type == "biz") {
          finalAction = "changed to another notebook (business)";
        } else {
          finalAction = "changed to another notebook (personal)";
        }
      }
      Browser.sendToExtension({
        name: "trackEvent",
        userId: userId,
        category: "Smart Filing",
        action: smartFilingNBType + " notebook -> " + finalAction,
        label: userType
      });
    }
  } else if (evt.data.name == "reset") {
    reset();
  } else if (evt.data.name == "setFocus") {
    if (evt.data.focus == "notebook") {
      notebookControl.focusEntry();
    } else if (evt.data.focus == "tags") {
      tagControl.focusEntry();
    }
  } else if (evt.data.name == "setKeyboardHandlers") {
    var shortcuts = {};
    for (var shortcutName in evt.data.handlers) {
      for (var i = 0; i < evt.data.handlers[shortcutName].length; i++) {
        switch (shortcutName) {
          case "closeWebClipperShortcut":
            shortcuts[evt.data.handlers[shortcutName][i]] = function() { handleShortcut(handleEscape) };
            break;
        }
      }
    }
    Browser.addKeyboardHandlers(shortcuts);
    tagControl.setKeyboardHandlers(evt.data.handlers);
  }
});
function TagEntryBox(existingTagContainer, tagEntryField, clearAllControl, autoCompleteBox, autoCompleteContainer, callback) {
  "use strict";

  var userInteraction = false;
  var maxTags = 20;
  var ESCAPE_KEY = 27;

  var tagTrie = new TagTrie();

  // Various text placeholders.
  var placeholders = {
    "ADD": "quickNote_addTags",
    "DISABLED": "quickNote_tagsDisabled",
    "FULL": "tagNamesNotInRange"
  };

  var mouseInAutoComplete = false;

  var autoCompleteVisible = false;
  var autoCompleteSelection = null;

  tagEntryField.placeholder = Browser.i18n.getMessage(placeholders["ADD"]);

  var lastTextValue = "";
  
  tagEntryField.addEventListener("keyup", handleTextEntry);
  tagEntryField.addEventListener("blur", function(evt) {
    blurTextEntry(evt);
  });
  clearAllControl.addEventListener("click", clearAll);

  autoCompleteBox.addEventListener("click", function(evt){evt.stopPropagation();});

  // We want to be able to detect when the user is scrolling this.
  autoCompleteBox.addEventListener("mouseover", function(evt){mouseInAutoComplete = true});
  autoCompleteBox.addEventListener("mouseout", function(evt){mouseInAutoComplete = false});

  // self.addEventListener("click", focusEntry);

  // We attach a click handler to the whole window, so that if anyone clicks on it, and we don't capture that, then
  // we'll close the autocomplete box.
  window.addEventListener("click", hideAutoComplete);
  window.addEventListener("keyup", hideAutoCompleteFromEsc);

  // The list of tags we've added.
  var tags = [];
  var tagMap = {};

  // The elements we have for displaying tags.
  var tagElements = {};

  function focusEntry(evt) {
    tagEntryField.focus();
  }

  function clearAll() {
    for (var i = tags.length - 1; i >= 0; i--) {
      clearTag(tags[i]);
    }
    tagEntryField.focus();
    if (callback) {
      callback({ name: "clearTags" });
    }
  }

  function blurTextEntry(evt) {
    if ((!autoCompleteVisible || !mouseInAutoComplete) && !tagEntryField.disabled) {
      resetPlaceholder();
    }
  }

  function resetPlaceholder() {
    // Simualte the user pressing enter.
    handleTextEntry.call(tagEntryField, {keyCode: 9, nonUserEvent: true});
    if (tags.length == maxTags) {
      tagEntryField.placeholder = Browser.i18n.getMessage(placeholders["FULL"]);
      tagEntryField.disabled = true;
    } else {
      tagEntryField.placeholder = Browser.i18n.getMessage(placeholders["ADD"]);
      tagEntryField.disabled = false;
    }
    hideAutoComplete();
  }

  function createTag(tagName, smartFiling) {
    var c1 = document.createComment("\n");
    var div = document.createElement("div");
    var text = document.createElement("div");
    var c2 = document.createComment("\n");
    var lozenge = document.createElement("div");

    div.className = "tag";
    if (smartFiling) {
      div.className += " green";
    } else {
      div.className += " gray";
    }
    lozenge.className = "lozenge";

    text.innerText = tagName;

    div.appendChild(text);
    div.appendChild(c2);
    div.appendChild(lozenge);

    lozenge.addEventListener("click", function() {
      clearTag(tagName);
      tagEntryField.focus();
      if (callback) {
        callback({ name: "clearTag", tagName: tagName });
      }
    });
    tagElements[tagName.toLowerCase()] = div;
    tags.push(tagName);
    tagMap[tagName.toLowerCase()] = true;
    existingTagContainer.insertBefore(div, clearAllControl);
    existingTagContainer.insertBefore(c1, div);
    existingTagContainer.className = "visible";
    clearAllControl.className = "visible";

    if (callback) {
      callback({ name: "createTag", tagName: tagName, smart: smartFiling });
    }
  }

  function clearTag(tagName) {
    if (!tagName) return;
    var tagIndex = tags.indexOf(tagName);
    if (tagIndex == -1) return;

    userInteraction = true;
    var element = tagElements[tagName.toLowerCase()];
    if (element) {
      element.parentNode.removeChild(element.previousSibling);
      element.parentNode.removeChild(element);
      delete tagElements[tagName.toLowerCase()];
    }
    tags.splice(tagIndex, 1);
    delete tagMap[tagName.toLowerCase()];

    if (tags.length < maxTags) {
      tagEntryField.disabled = false;
      tagEntryField.placeholder = Browser.i18n.getMessage(placeholders["ADD"]);
      // tagEntryField.className = ""; TODO
    }
    // tagEntryField.focus(); TODO
    if (tags.length == 0) {
      existingTagContainer.className = "";
      clearAllControl.className = "";
    }
  }

  function selectAutoComplete(evt) {
    userInteraction = true;
    if (evt.srcElement.firstChild.nodeType == Node.ELEMENT_NODE) {
      addTag(evt.srcElement.firstChild.textContent, true, false);
    } else if (evt.srcElement.firstChild.nodeType == Node.TEXT_NODE) {
      addTag(evt.srcElement.textContent, true, false);
    }
    tagEntryField.value = "";
    hideAutoComplete();
  }

  function setAutoCompleteList(tagList) {
    hideAutoComplete();
    tagTrie = new TagTrie();
    for (var i = 0; i < tagList.length; i++) {
      var tagEntry = document.createElement("div");
      tagEntry.textContent = tagList[i];
      tagEntry.addEventListener("click", selectAutoComplete);
      tagEntry.addEventListener("mouseover", hoverAutoComplete);
      tagTrie.insert(tagList[i], tagEntry);
    }
  }

  function hoverAutoComplete() {
    var original = autoCompleteSelection;
    if (original) {
      original.className = original.className.replace(/\s*selected/g, "");
    }
    this.className += " selected";
    autoCompleteSelection = this;
  }

  function getSelectedTags() {
    var t = [];
    for (var i in tags) {
      t.push(tags[i]);
    }
    return t;
  }

  function addTag(tag, focusEntryField, smartFiling) {
    // Can't add blank tag.
    if (!tag) return;
    tag = tag.trim();
    // Already have this tag.
    if (tagMap[tag.toLowerCase()]) return;

    createTag(tag, smartFiling);

    if (tags.length == maxTags) {
      tagEntryField.value = "";
      tagEntryField.disabled = true;
      tagEntryField.placeholder = Browser.i18n.getMessage(placeholders["FULL"]);
    } else if (focusEntryField) {
      tagEntryField.focus();
    }
  }

  function showAutoComplete() {
    autoCompleteVisible = true;
    autoCompleteContainer.className = "visible";
    if (callback) {
      callback({ name: "toggleAutoComplete" });
    }
  }

  function updateAutoComplete(val) {
    val = val.toLowerCase();
    var matches = tagTrie.getMatching(val);

    if (matches.length) {
      var list = document.createDocumentFragment();
      matches = matches.sort(function(a, b) {
        if (a[0] === b[0]) {
          return 0;
        } else if (a[0] < b[0]) {
          return -1
        } else {
          return 1;
        }
      });
      var matchCount = 0;
      for (var i = 0; i < matches.length; i++) {
        if (!tagMap[matches[i][0]]) {
          list.appendChild(matches[i][1]);
          matchCount++;
        }
      }

      // Delete all existing nodes and then add the new ones.
      while (autoCompleteBox.hasChildNodes()) {
        autoCompleteBox.removeChild(autoCompleteBox.lastChild);
      }
      autoCompleteBox.appendChild(list);

      if (matchCount) {
        showAutoComplete();
      } else {
        hideAutoComplete();
      }
    } else {
      hideAutoComplete();
    }
  }

  function hideAutoComplete() {
    mouseInAutoComplete = false;
    autoCompleteVisible = false;
    autoCompleteSelection = null;
    var oldClass = autoCompleteContainer.className;
    autoCompleteContainer.className = "";
    if (callback && oldClass != autoCompleteContainer.className) {
      callback({ name: "toggleAutoComplete" });
    }
  }

  function incrementAutoSelect(backwards) {
    var current = autoCompleteSelection;

    // Set the initial state.
    if (!current) {
      current = autoCompleteBox.firstChild;
      if (current) {
        current.className += " selected";
        autoCompleteSelection = current;
      }
      return;
    }

    var original = current; // We'll clear this if we find a replacement.
    if (!backwards) {
      current = current.nextSibling;
    }
    else {
      current = current.previousSibling;
    }

    if (!current) current = original;

    // We found another node.
    if (current) {
      original.className = original.className.replace(/\s*selected/g, "");
      current.className = " selected";
      autoCompleteSelection = current;
      current.scrollIntoViewIfNeeded(false);
    }
  }

  function hideAutoCompleteFromEsc(evt) {
    if(evt.keyCode && evt.keyCode == 27 && autoCompleteVisible) {
      hideAutoComplete();
      tagEntryField.focus();
    }
  }

  function handleTextEntry(evt) {
    // In case the user types, for example ", " before starting a new tag,
    // we'll strip leading whitespace.
    var autoCompleteVal = this.value.replace(/^\s*/, "");
    if (autoCompleteVal != "") {
      updateAutoComplete(autoCompleteVal);
    } else {
      hideAutoComplete();
    }

    hideAutoCompleteFromEsc(evt);

    // And we'll store the new value of the field.
    lastTextValue = this.value;
    var refocus = true;

    // We don't want to re-grab focus in this case (9 is TAB).
    if (evt.keyCode == 9) {
      refocus = false;
    }

    // Otherwise, 'tab' and 'enter' have the same behavior.
    if (evt.keyCode == 9 || evt.keyCode == 13) {
      if (autoCompleteVisible && autoCompleteSelection) {
        if (autoCompleteSelection.firstChild.nodeType == Node.ELEMENT_NODE) {
          this.value = autoCompleteSelection.firstChild.textContent;
        } else if (autoCompleteSelection.firstChild.nodeType == Node.TEXT_NODE) {
          this.value = autoCompleteSelection.textContent;
        }
      }
      this.value = this.value + ",";
    }

    // Up and down arrows for autocomplete.
    if (evt.keyCode == 38 || evt.keyCode == 40) {
      if (autoCompleteVisible) {
        var backwards = (evt.keyCode == 38);
        incrementAutoSelect(backwards);
      }
    }

    if (this.value.match(/,/)) {
      var tagList = this.value.split(/\s*,\s*/);
      for (var i = 0; i < tagList.length - 1; i++) {
        addTag(tagList[i], refocus, false);
        if (evt && !evt.nonUserEvent) {
          userInteraction = true;
        }
        hideAutoComplete();
      }
      this.value = tagList[tagList.length - 1].trim();
    }

    // Don't let this pass up the tree. It's wrapped in an 'if' because
    // sometimes we send this function fake events.
    if (evt.stopPropagation && evt.keyCode != ESCAPE_KEY) evt.stopPropagation();
  }

  function setDisabled(disabled) {
    var tags = existingTagContainer.querySelectorAll(".tag");
    if (disabled) {
      tagEntryField.disabled = true;
      tagEntryField.placeholder = Browser.i18n.getMessage(placeholders["DISABLED"]);
      existingTagContainer.className = "";
    } else {
      tagEntryField.disabled = false;
      resetPlaceholder();
      if (tags.length > 0) {
        existingTagContainer.className = "visible";
      }
    }
  }

  function overridable() {
    return !userInteraction;
  }

  function truncateInMiddle(elt) {
    elt.innerHTML = "<div>" + elt.textContent + "</div><div>" + elt.textContent + "</div>";
  }

  function setKeyboardHandlers(handlers) {
    for (var shortcutName in handlers) {
      switch(shortcutName) {
        case "closeWebClipperShortcut":
          ESCAPE_KEY = handlers[shortcutName][0];
          break;
      }
    }
  }

  // function getNumRows() {
  //   return parseInt(window.getComputedStyle(self).height) / 28;
  // }

  this.focusEntry = focusEntry;
  this.setAutoCompleteList = setAutoCompleteList;
  this.getSelectedTags = getSelectedTags;
  this.addTag = addTag;
  this.setDisabled = setDisabled;
  this.overridable = overridable;
  this.clearAll = clearAll;
  // self.getNumRows = getNumRows;

  Object.preventExtensions(this);
}
Object.preventExtensions(TagEntryBox);

function TagTrie() {
  "use strict";

  var trie = {};

  var matching = [];

  function insert(tag, data) {
    if (!tag) return;
    tag = tag.toLowerCase();
    var current = trie;
    for (var i = 0; i < tag.length; i++) {
      if (!current[tag[i]]) {
        current[tag[i]] = {};
      }
      current = current[tag[i]];
    }
    current.name = tag;
    current.value = data;
  }

  function fillMatching(current) {
    if (current.name && current.value) {
      matching.push([current.name, current.value]);
    }
    for (var i in current) {
      if (i !== "name" && i !== "value") {
        fillMatching(current[i]);
      }
    }
  }

  function getMatching(tag) {
    matching = [];
    if (!tag) return matching;
    tag = tag.toLowerCase();
    var current = trie;

    for (var i = 0; i < tag.length; i++) {
      if (!current[tag[i]]) {
        return matching;
      }
      current = current[tag[i]];
    }
    fillMatching(current);
    return matching;
  }

  this.insert = insert;
  this.getMatching = getMatching;
  this.trie = trie;

  Object.preventExtensions(this);
}
Object.preventExtensions(TagTrie);

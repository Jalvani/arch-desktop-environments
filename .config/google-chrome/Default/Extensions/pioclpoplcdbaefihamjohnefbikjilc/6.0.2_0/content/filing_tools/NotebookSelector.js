function NotebookSelector(search, searchCancel, all, callback) {
  "use strict";

  var userSelectedNotebook = false;
  var smartFilingSuggested = false;

  var currentResults;
  var selected;
  var stacks = {};

  searchCancel.addEventListener("click", function() {
    search.value = "";
    handleInput();
    search.focus();
  });

  search.addEventListener("input", handleInput);
  search.addEventListener("keydown", handleKeydown);

  function addNotebookToAll(name, guid, type, owner, shareKey, linkedGuid) {
    var elt = createNotebook(name, guid, type, owner, shareKey, linkedGuid);
    all.appendChild(elt);
    return elt;
  }

  function addNotebookToStack(name, guid, type, owner, shareKey, linkedGuid, stack) {
    var elt = createNotebook(name, guid, type, owner, shareKey, linkedGuid);
    stacks[stack].appendChild(elt);
    return elt;
  }

  function addStackIfNeeded(name) {
    if (!stacks[name]) {
      var elt = createStack(name);
      all.appendChild(elt);
      return elt;
    }
  }

  function changedNotebook() {
    return userSelectedNotebook;
  }

  function createNotebook(name, guid, type, owner, shareKey, linkedGuid) {
    var elt = document.createElement("div");
    var s1 = document.createElement("span");
    var s2 = document.createElement("span");
    elt.setAttribute("name", name.toLowerCase());
    if (shareKey) {
      elt.setAttribute("shareKey", shareKey);
    }
    if (linkedGuid) {
      elt.setAttribute("linkedGuid", linkedGuid);
    }
    s1.innerText = name;
    elt.id = guid;
    elt.className = "notebook";
    if (type == "biz" || type == "linked") {
      elt.className += " " + type;
      elt.setAttribute("type", type);
    } else {
      elt.setAttribute("type", "pers");
    }
    if (owner) {
      s2.innerText = " (" + owner + ")";
    }
    elt.addEventListener("click", function() {
      if (selected.guid !== this.id) {
        select(this, false);
      }
      userSelectedNotebook = true;
      searchCancel.click();
    });
    elt.addEventListener("mouseover", function() {
      highlight(this);
    });
    elt.appendChild(s1);
    elt.appendChild(s2);
    elt.title = name;
    if (owner) {
      elt.title += " (" + owner + ")";
    }
    return elt;
  }

  function createStack(name) {
    var elt = document.createElement("div");
    elt.className = "stack";
    var header = document.createElement("div");
    header.className = "stackHeader";
    header.innerText = name;
    elt.appendChild(header);
    stacks[name] = elt;
    return elt;
  }

  function focusEntry() {
    search.focus();
  }

  function getSelected() {
    return selected;
  }

  function handleInput() {
    if (search.value == "") {
      searchCancel.className = searchCancel.className.replace(/\s*visible/g, "");
      // show all the notebooks
      var hidden = all.querySelectorAll(".notebook.hidden");
      for (var i = 0; i < hidden.length; i++) {
        hidden.item(i).className = hidden.item(i).className.replace(/\s*hidden/g, "");
      }
      currentResults = all.querySelectorAll(".notebook");
      // uncollapse stacks
      var stacks = all.querySelectorAll(".stack.collapsed");
      for (var i = 0; i < stacks.length; i++) {
        stacks.item(i).className = stacks.item(i).className.replace(/\s*collapsed/g, "");
      }
    } else {
      searchCancel.className += " visible";
      // show the appropriate notebooks
      var searchText = search.value.toLowerCase();
      var visibleNonMatching = all.querySelectorAll(".notebook:not(.hidden):not([name^='" + searchText + "'])");
      for (var i = 0; i < visibleNonMatching.length; i++) {
        visibleNonMatching.item(i).className += " hidden";
      }
      var hiddenMatching = all.querySelectorAll(".notebook.hidden[name^='" + searchText + "']");
      for (var i = 0; i < hiddenMatching.length; i++) {
        hiddenMatching.item(i).className = hiddenMatching.item(i).className.replace(/\s*hidden/g, "");
      }
      // collapse stacks
      var stacks = all.querySelectorAll(".stack:not(.collapsed)");
      for (var i = 0; i < stacks.length; i++) {
        stacks.item(i).className += " collapsed";
      }
      currentResults = all.querySelectorAll(".notebook[name^='" + searchText + "']:not(.hidden)");
      if (currentResults.length > 0) {
        highlight(currentResults.item(0));
      }
    }
  }

  function handleKeydown(evt) {
    if (evt.keyCode == 38 || evt.keyCode == 40) {
      if (!currentResults) {
        currentResults = all.querySelectorAll(".notebook");
      }
      var h = all.querySelector(".notebook.highlighted");
      if (!h) {
        h = all.querySelector(".notebook.selected");
      }
      if (h) {
        var hi = Array.prototype.slice.call(currentResults).indexOf(h);
        if (evt.keyCode == 38 && hi - 1 > -1 && currentResults.item(hi - 1)) { // up
          highlight(currentResults.item(hi - 1));
        } else if (evt.keyCode == 40 && currentResults.item(hi + 1)) { // down
          highlight(currentResults.item(hi + 1));
        }
        evt.preventDefault();
      }
    } else if (evt.keyCode == 13) {
      var h = all.querySelector(".notebook.highlighted");
      if (h) {
        select(h, false);
        searchCancel.click();
      }
    }
  }

  function hasNotChangedSmartFiling() {
    return smartFilingSuggested && !userSelectedNotebook;
  }

  function highlight(elt) {
    var hl = all.querySelector(".notebook.highlighted");
    if (hl) {
      hl.className = hl.className.replace(/\s*highlighted/g, "");
    }
    if (selected.guid !== elt.id) {
      elt.className += " highlighted";
      elt.scrollIntoViewIfNeeded();
    }
  }

  function getNotebook(guid) {
    return all.querySelector(".notebook[id='" + guid + "']");
  }

  function insertNotebook(index, name, guid, type, owner, shareKey, linkedGuid) {
    var elt = createNotebook(name, guid, type, owner, shareKey, linkedGuid);
    all.insertBefore(elt, all.children[index]);
    return elt;
  }

  function insertNotebookIntoStack(index, name, guid, type, owner, shareKey, linkedGuid, stack) {
    var elt = createNotebook(name, guid, type, owner, shareKey, linkedGuid);
    // need to add 1 to the index to avoid the stack header element
    stacks[stack].insertBefore(elt, stacks[stack].children[index + 1]);
    return elt;
  }

  function insertStackIfNeeded(index, name) {
    if (!stacks[name]) {
      var elt = createStack(name);
      all.insertBefore(elt, all.children[index]);
      return elt;
    }
  }

  function overridable() {
    return !userSelectedNotebook && !smartFilingSuggested;
  }

  function reset() {
    userSelectedNotebook = false;
    smartFilingSuggested = false;
    all.innerHTML = "";
    currentResults = null;
    selected = null;
    stacks = {};
  }

  function select(notebook, smartFiling) {
    if (smartFiling) {
    //   selected.className += " green";
      smartFilingSuggested = true;
    } else {
    //   selected.className = selected.className.replace(/\s*green/g, "");
    }
    selected = {};
    selected.name = notebook.textContent || notebook.innerText;
    selected.guid = notebook.id;
    var type;
    var linkedGuid;
    var shareKey;
    if (notebook.getAttribute) { // from clicking on something in the list
      type = notebook.getAttribute("type");
      linkedGuid = notebook.getAttribute("linkedGuid");
      shareKey = notebook.getAttribute("shareKey");
    } else { // from programatically setting the notebook
      type = notebook.type;
    }
    selected.type = type;
    selected.linkedGuid = linkedGuid;
    selected.shareKey = shareKey;
    // deselect previously selected notebook
    var sel = all.querySelector(".notebook.selected");
    if (sel) {
      sel.className = sel.className.replace(/\s*selected/g, "");
    }

    var elt = notebook;
    if (!elt.getAttribute) {
      elt = all.querySelector(".notebook[id='" + notebook.id + "']");
    }
    if (elt) {
      elt.className = elt.className.replace(/\s*highlighted/g, "") + " selected";
      elt.scrollIntoViewIfNeeded();
    }

    if (callback) {
      callback({
        name: "selectedNotebook",
        notebookName: selected.name,
        smart: smartFiling,
        type: type
      });
    }
  }

  this.addNotebookToAll = addNotebookToAll;
  this.addNotebookToStack = addNotebookToStack;
  this.addStackIfNeeded = addStackIfNeeded;
  this.changedNotebook = changedNotebook;
  this.focusEntry = focusEntry;
  this.getNotebook = getNotebook;
  this.getSelected = getSelected;
  this.hasNotChangedSmartFiling = hasNotChangedSmartFiling;
  this.insertNotebook = insertNotebook;
  this.insertNotebookIntoStack = insertNotebookIntoStack;
  this.insertStackIfNeeded = insertStackIfNeeded;
  this.overridable = overridable;
  this.reset = reset;
  this.select = select;

  Object.preventExtensions(this);
}
Object.preventExtensions(NotebookSelector);
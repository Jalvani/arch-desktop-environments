function ContentPreview() {
  "use strict";

  var nudgeEnabled = false;

  var contentVeil = new ContentVeil();

  // Stores a reference to the last element that we used as a preview.
  var previewElement = null;
  var numberOfPages = 0;
  // holds the text selection
  var selectedRanges = null;
  var selectedRangesStartEnds = null;
  var textSelectionFrame = null;

  function buildUrlElement() {
    var urlEl = document.createElement("div");
    urlEl.id = "evernotePreviewContainer";
    urlEl.className = "evernotePreviewContainer evernotePreviewUrlContainer";
    return urlEl;
  }

  var urlElement = buildUrlElement();
  var tempBookmarkThumb;

  function showUrlElement() {
    if (!urlElement.parentNode) {
      document.documentElement.appendChild(urlElement);
    }

    // Make sure we're centered in the window.
    var elStyle = window.getComputedStyle(urlElement, '');
    var w = parseInt(elStyle.getPropertyValue("width"));
    var h = parseInt(elStyle.getPropertyValue("height"));
    if (w && h) {
      urlElement.style.marginLeft = (0 - w / 2) + "px";
      urlElement.style.marginTop = (0 - h / 2) + "px";
    }
  }

  function hideUrlElement() {
    if (urlElement.parentNode) {
      urlElement.parentNode.removeChild(urlElement);
    }
  }

  function createUrlClipContent(title, url, favIcoUrl, snippet, callback) {
    var BAD_FAV_ICON_URLS = { "http://localhost/favicon.ico": true };
    var titleAttr = (title) ? GlobalUtils.escapeXML(title) : Browser.i18n.getMessage("quickNote_untitledNote");
    var checkedThumbnail, checkedFavIcon;

    var content = document.createElement("div");
    content.style.whiteSpace = "nowrap";
    var t = document.createElement("div");
    t.textContent = titleAttr;
    t.style.fontFamily = "Helvetica, Arial, sans-serif";
    t.style.fontSize = "14px";
    t.style.fontWeight = "bold";
    t.style.color = "#0C0C0C";
    t.style.overflowX = "hidden";
    t.style.textOverflow = "ellipsis";
    t.style.paddingBottom = "9px";
    content.appendChild(t);
    var d = document.createElement("div");
    d.style.borderTop = "1px solid #D8D8D8";
    d.style.height = "0px";
    d.style.width = "100%";
    content.appendChild(d);
    var thD = document.createElement("div");
    var th = document.createElement("img");
    var te = document.createElement("div");
    te.style.display = "inline-block";
    te.style.verticalAlign = "top";
    te.style.margin = "15px 0px 0px 0px";
    te.style.width = "364px";
    content.appendChild(te);
    var l = document.createElement("div");
    l.style.fontFamily = "Helvetica, Arial, sans-serif";
    l.style.fontSize = "12px";
    l.style.color = "#0C0C0C";
    l.style.display = "block";
    te.appendChild(l);
    var f = document.createElement("img");
    var a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    a.style.display = "inline-block";
    a.style.textDecoration = "none";
    a.style.whiteSpace = "nowrap";
    a.style.overflow = "hidden";
    a.style.textOverflow = "ellipsis";
    a.style.color = "#0C0C0C";
    a.style.width = "345px";
    l.appendChild(a);
    var s = document.createElement("div");
    if (snippet.trim() != "") {
      if (snippet.length < 500) {
        s.textContent = snippet;
      } else {
        s.textContent = snippet.slice(0, 500) + "...";
      }
      s.style.fontFamily = "Helvetica, Arial, sans-serif";
      s.style.fontSize = "12px";
      s.style.color = "#0C0C0C";
      s.style.display = "block";
      s.style.whiteSpace = "normal";
      s.style.marginTop = "15px";
      s.style.maxHeight = "154px";
      s.style.overflow = "hidden";
      te.appendChild(s);
    }

    pageInfo.getBiggestImage(function(thumbnail) {
      checkedThumbnail = true;
      if (thumbnail.src) {
        thD.style.position = "relative";
        thD.style.display = "inline-block";
        thD.style.width = "150px";
        thD.style.height = "150px";
        thD.style.margin = "15px 30px 0px 0px";
        thD.style.overflow = "hidden";
        if (thumbnail.height > 150 || thumbnail.width > 150) {
          th.setAttribute("thumbnail", thumbnail.src);
          tempBookmarkThumb = th;
          Browser.sendToExtension({
            name: "cropImage",
            height: thumbnail.height,
            url: thumbnail.src,
            width: thumbnail.width
          });
          th.style.maxWidth = "none";
          th.style.maxHeight = "none";
        } else {
          th.src = thumbnail.src;
        }
        th.width = Math.min(150, thumbnail.width);
        th.height = Math.min(150, thumbnail.height);
        thD.appendChild(th);
        if (te.parentNode) {
          content.insertBefore(thD, te);
        } else {
          content.appendChild(thD);
        }
      }
      if (checkedFavIcon) {
        callback(content);
      }
    });

    if (favIcoUrl && !BAD_FAV_ICON_URLS[favIcoUrl.toLowerCase()]) {
      f.onload = function() {
        checkedFavIcon = true;
        f.style.display = "inline-block";
        f.style.border = "none";
        f.style.width = "16px";
        f.style.height = "16px";
        f.style.padding = "0px";
        f.style.margin = "0px 8px -2px 0px";
        f.width = "16";
        f.height = "16";
        l.insertBefore(f, a);
        if (checkedThumbnail) {
          callback(content);
        }
      };
      f.onerror = function() {
        checkedFavIcon = true;
        if (checkedThumbnail) {
          callback(content);
        }
      };
      f.src = favIcoUrl;
    } else {
      checkedFavIcon = true;
      if (checkedThumbnail) {
        return content;
      }
    }
  }

  function receiveCroppedImage(request, sender, sendResponse) {
    if (tempBookmarkThumb) {
      tempBookmarkThumb.src = request.datauri;
      tempBookmarkThumb.removeAttribute("thumbnail");
    }
  }

  function previewUrl(request, sender, sendResponse) {
    function previewUrlCallback(content) {
      urlElement.innerHTML = "";
      urlElement.appendChild(content);
      showUrlElement();
    }
    nudgeEnabled = false;
    var title = document.title;
    var url = document.location.href;
    var favIconUrl = pageInfo.favIconUrl;
    pageInfo.getRecommendationText(true, function(snippet) {
      var content = createUrlClipContent(title, url, favIconUrl, snippet, previewUrlCallback);
      if (content) {
        urlElement.innerHTML = "";
        urlElement.appendChild(content);
        showUrlElement();
      }
    });
    clear();
    contentVeil.reset();
    contentVeil.gray();
  }

  // This doesn't remove internal state of previewElement, because another script may not have finished clipping until
  // after the page looks 'clear'.
  function clear() {
    contentVeil.reset();
    contentVeil.hide();
    hideUrlElement();
    hideEmailElement();
  }

  function reset() {
    selectedRanges = null;
    selectedRangesStartEnds = null;
    textSelectionFrame = null;
  }

  function _previewArticle () {
    if (previewElement)
    {
      var selectionFrame;
      if (typeof pageInfo !== undefined) {
        selectionFrame = pageInfo.getSelectionFrame();
      }

      if (selectionFrame) {

        var rect = {
          width: selectionFrame.width,
          height: selectionFrame.height,
          top: selectionFrame.offsetTop,
          bottom: (selectionFrame.height + selectionFrame.offsetTop),
          left: selectionFrame.offsetLeft,
          right: (selectionFrame.width + selectionFrame.offsetLeft)
        };
        contentVeil.revealStaticRect(contentVeil.expandRect(rect, -9), selectionFrame, true);
        contentVeil.show();
      }
      else {
        contentVeil.outlineElement(previewElement, true, true);
      }
    }
    else {
      log.warn("Couldn't find a preview element. We should switch to 'full page' mode.");
    }
  }

  function previewArticle (request, sender, sendResponse) {
    nudgeEnabled = true;
    window.focus();

    clear();
    // previewElement = null;
    if (!previewElement && typeof pageInfo !== undefined) {
      previewElement = pageInfo.getDefaultArticle(function(el){
        previewElement = el;
        _previewArticle();
      }, function(html, url, numPages) {
        numberOfPages = numPages;
        if (numPages > 1 && numberOfPages) { // only show in article view
          contentVeil.setPageCount(numPages - 1);
        }
      });
    } else if (previewElement) {
      _previewArticle();
      if (numberOfPages > 1) {
        contentVeil.setPageCount(numberOfPages - 1);
      }
    } else {
      log.warn("Couldn't find a 'pageInfo' object.");
    }
  }

  // When nudging the preview around the page, we want to skip nodes that aren't interesting. This includes empty
  // nodes, containers that have identical contents to the already selected node, invisible nodes, etc.
  // @TODO: There's a lot more we could probably add here.
  function looksInteresting(candidate, given) {

    if (!candidate) {
      log.warn("Can't determine if 'null' is interesting (it's probably not).");
      return false;
    }
    // This is the parent of our 'HTML' tag, but has no tag itself. There's no reason it's ever more interesting than
    // the HTML element.
    if (candidate === window.document) {
      return false;
    }

    // Elements with neither text nor images are not interesting.
    if (candidate.textContent.trim() == "" && (candidate.getElementsByTagName("img").length === 0)) {
      return false;
    }

    // Elements with 0 area are not interesting.
    var rect = candidate.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return false;
    }

    // Invisible elements are not interesting.
    var style = getComputedStyle(candidate);
    if ((style.visibility === "hidden") || (style.display === "none")) {
      return false;
    }

    // If the nodes have a parent/child relationship, then they're only interesting if their visible contents differ.
    if (candidate.parentNode && given.parentNode) {
      if ((candidate.parentNode == given) || (given.parentNode == candidate)) {
        if (sameElement(candidate, given)) {
          return false;
        }
      }
    }
    return true;
  }

  function sameElement(a, b) {
    var aRect = a.getBoundingClientRect();
    var bRect = b.getBoundingClientRect();
    if (aRect.bottom == bRect.bottom && aRect.height == bRect.height
        && aRect.left == bRect.left && aRect.right == bRect.right
        && aRect.top == bRect.top && aRect.width == bRect.width) {
      return false;
    } else if ((a.textContent === b.textContent) &&
      (a.getElementsByTagName("img").length === b.getElementsByTagName("img").length)) {
      return false;
    }
  }

  function descendTreeUntilUniqueElement(parent) {
    for (var i = 0; i < parent.children.length; i++) {
      if (sameElement(parent.children[i], parent)) {
        return descendTreeUntilUniqueElement(parent.children[i]);
      } else if (looksInteresting(parent.children[i], parent)) {
        return parent.children[i];
      }
    }
    return parent;
  }

  // Returns the current article element, which may not be the same as the auto-detected one if the user has 'nudged'
  // the selection around the page.
  function getArticleElement() {
    return previewElement;
  }

  function getUrlElement(callback) {
    function finish() {
      // if the thumbnail hasn't finished loading by the time the user tries
      // to clip, then remove it.
      var thumb = urlElement.querySelector("[thumbnail]");
      if (thumb) {
        thumb.parentNode.parentNode.removeChild(thumb.parentNode);
      }
      var html = "";
      var pieces = urlElement.innerHTML.split(/(?=<img.[^>]+>)/);
      for (var i = 0; i < pieces.length; i++) {
        if (/^<img/.test(pieces[i])) {
          html += pieces[i].replace(/>/, "></img>");
        } else {
          html += pieces[i];
        }
      }
      return html;
    }
    // if clipping from context menu, this will be empty, so need to populate it
    if (!urlElement.innerHTML) {
      pageInfo.getRecommendationText(true, function(snippet) {
        var content = createUrlClipContent(document.title, document.location.href,
          pageInfo.favIconUrl, snippet,
          function(content) {
            if (content) {
              urlElement.innerHTML = "";
              urlElement.appendChild(content);
              callback(finish());
            }
          }
        );
        if (content) {
          urlElement.innerHTML = "";
          urlElement.appendChild(content);
          callback(finish());
        }
      });
    } else {
      return finish();
    }
  }

  // What this does:
  // 'previewElement' is the HTML element node that we will clip when an "article" clip is selected. In general, this
  // is chosen by our Clearly implementation, and should be a div or something containing the main page content.
  // In case the user wants to adjust the auto-selection, though, The popup window registers event handlers for the 
  // arrow keys, and whenever one is pressed, it will pass us a "nudge_preview" message (unless nudging is disabled).
  // The nudge_preview message contains a "direction" property corresponding to the arrow key pressed: either "up",
  // "down", "left" or "right".
  //
  // Nudging "up" moves previewElement one level up in the DOM tree, such that the "article" becomes the previous
  // article's parent node. This operation will also save the currently selected node before moving up the tree.
  //
  // Nudging "down" will move the previewElement down the DOM tree to the current article's first child element, unless
  // we had already saved an article at this level in the tree, in which case we will select the previously selected
  // article element.
  //
  // Nudging left or right will move the previewElement to the the current previewElement's previous or next sibling
  // nodes, respectively. It will also adjust the "saved" article at this level in the tree, such that if the user were 
  // to nudge up and then down, they would end up back at the same element where they started.
  //
  // There are some checks in here to skip over nodes with no visible difference (i.e., container divs with no content
  // of their own) and to make sure we haven't run out of bounds in the DOM tree.
  //
  // Once the previewElement has changed, we'll repaint our preview overlay.
  function nudgePreview(evt) {
    if ((contentVeil && contentVeil.isHidden()) || !nudgeEnabled) {
      return;
    }
    var direction = evt.keyIdentifier;
    if (!previewElement) {
      return;
    }

    var oldPreview = previewElement;

    switch (direction) {
      case "Up":
        moveUp();
        break;
      case "Down":
        moveDown();
        break;
    }

    // Drawing is expensive so don't bother if nothing changed.
    if (oldPreview !== previewElement) {
      contentVeil.outlineElement(previewElement, true, true);
    }
  }

  function findCommonAncestor(a, b) {
    var ancestor = a;
    while (ancestor) {
      if (ancestor.contains(b)) {
        return ancestor;
      } else {
        ancestor = ancestor.parentNode;
      }
    }
    return document.body;
  }

  function calcElementImportance(elt) {
    var rect = elt.getBoundingClientRect();
    if (window.getComputedStyle(elt).visiblity == "hidden") {
      return 0;
    }
    return rect.width * rect.height;
  }

  function findBiggestDescendantThatExcludesNode(current, exclude) {
    var children = current.children;
    var maxImportance = 0;
    var mostImportantElt;
    for (var i = 0; i < children.length; i++) {
      if (children.item(i).contains(exclude)) {
        if (children.item(i) !== exclude) {
          var result = findBiggestDescendantThatExcludesNode(children.item(i), exclude);
          if (result.elt) {
            if (result.imp > maxImportance) {
              maxImportance = result.imp;
              mostImportantElt = result.elt;
            }
          }
        }
      } else {
        var imp = calcElementImportance(children.item(i));
        if (imp > maxImportance) {
          maxImportance = imp;
          mostImportantElt = children.item(i);
        }
      }
    }
    return { elt: mostImportantElt, imp: maxImportance };
  }

  function moveUp() {
    var temp = previewElement.parentNode;
    while (temp) {
      if (looksInteresting(temp, previewElement)) {
         // If we move up and then down, we want to move back to where we started, not the first child.
        temp.enNudgeDescendToNode = previewElement;
        previewElement = temp;
        break;
      }
      temp = temp.parentNode;
    }
  }

  function moveDown() {
    if (previewElement.enNudgeDescendToNode) {
      var temp = previewElement.enNudgeDescendToNode;
      // @TODO: make sure we clean these up somewhere else if we never reverse our nudging.
      delete previewElement.enNudgeDescendToNode;
      previewElement = temp;
    } else {
      previewElement = descendTreeUntilUniqueElement(previewElement);
    }
  }

  function expandPreview() {
    var oldPreview = previewElement;
    moveUp();
    if (oldPreview !== previewElement) {
      contentVeil.outlineElement(previewElement, false, true, true);
    }
  }

  function contractPreview() {
    var oldPreview = previewElement;
    moveDown();
    if (oldPreview !== previewElement) {
      contentVeil.outlineElement(previewElement, false, true, true);
    }
  }

  function moveToElementAbove() {
    var temp = previewElement.previousElementSibling;
    while (temp) {
      if (looksInteresting(temp, previewElement)) {
        previewElement = temp;
        contentVeil.outlineElement(previewElement, false, true, true);
        break;
      }
      temp = temp.previousElementSibling;
    }
  }

  function moveToElementBelow() {
    var temp = previewElement.nextElementSibling;
    while (temp) {
      if (looksInteresting(temp, previewElement)) {
        previewElement = temp;
        contentVeil.outlineElement(previewElement, false, true, true);
        break;
      }
      temp = temp.nextElementSibling;
    }
  }

  function previewFullPage() {
    nudgeEnabled = false;
    var borderWidth = 4;
    var w = document.body.scrollWidth;
    var h = document.body.scrollHeight;

    var rect = {
      bottom: h - borderWidth,
      top: borderWidth,
      left: borderWidth,
      right: w - borderWidth,
      width: w - (2 * borderWidth),
      height: h - (2 * borderWidth)
    }

    clear();
    contentVeil.reset();
    contentVeil.revealStaticRect(rect, document.body);
    contentVeil.show();
  }

  function buildEmailElement() {
    var elt = document.createElement("div");
    elt.id = "evernoteEmailPreview";
    return elt;
  }

  var emailElement = buildEmailElement();

  function previewEmail() {
    // remove gmail tooltip if it's still there
    var tooltip = document.querySelector("#evernoteTooltip");
    if (tooltip) {
      tooltip.parentNode.removeChild(tooltip);
    }
    // render email
    emailElement.innerHTML = "";
    var container = document.createElement("div");
    // subject line
    var subject = document.createElement("div");
    subject.id = "subject";
    subject.className = "header";
    subject.innerText = document.querySelector("h1 > span").innerText;
    var subjectImage = document.createElement("div");
    subject.appendChild(subjectImage);
    container.appendChild(subject);
    // contacts
    var contacts = document.querySelectorAll("table tr:first-child td:first-child span[email]");
    var contDict = [];
    var sender = document.createElement("div");
    sender.className = "contact";
    sender.innerText = Browser.i18n.getMessage("sender") + ": " + contacts.item(0).getAttribute("email");
    container.appendChild(sender);
    for (var i = 1; i < contacts.length; i++) {
      var email = contacts.item(i).getAttribute("email");
      if (contDict.indexOf(email) < 0 && email != contacts.item(0).getAttribute("email")) {
        contDict.push(contacts.item(i).getAttribute("email"));
      }
    }
    var rec = contDict.join(", ");
    if (rec.length > 0) {
      var recipients = document.createElement("div");
      recipients.className = "contact";
      recipients.innerText = Browser.i18n.getMessage("recipients") + ": " + rec;
      container.appendChild(recipients);
    }
    // emails
    var emails = document.querySelectorAll("[role='presentation'] td:first-child > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div");
    var currentlyCollapsedCount = 0;
    for (var i = 0; i < emails.length; i++) {
      var totalCollapsed = emails.item(i).querySelector("table");
      if (totalCollapsed) {
        if (currentlyCollapsedCount > 0) {
          var divider = document.createElement("div");
          divider.className = "divider";
          container.appendChild(divider);
          var count = document.createElement("div");
          count.className = "collapsedCount dimmed";
          count.innerText = Browser.i18n.getMessage("olderMessages", [currentlyCollapsedCount]);
          container.appendChild(count);
          currentlyCollapsedCount = 0;
        }
        var divider = document.createElement("div");
        divider.className = "divider";
        container.appendChild(divider);

        var basics = null, author = null, date = null;
        var content = null, htmlContent = false;
        var attFrag = null;

        var meat = emails.item(i).querySelector(".hi");
        if (!meat) { // hasn't been clicked/loaded yet
          meat = emails.item(i).querySelector("table[aria-role='presentation']");
          basics = meat.firstElementChild.firstElementChild;
          author = basics.children[0];
          date = basics.children[2].querySelector("span[title]");
          // snippet
          content = basics.children[1].textContent;
        } else {
          meat = meat.parentNode;
          var partialCollapsed = false;
          if (!meat.getBoundingClientRect().width) {
            partialCollapsed = true;
          }
          meat = meat.cloneNode(true);
          var hasAttachments = (meat.children.length == 9);
          // remove duplicated content
          var expandBtns = meat.querySelectorAll("[role='button'] img");
          for (var j = 0; j < expandBtns.length; j++) {
            var rules = window.getMatchedCSSRules(expandBtns.item(j));
            for (var r = 0; r < rules.length; r++) {
              if (/ellipsis/.test(rules[r].cssText)) {
                var btn = expandBtns.item(j).parentNode.parentNode;
                var dup = btn.nextElementSibling;
                btn.parentNode.removeChild(btn);
                dup.parentNode.removeChild(dup);
                break;
              }
            }
          }
          basics = meat.firstElementChild;
          author = basics.firstElementChild.firstElementChild.firstElementChild.querySelector("span[email]");
          date = basics.firstElementChild.firstElementChild.firstElementChild.querySelector("span[title]");
          for (var j = meat.children.length - 1; j >= 1; j--) {
            if (meat.children[j].textContent.trim()) {
              if ((hasAttachments && j != meat.children.length - 2) || !hasAttachments) {
                if (partialCollapsed) {
                  content = meat.children[j].textContent.slice(0, 77) + "...";
                } else {
                  content = meat.children[j].innerHTML;
                  htmlContent = true;
                }
                break;
              }
            }
          }
          if (hasAttachments && !partialCollapsed) {
            var attachments = meat.children[meat.children.length - 2].querySelectorAll("table");
            attFrag = document.createDocumentFragment();
            for (var j = 0; j < attachments.length; j++) {
              var tempFile = document.createElement("div");
              var tempName = document.createElement("span");
              var tempSize = document.createElement("span");
              tempSize.className = "dimmed";
              var fileName = attachments.item(j).querySelector("td:last-child b");
              var fileSize = attachments.item(j).querySelector("td:last-child span").previousSibling;
              var fileUrl = attachments.item(j).querySelector("td:last-child span a[download_url]");
              tempName.textContent = fileName.textContent;
              tempSize.textContent = " (" + fileSize.textContent.trim() + ")";
              tempFile.setAttribute("evernote_attachment_url", fileUrl.href);
              tempFile.setAttribute("evernote_attachment_name", fileName.textContent);
              tempFile.style.display = "block";
              tempFile.appendChild(tempName);
              tempFile.appendChild(tempSize);
              attFrag.appendChild(tempFile);
            }
          }
        }
        var email = document.createElement("div");
        var header = document.createElement("div");
        // author
        var temp = document.createElement("span");
        temp.className = "header sender";
        temp.innerText = author.textContent;
        header.appendChild(temp);
        // date
        temp = document.createElement("span");
        temp.className = "dimmed date";
        temp.innerText = date.title;
        header.appendChild(temp);
        email.appendChild(header);
        // content
        temp = document.createElement("div");
        temp.className = "body";
        if (content) {
          if (htmlContent) {
            temp.innerHTML = content;
          } else {
            temp.innerText = content;
          }
        }
        email.appendChild(temp);
        // attachments
        if (attFrag) {
          temp = document.createElement("div");
          temp.className = "attachments";
          temp.appendChild(attFrag);
          email.appendChild(temp);
        }
        container.appendChild(email);
      } else { // totally collapsed
        currentlyCollapsedCount++;
      }
    }
    emailElement.appendChild(container);

    clear();
    contentVeil.reset();
    contentVeil.gray();
    showEmailElement();
  }

  function hideEmailElement() {
    if (emailElement.parentNode) {
      emailElement.parentNode.removeChild(emailElement);
    }
  }

  function showEmailElement() {
    if (!emailElement.parentNode) {
      document.documentElement.appendChild(emailElement);
    }
  }

  function getEmailElement() {
    return emailElement;
  }

  // Creates the union of two rectangles, which is defined to be the smallest rectangle that contains both given
  // rectangles.
  function unionRectangles(rect1, rect2) {
    var rect = {
      top: (Math.min(rect1.top, rect2.top)),
      bottom: (Math.max(rect1.bottom, rect2.bottom)),
      left: (Math.min(rect1.left, rect2.left)),
      right: (Math.max(rect1.right, rect2.right))
    }
    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;

    return rect;
  }

  // Returns true if the rectangles match, false otherwise.
  function rectanglesEqual(rect1, rect2) {
    if (!rect1 && !rect2) return true;
    if (!rect1) return false;
    if (!rect2) return false;
    if (rect1.top != rect2.top) return false;
    if (rect1.bottom != rect2.bottom) return false;
    if (rect1.left != rect2.left) return false;
    if (rect1.right != rect2.right) return false;
    if (rect1.width != rect2.width) return false;
    if (rect1.height != rect2.height) return false;
    return true;
  }

  // If the user triple-clicks a paragraph, we will often get a selection that includes the next paragraph after the
  // selected one, but only up to offset 0 in that paragraph. This causes the built in getBoundingClientRect to give a
  // box that includes the whole trailing paragraph, even though none of it is actually selected. Instead, we'll build
  // our own bounding rectangle that omits the trailing box.
  // @TODO: Currently this computes a box that is *too big* if you pass it a range that doesn't have start and/or end
  // offsets that are 0, because it will select the entire beginning and ending node, instead of jsut the selected
  // portion.
  function computeAlternateBoundingBox(range) {
    
    // If the end of selection isn't at offset 0 into an element node (rather than a text node), then we just return the
    // original matching rectangle.
    if ((range.endOffset !== 0) || (range.endContainer.nodeType !== Node.ELEMENT_NODE)) {
      var rect = range.getBoundingClientRect();
      var mutableRect = {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
      };
      return mutableRect;
    }

    // This is the one we don't want.
    var endElementRect = null;
    try {
      endElementRect = range.endContainer.getBoundingClientRect();
    }
    catch(ex) {
      log.warn("Couldn't get a bounding client rect for our end element, maybe it's a text node.");
    }

    // We look for a rectangle matching our end element, and if we find it, we don't copy it to our list to keep.
    // You'd think we could just grab the last element in range.getClientRects() here and trim that one, which might be
    // true, but the spec makes no claim that these are returned in order, so I don't want to rely on that.
    // We keep track if we remove a rectangle, as we're only trying to remove one for the trailing element. If there are
    // more than one matching rectangle, we want to keep all but one of them.
    var foundEnd = false;
    var keptRects = [];
    var initialRects = range.getClientRects();
    for (var i = 0; i < initialRects.length; i++) {
      if (rectanglesEqual(endElementRect, initialRects[i]) && !foundEnd) {
        foundEnd = true;
      }
      else {
        keptRects.push(initialRects[i]);
      }
    }

    // Now compute our new bounding box and return that.
    if (keptRects.length == 0) return range.getBoundingClientRect();
    if (keptRects.length == 1) return keptRects[0];

    var rect = keptRects[0];
    for (var i = 1; i < keptRects.length; i++) {
      rect = unionRectangles(rect, keptRects[i]);
    }

    return rect;
  }

  // If every edge of the rectangle is in negative space,
  function rectIsOnScreen(rect) {
    // rtl pages have actual content in "negative" space. This case could be handled better.
    if (document.dir == "rtl") {
      return false;
    }
    // If both top and bottom are in negative space, we can't see this.
    if (rect.bottom < 0 && rect.top < 0) {
      return false;
    }
    // Or, if both left and right are in negative space, we can't see this.
    if (rect.left < 0 && rect.right < 0) {
      return false;
    }
    // Probably visible.
    return true;
  }

  function applyElementRect(element, rect) {
    var newRect = rect;
    var tempRect = element.getBoundingClientRect();
    tempRect = {
      bottom: tempRect.bottom + window.scrollY,
      height: tempRect.height,
      left: tempRect.left + window.scrollX,
      right: tempRect.right + window.scrollX,
      top: tempRect.top + window.scrollY,
      width: tempRect.width
    };

    // Skip elements that are positioned off screen.
    if (!rectIsOnScreen(tempRect)) {
      return newRect;
    }
    var cs = getComputedStyle(element);
    // We won't descend into hidden elements.
    if (cs.display == "none") {
      return newRect;
    }
    // don't union a big rectangle that has hidden overflow
    if (cs.overflowX == "hidden" || cs.overflowY == "hidden") {
      return newRect;
    }
    // We skip anything with an area of one px or less. This is anything that has "display: none", or single pixel
    // images for loading ads and analytics and stuff. Most hidden items end up at 0:0 and will stretch our rectangle
    // to the top left corner of the screen if we include them. Sometimes single pixels are deliberately placed off
    // screen.
    if ((tempRect.width * tempRect.height) > 1) {
      newRect = unionRectangles(tempRect, rect);
    }

    if (element.children) {
      for (var i = 0; i < element.children.length; i++) {
        newRect = applyElementRect(element.children[i], newRect);
      }
    }
    return newRect;
  }

  // In the case of positioned elements, a bounding box around an element doesn't necessarily contain its child
  // elements, so we have this method to combine all of these into one bigger box. ContentVeil calls this function.
  function computeDescendantBoundingBox(element) {
    if (!element) return {top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0};
    var rect = element.getBoundingClientRect();
    return applyElementRect(element, {
      bottom: rect.bottom + window.scrollY,
      height: rect.height,
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      top: rect.top + window.scrollY,
      width: rect.width
    });
  }

  function ensureSelectionIsShown() {
    var selection;
    if (typeof pageInfo !== undefined && !selectedRanges) {
      selection = pageInfo.getSelection();
      selectedRanges = [];
      selectedRangesStartEnds = [];
      for (var i = 0; i < selection.rangeCount; i++) {
        selectedRanges.push(selection.getRangeAt(i).cloneRange());
        selectedRangesStartEnds.push([ selectedRanges[i].startOffset, selectedRanges[i].endOffset ]);
      }
      // If our selection is in a frame or iframe, we'll compute an offset relative to that, so we need to adjust it by
      // the offset of the frame.
      textSelectionFrame = pageInfo.getSelectionFrame();
    }
    // may need to reselect text
    if (!selection) {
      selection = window.getSelection();
      selection.removeAllRanges();
      for (var r = 0; r < selectedRanges.length; r++) {
        var range = document.createRange();
        if ((selectedRanges[r].startContainer.length || selectedRanges[r].startContainer.children.length) < selectedRangesStartEnds[r][0]) {
          // this can happen if the user has added highlights to the selection
          // that would cause the start container's children to just be the
          // highlight elements rather than the text node. in that case,
          // use the appropriate text node as the new start container
          // TODO assumes that the user only highlighted within the selection,
          // not outside of selection.
          var runningLength = 0;
          for (var i = 0; i < selectedRanges[r].startContainer.childNodes.length; i++) {
            var node = selectedRanges[r].startContainer.childNodes[i];
            var nodeLength = 0;
            if (node.getAttribute && node.getAttribute("clearly_highlight_id")) {
              nodeLength = (node.innerText || node.textContent).length;
            } else {
              nodeLength = (node.length || node.children.length);
            }
            runningLength += nodeLength;
            if (runningLength >= selectedRangesStartEnds[r][0]) {
              range.setStart(node, selectedRangesStartEnds[r][0] - (runningLength - nodeLength));
              break;
            }
          }
        } else {
          range.setStart(selectedRanges[r].startContainer, selectedRangesStartEnds[r][0]);
        }
        // do the same for the end
        if ((selectedRanges[r].endContainer.length || selectedRanges[r].endContainer.children.length) < selectedRangesStartEnds[r][1]) {
          var runningLength = 0;
          for (var i = 0; i < selectedRanges[r].endContainer.childNodes.length; i++) {
            var node = selectedRanges[r].endContainer.childNodes[i];
            var nodeLength = 0;
            if (node.getAttribute && node.getAttribute("clearly_highlight_id")) {
              nodeLength = (node.innerText || node.textContent).length;
            } else {
              nodeLength = (node.length || node.children.length);
            }
            runningLength += nodeLength;
            if (runningLength >= selectedRangesStartEnds[r][1]) {
              range.setEnd(node, selectedRangesStartEnds[r][1] - (runningLength - nodeLength));
              break;
            }
          }
        } else {
          range.setEnd(selectedRanges[r].endContainer, selectedRangesStartEnds[r][1]);
        }
        selection.addRange(range);
      }
    }
    return selection;
  }

  function previewSelection() {
    nudgeEnabled = false;
    var selection = ensureSelectionIsShown();

    contentVeil.reset();

    var frameRect = null;
    if (textSelectionFrame) {
      frameRect = textSelectionFrame.getBoundingClientRect();
    }

    var range, rect, i;

    // If !selection, then something has gone awry.
    if (selection) {
      clear();
      contentVeil.reset();
      // We attempt to highlight each selection, but this hasn't been tested for more than a single selection.
      for (i = 0; i < selection.rangeCount; i++) {
        range = selection.getRangeAt(i);

        rect = computeAlternateBoundingBox(range);
        rect.top += document.body.scrollTop;
        rect.bottom += document.body.scrollTop;
        rect.left += document.body.scrollLeft;
        rect.right += document.body.scrollLeft;

        // Actual adjustment mentioned earlier regarding frames.
        if (frameRect) {
          rect.left += frameRect.left;
          rect.right += frameRect.left;
          rect.top += frameRect.top;
          rect.bottom += frameRect.top;
        }
        contentVeil.revealStaticRect(rect, textSelectionFrame, false);
        contentVeil.show();
      }
    }
    contentVeil.show();
  }

  function isPointOnVeil(x, y) {
    var btw = parseFloat(contentVeil.getElement().style.borderTopWidth);
    var brw = parseFloat(contentVeil.getElement().style.borderRightWidth);
    var bbw = parseFloat(contentVeil.getElement().style.borderBottomWidth);
    var blw = parseFloat(contentVeil.getElement().style.borderLeftWidth);
    var width = parseFloat(contentVeil.getElement().style.width);
    var height = parseFloat(contentVeil.getElement().style.height);
    if (x < width - brw && x > blw && y > btw && y < height - bbw) {
      return false;
    }
    return true;
  }

  function gray() {
    clear();
    contentVeil.reset();
    contentVeil.gray();
  }

  Browser.addMessageHandlers({
    preview_clear: clear,
    receiveCroppedImage: receiveCroppedImage
  });

  window.addEventListener("message", function(evt) {
    if (evt.data.name == "previewArticle") {
      previewArticle();
    } else if (evt.data.name == "previewFullPage") {
      previewFullPage();
    } else if (evt.data.name == "previewUrl") {
      previewUrl();
    } else if (evt.data.name == "previewEmail") {
      previewEmail();
    } else if (evt.data.name == "clearPreview") {
      clear();
    } else if (evt.data.name == "previewSelection") {
      previewSelection();
    }
  });

  // window.addEventListener("keyup", nudgePreview);

  // Public API:
  this.clear = clear;
  this.getArticleElement = getArticleElement;
  this.getUrlElement = getUrlElement;
  this.looksInteresting = looksInteresting;
  this.computeDescendantBoundingBox = computeDescendantBoundingBox;
  this.getEmailElement = getEmailElement;
  this.previewArticle = previewArticle;
  this.previewFullPage = previewFullPage;
  this.previewSelection = previewSelection;
  this.ensureSelectionIsShown = ensureSelectionIsShown;
  this.previewUrl = previewUrl;
  this.previewEmail = previewEmail;
  this.expandPreview = expandPreview;
  this.contractPreview = contractPreview;
  this.moveToElementAbove = moveToElementAbove;
  this.moveToElementBelow = moveToElementBelow;
  this.isPointOnVeil = isPointOnVeil;
  this.reset = reset;
  this.gray = gray;
  this.previewSelection = previewSelection;

  Object.preventExtensions(this);
}


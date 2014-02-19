function ContentVeil() {
  "use strict";

  // @TODO: save() and restore() aren't properly used here, so if we do things like add transforms in founctions,
  // we probably break other functions' notion of how to render things.

  var tooltipTimeout;

  var veil = document.createElement("div");
  veil.id = "evernoteContentVeil";
  var inner = document.createElement("div");
  inner.id = "evernoteInnerBox";
  var pageCounter = document.createElement("div");
  pageCounter.id = "evernotePageCounter";
  veil.appendChild(pageCounter);
  veil.appendChild(inner);
  var topExpandContract;
  var bottomExpandContract;
  for (var i = 0; i < 2; i++) {
    var expand = document.createElement("div");
    var contract = document.createElement("div");
    expand.className = "evernoteArticleExpand";
    contract.className = "evernoteArticleContract";
    expand.setAttribute("tooltip", Browser.i18n.getMessage("expandArticleTooltip"));
    contract.setAttribute("tooltip", Browser.i18n.getMessage("contractArticleTooltip"));
    expand.addEventListener("click", function() {
      contentPreview.expandPreview();
    });
    contract.addEventListener("click", function() {
      contentPreview.contractPreview();
    });
    expand.addEventListener("mousemove", nudgeMousemoveHandler);
    expand.addEventListener("mouseout", nudgeMouseoutHandler);
    contract.addEventListener("mousemove", nudgeMousemoveHandler);
    contract.addEventListener("mouseout", nudgeMouseoutHandler);
    if (i == 0) {
      topExpandContract = document.createElement("div");
      topExpandContract.className = "evernoteExpandContract evernoteUsingExpandContract";
      topExpandContract.appendChild(expand);
      topExpandContract.appendChild(contract);
      veil.appendChild(topExpandContract);
    } else {
      bottomExpandContract = document.createElement("div");
      bottomExpandContract.id = "bottomExpandContract";
      bottomExpandContract.className = "evernoteExpandContract";
      bottomExpandContract.appendChild(expand);
      bottomExpandContract.appendChild(contract);
      veil.appendChild(bottomExpandContract);
    }
  }

  function nudgeMousemoveHandler(evt) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(function() {
      evt.srcElement.className += " tooltipon";
    }, 250);
  }

  function nudgeMouseoutHandler() {
    clearTimeout(tooltipTimeout);
    this.className = this.className.replace(/\s*tooltipon/g, "");
  }

  // We keep a record of what we're currently showing (at least in some cases) so that we can update it in case the
  // state of the page changes (like if the user scrolls).
  var currentlyShownRect = null;
  var currentlyShownElt = null;
  var currentRectOffsetTop = 0;
  var currentRectOffsetLeft = 0;
  var currentlyStatic = false;
  var currentlyShadowBox = false;

  function reset(doNotResetPageCount) {
    currentlyShownRect = null;
    currentlyShownElt = null;
    currentRectOffsetTop = 0;
    currentRectOffsetLeft = 0;
    currentlyShadowBox = false;
    inner.className = inner.className.replace(/\s*evernoteShadowBox/g, "");
    veil.className = inner.className.replace(/\s*evernoteShadowBox/g, "");
    if (!doNotResetPageCount) {
      setPageCount();
    }
    topExpandContract.className = topExpandContract.className.replace(/\s*evernoteUsingExpandContract/g, "");
    bottomExpandContract.className = bottomExpandContract.className.replace(/s*evernoteUsingExpandContract/g, "");

    showElements("embed");

    blank();
  }

  function blank() {
    veil.style.height = document.body.scrollHeight + "px";
    veil.style.width = document.body.scrollWidth + "px";
    veil.style.borderWidth = "0";
  }

  function gray() {
    show();
    inner.style.display = "none";
    veil.style.backgroundColor = "rgba(255, 255, 255, 0.75)";
  }

  function show() {
    inner.style.display = "";
    veil.style.backgroundColor = "";
    if (!veil.parentNode) {
      document.documentElement.appendChild(veil);
    }
  }

  function hide() {
    if (veil.parentNode) {
      veil.parentNode.removeChild(veil);
    }
  }

  function isHidden() {
    if (veil.parentNode) {
      return false;
    }
    return true;
  }

  // Makes a rectangle bigger in all directions by the number of pixels specified (or smaller, if 'amount' is 
  // negative). Returns the new rectangle.
  function expandRect(rect, amount) {
    return {
      top: (rect.top - amount),
      left: (rect.left - amount),
      bottom: (rect.bottom + amount),
      right: (rect.right + amount),
      width: (rect.width + (2 * amount)),
      height: (rect.height + (2 * amount))
    };
  }

  function revealRect(rect, elt, staticView, shadowBox) {
    // Save this info.
    currentlyShownRect = rect;
    currentlyShownElt = elt;
    currentRectOffsetTop = document.body.scrollTop;
    currentRectOffsetLeft = document.body.scrollLeft;
    currentlyStatic = staticView;
    currentlyShadowBox = shadowBox;

    // We expand the rectangle for two reasons. 
    // 1) we want to expand it by the width of the stroke, so that when we draw out outline, it doesn't overlap our
    // content.
    // 2) We want to leave a little extra room around the content for aesthetic reasons.
    rect = expandRect(rect, 8);
    var x = rect.left;
    var y = rect.top;
    var width = rect.width;
    var height = rect.height;

    var veilWidth = veil.style.width.replace("px", "");
    var veilHeight = veil.style.height.replace("px", "");

    inner.className = inner.className.replace(/\s*evernoteShadowBox/g, "");
    veil.className = inner.className.replace(/\s*evernoteShadowBox/g, "");
    if (shadowBox) {
      inner.className += " evernoteShadowBox";
      veil.className += " evernoteShadowBox";
    }

    inner.style.display = "block";
    veil.style.borderLeftWidth = Math.max(x, 0) + "px";
    veil.style.borderTopWidth = Math.max(y, 0) + "px";
    veil.style.borderRightWidth = Math.max((veilWidth - x - width), 0) + "px";
    veil.style.borderBottomWidth = Math.max((veilHeight - y - height), 0) + "px";
  }

  function revealStaticRect(rect, elt, shadowBox) {
    revealRect(rect, elt, true, shadowBox);
  }

  function outlineElement(element, scrollTo, shadowBox, articleAdjustment) {
    // See notes in Preview.js for why we use this method instead of just calling element.getBoundingClientRect().
    var rect = contentPreview.computeDescendantBoundingBox(element);
    if (rect) {
      reset(articleAdjustment);
      revealRect(rect, element, true, shadowBox);
      if (scrollTo) {
        element.scrollIntoView(true);
      }
      hideElements("embed", element);
      // show the bottom set of expand/contract buttons on the bottom if the
      // article is longer than the window's height
      topExpandContract.className += " evernoteUsingExpandContract";
      if (rect.height > window.innerHeight) {
        bottomExpandContract.className += " evernoteUsingExpandContract";
      } else {
        bottomExpandContract.className = bottomExpandContract.className.replace(/\s*evernoteUsingExpandContract/g, "");
      }
      show();
    }
    else {
      log.warn("Couldn't create rectangle from element: " + element.cloneNode(false).outerHTML);
    }
  }

  function hideElements (tagName, exceptInElement) {
    var els = document.getElementsByTagName(tagName);
    for (var i = 0; i < els.length; i++) {
      els[i].enSavedVisibility = els[i].style.visibility;
      els[i].style.visibility = "hidden";
    }
    showElements(tagName, exceptInElement);
  }

  function showElements (tagName, inElement) {
    if (!inElement) {
      inElement = document;
    }
    var els = inElement.getElementsByTagName(tagName);
    for (var i = 0; i < els.length; i++) {
      if (typeof els[i].enSavedVisibility !== "undefined") {
        els[i].style.visibility = els[i].enSavedVisibility;
        delete els[i].enSavedVisibility;
      }
    }
  }

  function getElement() {
    return veil;
  }

  function setPageCount(count) {
    if (!count) {
      pageCounter.innerText = "";
    } else if (count == 1) {
      pageCounter.innerText = Browser.i18n.getMessage("oneMorePageFound");
    } else {
      pageCounter.innerText = Browser.i18n.getMessage("morePagesFound", [ count ]);
    }
    pageCounter.scrollIntoView(true);
  }

  // If we're currently showing a rectangle, and it's not static, we'll redraw on scroll.
  window.addEventListener("scroll", function(e) {
    if (currentlyShownRect && !currentlyStatic) {
      var rect = {
        top: currentlyShownRect.top,
        bottom: currentlyShownRect.bottom,
        left: currentlyShownRect.left,
        right: currentlyShownRect.right,
        width: currentlyShownRect.width,
        height: currentlyShownRect.height
      };

      var vert = document.body.scrollTop - currentRectOffsetTop;
      var horiz = document.body.scrollLeft - currentRectOffsetLeft;

      if (!vert && !horiz) {
        return;
      }

      rect.top -= vert;
      rect.bottom -= vert;
      rect.left -= horiz;
      rect.right -= horiz;

      blank();
      revealRect(rect, currentlyShownElt);
    }
  });

  window.addEventListener("resize", function(e) {
    if (currentlyShownElt) {
      var rect = contentPreview.computeDescendantBoundingBox(currentlyShownElt);
      if (rect) {
        blank();
        if (currentlyShadowBox) {
          revealRect(rect, currentlyShownElt, true, true);
        } else {
          revealRect(rect, currentlyShownElt, true, false);
        }
      }
    }
  });

  // this is called when the page itself changes
  window.addEventListener("DOMSubtreeModified", function(e) {
    if (currentlyShownElt) {
      if (currentlyShownElt.contains(e.srcElement)) {
        var rect = contentPreview.computeDescendantBoundingBox(currentlyShownElt);
        if (rect) {
          blank();
          if (currentlyShadowBox) {
            revealRect(rect, currentlyShownElt, true, true);
          } else {
            revealRect(rect, currentlyShownElt, true, false);
          }
        }
      }
    }
  });

  // Public API:
  this.reset = reset;
  this.show = show;
  this.gray = gray;
  this.getElement = getElement;
  this.hide = hide;
  this.isHidden = isHidden;
  this.revealRect = revealRect;
  this.revealStaticRect = revealStaticRect;
  this.outlineElement = outlineElement;
  this.expandRect = expandRect;
  this.setPageCount = setPageCount;

  Object.preventExtensions(this);
}


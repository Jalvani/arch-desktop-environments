function Clipper() {
  var serializer = new HtmlSerializer();
  var element, rangeObject, style, callback;
  var emailHTML;

  Browser.addMessageHandlers({
    clipFullPage: msgHandlerClipFullPage,
    // clipArticle: msgHandlerClipArticle,
    clipSelection: msgHandlerClipSelection,
    clipImage: msgHandlerClipImage,
    clipPdf: msgHandlerClipPdf,
    clipUrl: msgHandlerClipUrl
    // finishPdfDownload: msgHandlerFinishPdfDownload,
    // clipEmail: msgHandlerClipEmail,
  });

  function clipArticle(keepStyle, complete) {
    function _callback(html) {
      // convert the images with http/https urls to dataurl form. it's faster
      // to extract them from the <img> elements here than in the background.
      // this only works for images that have the same domain as the web page.
      // the ones without the same domain will be handled with an XHR in the
      // background which is faster than the img/canvas approach used here.
      html = loadSameSiteImages(el, html);
      // get the width of the selected area and force the clip to be that width
      // so it looks like the original page
      complete(html, window.getComputedStyle(el).width);
    }

    function __callback(html) {
      htmlSoFar += html;
      if (currentPage < additionalPages.length) {
        kickoffSerializer(additionalPages[currentPage++], null, keepStyle, __callback);
      } else {
        _callback(htmlSoFar);
      }
    }

    var el;
    var additionalPages = pageInfo.getAdditionalPages();
    var currentPage = 0;
    var htmlSoFar = "";
    try {
      // ContentPreview should have already done this work, and potentially nudged it around somewhere.
      el = contentPreview.getArticleElement();
      if (el) {
        kickoffSerializer(el, null, keepStyle, __callback);
        return;
      }
    }
    catch (e) {
      log.warn("Couldn't get preview from contentPreview. Trying pageInfo.");
    }

    try {
      function proxy(article) {
        el = article;
        kickoffSerializer(el, null, keepStyle, __callback);
      }
      pageInfo.getDefaultArticle(proxy);
      return;
    }
    catch (e) {
      log.warn("Couldn't get article from pageInfo. Trying default.");
    }
    el = document.body;
    kickoffSerializer(el, null, keepStyle, __callback);
  }

  function clipFullPage(keepStyle, complete) {
    function _callback(html) {
      html = loadSameSiteImages(document.body, html);
      complete(html);
    }

    kickoffSerializer(document.body, null, keepStyle, _callback);
  }

  function msgHandlerClipFullPage(request, sender, sendResponse) {
    var pnk = UUID.generateGuid();
    clipResultCoordinator.showClipResult(pnk, function() {
      var portId = Browser.openPort();
      Browser.sendToExtension({
        name: "receiveNoteFilingInfo",
        noteFilingInfo: {
          title: document.title || Browser.i18n.getMessage("quickNote_untitledNote"),
          type: "pers",
          url: document.location.href
        },
        pendingNoteKey: pnk,
        userId: request.userId,
        userType: request.userType
      }, portId);
      clipFullPage(true, function(html) {
        Browser.sendToExtension({
          name: "receiveNoteContent",
          clipType: "fullPage",
          html: html,
          pendingNoteKey: pnk,
          recommendationText: pageInfo.getRecommendationText(false),
          userId: request.userId,
          userType: request.userType
        }, portId);
        contentPreview.reset();
      });
    });
  }

  function clipPdf(complete) {
    complete("<embed src=\"" + pageInfo.getPdfUrl() + "\" type=\"application/pdf\"></embed>");
  }

  function msgHandlerClipPdf(request, sender, sendResponse) {
    var pnk = UUID.generateGuid();
    clipResultCoordinator.showClipResult(pnk, function() {
      var portId = Browser.openPort();
      Browser.sendToExtension({
        name: "receiveNoteFilingInfo",
        noteFilingInfo: {
          title: document.title || Browser.i18n.getMessage("quickNote_untitledNote"),
          type: "pers",
          url: document.location.href
        },
        pendingNoteKey: pnk,
        userId: request.userId,
        userType: request.userType
      }, portId);
      clipPdf(function(html) {
        Browser.sendToExtension({
          name: "receiveNoteContent",
          clipType: "pdf",
          html: html,
          pendingNoteKey: pnk,
          recommendationText: pageInfo.getRecommendationText(false),
          userId: request.userId,
          userType: request.userType
        }, portId);
        contentPreview.reset();
      });
    });
  }

  function clipEmail(complete) {
    function _callback(html) {
      html = loadSameSiteImages(el, html);
      complete(html);
    }

    var el = contentPreview.getEmailElement();
    kickoffSerializer(el, null, true, _callback);
  }

  function clipSelection(keepStyle, selectionText, complete) {
    function _callback(html) {
      html = loadSameSiteImages(range.commonAncestorContainer, html);
      complete(html, range.commonAncestorContainer.scrollWidth + "px");
    }

    if (selectionText && document.querySelector("embed[type='application/pdf']")) {
      complete(selectionText);
      return;
    }

    var selection;
    var range;

    try {
      selection = contentPreview.ensureSelectionIsShown();
      // selection = window.getSelection();
      if (selection) {
        range = selection.getRangeAt(0);
        if (range) {
          // http://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#ranges
          if (range.commonAncestorContainer.nodeType == Node.TEXT_NODE) {
            var str = range.commonAncestorContainer.textContent.substring(range.startOffset, range.endOffset);
            complete(escapeHTML(str));
          }
          else {
            kickoffSerializer(range.commonAncestorContainer, range, keepStyle, _callback);
          }
          return;
        }
      }
    }
    catch(e) {
      complete("");
    }
  }

  function msgHandlerClipSelection(request, sender, sendResponse) {
    var pnk = UUID.generateGuid();
    clipResultCoordinator.showClipResult(pnk, function() {
      var portId = Browser.openPort();
      Browser.sendToExtension({
        name: "receiveNoteFilingInfo",
        noteFilingInfo: {
          title: document.title || Browser.i18n.getMessage("quickNote_untitledNote"),
          type: "pers",
          url: document.location.href
        },
        pendingNoteKey: pnk,
        userId: request.userId,
        userType: request.userType
      }, portId);
      clipSelection(true, request.selectionText, function(html, width) {
        Browser.sendToExtension({
          name: "receiveNoteContent",
          clipType: "selection",
          html: html,
          pendingNoteKey: pnk,
          recommendationText: pageInfo.getRecommendationText(false),
          userId: request.userId,
          userType: request.userType,
          width: width
        }, portId);
        contentPreview.reset();
      });
    });
  }

  function clipImage(url, complete) {
    complete(loadSameSiteImages(document.body, "<img src=\"" + url + "\" />", true));
  }

  function msgHandlerClipImage(request, sender, sendResponse) {
    var pnk = UUID.generateGuid();
    clipResultCoordinator.showClipResult(pnk, function() {
      var portId = Browser.openPort();
      Browser.sendToExtension({
        name: "receiveNoteFilingInfo",
        noteFilingInfo: {
          title: document.title || Browser.i18n.getMessage("quickNote_untitledNote"),
          type: "pers",
          url: document.location.href
        },
        pendingNoteKey: pnk,
        userId: request.userId,
        userType: request.userType
      }, portId);
      clipImage(request.imageUrl, function(html) {
        Browser.sendToExtension({
          name: "receiveNoteContent",
          clipType: "image",
          html: html,
          pendingNoteKey: pnk,
          recommendationText: pageInfo.getRecommendationText(false),
          userId: request.userId,
          userType: request.userType
        }, portId);
        contentPreview.reset();
      });
    });
  }

  function clipUrl(complete) {
    var html = contentPreview.getUrlElement(function(html) {
      complete(html);
    });
    if (html) {
      complete(html);
    }
  }

  function msgHandlerClipUrl(request, sender, sendResponse) {
    var pnk = UUID.generateGuid();
    clipResultCoordinator.showClipResult(pnk, function() {
      var portId = Browser.openPort();
      Browser.sendToExtension({
        name: "receiveNoteFilingInfo",
        noteFilingInfo: {
          title: document.title || Browser.i18n.getMessage("quickNote_untitledNote"),
          type: "pers",
          url: document.location.href
        },
        pendingNoteKey: pnk,
        userId: request.userId,
        userType: request.userType
      }, portId);
      clipUrl(function(html) {
        Browser.sendToExtension({
          name: "receiveNoteContent",
          clipType: "url",
          html: html,
          pendingNoteKey: pnk,
          recommendationText: pageInfo.getRecommendationText(false),
          userId: request.userId,
          userType: request.userType
        }, portId);
        contentPreview.reset();
      });
    });
  }

  function clipClearly(clearlyPagesElt, clearlyWindow, complete) {
    function _callback(html) {
      html = loadSameSiteImages(clearlyPagesElt, html);
      complete(html);
    }

    // port of Clearly's getCleanHTML function in highlight.js, but with node
    // elements instead of html string
    var tempElt = clearlyPagesElt.cloneNode(true);
    var sups = tempElt.querySelectorAll("sup");
    for (var i = 0; i < sups.length; i++) {
      sups.item(i).parentNode.removeChild(sups.item(i));
    }
    var spans = tempElt.querySelectorAll("span");
    for (var i = 0; i < spans.length; i++) {
      spans.item(i).parentNode.removeChild(spans.item(i));
    }
    var highDelBtns = tempElt.querySelectorAll("a." + clearlyWindow.ClearlyComponent__highlight.settings.highlightElementDeleteCSSClass);
    for (var i = 0; i < highDelBtns.length; i++) {
      highDelBtns.item(i).parentNode.removeChild(highDelBtns.item(i));
    }
    var highElts = tempElt.querySelectorAll("em." + clearlyWindow.ClearlyComponent__highlight.settings.highlightElementCSSClass);
    for (var i = 0; i < highElts.length; i++) {
      highElts.item(i).outerHTML = "<highlight>" + highElts.item(i).innerHTML + "</highlight>";
    }
    // highElts = tempElt.querySelectorAll("highlight");
    // var highEltGroups = [];
    // var startNewGroup = false;
    // for (var i = 0; i < highElts.length; i++) {
    //   if (i == 0) {
    //     highEltGroups.push([i]);
    //     continue;
    //   }
    //   if (highElts.item(i).nextSibling && highElts.item(i).nextSibling.nodeType == Node.TEXT_NODE
    //     && highElts.item(i).nextSibling.textContent.trim() == ""
    //     && highElts.item(i).nextSibling.nextSibling
    //     && highElts.item(i).nextSibling.nextSibling.nodeName == "HIGHLIGHT") {
    //       if (startNewGroup) {
    //         highEltGroups.push([i+1]);
    //       } else {
    //         highEltGroups[highEltGroups.length - 1].push(i+1);
    //       }
    //       startNewGroup = false;
    //   } else {
    //     
    //   }
    // }
    kickoffSerializer(tempElt, null, false, _callback, clearlyWindow);
  }

  // function populate(n) {
  //   if (n) {
  //     note = n;
  //   }
  //   else note = {};
  //   if (!note.url) {
  //     note.url = document.location.href;
  //   }
  //   if (!note.title) {
  //     note.title = document.title;
  //   }
  // }

  function kickoffSerializer(_element, _rangeObject, _style, _callback, _window) {
    element = _element;
    rangeObject = _rangeObject;
    style = _style;
    callback = _callback;

    if (_window) { // don't serialize iframes if it's clearly
      serializer.serialize(element, rangeObject, style, callback, null, _window);
    } else {
      function handleFrames(frameData) {
        serializer.serialize(element, rangeObject, style, callback, frameData);
      }
      try {
        serializeFrames(handleFrames);
      } catch(e) {
        log.error("serializeFrames failed");
      }
    }
  }

  function loadSameSiteImages(el, html, naturalSize) {
    var imgs = el.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs.item(i);
      // <img src /> returns the page's url for img.src instead of blank
      if (img.getAttribute("src") && img.getAttribute("src").trim() != "" && /^https?:\/\//.test(img.src)) {
        var imgDomain = /^(https?:\/\/.[^\/]+)\/?/.exec(img.src)[1];
        var pageDomain = /^(https?:\/\/.[^\/]+)\/?/.exec(document.location.href)[1];
        if (imgDomain == pageDomain) {
          var canvas = document.createElement("canvas");
          if (naturalSize) {
            canvas.width = img.naturalWidth || 1;
            canvas.height = img.naturalHeight || 1;
          } else {
            canvas.width = img.width || 1;
            canvas.height = img.height || 1;
          }
          var ctx = canvas.getContext("2d");
          if (img.naturalWidth || img.naturalHeight) {
            // image loaded with a 200
            if (naturalSize) {
              ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
            } else {
              ctx.drawImage(img, 0, 0, img.width, img.height);
            }
            try {
              if (/\.jpe?g$/.test(img.src)) {
                html = html.replace(img.src, canvas.toDataURL("image/jpeg"));
              } else {
                html = html.replace(img.src, canvas.toDataURL("image/png"));
              }// TODO gif
            } catch(err) {
              // need to try-catch this because even though an image passed the
              // cross-origin check, it could still be redirect to something
              // that's out of this domain. 18 is the right securityexception
              if (err.code != 18) {
                throw err;
              }
            }
          }
        }
      }
    }
    return html;
  }

  function start(notify) {
    if (notify) clipResult.startClip(note);
  }

  // function msgHandlerClipFullPage(request, sender, sendResponse) {
  //   populate(request.note);
  //   start(request.notify);
  //   kickoffSerializer(document.body, null, request.keepStyle, complete);
  // }

  // function msgHandlerClipArticle(request, sender, sendResponse) {
  //   populate(request.note);
  //   start(request.notify);
  // 
  //   var el;
  //   try {
  //     // ContentPreview should have already done this work, and potentially nudged it around somewhere.
  //     el = contentPreview.getArticleElement();
  //     if (el) {
  //       kickoffSerializer(el, null, request.keepStyle, complete);
  //       return;
  //     }
  //   }
  //   catch (e) {
  //     console.warn("Couldn't get preview from contentPreview. Trying pageInfo.");
  //   }
  // 
  //   try {
  //     function proxy(article) {
  //       kickoffSerializer(article, null, request.keepStyle, complete);
  //     }
  //     pageInfo.getDefaultArticle(proxy);
  //     return;
  //   }
  //   catch (e) {
  //     console.warn("Couldn't get article from pageInfo. Trying default.");
  //   }
  //   kickoffSerializer(document.body, null, request.keepStyle, complete);
  // }

  // function msgHandlerClipSelection(request, sender, sendResponse) {
  //   populate(request.note);
  //   start(request.notify);
  //   buildSelection(request.keepStyle, request.selectionText);
  // }

  // function msgHandlerClipPdf(request, sender, sendResponse) {
  //   populate(request.note);
  //   start(request.notify);
  //   // instead of clipping/downloading the pdf here and transmitting it to the
  //   // background, which takes a non-trivial amount of time, tell the
  //   // background to download it, then alert us when it has done.
  //   Browser.sendToExtension({name: "downloadPdf", url: request.note.pdf});
  // }

  // function msgHandlerFinishPdfDownload(request, sender, sendResponse) {
  //   complete("");
  // }

  // @TODO: Duplicated in HtmlSerializer. Consolidate.
  function escapeHTML(str){ 
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    return str;
  }

  // function buildSelection(keepStyle, selectionText) {
  //   if (selectionText) {
  //     if (document.querySelector("embed[type='application/pdf']")) {
  //       complete(selectionText);
  //       return;
  //     }
  //   }
  // 
  //   var str = "";
  //   try {
  //     var selection = window.getSelection();
  //     var range;
  //     if (selection) { 
  //       range = selection.getRangeAt(0);
  //       if (range) {
  //         // http://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#ranges
  //         if (range.commonAncestorContainer.nodeType == Node.TEXT_NODE) {
  //           str = range.commonAncestorContainer.textContent.substring(range.startOffset, range.endOffset);
  //           complete(escapeHTML(str));
  //         }
  //         else {
  //           serializer.serialize(range.commonAncestorContainer, range, keepStyle, complete);
  //         }
  //         return;
  //       }
  //     }
  //   }
  //   catch(e) {
  //     complete("");
  //   }
  // }

  // function complete(str) {
    // note.content = "<br><div style='position: relative'>" + str + "</div><br>";
    // clipResult.waitComplete();
    // callback("<br><div style='position: relative'>" + str + "</div><br>");
    // Browser.sendToExtension({name: "clipComplete", note: note});
  // }

  this.clipArticle = clipArticle;
  this.clipEmail = clipEmail;
  this.clipImage = clipImage;
  this.clipFullPage = clipFullPage;
  this.clipPdf = clipPdf;
  this.clipSelection = clipSelection;
  this.clipUrl = clipUrl;
  this.clipClearly = clipClearly;
  Object.preventExtensions(this);
}

Object.preventExtensions(Clipper);

(function() {
  try {
    urls = {};
    anchors = document.getElementsByTagName('a');
    for (i=0; i<anchors.length; i++) {
      a = anchors[i];
      title = a.title;
      if (title == null || title == '') {
        title = a.textContent;
      }
      urls[a.href] = title;
    }   
    return {"urls": urls};
  } catch(e) {
    return {"error": e.message + "\n" + e.stack, "urls" : {}};
  }
})();

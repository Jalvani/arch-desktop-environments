function getAsins(hump, callback) {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.executeScript(tab.id, {file: "content_script.js"}, function(response) {
      response = response[0];
      if (typeof response["error"] != "undefined") {
        hump.asins_scrape_error = response.error;
      }
      hump.add_url_list(response.urls)
      callback(hump, tab);
      return true;
    });
  });
}

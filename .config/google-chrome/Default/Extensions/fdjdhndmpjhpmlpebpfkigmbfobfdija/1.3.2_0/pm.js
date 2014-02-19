var bookmarklet = "http://app.personalized-media.com/app.js?id=M2G_CHROME&_BUTTON_STARTATONCE=true";


var manifest = chrome.app.getDetails(),
    version = localStorage.getItem("version"),
    enabled = true;

if (version !== manifest.version) {
    localStorage.setItem("version", manifest.version);
    chrome.tabs.create({
        url: "http://www.goasterisk.com/how-to-use-asterisk/"
    });
}


chrome.browserAction.setIcon({
    path: {
        19: "icon19.png",
        38: "icon38.png"
    }
});

enabled && chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
        if (!tab.url || /^chrome/.test(tab.url))
            return;

        chrome.tabs.executeScript(tab.id, {
            code: "(function(){var s=document.createElement('script');s.setAttribute('type','text/javascript');s.setAttribute('src','"+bookmarklet+"');document.documentElement.appendChild(s);})();"
        });
    });
});

chrome.webNavigation.onCompleted.addListener(function(info) {
    if (enabled && 0 === info.frameId) // only for main tab window
        chrome.tabs.executeScript(info.tabId, {
            code: "(function(){var s=document.createElement('script');s.setAttribute('type','text/javascript');s.setAttribute('src','"+bookmarklet+"');document.documentElement.appendChild(s);})();"
        });
});

chrome.browserAction.onClicked.addListener(function(tab) {
    enabled = !enabled;

    if (enabled) {
        chrome.browserAction.setIcon({
            path: {
                19: "icon19.png",
                38: "icon38.png"
            }
        });

        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
                if (!tab.url || /^chrome/.test(tab.url))
                    return;

                chrome.tabs.executeScript(tab.id, {
                    code: "(function(){if(document.getElementById('wikifier-root-control')){var evt=document.createEvent('Events');evt.initEvent('LinkerEnable', true, true);window.dispatchEvent(evt);}else{var s=document.createElement('script');s.setAttribute('type','text/javascript');s.setAttribute('src','"+bookmarklet+"');document.documentElement.appendChild(s);}})();"
                });
            });
        });
    } else {
        chrome.browserAction.setIcon({
            path: {
                19: "icon19_disabled.png",
                38: "icon38_disabled.png"
            }
        });

        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
                if (!tab.url || /^chrome/.test(tab.url))
                    return;

                chrome.tabs.executeScript(tab.id, {
                    code: "(function(){var evt=document.createEvent('Events');evt.initEvent('LinkerDisable', true, true);window.dispatchEvent(evt);})();"
                });
            });
        });
    }
});

// Copyright RescueTime, Inc.

// Require RescueTimeTimer.js


var RescueTimeUtil = {
    os: null,
    browser: null,
    browser_version: null,
    random_space: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
    random_size: 12,
    Timer: null,
    timers: {},
    _log_enabled: false,
    _log: null,
    initialize: function(Timerclass) {
        this.Timer = Timerclass;
        this.getSystem();
        this.getBrowser();	
        (function(self) {
            if (self.isFirefox()) {
                self._log = function() {
                    if (self._log_enabled) {
                        Components.classes["@mozilla.org/consoleservice;1"].
                            getService(Components.interfaces.nsIConsoleService).
                            logStringMessage(self.formatLog(Array.prototype.slice.call(arguments)));
                    }
                }
            } else { 
                self._log = function() { 
                    if (self._log_enabled) {
                        chrome.extension.getBackgroundPage().console.log(self.formatLog(Array.prototype.slice.call(arguments))); 
                    }
                }
            }
        })(this);
        return this;
    },
    formatLog: function(strings) {
        var msg =  (Date.now() / 1000 ) + " RescueTime: " + strings.join('');
        return msg;
    },
    getWindow: function() {
        if (typeof(Components) !== "undefined") {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
            var mywindow = wm.getMostRecentWindow("navigator:browser");
            return mywindow;
        } else {
            return window;
        }
    },
    getSystem: function() {
        if (this.os == null) {
            var v = this.getWindow().navigator.appVersion;
            if (v.indexOf("Windows") > -1) {
                this.os = "windows"; 
            } else if ((v.indexOf("Macintosh") > -1) || (v.indexOf("OS X") > -1)) {
                this.os = "osx";
            } else if (v.indexOf("Linux") > -1) {
                this.os = "linux";
            } else if (v.indexOf("CrOS") > -1) {
                this.os = "chromeos";
            } else {
                this.os = "unknown";
            }
        }
        return this.os;
    },
    isCrOs: function() {
        if (this.getSystem() == "chromeos") {
            return true;
        }
        return false;
    },
    getBrowser: function() {
        if (this.browser == null) {
            var v = this.getWindow().navigator.userAgent;
            if (v.indexOf("Firefox/") > -1) {
                this.browser = "firefox";
            } else if (v.indexOf("Chrome/") > -1) {
                this.browser = "chrome";
            } else if (v.indexOf("Safari/") > -1) {
                this.browser = "safari";
            } else {
                this.browser = "unknown";
            }
        }
        return this.browser;
    },
    getBrowserVersion: function() {
        if (this.browserVersion == null) {
            if (this.getBrowser() == "firefox") {
                this.browserVersion = 
		    this.getWindow().navigator.userAgent.split("Firefox/")[1];
            } else if (this.getBrowser() == "chrome") {
                this.browserVersion = 
                    this.getWindow().navigator.userAgent.split("Chrome/")[1].split(" ")[0];
            } else if (this.getBrowser() == "safari") {
                this.browserVersion = 
                    this.getWindow().navigator.userAgent.split("Version/")[1].split(" ")[0]
            }
        }
        return this.browserVersion;
    },
    isFirefox: function() { // helper because this is what we care about most often
        if (this.getBrowser() == "firefox") {
            return true;
        } else { 
            return false;
        }
    },
    isChromeFamily: function() {
        if ((this.getBrowser() == "chrome") || (this.getBrowser() == "chromium")) {
            return true;
        } else { 
            return false;
        } 
    },
    validateEmail: function(email) {
        // address validation needs real code here
        if ((email != null) && (email != "")) {
            var ats = email.split("@");
            if ((ats.length == 2) && (ats[0].length > 0) && (ats[1].length > 0)) {
                var dmn = ats[1].split(".");
                if (dmn.length > 1) {
                    return true;
                }
            }
        }
        return false;	    
    },
    safeData: function(data) {
        if (data != null) {
            if (data.length > 1024) {
                data = data.substring(0,1023);
            }
        }
        return data;
    },
    noQueryUrl: function(data) {
        if (data != null) {
            if (data.indexOf('?') > -1) {
                data = data.substring(0, data.indexOf('?'));
            }
        }
        return data;
    },
    serverOnlyUrl: function(data) {
        if (data != null) {
            if (data.indexOf('//') > -1) {
                var workingpath = data.substring(data.indexOf('//') + 2);
                if (workingpath.indexOf('/') > -1) {
                    data = data.substring(0, workingpath.indexOf('/') + data.indexOf('//') + 2);
                }
            } else if (data.indexOf('/')) {
                data = data.substring(0, data.indexOf('/'));
            }
        }
        return data;
    },
    randomString: function(size) {
        if (size == null) {
            size = this.random_size;
        }
        var charlist = new Array(size);
        var space_size = this.random_space.length;
        for (var i = 0; i < size; i++) {
            charlist[i] = this.random_space[Math.floor(Math.random() * space_size)];
        }
        return charlist.join("");
    },
    isoDate: function(dateObject) {
        if (!dateObject)
            dateObject = new Date();
        var year = dateObject.getYear();
        if (year < 2000) // Yeah, like that's gonna happen.
            year = year + 1900;
        var month = dateObject.getMonth() + 1;
        var day = dateObject.getDate();
        var hour = dateObject.getHours();
        var hourUTC = dateObject.getUTCHours();
        var minute = dateObject.getMinutes();
        var minuteUTC = dateObject.getUTCMinutes();
        var second = dateObject.getSeconds();
        if (month <= 9) month = "0" + month;
        if (day <= 9) day = "0" + day;
        if (hour <= 9) hour = "0" + hour;
        if (minute <= 9) minute = "0" + minute;
        if (second <= 9) second = "0" + second;
        //%Y-%m-%d %H:%M:%S
        var isoTime = year + '-' + month + '-' + day + " " + hour + ':' + minute + ':' + second;
        return isoTime;
    },
    cancel: function(name) {
        this._log("cancel: ", name);
        if (this.timers[name]) {
            this.timers[name].cancel();
            delete(this.timers[name]);
        }
    },
    isRunning: function(name) {
        if (this.timers[name]) {
            return true;
        }
        return false;
    },
    onInterval: function(name, callback, when) {
        this._log("onInterval setting repeater: ",name," every ",when);
        if ( this.timers[name] == null ) {
            this.timers[name] = new this.Timer(this.getBrowser(), callback, when);
            this.timers[name].repeat();
        } else {
            if (this.timers[name].handle == null) {
                this.timers[name].repeat();
            }
        }
        this._log("got timer handle: ", this.timers[name].handle);
    },
    inFuture: function(name, callback, when) { // this shit doesnt work right in firefox
        if ( this.timers[name] == null ) {
            this._log("inFuture setting once: ", name, " when: ", when);
            var self = this;
            this.timers[name] = new this.Timer(this.getBrowser(), function() {
                callback(); 
                delete(self.timers[name]);
            }, when);
            this.timers[name].once();
            this._log("got timer handle: ", this.timers[name].handle);
        } else {
            this._log("timer: ", name, " still busy: discarding new request");
        }
    },
    RequestInstance: function() {
        var request = null;
        if (this.isFirefox()) {
            request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
        } else {
            request = new XMLHttpRequest();  
        }
        return request;
    },
    getRequest: function(url, successCallback, failCallback, options) {
        var request = this.RequestInstance();
        if (! options) { options = {}; }
        if (! options["async"]) { options["async"] = true; }
        if (successCallback == null) { successCallback = function(response) {};	}
        if (failCallback == null) { failCallback = function(response) {}; }	
        this._log('getRequest : ', url);
        request.open("GET", url, options["async"]);
        if (options["timeout"]) {
            options["timeout_timer"] = "timeout get " + url;
            this.inFuture(options["timeout_timer"], function() { request.abort(); }, options["timeout"] );
        }
        if (options["async"]) {
            (function(self) {
                request.onreadystatechange = function (event) {  
                    if (request.readyState == 4) {  
                        if (request.status == 200) {
                            if (options["timeout"]) { self.cancel(options["timeout_timer"]); }
                            successCallback(request);              
                        } else {
                            failCallback(request);
                        }
                    }  
                }
            })(this);
        }
        request.send();
        if (! options["async"]) {
            if(req.status == 200) {
                if (options["timeout"]) { this.cancel("timeout_timer"); }
                successCallback(req);              
            } else {
                failCallback(req);
            }
        }
    },
    postRequest: function(urlTarget, params, fileAttach, async, successCallback, failCallback) {
        if (async == null) { async = true; }
        if (successCallback == null) { successCallback = function(response) {};	}
        if (failCallback == null) { failCallback = function(response) {}; }	
        var request = this.RequestInstance();
        var requestbody = null;
        request.open("POST", urlTarget, async);
        if (fileAttach) {
            var boundary = '----something';
            var boundarysep = '--' + boundary + '\r\n';
            var boundaryterm = '--' + boundary + '--\r\n';
            requestbody = ['\r\n'];
            for (var key in params) {
                requestbody.push('Content-Disposition: form-data; name="',key,'"\r\n\r\n',params[key],'\r\n',boundarysep);
            }
            requestbody.push('Content-Disposition: form-data; name="file"; filename="file1"\r\n',
                             'Content-Type: application/octet-stream','\r\n\r\n',
                             fileAttach,'\r\n');
            requestbody.push(boundaryterm);
            requestbody = requestbody.join('');
            request.setRequestHeader('Content-Type','multipart/form-data;charset=UTF-8; boundary=' + boundary);
        }
        else {
            requestbody = []
            for (var key in params) {
                requestbody.push([key, encodeURIComponent(params[key])].join("="));
            }
            requestbody = requestbody.join("&");
            request.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        }
        //request.setRequestHeader("Content-Length", requestbody.length);
        if (async) {
            request.onreadystatechange = function (event) {  
                if (request.readyState == 4) {  
                    if (request.status == 200)
                        successCallback(request);              
                    else
                        failCallback(request);
                }  
            }
        }
        request.send(requestbody);
        if (!async) {
            if(req.status == 200)
                successCallback(req);              
            else
                failCallback(req);
        }
    }
}

var EXPORTED_SYMBOLS = ["RescueTimeUtil"];
// I don't like burrying execution, but here ya go;
RescueTimeUtil.initialize();

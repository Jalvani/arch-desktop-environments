/*
 *
 Copyright RescueTime, Inc.
 *
 */


// require RescueTimeUtil
// require RescueTimeLocalStorage
// require RescueTimeClientConfig
// require RescueTimeEngine

var RescueTimeAPI = {
    util: null,
    config: null,
    storage: null,
    engine: null,
    client_identity: {
        client_version: "3.0.15",
        data_version: 2,
        os_id: 8,
    },
    staticIdentityParams: null,
    userAgent: null,
    asHelperOnly: false, // only grab url and assist blocking
    isActivated: false,
    blockList: null,
    waitFor: {
        config: 0,
        sendLog: 0,
        messages: 0
    },
    messageCodes: {
        ALERTS: 1,
        NEW_CONFIG: 2,
        NEW_BETA_CLIENT: 3,
        NEW_BLOCK_LIST: 4,
        NEW_SURVEY: 5
    },

    initialize: function(engine) {
        this.util = engine.util;
        this.storage = engine.storage;
        this.config = engine.config;
        this.engine = engine;
        this.engine.api = this; // May merge engine and api to one (engine) singleton; this is ugly
        this.userAgent = this.getUserAgent();
        // send any backlogged logs here
        (function(self) {
            self.util.inFuture("send_or_store_logs", self.engine.sendOrStorePendingLogsGenerator(), 5);
        })(this);
        if (this.config.shouldLogTime()) {
            this.engine.startLogPusher();
        }
        if (this.config.hasAccountKey()) {
            this.pullMessages();
            this.engine.startMessagePuller();
        }
        return this;
    },
    getUserAgent: function() {
        if (this.userAgent == null) {
            this.userAgent = ["RescueTime Client ", this.client_identity.client_version,
                              " javascript ", this.util.getSystem(),
                              " ", this.util.getBrowser(),
                              " ", this.util.getWindow().navigator.userAgent
                             ].join("");
        }
        return this.userAgent;
    },
    getStaticIdentityParams: function() {
        if (this.staticIdentityParams == null) {
            this.staticIdentityParams = {
                "os_id": this.client_identity.os_id,
                "data_version": this.client_identity.data_version,
                "client_version": this.client_identity.client_version
            };
        }
        return this.staticIdentityParams;
    },
    getIdentityParams: function() {
        var params = {};
        var statics = this.getStaticIdentityParams();
        for (key in statics) {
            params[key] = statics[key];
        }
        params["account_key"] = this.config.common.account_key;
        params["os_username"] = this.engine.os_username();
        params["computer_name"] = this.engine.computer_name();
        return params;
    },
    requestActivation: function(email, expects_account, uiCallback) {
        this.config.setConfigData("activation_email", email);
        this.util._log("will attempt activation for: ", email, " expects account: ", expects_account);
        var params = this.getStaticIdentityParams();
        params["os_username"] = this.engine.os_username();
        params["computer_name"] = this.engine.computer_name();
        params["device[os]"] = this.util.getSystem();
        params["device[browser]"] = this.util.getBrowser();
        params["device[identity]"] = this.engine.identity;
        params["email"] = email;
        params["expects_account"] = +expects_account;
        var self = this;
        var win = function(response) {
            self.util._log("request activation response: ", response.toString());
            var result = JSON.parse(response.responseText);
            self.util._log("response json: ", response.responseText);
            var status = "continue";
            var ui_result = null;
            var ui_update_callback = null;
            if (result == null) {
                ui_result = "no response, uknown error";
            } else if (result["c"][0] == 1) {
                if (result["error"] != null) {
                    ui_result = result["error"];
                    if (result["error"] == "user:taken") {
                        ui_result = "That user name is taken! (switch tabs if you are already a user)";
                    } 
                    else if (result["error"] == "user:not_found") {
                        ui_result = "We did not find a user matching that email!";
                    }
                } else {
                    ui_result = "unknown error";
                }
                status = "reload"
            } else if (result["c"][0] == 0) {
                if (result["activate_inline"] != null) {
                    self.util._log("inline activation");
                    var account_key = result["account_key"];
                    var data_key = result["data_key"];
                    self.util._log("got account key, data key: ", account_key, ",", data_key);
                    if ((account_key != null) && (data_key != null)) {
                        self.config.setCommonConfig("account_key", account_key);
                        self.config.setConfigData("data_key", data_key);
                        ui_result = "Thanks for using RescueTime!";
                        status = "reload_delayed";
                        self.pullConfig(uiCallback);
                        if (! self.engine.messagePullerRunning()) {
                            self.engine.startMessagePuller();
                        }
                    } else {
                        status ="reload_delayed";
                        ui_result = "There was a problem with activation";
                    }
                } else {
                    var activation_code = result["code"];
                    self.util._log("activation code: ", activation_code);
                    self.config.setConfigData("activation_code", activation_code);
                    if (result["url"] != null) {
                        self.config.setConfigData("activation_url", result["url"]);
                        status = "goto_activation_url";
                    }
                    if (result["new_user"] != null) {
                        self.config.setConfigData("activation_new_user", true);
                        ui_result = "New user activation in progress...";
                    } else {
                        ui_result = "Log in to complete activation...";
                    }
                    self.util._log("requestActivation scheduling future checkActivation");
                    self.util.cancel("check_activation");
                    self.util.inFuture("check_activation", function() { self.checkActivation(uiCallback); }, 5000);
                }
            }
            if (uiCallback != null) {
                uiCallback(status, ui_result, ui_update_callback);
            }
        };
        var fail = function(response) {
            self.util._log("request activation fail: ", response.toString());
            if (uiCallback != null) {
                uiCallback("fail", "total fail");
            }
        };  
        this.postUI("/device/activate/request", win, fail, params);
    },
    checkActivation: function(uiCallback) {
        var code = this.config.getConfigData("activation_code");
        var email = this.config.getConfigData("activation_email");
        var params = this.getStaticIdentityParams();
        params["os_username"] = this.engine.os_username();
        params["computer_name"] = this.engine.computer_name();
        params["device[os]"] = this.util.getSystem();
        params["device[browser]"] = this.util.getBrowser();
        params["device[identity]"] = this.engine.identity;
        params["email"] = email;
        params["activation_code"] = code;

        var self = this;
        var win = function(response) { 
            var ui_result = null;
            var reschedule = false;
            self.util._log("begin activation check for: ", code);
            self.engine.logDebug("response: " + response.responseText);
            response = JSON.parse(response.responseText);
            var status = "activation_pending";
            if (response == null) {
                // unknown hiccup
                reschedule = true;
            } else {
                if (response["error"] != null) {
                    if (response["error"] == "activation_code:not_found") {
                        self.storage.deleteData("activation_code");
                        self.util._log('deleteing activication code so we get a new one');
                        reschedule = false;
                    } 
                    self.util._log("activation error: ", response["error"]);
                } else if (response["status"] == "pending") {
                    self.util._log("activation check status is pending");
                    ui_result = "Waiting for your activation confirmation... check your email!";
                    reschedule = true;
                } else if (response["status"] == "approved") {
                    self.util.cancel("check_activation");
                    self.engine.logDebug("activation check status is approved");
                    var account_key = response["account_key"];
                    var data_key = response["data_key"];
                    self.config.setCommonConfig("account_key", account_key);
                    self.config.setConfigData("data_key", data_key);
                    self.util._log("got account key, data key: ", account_key, ",", data_key);
                    ui_result = "Activation is complete! Enjoy RescueTime.";
                    status = "reload_delayed";
                    self.pullConfig(uiCallback);
                    if (! self.engine.messagePullerRunning()) {
                        self.engine.startMessagePuller();
                    }
                }
            }
            if (uiCallback != null) {
                uiCallback(status, ui_result);
            }
            if (reschedule) {
                self.util._log("checkActivation is rescheduling check activation");
                self.util.cancel("check_activation");
                self.util.inFuture("check_activation", function() { self.checkActivation(uiCallback); }, 5000);
            }

        };
        var fail = function(response) { 
            self.util._log("failed to get response on activation check");
            if (uiCallback != null) {
                uiCallback("fail","failed an activation attempt... retrying");
            }
            self.util.inFuture("check_activation", function() { self.checkActivation(uiCallback); }, 5000);
        };
        this.postUI("/device/activate/check", win, fail, params);
    },
    hello: function() {
        var engine = this.engine;
        var helloSuccess = function(response) {
            util._log("hello success: ", response.responseText);
        };
        var helloFail = function(response) {
            util._log("hello fail: ", response.toString());
        };
        this.postAPI("/hello", helloSuccess, helloFail);
    },
    pullConfig: function(callback) {
        if (! this.config.hasAccountKey()) {
            // impossible
            return;
        }
        var now = Date.now();
        if ((now - this.waitFor.config) < 60000 ) {
            this.util._log("too soon to get config, waiting");
            return;
        }
        this.waitFor.config = now;
        var params = this.getIdentityParams();
        var self = this;
        var configSuccess = function(response) {
            self.util._log("begin config result parse");
            self.util._log("config response: ", response.responseText);
            response = JSON.parse(response.responseText);
            var status = null
            var message = null;
            if (response == null) {
                self.util._log("unknown error: null response");
            } else {
                if (response["c"][0] == 0) {
                    self.engine.logDebug("response code 0");
                    self.engine.logDebug("got config: ", response["config"]);
                    status = "noop";
                    var reset_logging_schedule = false;
                    for (var key in response["config"]) {
                        // only reload screen if config has changed
                        if (! self.config.matchesCommonConfig(key, response["config"][key])) {
                            var value_was = self.config.getCommonConfig(key);
                            var value = response["config"][key];
                            self.config.setCommonConfig(key, value);
                            self.util._log('config has changed for: ', 
                                           key, " was ", value_was, "(", typeof(value_was), ")", 
                                           " now ", value, "(", typeof(value), ")" );
                            status = "reload_delayed";
                            // reset the schedule if push interval changed
                            if (key == "push_interval") {
                                reset_logging_schedule = true;
                            }                                    
                        }
                    }
                    if (reset_logging_schedule) {
                        self.engine.stopLogPusher();
                        self.util.inFuture("send_or_store_logs", 
                                           self.engine.sendOrStorePendingLogsGenerator(), 1);
                    } // following will start it again
                    if (self.config.shouldLogTime() && (! self.engine.logPusherRunning())) {
                        self.engine.startLogPusher();
                    }
                } else if (response["c"][0] == 1) {
                    var error = response["error"];
                    if ((error != null) && (error == "Unable to find user machine")) {
                        // fatal condition, reset config
                        message = "There was a fatal error syncing your account. Reactivation required. No data is lost.";
                        self.engine.hardReset();
                    }
                    status = "reload_delayed";
                }
            }
            if (callback != null) {
                callback(status, message);
            }
        };
        var configFail = function(response) {
            self.engine.log("failed to get config");
        };
        this.postAPI("/config",  configSuccess, configFail, params);
    },
    sendLogFile: function(logFile) {
        var params = this.getIdentityParams();
        // can i figure out how to gzip?
        params['gz'] = 0;
        var self = this; 
        var sendSuccess = function(response) {
            // check success code and done
            self.util._log('response: ', response.responseText);
            // TODO getting parse error from json parser?
            response = JSON.parse(response.responseText);
            if (response == null) {
                self.engine.log("unknown error: null response, saving log");
                self.engine.saveLogFile(logFile);
            } else if (response["error"]) {
                self.engine.log("post log error: ", JSON.stringify(response));
                self.engine.saveLogFile(logFile);
            } else {
                if ((response["c"]) && (response["c"][0] == 0)) {
                    self.engine.log("response code 0, log send success");
                    self.engine.lastLogSent = Date.now();
                    self.engine.nextLogToStorageFlush = self.engine.lastLogSent + self.engine.logToStorageFlushPeriod;
                    
                } else {
                    // if fail store log
                    self.engine.logDebug("result code fail, could not send log, saving log");
                    self.util._log("response was: ", response);
                    self.engine.saveLogFile(logFile);
                }
            }
        };
        var sendFail = function(response) {
            self.engine.logDebug("https post fail, could not send log, saving log");
            self.engine.saveLogFile(logFile);
        };        
        this.postAPI("/collect", sendSuccess, sendFail, params, logFile);
    },
    pullMessages: function() {
        var params = this.getIdentityParams();
        var self = this;
        this.util._log("being pull messages");
        var success = function(response) {
            response = JSON.parse(response.responseText);
            if (response == null) {
                self.util._log("unknown error: null response");
            } else if (response["error"]) {
                self.engine.logDebug("post log error: ", response["error"]);
            } else if ((response["c"]) && (response["c"][0] == 0)) {
                self.util._log("response code 0, message received");
                var messages = response["messages"]
                if (messages != null) {
                    self.util._log("got message responses: ", messages.join(","));
                    if (messages.length > 0) {
                        var dedup = {};
                        for (var i = 0; i < messages.length; i++) {
                            if (dedup[messages[i]]) { 
                                continue;
                            }
                            dedup[messages[i]] = true;
                            self.util._log("should handle message code: ", messages[i]);
                            if (self.messageCodes.NEW_CONFIG == messages[i]) {
                                self.waitFor.config = 0;
                                self.pullConfig();
                            } else if (self.messageCodes.ALERTS == messages[i]) {
                                self.pullAlerts();
                            }
                        }
                    }
                }
            }
        };
        var fail = function(response) {
            self.engine.logDebug("fatal error getting client messages");
        };
        this.postAPI("/messages", success, fail, params);
    },
    pullAlerts: function() {
        this.util._log("pull alerts message handler");
        // needs to bubble some events to be visible if possible
        // get alerts
    },
    getGetUrl: function(path, paramstring) {
        // path expects preceding "/"
        var url = [this.config.protocol,this.config.common.ui_url,path,"?",paramstring].join("");
        return url;
    },
    postAPI: function(path, successCallback, failCallback, params, multipartfile) {
        return this.post(this.config.common.url, path, successCallback, failCallback, params, multipartfile);
    },
    postUI: function(path, successCallback, failCallback, params, multipartfile) {
        return this.post(this.config.common.ui_url, path, successCallback, failCallback, params, multipartfile);
    },
    post: function(service, path, successCallback, failCallback, params, multipartfile) {
        var url = [this.config.protocol,service,path].join('');
        if (params == null) { params = {}; }
        params["format"] = "json";
        if (this.engine.debug) {
            var debugparams = [];
            for (var key in params) {
                debugparams.push(key + "=" + params[key]);
            }
            this.util._log("params: ", debugparams.join(" "));
        }
        var self = this;
        var duration = Date.now();
        var benchmarkedSuccess = function(response) {
            duration = Date.now() - duration;
            if (successCallback != null) {
                if (self.engine.debug) {
                    self.engine.logDebug("[" + duration + "ms] for: " + url);
                }
                return successCallback(response);
            }
        };
        this.util.postRequest(url, params, multipartfile, true, 
                              benchmarkedSuccess, failCallback);
    }
};

var EXPORTED_SYMBOLS = ["RescueTimeAPI"];

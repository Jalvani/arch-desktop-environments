// assume RTlib has been linked prior to execution
var RescueTimePopover = {
    initialized: false,
    lastMessage: "(no message)",
    api: null,
    disableUI: false,
    hooksRegistered: {},
    currentScreen: null,
    lastDashboardUrl: null,

    initialize: function(myapi) {
        if (this.initialized) { return this; }
        this.api = myapi;
        this.api.util._log("RescueTimePopover intialize");
        (function(self) { RescueTimeJq("#rt_popover_close").click(function() { 
            self.api.util._log("close hook running");
            self.closePopover(); 
        }) })(this);
        this.navHooks();
        this.accountPanelHooks();
        this.pausePanelHooks();
        this.helpPanelHooks();
        this.debugHooks();
        this.initialized = true;
        return this;
    },
    displayMessage: function(message) {
        if (message != null) {
            this.lastMessage = message;
        }
        RescueTimeJq("#rt_popover_message_span").text(this.lastMessage);
        RescueTimeJq("#rt_popover_messages").show();
    },
    warning: function(message) {
        RescueTimeJq("#rt_popover_message_span").addClass('warning');
        RescueTimeJq("#rt_popover_message_span").removeClass('notice');
        this.displayMessage(message);
    },
    notice: function(message) {
        RescueTimeJq("#rt_popover_message_span").addClass('notice');
        RescueTimeJq("#rt_popover_message_span").removeClass('warning');
        this.displayMessage(message);
    },
    debug: function() {
        return (this.api.engine.debug);
    },
    closePopover: function() { 
        this.api.util._log("RescueTimePopover.closePopover");
        this.api.util.cancel("debug_refresh");
        if (this.api.util.isFirefox()) {
            this.api.util.getWindow().document.getElementById("rescuetime-firefox-panel-popover").hidePopup();
        } else {
            this.api.util._log("close popover window");
            window.close();
        }
    },
    load: function() {
        this.api.engine.logDebug("entered popover load hook");
        if (this.api.util.isFirefox()) {
            var panel = RescueTimeJq("#rescuetime-firefox-panel");
            if (panel == null) {
                this.api.util._log("firefox: panel is not loaded yet, not loading ui");
            } else if (panel.collapsed == false) {
                this.api.util._log("firefox: panel is collapsed not loading ui");
                return;
            }
        }	    
        if (this.disableUI) {
            RescueTimeJq("#rt_popover_app_container").hide();
            RescueTimeJq("#rt_popover_no_app").show();
        } else {
            if (this.api.config.hasAccountKey()) {
                this.api.engine.logDebug("we have an activated system");
                this.setScreen("dashboard");
                this.api.pullConfig(this.panelStatusCallbackGenerator());
            } else {
                this.enableActivationButtons();
                this.api.engine.logDebug("we do not have an activated system");
                this.setScreen("account");
            }
        }
        if (this.api.engine.isInsideLoggingSchedule()) {
            RescueTimeJq("#rt_popover_logging_schedule").hide();
        } else {
            RescueTimeJq("#rt_popover_logging_schedule").show();
        }
        if (this.api.engine.isPaused()) {
            RescueTimeJq("#rt_popover_nav_pause").text("Paused: click to unpause");
            RescueTimeJq("#rt_popover_nav_pause").addClass("warning");
        } else {
            RescueTimeJq("#rt_popover_nav_pause").text("Pause");
            RescueTimeJq("#rt_popover_nav_pause").removeClass("warning");
        }

    },
    setScreen: function(selected) {
        (function(self) { 
            var screens = {
                "dashboard" : { show: function() { self.drawDashboardPanel(); },
                                hide: function() { RescueTimeJq("#rt_popover_dashboard_panel").hide() } },
                "account" : { show: function() { self.drawAccountPanel(); }, 
                              hide: function() { RescueTimeJq("#rt_popover_account_panel").hide(); } },
                "help": { show: function() { self.drawHelpPanel(); },
                          hide: function() { RescueTimeJq("#rt_popover_help_panel").hide(); } },
                "pause": { show: function() { self.drawPausePanel(); },
                           hide: function() { RescueTimeJq("#rt_popover_pause_panel").hide(); } }
            };
            
            // if the nav is hidden and the account key exists, show it.
            if (self.api.config.hasAccountKey()) {
                RescueTimeJq("#rt_popover_nav_with_account:hidden").show();
            }
            
            if (! self.api.config.hasAccountKey()) {
                
                // also hide the nav in the top corner if there's no account.
                RescueTimeJq("#rt_popover_nav_with_account").hide();
                
                if (selected == "dashboard") {
                    selected = "account";
                } else if (selected == self.currentScreen) {
                    selected = "account";
                }
            } else if (selected == self.currentScreen) {
                // reclick acts like screen close, default back to dashboard
                selected = "dashboard";
            }
            for (var screen in screens) {
                if (selected == screen) {
                    screens[screen].show();
                    self.currentScreen = screen;
                } else {
                    screens[screen].hide();
                }
            }
        })(this);
    },
    panelStatusCallbackGenerator: function() {
        var self = this;
        var callback = function(action, message, extraCallback) {
            if (message != null) {
                self.notice(message);
            }
            if (extraCallback != null) {
                self.api.util._log('executing extra callback');
                extraCallback();
            }
            if (action != null) {
                if (action == "reload") {
                    self.load();
                } else if (action == "reload_delayed") {
                    self.api.util.inFuture("popover_reload", function() { 
                        self.api.util._log("executing popover reload");
                        self.load(); 
                    }, 1000);
                } else if (action == "goto_activation_url") {
                    self.closePopover();
                    self.openUrlInTab(self.api.config.getConfigData("activation_url") + 
                                      "?from=extension&activation_email=" + 
                                      encodeURIComponent(self.api.config.getConfigData("activation_email")));
                }
                // noop no need to match
            }
        };
        return callback;
    },
    drawAccountPanel: function() {
        if (this.api.config.hasAccountKey()) {
            var email = this.api.config.getConfigData("activation_email");
            RescueTimeJq("#rt_popover_account_panel_activation").hide();
            RescueTimeJq("#rt_popover_account_panel_active").show();
            if ((this.api.config.getSetting("plan_id") == 1)
                || (this.api.config.getSetting("premium_enabled") == false)) {
                RescueTimeJq("#rt_popover_account_upgrade").show();
            }
            if (this.api.engine.isLoggingDisabledLocally()) {
                RescueTimeJq("#disable-plugin-logging").attr('checked', 'checked');
            } 
            if (this.api.config.asBoolean(this.api.config.getConfigData("data_include_weekends"))) {
                RescueTimeJq("#daily-average-include-weekend").attr('checked', 'checked');  
            }
            if (this.api.util.isCrOs()) {
                RescueTimeJq("#rescuetime-settings-disable-logging").hide();
            }
            RescueTimeJq("#rt_popover_account_registered_as").text(' for ' + email);
        } else {
            RescueTimeJq("#rt_popover_account_panel_active").hide();
            RescueTimeJq("#rt_popover_account_panel_activation").show();
            var email = this.api.config.getConfigData("activation_email");
            var code = this.api.config.getConfigData("activation_code");
            if (email != null) {
                RescueTimeJq("#rt_popover_account_email").val(email);
            }
            var popover = this;
            if (code != null) {
                this.notice("Checking up on activation for: " + email);
                this.api.util._log("re-checking activiation due to panel load");
                var uiCallback = this.panelStatusCallbackGenerator();
                this.api.util.cancel("check_activation");
                (function(self){
                    self.api.util.inFuture("check_activation", function() { self.api.checkActivation(uiCallback); }, 50);
                })(this);
            }
        }
        RescueTimeJq("#rt_popover_account_panel").show();
    },
    drawDashboardPanel: function() {
        RescueTimeJq("#rt_popover_dashboard_panel").show();
        this.api.util._log("should show dashboard");
        var dashboard_local_url = "dashboard-local.html";
        var dashboard_offline_url = "dashboard-offline.html";
        var dashboard_remote_url = this.getPopoverDashboardUrl();
        this.api.util._log('dashboard_remote_url: ', dashboard_remote_url);
        var test_connection_url = this.api.getGetUrl('/hello');
        if (this.api.util.isFirefox()) {
            dashboard_local_url = "chrome://rescuetime_firefox/skin/dashboard-local.html";
        }
        (function(self) {
            self.api.util._log("getting remote dash: ", dashboard_remote_url);
            var success = function(response) {
                self.lastDashboardUrl = dashboard_remote_url;
                self.api.util._log("will show remote dash: ", dashboard_remote_url);        
                RescueTimeJq("#rt_popover_dashboard_iframe").attr("src", dashboard_remote_url);	        
            };
            var fail = function(fail) {
                self.lastDashboardUrl = dashboard_offline_url;
                self.api.util._log("will show local dash: ", dashboard_offline_url);
                // in the future we could distinguish between offline and RescueTime timeout
                // right now it treats them the same
                RescueTimeJq("#rt_popover_dashboard_iframe").attr("src", dashboard_offline_url);	        
            };
            // let them spin for 10 seconds or give up
            self.api.util.getRequest(test_connection_url, success, fail, { "timeout" : 10000 } );
        })(this);
    },
    drawPausePanel: function() {
        if (this.api.engine.isPaused()) {
        } else {
            RescueTimeJq("#rt_popover_pause_panel").show();
        }
    },
    drawHelpPanel: function() {
        RescueTimeJq("#rt_popover_help_panel").show();
        if (RescueTimeJq("#rt_popover_help_panel").is(":visible")) {
            RescueTimeJq("#rt_popover_help_email").hide();
            RescueTimeJq("#rt_popover_help_main").show();
        }  
    },
    enableActivationButtons: function() {
        RescueTimeJq("#rt_popover_account_needs").prop("disabled", false);
        RescueTimeJq("#rt_popover_account_has").prop("disabled", false);
    },
    disableActivationButtons: function() {
        RescueTimeJq("#rt_popover_account_needs").prop("disabled", true);
        RescueTimeJq("#rt_popover_account_has").prop("disabled", true);
    },
    navHooks: function() {
        if (this.hooksRegistered['navHooks']) {
            return;
        }
        (function(self) {
            RescueTimeJq("#rt_popover_nav_dashboard, #rt_popover_nav_more_stats").click(function() {
                if (self.api.config.hasAccountKey()) {
                    if (self.currentScreen == "dashboard") {
                        self.openUrlInTab(self.api.getGetUrl('/dashboard',
                                                             'from=extension&activation_email='+ encodeURIComponent(self.api.config.getConfigData("activation_email"))));
                    } else {
                        self.setScreen("dashboard");
                    }
                } else {
                    self.setScreen("account");
                }
            });
            RescueTimeJq("#rt_popover_nav_account").click(function() {
                self.setScreen("account");
            });
            // don't show the pause tab if we're not doing local logging
            if (self.api.engine.isLoggingDisabledLocally()) {
                RescueTimeJq("#rt_popover_nav_pause").hide();
                RescueTimeJq("#rt_popover_nav_pause_spacer").hide();
            }
            RescueTimeJq("#rt_popover_nav_pause").click(function() {
                if (self.api.engine.isPaused()) {
                    self.api.engine.unPause();
                    self.closePopover();
                } else {
                    self.setScreen("pause");
                }
            });
            RescueTimeJq("#rt_popover_nav_help").click(function() {
                self.drawHelpPanel();
                self.setScreen("help");
            });
        })(this);
    },
    accountPanelHooks: function() {
        (function(self) {
            RescueTimeJq("#rt_popover_account_settings_account").click(function() {
                self.openUrlInTab(self.api.getGetUrl('/users/settings',
                                                     'from=extension&activation_email='+ encodeURIComponent(self.api.config.getConfigData("activation_email"))));
            });
            RescueTimeJq("#rt_popover_account_registered_as").click(function() {
                self.openUrlInTab(self.api.getGetUrl('/users/settings',
                                                     'from=extension&activation_email='+ encodeURIComponent(self.api.config.getConfigData("activation_email"))));
            });
            RescueTimeJq("#rt_popover_account_settings_monitoring").click(function() {
                self.openUrlInTab(self.api.getGetUrl('/accounts/monitoring_options',
                                                     'from=extension&activation_email='+ encodeURIComponent(self.api.config.getConfigData("activation_email"))));
            });
            RescueTimeJq("#rt_popover_account_forget").click(function() {
                RescueTimeJq("#rt_popover_account_forget_confirm").show();
            });
            RescueTimeJq("#rt_popover_account_forget_ok").click(function() {
                self.api.engine.logDebug("Resetting configuration!");
                RescueTimeJq("#rt_popover_account_forget_confirm").hide();
                self.api.engine.hardReset(function() { self.setScreen("account"); });
            });
            RescueTimeJq("#rt_popover_account_forget_cancel").click(function() {
                RescueTimeJq("#rt_popover_account_forget_confirm").hide();
            });
            RescueTimeJq("#rt_popover_account_needs").click(function() {
                self.initiateActivation("needs");
            });
            RescueTimeJq("#rt_popover_account_has").click(function() {
                self.initiateActivation("has");
            });
            RescueTimeJq("#rt_popover_account_upgrade_now").click(function() {
                self.openUrlInTab(self.api.getGetUrl('/upgrade',
                                                     'from=extension&activation_email='+ encodeURIComponent(self.api.config.getConfigData("activation_email"))));
            });
            RescueTimeJq("#activate-tabs LI").click(function() {
                if (RescueTimeJq(this).attr('id') == "activate-tabs-sign-up" && !RescueTimeJq(this).hasClass('active')) {
                    RescueTimeJq("#activate-tabs LI").removeClass('active');
                    RescueTimeJq(this).addClass('active');
                    RescueTimeJq("#rt_popover_account_signup_form").show();
                    RescueTimeJq("#rt_popover_account_signin_form").hide();
                }
                if (RescueTimeJq(this).attr('id') == "activate-tabs-sign-in" && !RescueTimeJq(this).hasClass('active')) {
                    RescueTimeJq("#activate-tabs LI").removeClass('active');
                    RescueTimeJq(this).addClass('active');
                    RescueTimeJq("#rt_popover_account_signup_form").hide();
                    RescueTimeJq("#rt_popover_account_signin_form").show();
                    if (! self.api.util.isCrOs()) {
                        RescueTimeJq("#rt_popover_account_local_logging").attr("checked", "checked");
                    } else {
                        RescueTimeJq("#rt-activation-info-cros").show();
                        RescueTimeJq("#rt-activation-info-not-cros").hide();
                    }
                }
            });
            RescueTimeJq("#disable-plugin-logging").click(function() {
                var checked = RescueTimeJq("#disable-plugin-logging").attr('checked');
                if (checked == "checked") {
                    RescueTimeJq("#rt_popover_nav_pause").hide();
                    RescueTimeJq("#rt_popover_nav_pause_spacer").hide();
                    self.api.config.setConfigData('local_logging_enabled', false);
                    self.api.engine.stopLogPusher();
                    self.api.engine.clearAllLogEntries();
                } else {
                    RescueTimeJq("#rt_popover_nav_pause").show();
                    RescueTimeJq("#rt_popover_nav_pause_spacer").show();
                    self.api.config.setConfigData('local_logging_enabled', true);
                    self.api.engine.startLogPusher();
                }
            });
            RescueTimeJq("#daily-average-include-weekend").click(function() {
                var checked = RescueTimeJq("#daily-average-include-weekend").attr('checked');
                if (checked == "checked") {
                    self.api.config.setConfigData("data_include_weekends", true);
                } else {
                    self.api.config.setConfigData("data_include_weekends", false);
                }
            });
        })(this);
    },
    helpPanelHooks: function() {
        var popover = this;
        RescueTimeJq("#rt_popover_help_debug").click(function() {
            RescueTimeJq("#rt_popover_debug_panel").toggle();
            popover.api.util._log("should toggle debug panel");
            if (RescueTimeJq("#rt_popover_debug_panel").is(":visible")) {
                popover.api.engine.debug = true;
                popover.loadDebug();
            } else {
                popover.closeDebugPanel();
            }
        });
        RescueTimeJq("#rt_popover_help_why_email").click(function() {
            RescueTimeJq("#rt_popover_help_email").show();
            RescueTimeJq("#rt_popover_help_panel").show();
            RescueTimeJq("#rt_popover_help_main").hide();
        });
        this.hooksRegistered['helpPanelHooks'] = true
    },
    pausePanelHooks: function() {
        if (this.hooksRegistered['pausePanelHooks']) {
            return;
        }
        (function(self) {
            RescueTimeJq("#rt_popover_pause_for_button").click(function() {
                var pause_for = RescueTimeJq("#rt_popover_pause_for_minutes").val();
                
                if ((pause_for == null) || (pause_for == "")) {
                    pause_for = 30;
                }
                var pause_until = Date.now() + (pause_for * 60 * 1000);
                self.api.util._log("got pause_for: ", pause_for, " pause until: ", pause_until);
                self.api.engine.pauseUntil(pause_until);
                self.closePopover();
            });
            RescueTimeJq("#rt_popover_pause_tomorrow_button").click(function() {
                var tomorrow = new Date();
                // d = new Date(); d.setMinutes(0) ; d.setSeconds(0) ; d.setHours(24) ; d.getTime();
                tomorrow.setMinutes(0);
                tomorrow.setSeconds(0);
                tomorrow.setHours(24); // this will roll the time to next 00:00
                var pause_until = tomorrow.getTime();
                self.api.util._log("got pause until tomorrow: ", pause_until);
                self.api.engine.pauseUntil(pause_until);
                self.closePopover();
            });
        })(this);
        this.hooksRegistered['pausePanelHooks'] = true
    },
    initiateActivation: function(activate_as) {
        var email = RescueTimeJq("#rt_popover_account_email").val();
        if (this.api.util.validateEmail(email)) {
            this.disableActivationButtons();
            // allow it to reset
            this.api.util.cancel('check_activation');
            this.api.config.removeConfigData('activation_url');
            this.api.config.removeConfigData('activation_code');
            var uicallback = this.panelStatusCallbackGenerator();
            if (activate_as == "needs") {
                this.notice("Activating a new account for: " + email);
                this.api.requestActivation(email, false, uicallback);
            } else if (activate_as == "has") {
                this.notice("Linking to your RescueTime account for: " + email);
                if (RescueTimeJq('INPUT#rt_popover_account_local_logging').is(':checked')) {
                    this.api.config.setConfigData('local_logging_enabled', false);
                    RescueTimeJq("#rt_popover_nav_pause").hide();
                } else {
                    this.api.config.setConfigData('local_logging_enabled', true);
                    RescueTimeJq("#rt_popover_nav_pause").show();
                }
                this.api.requestActivation(email, true, uicallback);
            }
        } else {
            // warn about the email
            this.enableActivationButtons();
            this.warning("Bad email address, try again.");
        }
    },
    openUrlInTab: function(url) {
        this.api.util._log("will open in tab: ", url);
        if (this.api.util.isFirefox()) {
            //            top.document.getElementById("content");
            var browser = top.document.getElementById("content");
            var tab = browser.addTab(url);
            browser.selectedTab = tab;
            this.closePopover();
        } else {
            chrome.tabs.create({'url': url}, function(tab) {});
        }
    },
    getPopoverDashboardUrl: function() {
        var url = "";
        if (this.api.engine.mostRecentUrlNotSelf != null) {
            url = this.api.engine.mostRecentUrlNotSelf.split("?")[0];
        }
        var params = { 
            rtapi_key: this.api.config.getConfigData("data_key"),
            time_frame: "day",
            limit: 7,
            current_url: url,
            current_title: this.api.engine.mostRecentTitleNotSelf,
            rescuetime_extension_requestor_browser: this.api.util.getBrowser(),
            from: "extension",
            activation_email: this.api.config.getConfigData("activation_email"),
        };
        if (! this.api.config.asBoolean(this.api.config.getConfigData("data_include_weekends"))) {
            params['weekday_aware'] = 'true';
        }   
        return this.api.getGetUrl("/x/popover", RescueTimeJq.param(params, true));
    },
    logDebug: function(entry) {
        RescueTimeJq("#rt_popover_debug_log").append("<br />" + entry);	
    },
    closeDebugPanel: function() {
        this.api.engine.debug = false;
        this.api.util.cancel("debug_refresh");
        RescueTimeJq("#rt_popover_debug_panel").hide(); 
    },
    debugHooks: function() {
        var popover = this;
        RescueTimeJq("#rt_popover_debug_close").click(function() {
            popover.closeDebugPanel();
        });
        RescueTimeJq("#rt_popover_debug_hello").click(function() {
            popover.api.hello();
        });
        RescueTimeJq("#rt_popover_debug_reset").click(function() {
            popover.api.engine.log("Resetting configuration!");
            RescueTimeJq("#rt_popover_dashboard_panel").hide();
            popover.api.engine.hardReset(function() { popover.load(); });
        });	
        this.hooksRegistered['debugHooks'] = true
    },
    loadDebug: function() {
        this.drawDebug();
        if ((this.api.util.isFirefox())
            && (this.api.util.getWindow().document.getElementById("rescuetime-firefox-panel").collapsed)) {
            this.api.util._log("debug panel not visible, not setting timer");	    
        } else {
            this.api.util.cancel("debug_refresh");
            (function(self) { 
                self.api.util._log("reset debug timer");
                self.api.util.onInterval("debug_refresh", function() { 
                    self.drawDebug(); 
                }, 1000);	
            })(this);
        }
    },
    drawDebug: function() {
        var url = this.api.engine.mostRecentUrl;
        var title = this.api.engine.mostRecentTitle;
        var debug_messages = [
            "os_username: [", this.api.engine.os_username(),
            "] computer_name: [", this.api.engine.computer_name(),
            "] <br />extension reloads: ", this.api.engine.extensionLoads,
            " scans: ", this.api.engine.scannerLoops,
            " data gets/sets/last: ",
            this.api.storage.dataGets,"/",this.api.storage.dataSets,"/",this.api.storage.lastGetDataKey,
            " conf gets/sets: ",
            this.api.storage.configGets,"/",this.api.storage.configSets,
            "<br />CurrentUrl: ", url, 
            "<br />CurrentTitle: ", title,
        ];
        RescueTimeJq("#rt_popover_debug_message").text(debug_messages.join(""));
        RescueTimeJq("#rt_popover_debug_log").text("Logs entries:");
        for (var i in this.api.engine.logMessages) {
            this.logDebug(this.api.engine.logMessages[i]);
        }
    }
}
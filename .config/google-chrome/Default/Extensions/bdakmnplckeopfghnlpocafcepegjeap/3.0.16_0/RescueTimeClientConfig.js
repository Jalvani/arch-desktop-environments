// Copyright RescueTime, Inc.

// require RescueTimeUtil
// require RescueTimeLocalStorage

var RescueTimeClientConfig = {
    storage: null,
    util: null, 
    protocol: "https://",
    isResetting: false,
    _reset_config: {
        account_key: null,
        whitelist: null,
        plan_id: null,
        paused_until: null,
        blocking_enabled: null,
    },
    common: {
        account_key: null,
        url: 'www.rescuetime.com:443',
        ui_url: 'www.rescuetime.com:443',
        logging_enabled: true,
        scan_interval: 1,
        push_interval: 180,
        pull_interval: 60,
        idle_time_start: 120,
        idle_time_away: 120,
        paused_until: null,
        timepie_enabled: false,
        blocking_enabled: true,
        blocking_allow_rescore: true,
        pausing_allowed: true,
        focused_time_allowed: true,
        plan_id: null,
        whitelist: null,
        premium_enabled: true,
        // below not impl
        full_urls_enabled: true,
        whitelist_enabled: true,
        window_titles_enabled: true, // TODO
        blocking_enabled: true, // TODO
        alerts_enabled: true, // TODO
        logging_schedule_enabled: false, // TODO
        logging_scheduled_days: "127",
        logging_scheduled_start_hour: null,
        logging_scheduled_stop_hour: null,
        pausing_allowed: true,
        focused_time_allowed: true,
        goto_dashboard_allowed: true,
        debug_log_level: 1,
        // ignored
        ssl_enabled: true,
        projects_enabled: true,
        hotkey_enabled: true,
        hotkey_char: 'ctrl+shift+s',
        quitting_allowed: true
    },
    initialize: function(storage) {
        this.util = storage.util;
        this.storage = storage;
        this.loadLocalConfig();
        return this;
    },
    matchesCommonConfig: function(key, value) {
        if (this.common[key] == value) {
            return true;
        }
        return false;
    },
    getCommonConfig: function(key) {
        return this.common[key];
    },
    setCommonConfig: function(key, value) {
        this.common[key] = value;
        this.storage.setConfig(key, value);
        return value;
    },
    setConfigData: function(key, value) {
        this.storage.setData(key, value);
        return value;
    },
    getConfigData: function(key) {
        return this.storage.getData(key);
    },
    removeConfigData: function(key) {
        return this.storage.deleteData(key);
    },
    getSetting: function(key) { // merged view of common + data configs
        var value = this.common[key];
        if ((value == null) || (value == "null")) {
            value = this.getConfigData(key);
            if (this.blankOrNull(value)) {
                value = null;
            }
        }
        return value;
    },
    asBoolean: function(value) {
        if ((value == "true") || (value == true)) {
            return true;
        } 
        return false;
    },
    blankOrNull: function(value) {
        if ((value) && (value != "null") && (value != "")) {
            return false;
        }
        return true;
    },
    loadLocalConfig: function() {
        var self = this;
        var value;
        for (var key in self.common) {
            value = self.common[key];
            // localstorage currently does preserve boolean type info
            if (typeof(self.common[key]) == 'boolean') {
                if (self.storage.getConfig(key) == "true") {
                    self.common[key] = true;
                } else if (self.storage.getConfig(key) == "false") {
                    self.common[key] = false;
                } else {
                    self.common[key] = null;
                }
            } else {
                self.common[key] = self.storage.getConfig(key);
            }
            // preserve default value if local copy is null
            if (self.common[key] == null) {
                self.common[key] = value;
            }
        }
    },
    resetConfig: function() {
        var self = this;
        for (var key in self._reset_config) {
            self.setCommonConfig(key, this._reset_config[key]);
            self.storage.deleteConfig(key);
        }
    },
    shouldLogTime: function() {
        if (this.hasAccountKey() && 
            ((this.common.logging_enabled) 
             && (this.common.logging_enabled != false)
             && (this.common.logging_enabled != 'false'))) {
            return true;
        }
        return false;
    },
    hasAccountKey: function() {
        if (this.common.account_key) {
            if ((this.common.account_key != "null") && (this.common.account_key != "")) {
                return true;
            }
        }
        return false;
    }
}
var EXPORTED_SYMBOLS = ["RescueTimeClientConfig"];

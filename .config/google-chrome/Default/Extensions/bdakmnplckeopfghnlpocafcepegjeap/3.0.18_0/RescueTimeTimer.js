
function RescueTimeTimer(platform, callback, interval) {
    this.callback = callback;
    this.interval = interval;
    this.platform = platform;
    this.handle = null;
    this.finished = false;
    this._repeating = false;

    this.set = function(repeat) {
        this._repeating = repeat;
        if (this.handle != null) {
            return null;
        }
        if (this.platform == "firefox") {
            // this.handle = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
            // self = this;
            // if (this._repeating) {
            //     var executor = {
            //         notify: function(subject, topic, data) { 
            //             self.callback(); 
            //         } 
            //     };
            //     this.handle.initWithCallback(executor, this.interval, 
            //                                  Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
            // } else  {
            //     var executor = { 
            //         notify: function(timer) { 
            //             self.callback(); 
            //         } 
            //     };
            //     this.handle.initWithCallback(executor, this.interval, 
            //                                  Components.interfaces.nsITimer.TYPE_ONE_SHOT);
            // }
            var mywindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
            if (this._repeating) {
                this.handle = mywindow.setInterval(this.callback, this.interval);
            } else {
                this.handle = mywindow.setTimeout(this.callback, this.interval);
            }

        } else {
            if (this._repeating) {
                this.handle = setInterval(this.callback, this.interval);
            } else {
                this.handle = setTimeout(this.callback, this.interval);
            }
        }
        return this;
    };
    this.once = function() {
        return this.set(false);
    };
    this.repeat = function() {
        this.repeating = true;
        return this.set(true);
    };
    this.cancel = function() {
        if (this.platform == "firefox") {
            //this.handle.cancel();
            var mywindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
            if (this._repeating) {
                mywindow.clearInterval(this.handle);
            } else {
                mywindow.clearTimeout(this.handle);
            }
        } else {
            if (this._repeating) {
                clearInterval(this.handle);
            } else {
                clearTimeout(this.handle);
            }
        }
        return this;
    };
}

EXPORTED_SYMBOLS = ["RescueTimeTimer"];
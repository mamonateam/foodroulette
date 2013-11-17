// Platform: windows8
// 3.0.0-0-ge670de9
/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/
;(function() {
var CORDOVA_JS_BUILD_LABEL = '3.0.0-0-ge670de9';
// file: lib/scripts/require.js

var require,
    define;

(function () {
    var modules = {},
    // Stack of moduleIds currently being built.
        requireStack = [],
    // Map of module ID -> index into requireStack of modules currently being built.
        inProgressModules = {},
        SEPERATOR = ".";



    function build(module) {
        var factory = module.factory,
            localRequire = function (id) {
                var resultantId = id;
                //Its a relative path, so lop off the last portion and add the id (minus "./")
                if (id.charAt(0) === ".") {
                    resultantId = module.id.slice(0, module.id.lastIndexOf(SEPERATOR)) + SEPERATOR + id.slice(2);
                }
                return require(resultantId);
            };
        module.exports = {};
        delete module.factory;
        factory(localRequire, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        } else if (id in inProgressModules) {
            var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw "Cycle in require graph: " + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = requireStack.length;
                requireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                requireStack.pop();
            }
        }
        return modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already defined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

    define.moduleMap = modules;
})();

//Export for use in node
if (typeof module === "object" && typeof require === "function") {
    module.exports.require = require;
    module.exports.define = define;
}

// file: lib/cordova.js
define("cordova", function(require, exports, module) {


var channel = require('cordova/channel');

/**
 * Listen for DOMContentLoaded and notify our channel subscribers.
 */
document.addEventListener('DOMContentLoaded', function() {
    channel.onDOMContentLoaded.fire();
}, false);
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
}

/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {},
    windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] != 'undefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] != 'undefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] != "undefined") {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] != "undefined") {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}

if(typeof window.console === "undefined") {
    window.console = {
        log:function(){}
    };
}
// there are places in the framework where we call `warn` also, so we should make sure it exists
if(typeof window.console.warn === "undefined") {
    window.console.warn = function(msg) {
        this.log("warn: " + msg);
    }
}

var cordova = {
    define:define,
    require:require,
    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler:function(event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler:function(event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler:function(event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function() {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
        'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     * bNoDetach is required for events which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent: function(type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] != 'undefined') {
            if( bNoDetach ) {
              documentEventHandlers[type].fire(evt);
            }
            else {
              setTimeout(function() {
                  // Fire deviceready on listeners that were registered before cordova.js was loaded.
                  if (type == 'deviceready') {
                      document.dispatchEvent(evt);
                  }
                  documentEventHandlers[type].fire(evt);
              }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent: function(type, data) {
        var evt = createEvent(type,data);
        if (typeof windowEventHandlers[type] != 'undefined') {
            setTimeout(function() {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
    // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
    callbackId: Math.floor(Math.random() * 2000000000),
    callbacks:  {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     */
    callbackSuccess: function(callbackId, args) {
        try {
            cordova.callbackFromNative(callbackId, true, args.status, [args.message], args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning error result from an action.
     */
    callbackError: function(callbackId, args) {
        // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
        // Derive success from status.
        try {
            cordova.callbackFromNative(callbackId, false, args.status, [args.message], args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning the result from an action.
     */
    callbackFromNative: function(callbackId, success, status, args, keepCallback) {
        var callback = cordova.callbacks[callbackId];
        if (callback) {
            if (success && status == cordova.callbackStatus.OK) {
                callback.success && callback.success.apply(null, args);
            } else if (!success) {
                callback.fail && callback.fail.apply(null, args);
            }

            // Clear callback if not expecting any more results
            if (!keepCallback) {
                delete cordova.callbacks[callbackId];
            }
        }
    },
    addConstructor: function(func) {
        channel.onCordovaReady.subscribe(function() {
            try {
                func();
            } catch(e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

module.exports = cordova;

});

// file: lib/common/argscheck.js
define("cordova/argscheck", function(require, exports, module) {

var exec = require('cordova/exec');
var utils = require('cordova/utils');

var moduleExports = module.exports;

var typeMap = {
    'A': 'Array',
    'D': 'Date',
    'N': 'Number',
    'S': 'String',
    'F': 'Function',
    'O': 'Object'
};

function extractParamName(callee, argIndex) {
  return (/.*?\((.*?)\)/).exec(callee)[1].split(', ')[argIndex];
}

function checkArgs(spec, functionName, args, opt_callee) {
    if (!moduleExports.enableChecks) {
        return;
    }
    var errMsg = null;
    var typeName;
    for (var i = 0; i < spec.length; ++i) {
        var c = spec.charAt(i),
            cUpper = c.toUpperCase(),
            arg = args[i];
        // Asterix means allow anything.
        if (c == '*') {
            continue;
        }
        typeName = utils.typeName(arg);
        if ((arg === null || arg === undefined) && c == cUpper) {
            continue;
        }
        if (typeName != typeMap[cUpper]) {
            errMsg = 'Expected ' + typeMap[cUpper];
            break;
        }
    }
    if (errMsg) {
        errMsg += ', but got ' + typeName + '.';
        errMsg = 'Wrong type for parameter "' + extractParamName(opt_callee || args.callee, i) + '" of ' + functionName + ': ' + errMsg;
        // Don't log when running unit tests.
        if (typeof jasmine == 'undefined') {
            console.error(errMsg);
        }
        throw TypeError(errMsg);
    }
}

function getValue(value, defaultValue) {
    return value === undefined ? defaultValue : value;
}

moduleExports.checkArgs = checkArgs;
moduleExports.getValue = getValue;
moduleExports.enableChecks = true;


});

// file: lib/common/base64.js
define("cordova/base64", function(require, exports, module) {

var base64 = exports;

base64.fromArrayBuffer = function(arrayBuffer) {
  var array = new Uint8Array(arrayBuffer);
  return uint8ToBase64(array);
};

//------------------------------------------------------------------------------

/* This code is based on the performance tests at http://jsperf.com/b64tests
 * This 12-bit-at-a-time algorithm was the best performing version on all
 * platforms tested.
 */

var b64_6bit = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64_12bit;

var b64_12bitTable = function() {
    b64_12bit = [];
    for (var i=0; i<64; i++) {
        for (var j=0; j<64; j++) {
            b64_12bit[i*64+j] = b64_6bit[i] + b64_6bit[j];
        }
    }
    b64_12bitTable = function() { return b64_12bit; };
    return b64_12bit;
}

function uint8ToBase64(rawData) {
    var numBytes = rawData.byteLength;
    var output="";
    var segment;
    var table = b64_12bitTable();
    for (var i=0;i<numBytes-2;i+=3) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8) + rawData[i+2];
        output += table[segment >> 12];
        output += table[segment & 0xfff];
    }
    if (numBytes - i == 2) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8);
        output += table[segment >> 12];
        output += b64_6bit[(segment & 0xfff) >> 6];
        output += '=';
    } else if (numBytes - i == 1) {
        segment = (rawData[i] << 16);
        output += table[segment >> 12];
        output += '==';
    }
    return output;
}

});

// file: lib/common/builder.js
define("cordova/builder", function(require, exports, module) {

var utils = require('cordova/utils');

function each(objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            func.apply(context, [objects[prop], prop]);
        }
    }
}

function clobber(obj, key, value) {
    exports.replaceHookForTesting(obj, key);
    obj[key] = value;
    // Getters can only be overridden by getters.
    if (obj[key] !== value) {
        utils.defineGetter(obj, key, function() {
            return value;
        });
    }
}

function assignOrWrapInDeprecateGetter(obj, key, value, message) {
    if (message) {
        utils.defineGetter(obj, key, function() {
            console.log(message);
            delete obj[key];
            clobber(obj, key, value);
            return value;
        });
    } else {
        clobber(obj, key, value);
    }
}

function include(parent, objects, clobber, merge) {
    each(objects, function (obj, key) {
        try {
          var result = obj.path ? require(obj.path) : {};

          if (clobber) {
              // Clobber if it doesn't exist.
              if (typeof parent[key] === 'undefined') {
                  assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
              } else if (typeof obj.path !== 'undefined') {
                  // If merging, merge properties onto parent, otherwise, clobber.
                  if (merge) {
                      recursiveMerge(parent[key], result);
                  } else {
                      assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                  }
              }
              result = parent[key];
          } else {
            // Overwrite if not currently defined.
            if (typeof parent[key] == 'undefined') {
              assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
            } else {
              // Set result to what already exists, so we can build children into it if they exist.
              result = parent[key];
            }
          }

          if (obj.children) {
            include(result, obj.children, clobber, merge);
          }
        } catch(e) {
          utils.alert('Exception building cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge(target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (target.prototype && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                clobber(target.prototype, prop, src[prop]);
            } else {
                if (typeof src[prop] === 'object' && typeof target[prop] === 'object') {
                    recursiveMerge(target[prop], src[prop]);
                } else {
                    clobber(target, prop, src[prop]);
                }
            }
        }
    }
}

exports.buildIntoButDoNotClobber = function(objects, target) {
    include(target, objects, false, false);
};
exports.buildIntoAndClobber = function(objects, target) {
    include(target, objects, true, false);
};
exports.buildIntoAndMerge = function(objects, target) {
    include(target, objects, true, true);
};
exports.recursiveMerge = recursiveMerge;
exports.assignOrWrapInDeprecateGetter = assignOrWrapInDeprecateGetter;
exports.replaceHookForTesting = function() {};

});

// file: lib/common/channel.js
define("cordova/channel", function(require, exports, module) {

var utils = require('cordova/utils'),
    nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * cordova initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
 * onDeviceReady*              User event fired to indicate that Cordova is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 * onDestroy*                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function(type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
},
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired. All channels must be sticky channels.
         */
        join: function(h, c) {
            var len = c.length,
                i = len,
                f = function() {
                    if (!(--i)) h();
                };
            for (var j=0; j<len; j++) {
                if (c[j].state === 0) {
                    throw Error('Can only use join with sticky channels.');
                }
                c[j].subscribe(f);
            }
            if (!len) h();
        },
        create: function(type) {
            return channel[type] = new Channel(type, false);
        },
        createSticky: function(type) {
            return channel[type] = new Channel(type, true);
        },

        /**
         * cordova Channels that must fire before "deviceready" is fired.
         */
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},

        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up Cordova's "deviceready" event until the feature has been initialized
         * and Cordova.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = channel[feature] || this.createSticky(feature);
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    };

function forceFunction(f) {
    if (typeof f != 'function') throw "Function required as first argument!";
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(f, c) {
    // need a function to call
    forceFunction(f);
    if (this.state == 2) {
        f.apply(c || this, this.fireArgs);
        return;
    }

    var func = f,
        guid = f.observer_guid;
    if (typeof c == "object") { func = utils.close(c, f); }

    if (!guid) {
        // first time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    func.observer_guid = guid;
    f.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = func;
        this.numHandlers++;
        if (this.numHandlers == 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(f) {
    // need a function to unsubscribe
    forceFunction(f);

    var guid = f.observer_guid,
        handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    var fail = false,
        fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state == 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state == 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};


// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onCordovaReady');

// Event to indicate that all automatically loaded JS plugins are loaded and ready.
channel.createSticky('onPluginsReady');

// Event to indicate that Cordova is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Event to indicate a destroy lifecycle event
channel.createSticky('onDestroy');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onDOMContentLoaded');

module.exports = channel;

});

// file: lib/common/commandProxy.js
define("cordova/commandProxy", function(require, exports, module) {


// internal map of proxy function
var CommandProxyMap = {};

module.exports = {

    // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
    add:function(id,proxyObj) {
        console.log("adding proxy for " + id);
        CommandProxyMap[id] = proxyObj;
        return proxyObj;
    },

    // cordova.commandProxy.remove("Accelerometer");
    remove:function(id) {
        var proxy = CommandProxyMap[id];
        delete CommandProxyMap[id];
        CommandProxyMap[id] = null;
        return proxy;
    },

    get:function(service,action) {
        return ( CommandProxyMap[service] ? CommandProxyMap[service][action] : null );
    }
};
});

// file: lib/windows8/exec.js
define("cordova/exec", function(require, exports, module) {

var cordova = require('cordova');
var commandProxy = require('cordova/commandProxy');

/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */
module.exports = function(success, fail, service, action, args) {

    var proxy = commandProxy.get(service,action);
    if(proxy) {
        var callbackId = service + cordova.callbackId++;
        // console.log("EXEC:" + service + " : " + action);
        if (typeof success == "function" || typeof fail == "function") {
            cordova.callbacks[callbackId] = {success:success, fail:fail};
        }
        try {
            proxy(success, fail, args);
        }
        catch(e) {
            console.log("Exception calling native with command :: " + service + " :: " + action  + " ::exception=" + e);
        }
    }
    else {
        fail && fail("Missing Command Error");
    }
};

});

// file: lib/common/modulemapper.js
define("cordova/modulemapper", function(require, exports, module) {

var builder = require('cordova/builder'),
    moduleMap = define.moduleMap,
    symbolList,
    deprecationMap;

exports.reset = function() {
    symbolList = [];
    deprecationMap = {};
};

function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
    if (!(moduleName in moduleMap)) {
        throw new Error('Module ' + moduleName + ' does not exist.');
    }
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function(moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace(symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) {
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function(context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy == 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy == 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function(context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.loadMatchingModules = function(matchingRegExp) {
    for (var k in moduleMap) {
        if (matchingRegExp.exec(k)) {
            require(k);
        }
    }
};

exports.reset();


});

// file: lib/windows8/platform.js
define("cordova/platform", function(require, exports, module) {

var cordova = require('cordova'),
    exec = require('cordova/exec'),
    channel = cordova.require("cordova/channel"),
    modulemapper = require('cordova/modulemapper');

/*
 * Define native implementations ( there is no native layer, so need to make sure the proxies are there )
 */
modulemapper.loadMatchingModules(/cordova.*\/windows8\/.*Proxy$/);

module.exports = {
    id: "windows8",
    initialize:function() {

        modulemapper.loadMatchingModules(/cordova.*\/plugininit$/);

        modulemapper.loadMatchingModules(/cordova.*\/symbols$/);
        modulemapper.clobbers('cordova/commandProxy', 'cordova.commandProxy');

        modulemapper.mapModules(window);

        var onWinJSReady = function () {
            var app = WinJS.Application;
            var checkpointHandler = function checkpointHandler() {
                cordova.fireDocumentEvent('pause');
            };

            var resumingHandler = function resumingHandler() {
                cordova.fireDocumentEvent('resume');
            };

            app.addEventListener("checkpoint", checkpointHandler);
            Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", resumingHandler, false);
            app.start();

        };

        if (!window.WinJS) {
            // <script src="//Microsoft.WinJS.1.0/js/base.js"></script>
            var scriptElem = document.createElement("script");
            scriptElem.src = "//Microsoft.WinJS.1.0/js/base.js";
            scriptElem.addEventListener("load", onWinJSReady);
            document.head.appendChild(scriptElem);

            console.log("added WinJS ... ");
        }
        else {
            onWinJSReady();
        }
    }
};

});

// file: lib/windows8/plugin/capture/symbols.js
define("cordova/plugin/capture/symbols", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/CaptureError', 'CaptureError');
modulemapper.clobbers('cordova/plugin/CaptureAudioOptions', 'CaptureAudioOptions');
modulemapper.clobbers('cordova/plugin/CaptureImageOptions', 'CaptureImageOptions');
modulemapper.clobbers('cordova/plugin/CaptureVideoOptions', 'CaptureVideoOptions');
modulemapper.clobbers('cordova/plugin/MediaFile', 'MediaFile');
modulemapper.clobbers('cordova/plugin/MediaFileData', 'MediaFileData');
modulemapper.clobbers('cordova/plugin/capture', 'navigator.device.capture');

modulemapper.merges('cordova/plugin/windows8/MediaFile', 'MediaFile');

});

// file: lib/common/plugin/echo.js
define("cordova/plugin/echo", function(require, exports, module) {

var exec = require('cordova/exec'),
    utils = require('cordova/utils');

/**
 * Sends the given message through exec() to the Echo plugin, which sends it back to the successCallback.
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 * @param message  The string to be echoed.
 * @param forceAsync  Whether to force an async return value (for testing native->js bridge).
 */
module.exports = function(successCallback, errorCallback, message, forceAsync) {
    var action = 'echo';
    var messageIsMultipart = (utils.typeName(message) == "Array");
    var args = messageIsMultipart ? message : [message];

    if (utils.typeName(message) == 'ArrayBuffer') {
        if (forceAsync) {
            console.warn('Cannot echo ArrayBuffer with forced async, falling back to sync.');
        }
        action += 'ArrayBuffer';
    } else if (messageIsMultipart) {
        if (forceAsync) {
            console.warn('Cannot echo MultiPart Array with forced async, falling back to sync.');
        }
        action += 'MultiPart';
    } else if (forceAsync) {
        action += 'Async';
    }

    exec(successCallback, errorCallback, "Echo", action, args);
};


});

// file: lib/windows8/plugin/file/symbols.js
define("cordova/plugin/file/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper'),
    symbolshelper = require('cordova/plugin/file/symbolshelper');

symbolshelper(modulemapper.defaults);
modulemapper.clobbers('cordova/plugin/File', 'File');
modulemapper.clobbers('cordova/plugin/FileReader', 'FileReader');

});

// file: lib/windows8/plugin/media/symbols.js
define("cordova/plugin/media/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Media', 'Media');
modulemapper.clobbers('cordova/plugin/MediaError', 'MediaError');

});

// file: lib/windows8/plugin/windows8/AccelerometerProxy.js
define("cordova/plugin/windows8/AccelerometerProxy", function(require, exports, module) {

/*global Windows:true */

var cordova = require('cordova'),
    Acceleration = require('cordova/plugin/Acceleration');

/* This is the actual implementation part that returns the result on Windows 8
*/

module.exports = {
    onDataChanged:null,
    start:function(win,lose){

        var accel = Windows.Devices.Sensors.Accelerometer.getDefault();
        if(!accel) {
            lose && lose("No accelerometer found");
        }
        else {
            var self = this;
            accel.reportInterval = Math.max(16,accel.minimumReportInterval);

            // store our bound function
            this.onDataChanged = function(e) {
                var a = e.reading;
                win(new Acceleration(a.accelerationX,a.accelerationY,a.accelerationZ));
            };
            accel.addEventListener("readingchanged",this.onDataChanged);

            setTimeout(function(){
                var a = accel.getCurrentReading();
                win(new Acceleration(a.accelerationX,a.accelerationY,a.accelerationZ));
            },0); // async do later
        }
    },
    stop:function(win,lose){
        win = win || function(){};
        var accel = Windows.Devices.Sensors.Accelerometer.getDefault();
        if(!accel) {
            lose && lose("No accelerometer found");
        }
        else {
            accel.removeEventListener("readingchanged",this.onDataChanged);
            this.onDataChanged = null;
            accel.reportInterval = 0; // back to the default
            win();
        }
    }
};

require("cordova/commandProxy").add("Accelerometer",module.exports);
});

// file: lib/windows8/plugin/windows8/CameraProxy.js
define("cordova/plugin/windows8/CameraProxy", function(require, exports, module) {

/*global Windows:true, URL:true */


var cordova = require('cordova'),
    Camera = require('cordova/plugin/CameraConstants'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError'),
    FileReader = require('cordova/plugin/FileReader');

module.exports = {

    // args will contain :
    //  ...  it is an array, so be careful
    // 0 quality:50,
    // 1 destinationType:Camera.DestinationType.FILE_URI,
    // 2 sourceType:Camera.PictureSourceType.CAMERA,
    // 3 targetWidth:-1,
    // 4 targetHeight:-1,
    // 5 encodingType:Camera.EncodingType.JPEG,
    // 6 mediaType:Camera.MediaType.PICTURE,
    // 7 allowEdit:false,
    // 8 correctOrientation:false,
    // 9 saveToPhotoAlbum:false,
    // 10 popoverOptions:null

    takePicture: function (successCallback, errorCallback, args) {
        var encodingType = args[5];
        var targetWidth = args[3];
        var targetHeight = args[4];
        var sourceType = args[2];
        var destinationType = args[1];
        var mediaType = args[6];
        var saveToPhotoAlbum = args[9];

        var pkg = Windows.ApplicationModel.Package.current;
        var packageId = pkg.installedLocation;

        var fail = function (fileError) {
            errorCallback("FileError, code:" + fileError.code);
        };

        // resize method :)
        var resizeImage = function (file) {
            var tempPhotoFileName = "";
            if (encodingType == Camera.EncodingType.PNG) {
                tempPhotoFileName = "camera_cordova_temp_return.png";
            } else {
                tempPhotoFileName = "camera_cordova_temp_return.jpg";
            }
            var imgObj = new Image();
            var success = function (fileEntry) {
                var successCB = function (filePhoto) {
                    var fileType = file.contentType,
                        reader = new FileReader();
                    reader.onloadend = function () {
                        var image = new Image();
                        image.src = reader.result;
                        image.onload = function () {
                            var imageWidth = targetWidth,
                                imageHeight = targetHeight;
                            var canvas = document.createElement('canvas');

                            canvas.width = imageWidth;
                            canvas.height = imageHeight;

                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(this, 0, 0, imageWidth, imageHeight);

                            // The resized file ready for upload
                            var _blob = canvas.msToBlob();
                            var _stream = _blob.msDetachStream();
                            Windows.Storage.StorageFolder.getFolderFromPathAsync(packageId.path).done(function (storageFolder) {
                                storageFolder.createFileAsync(tempPhotoFileName, Windows.Storage.CreationCollisionOption.generateUniqueName).done(function (file) {
                                    file.openAsync(Windows.Storage.FileAccessMode.readWrite).done(function (fileStream) {
                                        Windows.Storage.Streams.RandomAccessStream.copyAndCloseAsync(_stream, fileStream).done(function () {
                                            var _imageUrl = URL.createObjectURL(file);
                                            successCallback(_imageUrl);
                                        }, function () { errorCallback("Resize picture error."); });
                                    }, function () { errorCallback("Resize picture error."); });
                                }, function () { errorCallback("Resize picture error."); });
                            });
                        };
                    };

                    reader.readAsDataURL(filePhoto);
                };

                var failCB = function () {
                    errorCallback("File not found.");
                };
                fileEntry.file(successCB, failCB);
            };

            Windows.Storage.StorageFolder.getFolderFromPathAsync(packageId.path).done(function (storageFolder) {
                file.copyAsync(storageFolder, file.name, Windows.Storage.NameCollisionOption.replaceExisting).then(function (storageFile) {
                    success(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }, function () {
                    errorCallback("Folder not access.");
                });
            });

        };

        // because of asynchronous method, so let the successCallback be called in it.
        var resizeImageBase64 = function (file) {
            var imgObj = new Image();
            var success = function (fileEntry) {
                var successCB = function (filePhoto) {
                    var fileType = file.contentType,
                        reader = new FileReader();
                    reader.onloadend = function () {
                        var image = new Image();
                        image.src = reader.result;

                        image.onload = function () {
                            var imageWidth = targetWidth,
                                imageHeight = targetHeight;
                            var canvas = document.createElement('canvas');

                            canvas.width = imageWidth;
                            canvas.height = imageHeight;

                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(this, 0, 0, imageWidth, imageHeight);

                            // The resized file ready for upload
                            var finalFile = canvas.toDataURL(fileType);

                            // Remove the prefix such as "data:" + contentType + ";base64," , in order to meet the Cordova API.
                            var arr = finalFile.split(",");
                            var newStr = finalFile.substr(arr[0].length + 1);
                            successCallback(newStr);
                        };
                    };

                    reader.readAsDataURL(filePhoto);

                };
                var failCB = function () {
                    errorCallback("File not found.");
                };
                fileEntry.file(successCB, failCB);
            };

            Windows.Storage.StorageFolder.getFolderFromPathAsync(packageId.path).done(function (storageFolder) {
                file.copyAsync(storageFolder, file.name, Windows.Storage.NameCollisionOption.replaceExisting).then(function (storageFile) {
                    success(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }, function () {
                    errorCallback("Folder not access.");
                });
            });

        };

        if (sourceType != Camera.PictureSourceType.CAMERA) {
            var fileOpenPicker = new Windows.Storage.Pickers.FileOpenPicker();
            fileOpenPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.picturesLibrary;
            if (mediaType == Camera.MediaType.PICTURE) {
                fileOpenPicker.fileTypeFilter.replaceAll([".png", ".jpg", ".jpeg"]);
            } else if (mediaType == Camera.MediaType.VIDEO) {
                fileOpenPicker.fileTypeFilter.replaceAll([".avi", ".flv", ".asx", ".asf", ".mov", ".mp4", ".mpg", ".rm", ".srt", ".swf", ".wmv", ".vob"]);
            } else {
                fileOpenPicker.fileTypeFilter.replaceAll(["*"]);
            }

            fileOpenPicker.pickSingleFileAsync().then(function (file) {
                if (file) {
                    if (destinationType == Camera.DestinationType.FILE_URI) {
                        if (targetHeight > 0 && targetWidth > 0) {
                            resizeImage(file);
                        } else {
                            Windows.Storage.StorageFolder.getFolderFromPathAsync(packageId.path).done(function (storageFolder) {
                                file.copyAsync(storageFolder, file.name, Windows.Storage.NameCollisionOption.replaceExisting).then(function (storageFile) {
                                    var _imageUrl = URL.createObjectURL(storageFile);
                                    successCallback(_imageUrl);
                                }, function () {
                                    fail(FileError.INVALID_MODIFICATION_ERR);
                                }, function () {
                                    errorCallback("Folder not access.");
                                });
                            });

                        }
                    }
                    else {
                        if (targetHeight > 0 && targetWidth > 0) {
                            resizeImageBase64(file);
                        } else {
                            Windows.Storage.FileIO.readBufferAsync(file).done(function (buffer) {
                                var strBase64 = Windows.Security.Cryptography.CryptographicBuffer.encodeToBase64String(buffer);
                                successCallback(strBase64);
                            });
                        }

                    }

                } else {
                    errorCallback("User didn't choose a file.");
                }
            }, function () {
                errorCallback("User didn't choose a file.");
            });
        }
        else {

            var cameraCaptureUI = new Windows.Media.Capture.CameraCaptureUI();
            cameraCaptureUI.photoSettings.allowCropping = true;
            var allowCrop = !!args[7];
            if (!allowCrop) {
                cameraCaptureUI.photoSettings.allowCropping = false;
            }

            if (encodingType == Camera.EncodingType.PNG) {
                cameraCaptureUI.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.png;
            } else {
                cameraCaptureUI.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.jpeg;
            }
            // decide which max pixels should be supported by targetWidth or targetHeight.
            if (targetWidth >= 1280 || targetHeight >= 960) {
                cameraCaptureUI.photoSettings.maxResolution = Windows.Media.Capture.CameraCaptureUIMaxPhotoResolution.large3M;
            } else if (targetWidth >= 1024 || targetHeight >= 768) {
                cameraCaptureUI.photoSettings.maxResolution = Windows.Media.Capture.CameraCaptureUIMaxPhotoResolution.mediumXga;
            } else if (targetWidth >= 800 || targetHeight >= 600) {
                cameraCaptureUI.photoSettings.maxResolution = Windows.Media.Capture.CameraCaptureUIMaxPhotoResolution.mediumXga;
            } else if (targetWidth >= 640 || targetHeight >= 480) {
                cameraCaptureUI.photoSettings.maxResolution = Windows.Media.Capture.CameraCaptureUIMaxPhotoResolution.smallVga;
            } else if (targetWidth >= 320 || targetHeight >= 240) {
                cameraCaptureUI.photoSettings.maxResolution = Windows.Media.Capture.CameraCaptureUIMaxPhotoResolution.verySmallQvga;
            } else {
                cameraCaptureUI.photoSettings.maxResolution = Windows.Media.Capture.CameraCaptureUIMaxPhotoResolution.highestAvailable;
            }

            cameraCaptureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo).then(function (picture) {
                if (picture) {
                    // save to photo album successCallback
                    var success = function (fileEntry) {
                        if (destinationType == Camera.DestinationType.FILE_URI) {
                            if (targetHeight > 0 && targetWidth > 0) {
                                resizeImage(picture);
                            } else {
                                Windows.Storage.StorageFolder.getFolderFromPathAsync(packageId.path).done(function (storageFolder) {
                                    picture.copyAsync(storageFolder, picture.name, Windows.Storage.NameCollisionOption.replaceExisting).then(function (storageFile) {
                                        var _imageUrl = URL.createObjectURL(storageFile);
                                        successCallback(_imageUrl);
                                    }, function () {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                    }, function () {
                                        errorCallback("Folder not access.");
                                    });
                                });
                            }
                        } else {
                            if (targetHeight > 0 && targetWidth > 0) {
                                resizeImageBase64(picture);
                            } else {
                                Windows.Storage.FileIO.readBufferAsync(picture).done(function (buffer) {
                                    var strBase64 = Windows.Security.Cryptography.CryptographicBuffer.encodeToBase64String(buffer);
                                    successCallback(strBase64);
                                });
                            }
                        }
                    };
                    // save to photo album errorCallback
                    var fail = function () {
                        //errorCallback("FileError, code:" + fileError.code);
                        errorCallback("Save fail.");
                    };

                    if (saveToPhotoAlbum) {
                        Windows.Storage.StorageFile.getFileFromPathAsync(picture.path).then(function (storageFile) {
                            storageFile.copyAsync(Windows.Storage.KnownFolders.picturesLibrary, picture.name, Windows.Storage.NameCollisionOption.generateUniqueName).then(function (storageFile) {
                                success(storageFile);
                            }, function () {
                                fail();
                            });
                        });
                        //var directory = new DirectoryEntry("Pictures", parentPath);
                        //new FileEntry(picture.name, picture.path).copyTo(directory, null, success, fail);
                    } else {
                        if (destinationType == Camera.DestinationType.FILE_URI) {
                            if (targetHeight > 0 && targetWidth > 0) {
                                resizeImage(picture);
                            } else {
                                Windows.Storage.StorageFolder.getFolderFromPathAsync(packageId.path).done(function (storageFolder) {
                                    picture.copyAsync(storageFolder, picture.name, Windows.Storage.NameCollisionOption.replaceExisting).then(function (storageFile) {
                                        var _imageUrl = URL.createObjectURL(storageFile);
                                        successCallback(_imageUrl);
                                    }, function () {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                    }, function () {
                                        errorCallback("Folder not access.");
                                    });
                                });
                            }
                        } else {
                            if (targetHeight > 0 && targetWidth > 0) {
                                resizeImageBase64(picture);
                            } else {
                                Windows.Storage.FileIO.readBufferAsync(picture).done(function (buffer) {
                                    var strBase64 = Windows.Security.Cryptography.CryptographicBuffer.encodeToBase64String(buffer);
                                    successCallback(strBase64);
                                });
                            }
                        }
                    }
                } else {
                    errorCallback("User didn't capture a photo.");
                }
            }, function () {
                errorCallback("Fail to capture a photo.");
            });
        }
    }
};

require("cordova/commandProxy").add("Camera",module.exports);

});

// file: lib/windows8/plugin/windows8/CaptureProxy.js
define("cordova/plugin/windows8/CaptureProxy", function(require, exports, module) {

/*global Windows:true */

var MediaFile = require('cordova/plugin/MediaFile');
var CaptureError = require('cordova/plugin/CaptureError');
var CaptureAudioOptions = require('cordova/plugin/CaptureAudioOptions');
var CaptureImageOptions = require('cordova/plugin/CaptureImageOptions');
var CaptureVideoOptions = require('cordova/plugin/CaptureVideoOptions');
var MediaFileData = require('cordova/plugin/MediaFileData');

module.exports = {

    captureAudio:function(successCallback, errorCallback, args) {
        var options = args[0];

        var audioOptions = new CaptureAudioOptions();
        if (typeof(options.duration) == 'undefined') {
            audioOptions.duration = 3600; // Arbitrary amount, need to change later
        } else if (options.duration > 0) {
            audioOptions.duration = options.duration;
        } else {
            errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
            return;
        }

        var cameraCaptureAudioDuration = audioOptions.duration;
        var mediaCaptureSettings;
        var initCaptureSettings = function () {
            mediaCaptureSettings = null;
            mediaCaptureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
            mediaCaptureSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audio;
        };

        initCaptureSettings();
        var mediaCapture = new Windows.Media.Capture.MediaCapture();
        mediaCapture.initializeAsync(mediaCaptureSettings).done(function () {
            Windows.Storage.KnownFolders.musicLibrary.createFileAsync("captureAudio.mp3", Windows.Storage.NameCollisionOption.generateUniqueName).then(function (storageFile) {
                var mediaEncodingProfile = new Windows.Media.MediaProperties.MediaEncodingProfile.createMp3(Windows.Media.MediaProperties.AudioEncodingQuality.auto);
                var stopRecord = function () {
                    mediaCapture.stopRecordAsync().then(function (result) {
                        storageFile.getBasicPropertiesAsync().then(function (basicProperties) {
                            var results = [];
                            results.push(new MediaFile(storageFile.name, storageFile.path, storageFile.contentType, basicProperties.dateModified, basicProperties.size));
                            successCallback(results);
                        }, function () {
                            errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES));
                        });
                    }, function () { errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES)); });
                };
                mediaCapture.startRecordToStorageFileAsync(mediaEncodingProfile, storageFile).then(function () {
                    setTimeout(stopRecord, cameraCaptureAudioDuration * 1000);
                }, function () { errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES)); });
            }, function () { errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES)); });
        });
    },

    captureImage:function (successCallback, errorCallback, args) {
        var options = args[0];
        var imageOptions = new CaptureImageOptions();
        var cameraCaptureUI = new Windows.Media.Capture.CameraCaptureUI();
        cameraCaptureUI.photoSettings.allowCropping = true;
        cameraCaptureUI.photoSettings.maxResolution = Windows.Media.Capture.CameraCaptureUIMaxPhotoResolution.highestAvailable;
        cameraCaptureUI.photoSettings.format = Windows.Media.Capture.CameraCaptureUIPhotoFormat.jpeg;
        cameraCaptureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo).then(function (file) {
            file.moveAsync(Windows.Storage.KnownFolders.picturesLibrary, "cameraCaptureImage.jpg", Windows.Storage.NameCollisionOption.generateUniqueName).then(function () {
                file.getBasicPropertiesAsync().then(function (basicProperties) {
                    var results = [];
                    results.push(new MediaFile(file.name, file.path, file.contentType, basicProperties.dateModified, basicProperties.size));
                    successCallback(results);
                }, function () {
                    errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES));
                });
            }, function () {
                errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES));
            });
        }, function () { errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES)); });
    },

    captureVideo:function (successCallback, errorCallback, args) {
        var options = args[0];
        var videoOptions = new CaptureVideoOptions();
        if (options.duration && options.duration > 0) {
            videoOptions.duration = options.duration;
        }
        if (options.limit > 1) {
            videoOptions.limit = options.limit;
        }
        var cameraCaptureUI = new Windows.Media.Capture.CameraCaptureUI();
        cameraCaptureUI.videoSettings.allowTrimming = true;
        cameraCaptureUI.videoSettings.format = Windows.Media.Capture.CameraCaptureUIVideoFormat.mp4;
        cameraCaptureUI.videoSettings.maxDurationInSeconds = videoOptions.duration;
        cameraCaptureUI.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.video).then(function (file) {
            file.moveAsync(Windows.Storage.KnownFolders.videosLibrary, "cameraCaptureVedio.mp4", Windows.Storage.NameCollisionOption.generateUniqueName).then(function () {
                file.getBasicPropertiesAsync().then(function (basicProperties) {
                    var results = [];
                    results.push(new MediaFile(file.name, file.path, file.contentType, basicProperties.dateModified, basicProperties.size));
                    successCallback(results);
                }, function () {
                    errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES));
                });
            }, function () {
                errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES));
            });
        }, function () { errorCallback(new CaptureError(CaptureError.CAPTURE_NO_MEDIA_FILES)); });

    },

    getFormatData: function (successCallback, errorCallback, args) {
        Windows.Storage.StorageFile.getFileFromPathAsync(args[0]).then(
            function (storageFile) {
                var mediaTypeFlag = String(storageFile.contentType).split("/")[0].toLowerCase();
                if (mediaTypeFlag === "audio") {
                    storageFile.properties.getMusicPropertiesAsync().then(function (audioProperties) {
                        successCallback(new MediaFileData(null, audioProperties.bitrate, 0, 0, audioProperties.duration / 1000));
                    }, function () {
                        errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
                    });
                }
                else if (mediaTypeFlag === "video") {
                    storageFile.properties.getVideoPropertiesAsync().then(function (videoProperties) {
                        successCallback(new MediaFileData(null, videoProperties.bitrate, videoProperties.height, videoProperties.width, videoProperties.duration / 1000));
                    }, function () {
                        errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
                    });
                }
                else if (mediaTypeFlag === "image") {
                    storageFile.properties.getImagePropertiesAsync().then(function (imageProperties) {
                        successCallback(new MediaFileData(null, 0, imageProperties.height, imageProperties.width, 0));
                    }, function () {
                        errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
                    });
                }
                else { errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT)); }
            }, function () {
                errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
            }
        );
    }
};

require("cordova/commandProxy").add("Capture",module.exports);
});

// file: lib/windows8/plugin/windows8/CompassProxy.js
define("cordova/plugin/windows8/CompassProxy", function(require, exports, module) {

/*global Windows:true */

var cordova = require('cordova'),
    CompassHeading = require('cordova/plugin/CompassHeading');


module.exports = {

    onReadingChanged:null,
    getHeading:function(win,lose) {
        var deviceCompass = Windows.Devices.Sensors.Compass.getDefault();
        if(!deviceCompass) {
            setTimeout(function(){lose("Compass not available");},0);
        }
        else {

            deviceCompass.reportInterval = Math.max(16,deviceCompass.minimumReportInterval);

            this.onReadingChanged = function(e) {
                var reading = e.reading;
                var heading = new CompassHeading(reading.headingMagneticNorth, reading.headingTrueNorth);
                win(heading);
            };
            deviceCompass.addEventListener("readingchanged",this.onReadingChanged);
        }

    },
    stopHeading:function(win,lose) {
        var deviceCompass = Windows.Devices.Sensors.Compass.getDefault();
        if(!deviceCompass) {
            setTimeout(function(){lose("Compass not available");},0);
        }
        else {

            deviceCompass.removeEventListener("readingchanged",this.onReadingChanged);
            this.onReadingChanged = null;
            deviceCompass.reportInterval = 0;
            win();
        }

    }
};

require("cordova/commandProxy").add("Compass",module.exports);
});

// file: lib/windows8/plugin/windows8/ContactsProxy.js
define("cordova/plugin/windows8/ContactsProxy", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    search: function (win, fail, args) {
        var fields = args[0];
        var options = args[1];
        var picker = Windows.ApplicationModel.Contacts.ContactPicker();
        picker.commitButtonText = "Select";
        picker.selectionMode = Windows.ApplicationModel.Contacts.ContactSelectionMode.contacts;

        picker.desiredFields.push.apply(picker.desiredFields, fields);

        if (options.multiple) {
            picker.pickMultipleContactsAsync().then(function (contacts) {
                win(contacts);
            });
        }
        else {
            picker.pickSingleContactAsync().then(function (contact) {
                win([contact]);
            });
        }
    }

};

require("cordova/commandProxy").add("Contacts",module.exports);
});

// file: lib/windows8/plugin/windows8/DeviceProxy.js
define("cordova/plugin/windows8/DeviceProxy", function(require, exports, module) {

var cordova = require('cordova');
var utils = require('cordova/utils');
var FileError = require('cordova/plugin/FileError');


module.exports = {

    getDeviceInfo:function(win,fail,args) {

        // deviceId aka uuid, stored in Windows.Storage.ApplicationData.current.localSettings.values.deviceId
        var deviceId;
        var localSettings = Windows.Storage.ApplicationData.current.localSettings;

        if (localSettings.values.deviceId) {
            deviceId = localSettings.values.deviceId;
        }
        else {
            deviceId = localSettings.values.deviceId = utils.createUUID();
        }

        setTimeout(function () {
            win({ platform: "windows8", version: "8", uuid: deviceId, cordova: CORDOVA_JS_BUILD_LABEL });
        }, 0);
    }

};

require("cordova/commandProxy").add("Device",module.exports);

});

// file: lib/windows8/plugin/windows8/FileProxy.js
define("cordova/plugin/windows8/FileProxy", function(require, exports, module) {

var cordova = require('cordova');
var Entry = require('cordova/plugin/Entry'),
    File = require('cordova/plugin/File'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError'),
    DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    Flags = require('cordova/plugin/Flags'),
    FileSystem = require('cordova/plugin/FileSystem'),
    LocalFileSystem = require('cordova/plugin/LocalFileSystem');

module.exports = {

    getFileMetadata:function(win,fail,args) {
        var fullPath = args[0];

        Windows.Storage.StorageFile.getFileFromPathAsync(fullPath).done(
            function (storageFile) {
                storageFile.getBasicPropertiesAsync().then(
                    function (basicProperties) {
                        win(new File(storageFile.name, storageFile.path, storageFile.fileType, basicProperties.dateModified, basicProperties.size));
                    }, function () {
                        fail && fail(FileError.NOT_READABLE_ERR);
                    }
                );
            }, function () {
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    getMetadata:function(success,fail,args) {
        var fullPath = args[0];

        var dealFile = function (sFile) {
            Windows.Storage.StorageFile.getFileFromPathAsync(fullPath).then(
                function (storageFile) {
                    return storageFile.getBasicPropertiesAsync();
                },
                function () {
                    fail && fail(FileError.NOT_READABLE_ERR);
                }
            // get the basic properties of the file.
            ).then(
                function (basicProperties) {
                    success(basicProperties.dateModified);
                },
                function () {
                    fail && fail(FileError.NOT_READABLE_ERR);
                }
            );
        };

        var dealFolder = function (sFolder) {
            Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(
                function (storageFolder) {
                    return storageFolder.getBasicPropertiesAsync();
                },
                function () {
                    fail && fail(FileError.NOT_READABLE_ERR);
                }
            // get the basic properties of the folder.
            ).then(
                function (basicProperties) {
                    success(basicProperties.dateModified);
                },
                function () {
                    fail && fail(FileError.NOT_FOUND_ERR);
                }
            );
        };

        Windows.Storage.StorageFile.getFileFromPathAsync(fullPath).then(
            // the path is file.
            function (sFile) {
                dealFile(sFile);
            },
            // the path is folder
            function () {
                Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(
                    function (sFolder) {
                        dealFolder(sFolder);
                    }, function () {
                        fail && fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },

    getParent:function(win,fail,args) { // ["fullPath"]
        var fullPath = args[0];

        var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
        var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;

        if (fullPath == storageFolderPer.path) {
            win(new DirectoryEntry(storageFolderPer.name, storageFolderPer.path));
            return;
        } else if (fullPath == storageFolderTem.path) {
            win(new DirectoryEntry(storageFolderTem.name, storageFolderTem.path));
            return;
        }
        var splitArr = fullPath.split(new RegExp(/\/|\\/g));

        var popItem = splitArr.pop();

        var result = new DirectoryEntry(popItem, fullPath.substr(0, fullPath.length - popItem.length - 1));
        Windows.Storage.StorageFolder.getFolderFromPathAsync(result.fullPath).done(
            function () { win(result); },
            function () { fail && fail(FileError.INVALID_STATE_ERR); }
        );
    },

    readAsText:function(win,fail,args) {
        var fileName = args[0];
        var enc = args[1];

        Windows.Storage.StorageFile.getFileFromPathAsync(fileName).done(
            function (storageFile) {
                var value = Windows.Storage.Streams.UnicodeEncoding.utf8;
                if (enc == 'Utf16LE' || enc == 'utf16LE') {
                    value = Windows.Storage.Streams.UnicodeEncoding.utf16LE;
                }else if (enc == 'Utf16BE' || enc == 'utf16BE') {
                    value = Windows.Storage.Streams.UnicodeEncoding.utf16BE;
                }
                Windows.Storage.FileIO.readTextAsync(storageFile, value).done(
                    function (fileContent) {
                        win(fileContent);
                    },
                    function () {
                        fail && fail(FileError.ENCODING_ERR);
                    }
                );
            }, function () {
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    readAsDataURL:function(win,fail,args) {
        var fileName = args[0];


        Windows.Storage.StorageFile.getFileFromPathAsync(fileName).then(
            function (storageFile) {
                Windows.Storage.FileIO.readBufferAsync(storageFile).done(
                    function (buffer) {
                        var strBase64 = Windows.Security.Cryptography.CryptographicBuffer.encodeToBase64String(buffer);
                        //the method encodeToBase64String will add "77u/" as a prefix, so we should remove it
                        if(String(strBase64).substr(0,4) == "77u/") {
                            strBase64 = strBase64.substr(4);
                        }
                        var mediaType = storageFile.contentType;
                        var result = "data:" + mediaType + ";base64," + strBase64;
                        win(result);
                    }
                );
            }, function () {
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    getDirectory:function(win,fail,args) {
        var fullPath = args[0];
        var path = args[1];
        var options = args[2];

        var flag = "";
        if (options !== null) {
            flag = new Flags(options.create, options.exclusive);
        } else {
            flag = new Flags(false, false);
        }

        Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(
            function (storageFolder) {
                if (flag.create === true && flag.exclusive === true) {
                    storageFolder.createFolderAsync(path, Windows.Storage.CreationCollisionOption.failIfExists).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail && fail(FileError.PATH_EXISTS_ERR);
                        }
                    );
                } else if (flag.create === true && flag.exclusive === false) {
                    storageFolder.createFolderAsync(path, Windows.Storage.CreationCollisionOption.openIfExists).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail && fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    );
                } else if (flag.create === false) {
                    if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(path)) {
                        fail && fail(FileError.ENCODING_ERR);
                        return;
                    }

                    storageFolder.getFolderAsync(path).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail && fail(FileError.NOT_FOUND_ERR);
                        }
                    );
                }
            }, function () {
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    remove:function(win,fail,args) {
        var fullPath = args[0];

        Windows.Storage.StorageFile.getFileFromPathAsync(fullPath).then(
            function (sFile) {
                Windows.Storage.StorageFile.getFileFromPathAsync(fullPath).done(function (storageFile) {
                    storageFile.deleteAsync().done(win, function () {
                        fail && fail(FileError.INVALID_MODIFICATION_ERR);

                    });
                });
            },
            function () {
                Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(
                    function (sFolder) {
                        var removeEntry = function () {
                            var storageFolderTop = null;

                            Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(
                                function (storageFolder) {
                                    // FileSystem root can't be removed!
                                    var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
                                    var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;
                                    if (fullPath == storageFolderPer.path || fullPath == storageFolderTem.path) {
                                        fail && fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                                        return;
                                    }
                                    storageFolderTop = storageFolder;
                                    return storageFolder.createFileQuery().getFilesAsync();
                                }, function () {
                                    fail && fail(FileError.INVALID_MODIFICATION_ERR);

                                }
                            // check sub-files.
                            ).then(function (fileList) {
                                if (fileList) {
                                    if (fileList.length === 0) {
                                        return storageFolderTop.createFolderQuery().getFoldersAsync();
                                    } else {
                                        fail && fail(FileError.INVALID_MODIFICATION_ERR);
                                    }
                                }
                            // check sub-folders.
                            }).then(function (folderList) {
                                if (folderList) {
                                    if (folderList.length === 0) {
                                        storageFolderTop.deleteAsync().done(win, function () {
                                            fail && fail(FileError.INVALID_MODIFICATION_ERR);

                                        });
                                    } else {
                                        fail && fail(FileError.INVALID_MODIFICATION_ERR);
                                    }
                                }

                            });
                        };
                        removeEntry();
                    }, function () {
                        fail && fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },

    removeRecursively:function(successCallback,fail,args) {
        var fullPath = args[0];

        Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).done(function (storageFolder) {
        var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
        var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;

        if (storageFolder.path == storageFolderPer.path || storageFolder.path == storageFolderTem.path) {
            fail && fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            return;
        }

        var removeFolders = function (path) {
            return new WinJS.Promise(function (complete) {
                var filePromiseArr = [];
                var storageFolderTop = null;
                Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(
                    function (storageFolder) {
                        var fileListPromise = storageFolder.createFileQuery().getFilesAsync();

                        storageFolderTop = storageFolder;
                        return fileListPromise;
                    }
                // remove all the files directly under the folder.
                ).then(function (fileList) {
                    if (fileList !== null) {
                        for (var i = 0; i < fileList.length; i++) {
                            var filePromise = fileList[i].deleteAsync();
                            filePromiseArr.push(filePromise);
                        }
                    }
                    WinJS.Promise.join(filePromiseArr).then(function () {
                        var folderListPromise = storageFolderTop.createFolderQuery().getFoldersAsync();
                        return folderListPromise;
                    // remove empty folders.
                    }).then(function (folderList) {
                        var folderPromiseArr = [];
                        if (folderList.length !== 0) {
                            for (var j = 0; j < folderList.length; j++) {

                                folderPromiseArr.push(removeFolders(folderList[j].path));
                            }
                            WinJS.Promise.join(folderPromiseArr).then(function () {
                                storageFolderTop.deleteAsync().then(complete);
                            });
                        } else {
                            storageFolderTop.deleteAsync().then(complete);
                        }
                    }, function () { });
                }, function () { });
            });
        };
        removeFolders(storageFolder.path).then(function () {
            Windows.Storage.StorageFolder.getFolderFromPathAsync(storageFolder.path).then(
                function () {},
                function () {
                    if (typeof successCallback !== 'undefined' && successCallback !== null) { successCallback(); }
                });
            });
        });
    },

    getFile:function(win,fail,args) {
        var fullPath = args[0];
        var path = args[1];
        var options = args[2];

        var flag = "";
        if (options !== null) {
            flag = new Flags(options.create, options.exclusive);
        } else {
            flag = new Flags(false, false);
        }

        Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(
            function (storageFolder) {
                if (flag.create === true && flag.exclusive === true) {
                    storageFolder.createFileAsync(path, Windows.Storage.CreationCollisionOption.failIfExists).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail && fail(FileError.PATH_EXISTS_ERR);
                        }
                    );
                } else if (flag.create === true && flag.exclusive === false) {
                    storageFolder.createFileAsync(path, Windows.Storage.CreationCollisionOption.openIfExists).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail && fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    );
                } else if (flag.create === false) {
                    if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(path)) {
                        fail && fail(FileError.ENCODING_ERR);
                        return;
                    }
                    storageFolder.getFileAsync(path).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail && fail(FileError.NOT_FOUND_ERR);
                        }
                    );
                }
            }, function () {
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    readEntries:function(win,fail,args) { // ["fullPath"]
        var path = args[0];

        var result = [];

        Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(function (storageFolder) {
            var promiseArr = [];
            var index = 0;
            promiseArr[index++] = storageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                if (fileList !== null) {
                    for (var i = 0; i < fileList.length; i++) {
                        result.push(new FileEntry(fileList[i].name, fileList[i].path));
                    }
                }
            });
            promiseArr[index++] = storageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                if (folderList !== null) {
                    for (var j = 0; j < folderList.length; j++) {
                        result.push(new FileEntry(folderList[j].name, folderList[j].path));
                    }
                }
            });
            WinJS.Promise.join(promiseArr).then(function () {
                win(result);
            });

        }, function () { fail && fail(FileError.NOT_FOUND_ERR); });
    },

    write:function(win,fail,args) {
        var fileName = args[0];
        var text = args[1];
        var position = args[2];

        Windows.Storage.StorageFile.getFileFromPathAsync(fileName).done(
            function (storageFile) {
                Windows.Storage.FileIO.writeTextAsync(storageFile,text,Windows.Storage.Streams.UnicodeEncoding.utf8).done(
                    function() {
                        win(String(text).length);
                    }, function () {
                        fail && fail(FileError.INVALID_MODIFICATION_ERR);
                    }
                );
            }, function() {
                fail && fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    truncate:function(win,fail,args) { // ["fileName","size"]
        var fileName = args[0];
        var size = args[1];

        Windows.Storage.StorageFile.getFileFromPathAsync(fileName).done(function(storageFile){
            //the current length of the file.
            var leng = 0;

            storageFile.getBasicPropertiesAsync().then(function (basicProperties) {
                leng = basicProperties.size;
                if (Number(size) >= leng) {
                    win(this.length);
                    return;
                }
                if (Number(size) >= 0) {
                    Windows.Storage.FileIO.readTextAsync(storageFile, Windows.Storage.Streams.UnicodeEncoding.utf8).then(function (fileContent) {
                        fileContent = fileContent.substr(0, size);
                        var fullPath = storageFile.path;
                        var name = storageFile.name;
                        var entry = new Entry(true, false, name, fullPath);
                        var parentPath = "";
                        var successCallBack = function (entry) {
                            parentPath = entry.fullPath;
                            storageFile.deleteAsync().then(function () {
                                return Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath);
                            }).then(function (storageFolder) {
                                storageFolder.createFileAsync(name).then(function (newStorageFile) {
                                    Windows.Storage.FileIO.writeTextAsync(newStorageFile, fileContent).done(function () {
                                        win(String(fileContent).length);
                                    }, function () {
                                        fail && fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                                    });
                                });
                            });
                        };
                        entry.getParent(successCallBack, null);
                    }, function () { fail && fail(FileError.NOT_FOUND_ERR); });
                }
            });
        }, function () { fail && fail(FileError.NOT_FOUND_ERR); });
    },

    copyTo:function(success,fail,args) { // ["fullPath","parent", "newName"]
        var srcPath = args[0];
        var parentFullPath = args[1];
        var name = args[2];

        //name can't be invalid
        if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(name)) {
            fail && fail(FileError.ENCODING_ERR);
            return;
        }
        // copy
        var copyFiles = "";
        Windows.Storage.StorageFile.getFileFromPathAsync(srcPath).then(
            function (sFile) {
                copyFiles = function (srcPath, parentPath) {
                    var storageFileTop = null;
                    Windows.Storage.StorageFile.getFileFromPathAsync(srcPath).then(function (storageFile) {
                        storageFileTop = storageFile;
                        return Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath);
                    }, function () {

                        fail && fail(FileError.NOT_FOUND_ERR);
                    }).then(function (storageFolder) {
                        storageFileTop.copyAsync(storageFolder, name, Windows.Storage.NameCollisionOption.failIfExists).then(function (storageFile) {

                            success(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {

                            fail && fail(FileError.INVALID_MODIFICATION_ERR);
                        });
                    }, function () {

                        fail && fail(FileError.NOT_FOUND_ERR);
                    });
                };
                var copyFinish = function (srcPath, parentPath) {
                    copyFiles(srcPath, parentPath);
                };
                copyFinish(srcPath, parentFullPath);
            },
            function () {
                Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(
                    function (sFolder) {
                        copyFiles = function (srcPath, parentPath) {
                            var coreCopy = function (storageFolderTop, complete) {
                                storageFolderTop.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                    var folderPromiseArr = [];
                                    if (folderList.length === 0) { complete(); }
                                    else {
                                        Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolderTarget) {
                                            var tempPromiseArr = [];
                                            var index = 0;
                                            for (var j = 0; j < folderList.length; j++) {
                                                tempPromiseArr[index++] = storageFolderTarget.createFolderAsync(folderList[j].name).then(function (targetFolder) {
                                                    folderPromiseArr.push(copyFiles(folderList[j].path, targetFolder.path));
                                                });
                                            }
                                            WinJS.Promise.join(tempPromiseArr).then(function () {
                                                WinJS.Promise.join(folderPromiseArr).then(complete);
                                            });
                                        });
                                    }
                                });
                            };

                            return new WinJS.Promise(function (complete) {
                                var storageFolderTop = null;
                                var filePromiseArr = [];
                                var fileListTop = null;
                                Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(function (storageFolder) {
                                    storageFolderTop = storageFolder;
                                    return storageFolder.createFileQuery().getFilesAsync();
                                }).then(function (fileList) {
                                    fileListTop = fileList;
                                    if (fileList) {
                                        return Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath);
                                    }
                                }).then(function (targetStorageFolder) {
                                    for (var i = 0; i < fileListTop.length; i++) {
                                        filePromiseArr.push(fileListTop[i].copyAsync(targetStorageFolder));
                                    }
                                    WinJS.Promise.join(filePromiseArr).then(function () {
                                        coreCopy(storageFolderTop, complete);
                                    });
                                });
                            });
                        };
                        var copyFinish = function (srcPath, parentPath) {
                            Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolder) {
                                storageFolder.createFolderAsync(name, Windows.Storage.CreationCollisionOption.openIfExists).then(function (newStorageFolder) {
                                    //can't copy onto itself
                                    if (srcPath == newStorageFolder.path) {
                                        fail && fail(FileError.INVALID_MODIFICATION_ERR);
                                        return;
                                    }
                                    //can't copy into itself
                                    if (srcPath == parentPath) {
                                        fail && fail(FileError.INVALID_MODIFICATION_ERR);
                                        return;
                                    }
                                    copyFiles(srcPath, newStorageFolder.path).then(function () {
                                        Windows.Storage.StorageFolder.getFolderFromPathAsync(newStorageFolder.path).done(
                                            function (storageFolder) {
                                                success(new DirectoryEntry(storageFolder.name, storageFolder.path));
                                            },
                                            function () { fail && fail(FileError.NOT_FOUND_ERR); }
                                        );
                                    });
                                }, function () { fail && fail(FileError.INVALID_MODIFICATION_ERR); });
                            }, function () { fail && fail(FileError.INVALID_MODIFICATION_ERR); });
                        };
                        copyFinish(srcPath, parentFullPath);
                    }, function () {
                        fail && fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },

    moveTo:function(success,fail,args) {
        var srcPath = args[0];
        var parentFullPath = args[1];
        var name = args[2];


        //name can't be invalid
        if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(name)) {
            fail && fail(FileError.ENCODING_ERR);
            return;
        }

        var moveFiles = "";
        Windows.Storage.StorageFile.getFileFromPathAsync(srcPath).then(
            function (sFile) {
                moveFiles = function (srcPath, parentPath) {
                    var storageFileTop = null;
                    Windows.Storage.StorageFile.getFileFromPathAsync(srcPath).then(function (storageFile) {
                        storageFileTop = storageFile;
                        return Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath);
                    }, function () {
                        fail && fail(FileError.NOT_FOUND_ERR);
                    }).then(function (storageFolder) {
                        storageFileTop.moveAsync(storageFolder, name, Windows.Storage.NameCollisionOption.replaceExisting).then(function () {
                            success(new FileEntry(name, storageFileTop.path));
                        }, function () {
                            fail && fail(FileError.INVALID_MODIFICATION_ERR);
                        });
                    }, function () {
                        fail && fail(FileError.NOT_FOUND_ERR);
                    });
                };
                var moveFinish = function (srcPath, parentPath) {
                    //can't copy onto itself
                    if (srcPath == parentPath + "\\" + name) {
                        fail && fail(FileError.INVALID_MODIFICATION_ERR);
                        return;
                    }
                    moveFiles(srcPath, parentFullPath);
                };
                moveFinish(srcPath, parentFullPath);
            },
            function () {
                Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(
                    function (sFolder) {
                        moveFiles = function (srcPath, parentPath) {
                            var coreMove = function (storageFolderTop, complete) {
                                storageFolderTop.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                    var folderPromiseArr = [];
                                    if (folderList.length === 0) {
                                        // If failed, we must cancel the deletion of folders & files.So here wo can't delete the folder.
                                        complete();
                                    }
                                    else {
                                        Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolderTarget) {
                                            var tempPromiseArr = [];
                                            var index = 0;
                                            for (var j = 0; j < folderList.length; j++) {
                                                tempPromiseArr[index++] = storageFolderTarget.createFolderAsync(folderList[j].name).then(function (targetFolder) {
                                                    folderPromiseArr.push(moveFiles(folderList[j].path, targetFolder.path));
                                                });
                                            }
                                            WinJS.Promise.join(tempPromiseArr).then(function () {
                                                WinJS.Promise.join(folderPromiseArr).then(complete);
                                            });
                                        });
                                    }
                                });
                            };
                            return new WinJS.Promise(function (complete) {
                                var storageFolderTop = null;
                                Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(function (storageFolder) {
                                    storageFolderTop = storageFolder;
                                    return storageFolder.createFileQuery().getFilesAsync();
                                }).then(function (fileList) {
                                    var filePromiseArr = [];
                                    Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (dstStorageFolder) {
                                        if (fileList) {
                                            for (var i = 0; i < fileList.length; i++) {
                                                filePromiseArr.push(fileList[i].moveAsync(dstStorageFolder));
                                            }
                                        }
                                        WinJS.Promise.join(filePromiseArr).then(function () {
                                            coreMove(storageFolderTop, complete);
                                        }, function () { });
                                    });
                                });
                            });
                        };
                        var moveFinish = function (srcPath, parentPath) {
                            var originFolderTop = null;
                            Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(function (originFolder) {
                                originFolderTop = originFolder;
                                return Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath);
                            }, function () {
                                fail && fail(FileError.INVALID_MODIFICATION_ERR);
                            }).then(function (storageFolder) {
                                return storageFolder.createFolderAsync(name, Windows.Storage.CreationCollisionOption.openIfExists);
                            }, function () {
                                fail && fail(FileError.INVALID_MODIFICATION_ERR);
                            }).then(function (newStorageFolder) {
                                //can't move onto directory that is not empty
                                newStorageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                                    newStorageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                        if (fileList.length !== 0 || folderList.length !== 0) {
                                            fail && fail(FileError.INVALID_MODIFICATION_ERR);
                                            return;
                                        }
                                        //can't copy onto itself
                                        if (srcPath == newStorageFolder.path) {
                                            fail && fail(FileError.INVALID_MODIFICATION_ERR);
                                            return;
                                        }
                                        //can't copy into itself
                                        if (srcPath == parentPath) {
                                            fail && fail(FileError.INVALID_MODIFICATION_ERR);
                                            return;
                                        }
                                        moveFiles(srcPath, newStorageFolder.path).then(function () {
                                            var successCallback = function () {
                                                success(new DirectoryEntry(name, newStorageFolder.path));
                                            };
                                            var temp = new DirectoryEntry(originFolderTop.name, originFolderTop.path).removeRecursively(successCallback, fail);

                                        }, function () { console.log("error!"); });
                                    });
                                });
                            }, function () { fail && fail(FileError.INVALID_MODIFICATION_ERR); });

                        };
                        moveFinish(srcPath, parentFullPath);
                    }, function () {
                        fail && fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },
    tempFileSystem:null,

    persistentFileSystem:null,

    requestFileSystem:function(win,fail,args) {
        var type = args[0];
        var size = args[1];

        var filePath = "";
        var result = null;
        var fsTypeName = "";

        switch (type) {
            case LocalFileSystem.TEMPORARY:
                filePath = Windows.Storage.ApplicationData.current.temporaryFolder.path;
                fsTypeName = "temporary";
                break;
            case LocalFileSystem.PERSISTENT:
                filePath = Windows.Storage.ApplicationData.current.localFolder.path;
                fsTypeName = "persistent";
                break;
        }

        var MAX_SIZE = 10000000000;
        if (size > MAX_SIZE) {
            fail && fail(FileError.QUOTA_EXCEEDED_ERR);
            return;
        }

        var fileSystem = new FileSystem(fsTypeName, new DirectoryEntry(fsTypeName, filePath));
        result = fileSystem;
        win(result);
    },

    resolveLocalFileSystemURI:function(success,fail,args) {
        var uri = args[0];

        var path = uri;

        // support for file name with parameters
        if (/\?/g.test(path)) {
            path = String(path).split("?")[0];
        }

        // support for encodeURI
        if (/\%5/g.test(path)) {
            path = decodeURI(path);
        }

        // support for special path start with file:///
        if (path.substr(0, 8) == "file:///") {
            path = Windows.Storage.ApplicationData.current.localFolder.path + "\\" + String(path).substr(8).split("/").join("\\");
            Windows.Storage.StorageFile.getFileFromPathAsync(path).then(
                function (storageFile) {
                    success(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(
                        function (storageFolder) {
                            success(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail && fail(FileError.NOT_FOUND_ERR);
                        }
                    );
                }
            );
        } else {
            Windows.Storage.StorageFile.getFileFromPathAsync(path).then(
                function (storageFile) {
                    success(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(
                        function (storageFolder) {
                            success(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail && fail(FileError.ENCODING_ERR);
                        }
                    );
                }
            );
        }
    }

};

require("cordova/commandProxy").add("File",module.exports);

});

// file: lib/windows8/plugin/windows8/FileTransferProxy.js
define("cordova/plugin/windows8/FileTransferProxy", function(require, exports, module) {


var FileTransferError = require('cordova/plugin/FileTransferError'),
    FileUploadResult = require('cordova/plugin/FileUploadResult'),
    FileEntry = require('cordova/plugin/FileEntry');

module.exports = {

    upload:function(successCallback, error, options) {
        var filePath = options[0];
        var server = options[1];


        var win = function (fileUploadResult) {
            successCallback(fileUploadResult);
        };

        if (filePath === null || typeof filePath === 'undefined') {
            error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }

        if (String(filePath).substr(0, 8) == "file:///") {
            filePath = Windows.Storage.ApplicationData.current.localFolder.path + String(filePath).substr(8).split("/").join("\\");
        }

        Windows.Storage.StorageFile.getFileFromPathAsync(filePath).then(function (storageFile) {
            storageFile.openAsync(Windows.Storage.FileAccessMode.read).then(function (stream) {
                var blob = MSApp.createBlobFromRandomAccessStream(storageFile.contentType, stream);
                var formData = new FormData();
                formData.append("source\";filename=\"" + storageFile.name + "\"", blob);
                WinJS.xhr({ type: "POST", url: server, data: formData }).then(function (response) {
                    var code = response.status;
                    storageFile.getBasicPropertiesAsync().done(function (basicProperties) {

                        Windows.Storage.FileIO.readBufferAsync(storageFile).done(function (buffer) {
                            var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
                            var fileContent = dataReader.readString(buffer.length);
                            dataReader.close();
                            win(new FileUploadResult(basicProperties.size, code, fileContent));

                        });

                    });
                }, function () {
                    error(FileTransferError.INVALID_URL_ERR);
                });
            });

        },function(){error(FileTransferError.FILE_NOT_FOUND_ERR);});
    },

    download:function(win, error, options) {
        var source = options[0];
        var target = options[1];


        if (target === null || typeof target === undefined) {
            error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }
        if (String(target).substr(0, 8) == "file:///") {
            target = Windows.Storage.ApplicationData.current.localFolder.path + String(target).substr(8).split("/").join("\\");
        }
        var path = target.substr(0, String(target).lastIndexOf("\\"));
        var fileName = target.substr(String(target).lastIndexOf("\\") + 1);
        if (path === null || fileName === null) {
            error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }

        var download = null;


        Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(function (storageFolder) {
            storageFolder.createFileAsync(fileName, Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (storageFile) {
                var uri = Windows.Foundation.Uri(source);
                var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();
                download = downloader.createDownload(uri, storageFile);
                download.startAsync().then(function () {
                    win(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    error(FileTransferError.INVALID_URL_ERR);
                });
            });
        });
    }
};

require("cordova/commandProxy").add("FileTransfer",module.exports);
});

// file: lib/windows8/plugin/windows8/MediaFile.js
define("cordova/plugin/windows8/MediaFile", function(require, exports, module) {

/*global Windows:true */

var MediaFileData = require('cordova/plugin/MediaFileData');
var CaptureError = require('cordova/plugin/CaptureError');

module.exports = {

    getFormatData: function (successCallback, errorCallback, args) {
        Windows.Storage.StorageFile.getFileFromPathAsync(this.fullPath).then(
            function (storageFile) {
                var mediaTypeFlag = String(storageFile.contentType).split("/")[0].toLowerCase();
                if (mediaTypeFlag === "audio") {
                    storageFile.properties.getMusicPropertiesAsync().then(
                        function (audioProperties) {
                            successCallback(new MediaFileData(null, audioProperties.bitrate, 0, 0, audioProperties.duration / 1000));
                        }, function () {
                            errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
                        }
                    );
                } else if (mediaTypeFlag === "video") {
                    storageFile.properties.getVideoPropertiesAsync().then(
                        function (videoProperties) {
                            successCallback(new MediaFileData(null, videoProperties.bitrate, videoProperties.height, videoProperties.width, videoProperties.duration / 1000));
                        }, function () {
                            errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
                        }
                    );
                } else if (mediaTypeFlag === "image") {
                    storageFile.properties.getImagePropertiesAsync().then(
                        function (imageProperties) {
                            successCallback(new MediaFileData(null, 0, imageProperties.height, imageProperties.width, 0));
                        }, function () {
                            errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
                        }
                    );
                } else {
                    errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
                }
            }, function () {
                errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
            }
        );
    }
};

});

// file: lib/windows8/plugin/windows8/MediaProxy.js
define("cordova/plugin/windows8/MediaProxy", function(require, exports, module) {

/*global Windows:true */

var cordova = require('cordova'),
    Media = require('cordova/plugin/Media');

var MediaError = require('cordova/plugin/MediaError');

module.exports = {
    mediaCaptureMrg:null,

    // Initiates the audio file
    create:function(win, lose, args) {
        var id = args[0];
        var src = args[1];
        var thisM = Media.get(id);
        Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_STARTING);

        Media.prototype.node = null;

        var fn = src.split('.').pop(); // gets the file extension
        if (thisM.node === null) {
            if (fn === 'mp3' || fn === 'wma' || fn === 'wma' ||
                fn === 'cda' || fn === 'adx' || fn === 'wm' ||
                fn === 'm3u' || fn === 'wmx') {
                thisM.node = new Audio(src);
                thisM.node.load();
                var dur = thisM.node.duration;
                if (isNaN(dur)) {
                    dur = -1;
                }
                Media.onStatus(id, Media.MEDIA_DURATION, dur);
            }
            else {
                lose && lose({code:MediaError.MEDIA_ERR_ABORTED});
            }
        }
    },

    // Start playing the audio
    startPlayingAudio:function(win, lose, args) {
        var id = args[0];
        //var src = args[1];
        //var options = args[2];
        Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_RUNNING);

        (Media.get(id)).node.play();
    },

    // Stops the playing audio
    stopPlayingAudio:function(win, lose, args) {
        var id = args[0];
        try {
            (Media.get(id)).node.pause();
            (Media.get(id)).node.currentTime = 0;
            Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_STOPPED);
            win();
        } catch (err) {
            lose("Failed to stop: "+err);
        }
    },

    // Seeks to the position in the audio
    seekToAudio:function(win, lose, args) {
        var id = args[0];
        var milliseconds = args[1];
        try {
            (Media.get(id)).node.currentTime = milliseconds / 1000;
            win();
        } catch (err) {
            lose("Failed to seek: "+err);
        }
    },

    // Pauses the playing audio
    pausePlayingAudio:function(win, lose, args) {
        var id = args[0];
        var thisM = Media.get(id);
        try {
            thisM.node.pause();
            Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_PAUSED);
        } catch (err) {
            lose("Failed to pause: "+err);
        }
    },

    // Gets current position in the audio
    getCurrentPositionAudio:function(win, lose, args) {
        var id = args[0];
        try {
            var p = (Media.get(id)).node.currentTime;
            Media.onStatus(id, Media.MEDIA_POSITION, p);
            win(p);
        } catch (err) {
            lose(err);
        }
    },

    // Start recording audio
    startRecordingAudio:function(win, lose, args) {
        var id = args[0];
        var src = args[1];
        // Initialize device
        Media.prototype.mediaCaptureMgr = null;
        var thisM = (Media.get(id));
        var captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
        captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audio;
        thisM.mediaCaptureMgr = new Windows.Media.Capture.MediaCapture();
        thisM.mediaCaptureMgr.addEventListener("failed", lose);

        thisM.mediaCaptureMgr.initializeAsync(captureInitSettings).done(function (result) {
            thisM.mediaCaptureMgr.addEventListener("recordlimitationexceeded", lose);
            thisM.mediaCaptureMgr.addEventListener("failed", lose);
        }, lose);
        // Start recording
        Windows.Storage.KnownFolders.musicLibrary.createFileAsync(src, Windows.Storage.CreationCollisionOption.replaceExisting).done(function (newFile) {
            var storageFile = newFile;
            var fileType = this.src.split('.').pop();
            var encodingProfile = null;
            switch (fileType) {
                case 'm4a':
                    encodingProfile = Windows.Media.MediaProperties.MediaEncodingProfile.createM4a(Windows.Media.MediaProperties.AudioEncodingQuality.auto);
                    break;
                case 'mp3':
                    encodingProfile = Windows.Media.MediaProperties.MediaEncodingProfile.createMp3(Windows.Media.MediaProperties.AudioEncodingQuality.auto);
                    break;
                case 'wma':
                    encodingProfile = Windows.Media.MediaProperties.MediaEncodingProfile.createWma(Windows.Media.MediaProperties.AudioEncodingQuality.auto);
                    break;
                default:
                    lose("Invalid file type for record");
                    break;
            }
            thisM.mediaCaptureMgr.startRecordToStorageFileAsync(encodingProfile, storageFile).done(win, lose);
        }, lose);
    },

    // Stop recording audio
    stopRecordingAudio:function(win, lose, args) {
        var id = args[0];
        var thisM = Media.get(id);
        thisM.mediaCaptureMgr.stopRecordAsync().done(win, lose);
    },

    // Release the media object
    release:function(win, lose, args) {
        var id = args[0];
        var thisM = Media.get(id);
        try {
            delete thisM.node;
        } catch (err) {
            lose("Failed to release: "+err);
        }
    },
    setVolume:function(win, lose, args) {
        var id = args[0];
        var volume = args[1];
        var thisM = Media.get(id);
        thisM.volume = volume;
    }
};

require("cordova/commandProxy").add("Media",module.exports);
});

// file: lib/windows8/plugin/windows8/NetworkStatusProxy.js
define("cordova/plugin/windows8/NetworkStatusProxy", function(require, exports, module) {

/*global Windows:true */

var cordova = require('cordova');
var Connection = require('cordova/plugin/Connection');

module.exports = {

    getConnectionInfo:function(win,fail,args)
    {
        console.log("NetworkStatusProxy::getConnectionInfo");
        var winNetConn = Windows.Networking.Connectivity;
        var networkInfo = winNetConn.NetworkInformation;
        var networkCostInfo = winNetConn.NetworkCostType;
        var networkConnectivityInfo = winNetConn.NetworkConnectivityLevel;
        var networkAuthenticationInfo = winNetConn.NetworkAuthenticationType;
        var networkEncryptionInfo = winNetConn.NetworkEncryptionType;

        var connectionType;

        var profile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();
        if(profile) {
            var conLevel = profile.getNetworkConnectivityLevel();
            var interfaceType = profile.networkAdapter.ianaInterfaceType;

            if (conLevel == Windows.Networking.Connectivity.NetworkConnectivityLevel.none) {
                connectionType = Connection.NONE;
            }
            else {
                switch (interfaceType) {
                    case 71:
                        connectionType = Connection.WIFI;
                        break;
                    case 6:
                        connectionType = Connection.ETHERNET;
                        break;
                    case 243: // (3GPP WWAN) // Fallthrough is intentional
                    case 244: // (3GPP2 WWAN)
                         connectionType = Connection.CELL_3G;
                         break;
                    default:
                        connectionType = Connection.UNKNOWN;
                        break;
                }
            }
        }
        // FYI
        //Connection.UNKNOWN  'Unknown connection';
        //Connection.ETHERNET 'Ethernet connection';
        //Connection.WIFI     'WiFi connection';
        //Connection.CELL_2G  'Cell 2G connection';
        //Connection.CELL_3G  'Cell 3G connection';
        //Connection.CELL_4G  'Cell 4G connection';
        //Connection.NONE     'No network connection';

        setTimeout(function () {
            if (connectionType) {
                win(connectionType);
            } else {
                win(Connection.NONE);
            }
        },0);
    }

};

require("cordova/commandProxy").add("NetworkStatus",module.exports);
});

// file: lib/windows8/plugin/windows8/NotificationProxy.js
define("cordova/plugin/windows8/NotificationProxy", function(require, exports, module) {

/*global Windows:true */

var cordova = require('cordova');

var isAlertShowing = false;
var alertStack = [];

module.exports = {
    alert:function(win, loseX, args) {

        if (isAlertShowing) {
            var later = function () {
                module.exports.alert(win, loseX, args);
            };
            alertStack.push(later);
            return;
        }
        isAlertShowing = true;

        var message = args[0];
        var _title = args[1];
        var _buttonLabel = args[2];

        var md = new Windows.UI.Popups.MessageDialog(message, _title);
        md.commands.append(new Windows.UI.Popups.UICommand(_buttonLabel));
        md.showAsync().then(function() {
            isAlertShowing = false;
            win && win();

            if (alertStack.length) {
                setTimeout(alertStack.shift(), 0);
            }

        });
    },

    confirm:function(win, loseX, args) {

        if (isAlertShowing) {
            var later = function () {
                module.exports.confirm(win, loseX, args);
            };
            alertStack.push(later);
            return;
        }

        isAlertShowing = true;

        var message = args[0];
        var _title = args[1];
        var _buttonLabels = args[2];

        var btnList = [];
        function commandHandler (command) {
            win && win(btnList[command.label]);
        }

        var md = new Windows.UI.Popups.MessageDialog(message, _title);
        var button = _buttonLabels.split(',');

        for (var i = 0; i<button.length; i++) {
            btnList[button[i]] = i+1;
            md.commands.append(new Windows.UI.Popups.UICommand(button[i],commandHandler));
        }
        md.showAsync().then(function() {
            isAlertShowing = false;
            if (alertStack.length) {
                setTimeout(alertStack.shift(), 0);
            }

        });
    },

    vibrate:function(winX, loseX, args) {
        var mills = args[0];

        //...
    },

    beep:function(winX, loseX, args) {
        var count = args[0];
        /*
        var src = //filepath//
        var playTime = 500; // ms
        var quietTime = 1000; // ms
        var media = new Media(src, function(){});
        var hit = 1;
        var intervalId = window.setInterval( function () {
            media.play();
            sleep(playTime);
            media.stop();
            media.seekTo(0);
            if (hit < count) {
                hit++;
            } else {
                window.clearInterval(intervalId);
            }
        }, playTime + quietTime); */
    }
};

require("cordova/commandProxy").add("Notification",module.exports);
});

// file: lib/windows8/plugin/windows8/console.js
define("cordova/plugin/windows8/console", function(require, exports, module) {


if(!console || !console.log)
{
    var exec = require('cordova/exec');

    var debugConsole = {
        log:function(msg){
            exec(null,null,"DebugConsole","log",msg);
        },
        warn:function(msg){
            exec(null,null,"DebugConsole","warn",msg);
        },
        error:function(msg){
            exec(null,null,"DebugConsole","error",msg);
        }
    };

    module.exports = debugConsole;
}
else if(console && console.log) {

  console.log("console.log exists already!");
  console.warn = console.warn || function(msg){console.log("warn:"+msg);};
  console.error = console.error || function(msg){console.log("error:"+msg);};
}

});

// file: lib/windows8/plugin/windows8/console/symbols.js
define("cordova/plugin/windows8/console/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/windows8/console', 'navigator.console');

});

// file: lib/windows8/plugin/windows8/notification/plugininit.js
define("cordova/plugin/windows8/notification/plugininit", function(require, exports, module) {

window.alert = window.alert || require("cordova/plugin/notification").alert;
window.confirm = window.confirm || require("cordova/plugin/notification").confirm;


});

// file: lib/common/pluginloader.js
define("cordova/pluginloader", function(require, exports, module) {

var channel = require('cordova/channel');
var modulemapper = require('cordova/modulemapper');

// Helper function to inject a <script> tag.
function injectScript(url, onload, onerror) {
    var script = document.createElement("script");
    // onload fires even when script fails loads with an error.
    script.onload = onload;
    script.onerror = onerror || onload;
    script.src = url;
    document.head.appendChild(script);
}

function onScriptLoadingComplete(moduleList) {
    // Loop through all the plugins and then through their clobbers and merges.
    for (var i = 0, module; module = moduleList[i]; i++) {
        if (module) {
            try {
                if (module.clobbers && module.clobbers.length) {
                    for (var j = 0; j < module.clobbers.length; j++) {
                        modulemapper.clobbers(module.id, module.clobbers[j]);
                    }
                }

                if (module.merges && module.merges.length) {
                    for (var k = 0; k < module.merges.length; k++) {
                        modulemapper.merges(module.id, module.merges[k]);
                    }
                }

                // Finally, if runs is truthy we want to simply require() the module.
                // This can be skipped if it had any merges or clobbers, though,
                // since the mapper will already have required the module.
                if (module.runs && !(module.clobbers && module.clobbers.length) && !(module.merges && module.merges.length)) {
                    modulemapper.runs(module.id);
                }
            }
            catch(err) {
                // error with module, most likely clobbers, should we continue?
            }
        }
    }

    finishPluginLoading();
}

// Called when:
// * There are plugins defined and all plugins are finished loading.
// * There are no plugins to load.
function finishPluginLoading() {
    channel.onPluginsReady.fire();
}

// Handler for the cordova_plugins.js content.
// See plugman's plugin_loader.js for the details of this object.
// This function is only called if the really is a plugins array that isn't empty.
// Otherwise the onerror response handler will just call finishPluginLoading().
function handlePluginsObject(path, moduleList) {
    // Now inject the scripts.
    var scriptCounter = moduleList.length;

    if (!scriptCounter) {
        finishPluginLoading();
        return;
    }
    function scriptLoadedCallback() {
        if (!--scriptCounter) {
            onScriptLoadingComplete(moduleList);
        }
    }

    for (var i = 0; i < moduleList.length; i++) {
        injectScript(path + moduleList[i].file, scriptLoadedCallback);
    }
}

function injectPluginScript(pathPrefix) {
    injectScript(pathPrefix + 'cordova_plugins.js', function(){
        try {
            var moduleList = require("cordova/plugin_list");
            handlePluginsObject(pathPrefix, moduleList);
        } catch (e) {
            // Error loading cordova_plugins.js, file not found or something
            // this is an acceptable error, pre-3.0.0, so we just move on.
            finishPluginLoading();
        }
    },finishPluginLoading); // also, add script load error handler for file not found
}

function findCordovaPath() {
    var path = null;
    var scripts = document.getElementsByTagName('script');
    var term = 'cordova.js';
    for (var n = scripts.length-1; n>-1; n--) {
        var src = scripts[n].src;
        if (src.indexOf(term) == (src.length - term.length)) {
            path = src.substring(0, src.length - term.length);
            break;
        }
    }
    return path;
}

// Tries to load all plugins' js-modules.
// This is an async process, but onDeviceReady is blocked on onPluginsReady.
// onPluginsReady is fired when there are no plugins to load, or they are all done.
exports.load = function() {
    var pathPrefix = findCordovaPath();
    if (pathPrefix === null) {
        console.log('Could not find cordova.js script tag. Plugin loading may fail.');
        pathPrefix = '';
    }
    injectPluginScript(pathPrefix);
};


});

// file: lib/common/symbols.js
define("cordova/symbols", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

// Use merges here in case others symbols files depend on this running first,
// but fail to declare the dependency with a require().
modulemapper.merges('cordova', 'cordova');
modulemapper.clobbers('cordova/exec', 'cordova.exec');
modulemapper.clobbers('cordova/exec', 'Cordova.exec');

});

// file: lib/common/utils.js
define("cordova/utils", function(require, exports, module) {

var utils = exports;

/**
 * Defines a property getter / setter for obj[key].
 */
utils.defineGetterSetter = function(obj, key, getFunc, opt_setFunc) {
    if (Object.defineProperty) {
        var desc = {
            get: getFunc,
            configurable: true
        };
        if (opt_setFunc) {
            desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
    } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
            obj.__defineSetter__(key, opt_setFunc);
        }
    }
};

/**
 * Defines a property getter for obj[key].
 */
utils.defineGetter = utils.defineGetterSetter;

utils.arrayIndexOf = function(a, item) {
    if (a.indexOf) {
        return a.indexOf(item);
    }
    var len = a.length;
    for (var i = 0; i < len; ++i) {
        if (a[i] == item) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns whether the item was found in the array.
 */
utils.arrayRemove = function(a, item) {
    var index = utils.arrayIndexOf(a, item);
    if (index != -1) {
        a.splice(index, 1);
    }
    return index != -1;
};

utils.typeName = function(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = function(a) {
    return utils.typeName(a) == 'Array';
};

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function(d) {
    return utils.typeName(d) == 'Date';
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function(obj) {
    if(!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
        return obj;
    }

    var retVal, i;

    if(utils.isArray(obj)){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function(context, func, params) {
    if (typeof params == 'undefined') {
        return function() {
            return func.apply(context, arguments);
        };
    } else {
        return function() {
            return func.apply(context, params);
        };
    }
};

/**
 * Create a UUID
 */
utils.createUUID = function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function() {
    // proxy used to establish prototype chain
    var F = function() {};
    // extend Child from Parent
    return function(Child, Parent) {
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function(msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};


//------------------------------------------------------------------------------
function UUIDcreatePart(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}


});

window.cordova = require('cordova');
// file: lib/scripts/bootstrap.js

(function (context) {
    if (context._cordovaJsLoaded) {
        throw new Error('cordova.js included multiple times.');
    }
    context._cordovaJsLoaded = true;

    var channel = require('cordova/channel');
    var pluginloader = require('cordova/pluginloader');

    var platformInitChannelsArray = [channel.onNativeReady, channel.onPluginsReady];

    function logUnfiredChannels(arr) {
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i].state != 2) {
                console.log('Channel not fired: ' + arr[i].type);
            }
        }
    }

    window.setTimeout(function() {
        if (channel.onDeviceReady.state != 2) {
            console.log('deviceready has not fired after 5 seconds.');
            logUnfiredChannels(platformInitChannelsArray);
            logUnfiredChannels(channel.deviceReadyChannelsArray);
        }
    }, 5000);

    // Replace navigator before any modules are required(), to ensure it happens as soon as possible.
    // We replace it so that properties that can't be clobbered can instead be overridden.
    function replaceNavigator(origNavigator) {
        var CordovaNavigator = function() {};
        CordovaNavigator.prototype = origNavigator;
        var newNavigator = new CordovaNavigator();
        // This work-around really only applies to new APIs that are newer than Function.bind.
        // Without it, APIs such as getGamepads() break.
        if (CordovaNavigator.bind) {
            for (var key in origNavigator) {
                if (typeof origNavigator[key] == 'function') {
                    newNavigator[key] = origNavigator[key].bind(origNavigator);
                }
            }
        }
        return newNavigator;
    }
    if (context.navigator) {
        context.navigator = replaceNavigator(context.navigator);
    }

    // _nativeReady is global variable that the native side can set
    // to signify that the native code is ready. It is a global since
    // it may be called before any cordova JS is ready.
    if (window._nativeReady) {
        channel.onNativeReady.fire();
    }

    /**
     * Create all cordova objects once native side is ready.
     */
    channel.join(function() {
        // Call the platform-specific initialization
        require('cordova/platform').initialize();

        // Fire event to notify that all objects are created
        channel.onCordovaReady.fire();

        // Fire onDeviceReady event once page has fully loaded, all
        // constructors have run and cordova info has been received from native
        // side.
        // This join call is deliberately made after platform.initialize() in
        // order that plugins may manipulate channel.deviceReadyChannelsArray
        // if necessary.
        channel.join(function() {
            require('cordova').fireDocumentEvent('deviceready');
        }, channel.deviceReadyChannelsArray);

    }, platformInitChannelsArray);

    // Don't attempt to load when running unit tests.
    if (typeof XMLHttpRequest != 'undefined') {
        pluginloader.load();
    }
}(window));

// file: lib/scripts/bootstrap-windows8.js

require('cordova/channel').onNativeReady.fire();

})();
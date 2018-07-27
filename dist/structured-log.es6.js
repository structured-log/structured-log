/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
if (typeof Object.assign != 'function') {
    Object.assign = function (target, varArgs) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

/**
 * Represents the severity level of a log event.
 */
var LogEventLevel;
(function (LogEventLevel) {
    LogEventLevel[LogEventLevel["off"] = 0] = "off";
    LogEventLevel[LogEventLevel["fatal"] = 1] = "fatal";
    LogEventLevel[LogEventLevel["error"] = 3] = "error";
    LogEventLevel[LogEventLevel["warning"] = 7] = "warning";
    LogEventLevel[LogEventLevel["information"] = 15] = "information";
    LogEventLevel[LogEventLevel["debug"] = 31] = "debug";
    LogEventLevel[LogEventLevel["verbose"] = 63] = "verbose";
})(LogEventLevel || (LogEventLevel = {}));
/**
 * Checks if a log event level includes the target log event level.
 * @param {LogEventLevel} level The level to check.
 * @param {LogEventLevel} target The target level.
 * @returns True if the checked level contains the target level, or if the checked level is undefined.
 */
function isEnabled(level, target) {
    return typeof level === 'undefined' || (level & target) === target;
}
/**
 * Represents a log event.
 */
var LogEvent = /** @class */ (function () {
    /**
     * Creates a new log event instance.
     */
    function LogEvent(timestamp, level, messageTemplate, properties, error) {
        this.timestamp = timestamp;
        this.level = level;
        this.messageTemplate = messageTemplate;
        this.properties = properties || {};
        this.error = error || null;
    }
    return LogEvent;
}());

var tokenizer = /\{@?\w+}/g;
/**
 * Represents a message template that can be rendered into a log message.
 */
var MessageTemplate = /** @class */ (function () {
    /**
     * Creates a new MessageTemplate instance with the given template.
     */
    function MessageTemplate(messageTemplate) {
        if (messageTemplate === null || !messageTemplate.length) {
            throw new Error('Argument "messageTemplate" is required.');
        }
        this.raw = messageTemplate;
        this.tokens = this.tokenize(messageTemplate);
    }
    /**
     * Renders this template using the given properties.
     * @param {Object} properties Object containing the properties.
     * @returns Rendered message.
     */
    MessageTemplate.prototype.render = function (properties) {
        if (!this.tokens.length) {
            return this.raw;
        }
        properties = properties || {};
        var result = [];
        for (var i = 0; i < this.tokens.length; ++i) {
            var token = this.tokens[i];
            if (typeof token.name === 'string') {
                if (properties.hasOwnProperty(token.name)) {
                    result.push(this.toText(properties[token.name]));
                }
                else {
                    result.push(token.raw);
                }
            }
            else {
                result.push(token.text);
            }
        }
        return result.join('');
    };
    /**
     * Binds the given set of args to their matching tokens.
     * @param {any} positionalArgs Arguments.
     * @returns Object containing the properties.
     */
    MessageTemplate.prototype.bindProperties = function (positionalArgs) {
        var result = {};
        var nextArg = 0;
        for (var i = 0; i < this.tokens.length && nextArg < positionalArgs.length; ++i) {
            var token = this.tokens[i];
            if (typeof token.name === 'string') {
                var p = positionalArgs[nextArg];
                result[token.name] = this.capture(p, token.destructure);
                nextArg++;
            }
        }
        while (nextArg < positionalArgs.length) {
            var arg = positionalArgs[nextArg];
            if (typeof arg !== 'undefined') {
                result['a' + nextArg] = this.capture(arg);
            }
            nextArg++;
        }
        return result;
    };
    MessageTemplate.prototype.tokenize = function (template) {
        var tokens = [];
        var result;
        var textStart;
        while ((result = tokenizer.exec(template)) !== null) {
            if (result.index !== textStart) {
                tokens.push({ text: template.slice(textStart, result.index) });
            }
            var destructure = false;
            var token = result[0].slice(1, -1);
            if (token.indexOf('@') === 0) {
                token = token.slice(1);
                destructure = true;
            }
            tokens.push({
                name: token,
                destructure: destructure,
                raw: result[0]
            });
            textStart = tokenizer.lastIndex;
        }
        if (textStart >= 0 && textStart < template.length) {
            tokens.push({ text: template.slice(textStart) });
        }
        return tokens;
    };
    MessageTemplate.prototype.toText = function (property) {
        if (typeof property === 'undefined') {
            return 'undefined';
        }
        if (property === null) {
            return 'null';
        }
        if (typeof property === 'string') {
            return property;
        }
        if (typeof property === 'number') {
            return property.toString();
        }
        if (typeof property === 'boolean') {
            return property.toString();
        }
        if (typeof property.toISOString === 'function') {
            return property.toISOString();
        }
        if (typeof property === 'object') {
            var s = JSON.stringify(property);
            if (s.length > 70) {
                s = s.slice(0, 67) + '...';
            }
            return s;
        }
        return property.toString();
    };
    
    MessageTemplate.prototype.capture = function (property, destructure) {
        if (typeof property === 'function') {
            return property.toString();
        }
        if (typeof property === 'object') {
            // null value will be automatically stringified as "null", in properties it will be as null
            // otherwise it will throw an error
            if (property === null) {
                return property;
            }
            // Could use instanceof Date, but this way will be kinder
            // to values passed from other contexts...
            if (destructure || typeof property.toISOString === 'function') {
                return property;
            }
            return property.toString();
        }
        return property;
    };
    return MessageTemplate;
}());

/**
 * Logs events.
 */
var Logger = /** @class */ (function () {
    /**
     * Creates a new logger instance using the specified pipeline.
     */
    function Logger(pipeline, suppressErrors) {
        this.suppressErrors = true;
        this.pipeline = pipeline;
        this.suppressErrors = typeof suppressErrors === 'undefined' || suppressErrors;
    }
    Logger.prototype.fatal = function (errorOrMessageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        try {
            if (errorOrMessageTemplate instanceof Error) {
                this.write(LogEventLevel.fatal, properties[0], properties.slice(1), errorOrMessageTemplate);
            }
            else {
                this.write(LogEventLevel.fatal, errorOrMessageTemplate, properties);
            }
        }
        catch (error) {
            if (!this.suppressErrors) {
                throw error;
            }
        }
    };
    Logger.prototype.error = function (errorOrMessageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        try {
            if (errorOrMessageTemplate instanceof Error) {
                this.write(LogEventLevel.error, properties[0], properties.slice(1), errorOrMessageTemplate);
            }
            else {
                this.write(LogEventLevel.error, errorOrMessageTemplate, properties);
            }
        }
        catch (error) {
            if (!this.suppressErrors) {
                throw error;
            }
        }
    };
    Logger.prototype.warn = function (errorOrMessageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        try {
            if (errorOrMessageTemplate instanceof Error) {
                this.write(LogEventLevel.warning, properties[0], properties.slice(1), errorOrMessageTemplate);
            }
            else {
                this.write(LogEventLevel.warning, errorOrMessageTemplate, properties);
            }
        }
        catch (error) {
            if (!this.suppressErrors) {
                throw error;
            }
        }
    };
    Logger.prototype.info = function (errorOrMessageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        try {
            if (errorOrMessageTemplate instanceof Error) {
                this.write(LogEventLevel.information, properties[0], properties.slice(1), errorOrMessageTemplate);
            }
            else {
                this.write(LogEventLevel.information, errorOrMessageTemplate, properties);
            }
        }
        catch (error) {
            if (!this.suppressErrors) {
                throw error;
            }
        }
    };
    Logger.prototype.debug = function (errorOrMessageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        try {
            if (errorOrMessageTemplate instanceof Error) {
                this.write(LogEventLevel.debug, properties[0], properties.slice(1), errorOrMessageTemplate);
            }
            else {
                this.write(LogEventLevel.debug, errorOrMessageTemplate, properties);
            }
        }
        catch (error) {
            if (!this.suppressErrors) {
                throw error;
            }
        }
    };
    Logger.prototype.verbose = function (errorOrMessageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        try {
            if (errorOrMessageTemplate instanceof Error) {
                this.write(LogEventLevel.verbose, properties[0], properties.slice(1), errorOrMessageTemplate);
            }
            else {
                this.write(LogEventLevel.verbose, errorOrMessageTemplate, properties);
            }
        }
        catch (error) {
            if (!this.suppressErrors) {
                throw error;
            }
        }
    };
    /**
     * Flushes the pipeline of this logger.
     * @returns A {Promise<any>} that will resolve when the pipeline has been flushed.
     */
    Logger.prototype.flush = function () {
        return this.suppressErrors
            ? this.pipeline.flush().catch(function () { })
            : this.pipeline.flush();
    };
    /**
     * Emits events through this logger's pipeline.
     */
    Logger.prototype.emit = function (events) {
        try {
            this.pipeline.emit(events);
            return events;
        }
        catch (error) {
            if (!this.suppressErrors) {
                throw error;
            }
        }
    };
    Logger.prototype.write = function (level, rawMessageTemplate, unboundProperties, error) {
        var messageTemplate = new MessageTemplate(rawMessageTemplate);
        var properties = messageTemplate.bindProperties(unboundProperties);
        var logEvent = new LogEvent(new Date().toISOString(), level, messageTemplate, properties, error);
        this.pipeline.emit([logEvent]);
    };
    return Logger;
}());

var ConsoleSink = /** @class */ (function () {
    function ConsoleSink(options) {
        this.options = options || {};
        var internalConsole = this.options.console || typeof console !== 'undefined' && console || null;
        var stub = function () { };
        // console.debug is no-op for Node, so use console.log instead.
        var nodeConsole = !this.options.console &&
            typeof process !== 'undefined' &&
            process.versions &&
            process.versions.node;
        this.console = {
            error: (internalConsole && (internalConsole.error || internalConsole.log)) || stub,
            warn: (internalConsole && (internalConsole.warn || internalConsole.log)) || stub,
            info: (internalConsole && (internalConsole.info || internalConsole.log)) || stub,
            debug: (internalConsole && ((!nodeConsole && internalConsole.debug) || internalConsole.log)) || stub,
            log: (internalConsole && internalConsole.log) || stub
        };
    }
    ConsoleSink.prototype.emit = function (events) {
        for (var i = 0; i < events.length; ++i) {
            var e = events[i];
            if (!isEnabled(this.options.restrictedToMinimumLevel, e.level))
                continue;
            switch (e.level) {
                case LogEventLevel.fatal:
                    this.writeToConsole(this.console.error, 'Fatal', e);
                    break;
                case LogEventLevel.error:
                    this.writeToConsole(this.console.error, 'Error', e);
                    break;
                case LogEventLevel.warning:
                    this.writeToConsole(this.console.warn, 'Warning', e);
                    break;
                case LogEventLevel.information:
                    this.writeToConsole(this.console.info, 'Information', e);
                    break;
                case LogEventLevel.debug:
                    this.writeToConsole(this.console.debug, 'Debug', e);
                    break;
                case LogEventLevel.verbose:
                    this.writeToConsole(this.console.debug, 'Verbose', e);
                    break;
                default:
                    this.writeToConsole(this.console.log, 'Log', e);
                    break;
            }
        }
    };
    ConsoleSink.prototype.flush = function () {
        return Promise.resolve();
    };
    ConsoleSink.prototype.writeToConsole = function (logMethod, prefix, e) {
        var output = "[" + prefix + "] " + e.messageTemplate.render(e.properties);
        if (this.options.includeTimestamps) {
            output = e.timestamp + " " + output;
        }
        var values = [];
        if (this.options.includeProperties) {
            for (var key in e.properties) {
                if (e.properties.hasOwnProperty(key)) {
                    values.push(e.properties[key]);
                }
            }
        }
        if (e.error instanceof Error) {
            values.push('\n', e.error);
        }
        logMethod.apply(void 0, [output].concat(values));
    };
    return ConsoleSink;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var defaultBatchedSinkOptions = {
    maxSize: 100,
    period: 5,
    durableStore: null
};
var BatchedSink = /** @class */ (function () {
    function BatchedSink(innerSink, options) {
        this.durableStorageKey = 'structured-log-batched-sink-durable-cache';
        this.innerSink = innerSink || null;
        this.options = __assign({}, defaultBatchedSinkOptions, (options || {}));
        this.batchedEvents = [];
        this.cycleBatch();
        if (this.options.durableStore) {
            var initialBatch = [];
            for (var key in this.options.durableStore) {
                if (key.indexOf(this.durableStorageKey) === 0) {
                    var storedEvents = JSON.parse(this.options.durableStore.getItem(key))
                        .map(function (e) {
                        e.messageTemplate = new MessageTemplate(e.messageTemplate.raw);
                        return e;
                    });
                    initialBatch = initialBatch.concat(storedEvents);
                    this.options.durableStore.removeItem(key);
                }
            }
            this.emit(initialBatch);
        }
    }
    BatchedSink.prototype.emit = function (events) {
        if (this.batchedEvents.length + events.length <= this.options.maxSize) {
            (_a = this.batchedEvents).push.apply(_a, events);
            this.storeEvents();
        }
        else {
            var cursor = this.options.maxSize - this.batchedEvents.length < 0 ? 0 :
                this.options.maxSize - this.batchedEvents.length;
            (_b = this.batchedEvents).push.apply(_b, events.slice(0, cursor));
            this.storeEvents();
            while (cursor < events.length) {
                this.cycleBatch();
                (_c = this.batchedEvents).push.apply(_c, events.slice(cursor, cursor = cursor + this.options.maxSize));
                this.storeEvents();
            }
        }
        return events;
        var _a, _b, _c;
    };
    BatchedSink.prototype.flush = function () {
        this.cycleBatch();
        var corePromise = this.flushCore();
        return corePromise instanceof Promise ? corePromise : Promise.resolve();
    };
    BatchedSink.prototype.emitCore = function (events) {
        return this.innerSink.emit(events);
    };
    BatchedSink.prototype.flushCore = function () {
        return this.innerSink.flush();
    };
    BatchedSink.prototype.cycleBatch = function () {
        var _this = this;
        clearTimeout(this.batchTimeout);
        if (this.batchedEvents.length) {
            var processEvents = this.batchedEvents.slice(0);
            this.batchedEvents.length = 0;
            var emitPromise = this.emitCore(processEvents);
            (emitPromise instanceof Promise ? emitPromise : Promise.resolve())
                .then(function () {
                if (_this.options.durableStore) {
                    var previousBatchKey = _this.batchKey;
                    return _this.options.durableStore.removeItem(previousBatchKey);
                }
            }).catch(function () {
                (_a = _this.batchedEvents).unshift.apply(_a, processEvents);
                var _a;
            });
        }
        this.batchKey = this.durableStorageKey + "-" + new Date().getTime();
        if (!isNaN(this.options.period) && this.options.period > 0) {
            this.batchTimeout = setTimeout(function () { return _this.cycleBatch(); }, this.options.period * 1000);
        }
    };
    BatchedSink.prototype.storeEvents = function () {
        if (this.options.durableStore) {
            this.options.durableStore.setItem(this.batchKey, JSON.stringify(this.batchedEvents));
        }
    };
    return BatchedSink;
}());

var FilterStage = /** @class */ (function () {
    function FilterStage(predicate) {
        this.predicate = predicate;
    }
    FilterStage.prototype.emit = function (events) {
        return events.filter(this.predicate);
    };
    FilterStage.prototype.flush = function () {
        return Promise.resolve();
    };
    return FilterStage;
}());

/**
 * Allows dynamic control of the logging level.
 */
var DynamicLevelSwitch = /** @class */ (function () {
    function DynamicLevelSwitch() {
        this.minLevel = null;
        /**
         * Gets or sets a delegate that can be called when the pipeline needs to be flushed.
         * This should generally not be modified, as it will be provided by the pipeline stage.
         */
        this.flushDelegate = function () { return Promise.resolve(); };
    }
    DynamicLevelSwitch.prototype.fatal = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = LogEventLevel.fatal; });
    };
    DynamicLevelSwitch.prototype.error = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = LogEventLevel.error; });
    };
    DynamicLevelSwitch.prototype.warning = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = LogEventLevel.warning; });
    };
    DynamicLevelSwitch.prototype.information = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = LogEventLevel.information; });
    };
    DynamicLevelSwitch.prototype.debug = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = LogEventLevel.debug; });
    };
    DynamicLevelSwitch.prototype.verbose = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = LogEventLevel.verbose; });
    };
    DynamicLevelSwitch.prototype.off = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = LogEventLevel.off; });
    };
    DynamicLevelSwitch.prototype.isEnabled = function (level) {
        return this.minLevel === null || isEnabled(this.minLevel, level);
    };
    return DynamicLevelSwitch;
}());
var DynamicLevelSwitchStage = /** @class */ (function (_super) {
    __extends(DynamicLevelSwitchStage, _super);
    function DynamicLevelSwitchStage(dynamicLevelSwitch) {
        var _this = _super.call(this, function (e) { return dynamicLevelSwitch.isEnabled(e.level); }) || this;
        _this.dynamicLevelSwitch = dynamicLevelSwitch;
        return _this;
    }
    /**
     * Sets a delegate that can be called when the pipeline needs to be flushed.
     */
    DynamicLevelSwitchStage.prototype.setFlushDelegate = function (flushDelegate) {
        this.dynamicLevelSwitch.flushDelegate = flushDelegate;
    };
    return DynamicLevelSwitchStage;
}(FilterStage));

var Pipeline = /** @class */ (function () {
    function Pipeline() {
        this.stages = [];
        this.eventQueue = [];
        this.flushInProgress = false;
    }
    /**
     * Adds a stage to the end of the pipeline.
     * @param {PipelineStage} stage The pipeline stage to add.
     */
    Pipeline.prototype.addStage = function (stage) {
        this.stages.push(stage);
    };
    /**
     * Emits events through the pipeline. If a flush is currently in progress, the events will be queued and will been
     * sent through the pipeline once the flush is complete.
     * @param {LogEvent[]} events The events to emit.
     */
    Pipeline.prototype.emit = function (events) {
        var _this = this;
        if (this.flushInProgress) {
            this.eventQueue = this.eventQueue.concat(events);
            return this.flushPromise;
        }
        else {
            if (!this.stages.length || !events.length) {
                return Promise.resolve();
            }
            var promise = Promise.resolve(this.stages[0].emit(events));
            var _loop_1 = function (i) {
                promise = promise.then(function (events) { return _this.stages[i].emit(events); });
            };
            for (var i = 1; i < this.stages.length; ++i) {
                _loop_1(i);
            }
            return promise;
        }
    };
    /**
     * Flushes events through the pipeline.
     * @returns A {Promise<any>} that resolves when all events have been flushed and the pipeline can accept new events.
     */
    Pipeline.prototype.flush = function () {
        var _this = this;
        if (this.flushInProgress) {
            return this.flushPromise;
        }
        this.flushInProgress = true;
        return this.flushPromise = Promise.resolve()
            .then(function () {
            if (_this.stages.length === 0) {
                return;
            }
            var promise = _this.stages[0].flush();
            var _loop_2 = function (i) {
                promise = promise.then(function () { return _this.stages[i].flush(); });
            };
            for (var i = 1; i < _this.stages.length; ++i) {
                _loop_2(i);
            }
            return promise;
        })
            .then(function () {
            _this.flushInProgress = false;
            var queuedEvents = _this.eventQueue.slice();
            _this.eventQueue = [];
            return _this.emit(queuedEvents);
        });
    };
    return Pipeline;
}());

var SinkStage = /** @class */ (function () {
    function SinkStage(sink) {
        this.sink = sink;
    }
    SinkStage.prototype.emit = function (events) {
        this.sink.emit(events);
        return events;
    };
    SinkStage.prototype.flush = function () {
        return this.sink.flush();
    };
    return SinkStage;
}());

var deepClone = function (obj) { return JSON.parse(JSON.stringify(obj)); };
var EnrichStage = /** @class */ (function () {
    function EnrichStage(enricher) {
        this.enricher = enricher;
    }
    EnrichStage.prototype.emit = function (events) {
        for (var i = 0; i < events.length; ++i) {
            var extraProperties = this.enricher instanceof Function
                ? this.enricher(deepClone(events[i].properties))
                : this.enricher;
            Object.assign(events[i].properties, extraProperties);
        }
        return events;
    };
    EnrichStage.prototype.flush = function () {
        return Promise.resolve();
    };
    return EnrichStage;
}());

/**
 * Configures pipelines for new logger instances.
 */
var LoggerConfiguration = /** @class */ (function () {
    function LoggerConfiguration() {
        var _this = this;
        /**
         * Sets the minimum level for any subsequent stages in the pipeline.
         */
        this.minLevel = Object.assign(function (levelOrSwitch) {
            if (typeof levelOrSwitch === 'undefined' || levelOrSwitch === null) {
                throw new TypeError('Argument "levelOrSwitch" is not a valid LogEventLevel value or DynamicLevelSwitch instance.');
            }
            else if (levelOrSwitch instanceof DynamicLevelSwitch) {
                var switchStage = new DynamicLevelSwitchStage(levelOrSwitch);
                switchStage.setFlushDelegate(function () { return _this.pipeline.flush(); });
                _this.pipeline.addStage(switchStage);
                return _this;
            }
            else if (typeof levelOrSwitch === 'string') {
                var level_1 = LogEventLevel[levelOrSwitch.toLowerCase()];
                if (typeof level_1 === 'undefined' || level_1 === null) {
                    throw new TypeError('Argument "levelOrSwitch" is not a valid LogEventLevel value.');
                }
                return _this.filter(function (e) { return isEnabled(level_1, e.level); });
            }
            else {
                return _this.filter(function (e) { return isEnabled(levelOrSwitch, e.level); });
            }
        }, {
            fatal: function () { return _this.minLevel(LogEventLevel.fatal); },
            error: function () { return _this.minLevel(LogEventLevel.error); },
            warning: function () { return _this.minLevel(LogEventLevel.warning); },
            information: function () { return _this.minLevel(LogEventLevel.information); },
            debug: function () { return _this.minLevel(LogEventLevel.debug); },
            verbose: function () { return _this.minLevel(LogEventLevel.verbose); }
        });
        this.pipeline = new Pipeline();
        this._suppressErrors = true;
    }
    /**
     * Adds a sink to the pipeline.
     * @param {Sink} sink The sink to add.
     */
    LoggerConfiguration.prototype.writeTo = function (sink) {
        this.pipeline.addStage(new SinkStage(sink));
        return this;
    };
    /**
     * Adds a filter to the pipeline.
     * @param {(e: LogEvent) => boolean} predicate Filter predicate to use.
     */
    LoggerConfiguration.prototype.filter = function (predicate) {
        if (predicate instanceof Function) {
            this.pipeline.addStage(new FilterStage(predicate));
        }
        else {
            throw new TypeError('Argument "predicate" must be a function.');
        }
        return this;
    };
    /**
     * Adds an enricher to the pipeline.
     */
    LoggerConfiguration.prototype.enrich = function (enricher) {
        if (enricher instanceof Function || enricher instanceof Object) {
            this.pipeline.addStage(new EnrichStage(enricher));
        }
        else {
            throw new TypeError('Argument "enricher" must be either a function or an object.');
        }
        return this;
    };
    /**
     * Enable or disable error suppression.
     */
    LoggerConfiguration.prototype.suppressErrors = function (suppress) {
        this._suppressErrors = typeof suppress === 'undefined' || !!suppress;
        return this;
    };
    /**
     * Creates a new logger instance based on this configuration.
     */
    LoggerConfiguration.prototype.create = function () {
        return new Logger(this.pipeline, this._suppressErrors);
    };
    return LoggerConfiguration;
}());

function configure() {
    return new LoggerConfiguration();
}

export { configure, LoggerConfiguration, LogEventLevel, Logger, ConsoleSink, BatchedSink, DynamicLevelSwitch };
//# sourceMappingURL=structured-log.es6.js.map

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.structuredLog = global.structuredLog || {})));
}(this, (function (exports) { 'use strict';

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

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/**
 * Represents the severity level of a log event.
 */

(function (LogEventLevel) {
    LogEventLevel[LogEventLevel["off"] = 0] = "off";
    LogEventLevel[LogEventLevel["fatal"] = 1] = "fatal";
    LogEventLevel[LogEventLevel["error"] = 3] = "error";
    LogEventLevel[LogEventLevel["warning"] = 7] = "warning";
    LogEventLevel[LogEventLevel["information"] = 15] = "information";
    LogEventLevel[LogEventLevel["debug"] = 31] = "debug";
    LogEventLevel[LogEventLevel["verbose"] = 63] = "verbose";
})(exports.LogEventLevel || (exports.LogEventLevel = {}));
/**
 * Checks if a log event level includes the target log event level.
 * @param {LogEventLevel} level The level to check.
 * @param {LogEventLevel} target The target level.
 * @returns True if the checked level contains the target level.
 */
function isEnabled(level, target) {
    return (level & target) === target;
}
/**
 * Represents a log event.
 */
var LogEvent = (function () {
    /**
     * Creates a new log event instance.
     */
    function LogEvent(timestamp, level, messageTemplate, properties) {
        this.timestamp = timestamp;
        this.level = level;
        this.messageTemplate = messageTemplate;
        this.properties = properties || {};
    }
    return LogEvent;
}());

var tokenizer = /\{@?\w+}/g;
/**
 * Represents a message template that can be rendered into a log message.
 */
var MessageTemplate = (function () {
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
var Logger = (function () {
    /**
     * Creates a new logger instance using the specified pipeline.
     */
    function Logger(pipeline) {
        this.pipeline = pipeline;
    }
    /**
     * Logs an event with the {LogEventLevel.fatal} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    Logger.prototype.fatal = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(exports.LogEventLevel.fatal, messageTemplate, properties);
    };
    /**
     * Logs an event with the {LogEventLevel.error} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    Logger.prototype.error = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(exports.LogEventLevel.error, messageTemplate, properties);
    };
    /**
     * Logs an event with the {LogEventLevel.warning} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    Logger.prototype.warn = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(exports.LogEventLevel.warning, messageTemplate, properties);
    };
    /**
     * Logs an event with the {LogEventLevel.information} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    Logger.prototype.info = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(exports.LogEventLevel.information, messageTemplate, properties);
    };
    /**
     * Logs an event with the {LogEventLevel.debug} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    Logger.prototype.debug = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(exports.LogEventLevel.debug, messageTemplate, properties);
    };
    /**
     * Logs an event with the {LogEventLevel.verbose} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    Logger.prototype.verbose = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(exports.LogEventLevel.verbose, messageTemplate, properties);
    };
    /**
     * Flushes the pipeline of this logger.
     * @returns A {Promise<any>} that will resolve when the pipeline has been flushed.
     */
    Logger.prototype.flush = function () {
        return this.pipeline.flush();
    };
    /**
     * Emits events through this logger's pipeline.
     */
    Logger.prototype.emit = function (events) {
        this.pipeline.emit(events);
        return events;
    };
    Logger.prototype.write = function (level, rawMessageTemplate, unboundProperties) {
        var messageTemplate = new MessageTemplate(rawMessageTemplate);
        var properties = messageTemplate.bindProperties(unboundProperties);
        var logEvent = new LogEvent(new Date().toISOString(), level, messageTemplate, properties);
        this.pipeline.emit([logEvent]);
    };
    return Logger;
}());

var ConsoleSink = (function () {
    function ConsoleSink(options) {
        this.options = options || {};
        var internalConsole = this.options.consoleProxy || typeof console !== 'undefined' && console || null;
        var stub = function () { };
        this.consoleProxy = {
            error: (internalConsole && (internalConsole.error || internalConsole.log)) || stub,
            warn: (internalConsole && (internalConsole.warn || internalConsole.log)) || stub,
            info: (internalConsole && (internalConsole.info || internalConsole.log)) || stub,
            debug: (internalConsole && (internalConsole.debug || internalConsole.log)) || stub,
            log: (internalConsole && internalConsole.log) || stub
        };
    }
    ConsoleSink.prototype.emit = function (events) {
        for (var i = 0; i < events.length; ++i) {
            var e = events[i];
            switch (e.level) {
                case exports.LogEventLevel.fatal:
                    this.writeToConsole(this.consoleProxy.error, 'Fatal', e);
                    break;
                case exports.LogEventLevel.error:
                    this.writeToConsole(this.consoleProxy.error, 'Error', e);
                    break;
                case exports.LogEventLevel.warning:
                    this.writeToConsole(this.consoleProxy.warn, 'Warning', e);
                    break;
                case exports.LogEventLevel.debug:
                    this.writeToConsole(this.consoleProxy.debug, 'Debug', e);
                    break;
                case exports.LogEventLevel.verbose:
                    this.writeToConsole(this.consoleProxy.debug, 'Verbose', e);
                    break;
                case exports.LogEventLevel.information:
                default:
                    this.writeToConsole(this.consoleProxy.info, 'Information', e);
                    break;
            }
        }
    };
    ConsoleSink.prototype.flush = function () {
        return Promise.resolve();
    };
    ConsoleSink.prototype.writeToConsole = function (logMethod, prefix, e) {
        var output = '[' + prefix + '] ' + e.messageTemplate.render(e.properties);
        if (this.options.includeTimestamps) {
            output = e.timestamp + ' ' + output;
        }
        var values = [];
        if (this.options.includeProperties) {
            for (var key in e.properties) {
                if (e.properties.hasOwnProperty(key)) {
                    values.push(e.properties[key]);
                }
            }
        }
        logMethod.apply(void 0, [output].concat(values));
    };
    return ConsoleSink;
}());

var FilterStage = (function () {
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
var DynamicLevelSwitch = (function () {
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
        return this.flushDelegate().then(function () { return _this.minLevel = exports.LogEventLevel.fatal; });
    };
    DynamicLevelSwitch.prototype.error = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = exports.LogEventLevel.error; });
    };
    DynamicLevelSwitch.prototype.warning = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = exports.LogEventLevel.warning; });
    };
    DynamicLevelSwitch.prototype.information = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = exports.LogEventLevel.information; });
    };
    DynamicLevelSwitch.prototype.debug = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = exports.LogEventLevel.debug; });
    };
    DynamicLevelSwitch.prototype.verbose = function () {
        var _this = this;
        return this.flushDelegate().then(function () { return _this.minLevel = exports.LogEventLevel.verbose; });
    };
    DynamicLevelSwitch.prototype.isEnabled = function (level) {
        return this.minLevel === null || isEnabled(this.minLevel, level);
    };
    return DynamicLevelSwitch;
}());
var DynamicLevelSwitchStage = (function (_super) {
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

var Pipeline = (function () {
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
            if (!this.stages.length || !events || !events.length) {
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

var SinkStage = (function () {
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

var EnrichStage = (function () {
    function EnrichStage(enricher) {
        this.enricher = enricher;
    }
    EnrichStage.prototype.emit = function (events) {
        var extraProperties = this.enricher instanceof Function ? this.enricher() : this.enricher;
        for (var i = 0; i < events.length; ++i) {
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
var LoggerConfiguration = (function () {
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
                var flush = _this.pipeline.flush;
                switchStage.setFlushDelegate(function () { return _this.pipeline.flush(); });
                _this.pipeline.addStage(switchStage);
                return _this;
            }
            else if (typeof levelOrSwitch === 'string') {
                var level_1 = exports.LogEventLevel[levelOrSwitch.toLowerCase()];
                if (typeof level_1 === 'undefined') {
                    throw new TypeError('Argument "levelOrSwitch" is not a valid LogEventLevel value.');
                }
                return _this.filter(function (e) { return isEnabled(level_1, e.level); });
            }
            else {
                return _this.filter(function (e) { return isEnabled(levelOrSwitch, e.level); });
            }
        }, {
            fatal: function () { return _this.minLevel(exports.LogEventLevel.fatal); },
            error: function () { return _this.minLevel(exports.LogEventLevel.error); },
            warning: function () { return _this.minLevel(exports.LogEventLevel.warning); },
            information: function () { return _this.minLevel(exports.LogEventLevel.information); },
            debug: function () { return _this.minLevel(exports.LogEventLevel.debug); },
            verbose: function () { return _this.minLevel(exports.LogEventLevel.verbose); }
        });
        this.pipeline = new Pipeline();
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
     * Creates a new logger instance based on this configuration.
     */
    LoggerConfiguration.prototype.create = function () {
        return new Logger(this.pipeline);
    };
    return LoggerConfiguration;
}());

function configure() {
    return new LoggerConfiguration();
}

exports.configure = configure;
exports.LoggerConfiguration = LoggerConfiguration;
exports.Logger = Logger;
exports.ConsoleSink = ConsoleSink;
exports.DynamicLevelSwitch = DynamicLevelSwitch;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=structured-log.js.map

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
 * Represents the event pipeline.
 */
var Pipeline = (function () {
    /**
     * Creates a new Pipeline instance.
     */
    function Pipeline() {
        /**
         * If set to `true`, errors in the pipeline will not be caught and will be
         * allowed to propagate out to the execution environment.
         */
        this.yieldErrors = false;
        this.stages = [];
    }
    /**
     * Adds a new stage to the pipeline, and connects it to the previous stage.
     * @param {PipelineStage} stage The stage to add.
     */
    Pipeline.prototype.addStage = function (stage) {
        if (typeof stage === 'undefined' || !stage) {
            throw new Error('Argument "stage" cannot be undefined or null.');
        }
        this.stages.push(stage);
        if (this.stages.length > 1) {
            this.stages[this.stages.length - 2].next = this.stages[this.stages.length - 1];
        }
    };
    /**
     * Emits events through the pipeline.
     * @param {LogEvent[]} events The events to emit.
     * @returns {Promise<any>} Promise that will be resolved when all
     * pipeline stages have resolved.
     */
    Pipeline.prototype.emit = function (events) {
        var _this = this;
        try {
            if (this.stages.length === 0) {
                return Promise.resolve();
            }
            return this.stages[0].emit(events).catch(function (e) {
                if (_this.yieldErrors) {
                    throw e;
                }
            });
        }
        catch (e) {
            if (!this.yieldErrors) {
                return Promise.resolve();
            }
            else {
                throw e;
            }
        }
    };
    /**
     * Flushes any events through the pipeline
     * @returns {Promise<any>} Promise that will be resolved when all
     * pipeline stages have been flushed.
     */
    Pipeline.prototype.flush = function () {
        var _this = this;
        try {
            if (this.stages.length === 0) {
                return Promise.resolve();
            }
            return this.stages[0].flush().catch(function (e) {
                if (_this.yieldErrors) {
                    throw e;
                }
            });
        }
        catch (e) {
            if (!this.yieldErrors) {
                return Promise.resolve();
            }
            else {
                throw e;
            }
        }
    };
    return Pipeline;
}());

/**
 * Represents a stage in the event pipeline.
 */
var PipelineStage = (function () {
    function PipelineStage() {
        /**
         * Points to the next stage in the pipeline.
         */
        this.next = null;
    }
    /**
     * Emits events to this pipeline stage, as well as the next stage in the pipeline (if any).
     * @param {LogEvent[]} events The events to emit.
     * @returns {Promise<any>} Promise that will be resolved when all subsequent
     * pipeline stages have resolved.
     */
    PipelineStage.prototype.emit = function (events) {
        return this.next ? this.next.emit(events) : Promise.resolve();
    };
    /**
     * Flushes this pipeline stage, as well as the next stage in the pipeline (if any).
     * @returns {Promise<any>} Promise that will be resolved when all subsequent
     * pipeline stages have been flushed.
     */
    PipelineStage.prototype.flush = function () {
        return this.next ? this.next.flush() : Promise.resolve();
    };
    return PipelineStage;
}());

var FilterStage = (function (_super) {
    __extends(FilterStage, _super);
    function FilterStage(filter) {
        var _this = _super.call(this) || this;
        _this.filter = filter;
        return _this;
    }
    FilterStage.prototype.emit = function (events) {
        var _this = this;
        if (!this.next) {
            return Promise.resolve();
        }
        return Promise.resolve()
            .then(function () { return events.filter(_this.filter); })
            .then(function (filteredEvents) { return _this.next.emit(filteredEvents); });
    };
    return FilterStage;
}(PipelineStage));

var EnrichStage = (function (_super) {
    __extends(EnrichStage, _super);
    function EnrichStage(enricher) {
        var _this = _super.call(this) || this;
        _this.enricher = enricher;
        return _this;
    }
    EnrichStage.prototype.emit = function (events) {
        var _this = this;
        if (!this.next) {
            return Promise.resolve();
        }
        return Promise.resolve()
            .then(function () {
            for (var i = 0; i < events.length; ++i) {
                var e = events[i];
                e.messageTemplate.enrichWith(_this.enricher());
            }
            return events;
        })
            .then(function (enrichedEvents) { return _this.next.emit(enrichedEvents); });
    };
    return EnrichStage;
}(PipelineStage));

var LogEventLevel;
(function (LogEventLevel) {
    LogEventLevel[LogEventLevel["fatal"] = 0] = "fatal";
    LogEventLevel[LogEventLevel["error"] = 1] = "error";
    LogEventLevel[LogEventLevel["warn"] = 2] = "warn";
    LogEventLevel[LogEventLevel["warning"] = 2] = "warning";
    LogEventLevel[LogEventLevel["info"] = 3] = "info";
    LogEventLevel[LogEventLevel["information"] = 3] = "information";
    LogEventLevel[LogEventLevel["debug"] = 4] = "debug";
    LogEventLevel[LogEventLevel["verbose"] = 5] = "verbose";
})(LogEventLevel || (LogEventLevel = {}));

var Sink = (function () {
    function Sink() {
    }
    Sink.prototype.flush = function () {
        return Promise.resolve();
    };
    return Sink;
}());

var tokenizer = /\{@?\w+}/g;
var MessageTemplate = (function () {
    function MessageTemplate(messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.template = messageTemplate;
        this.tokens = this.tokenize(messageTemplate);
        this.properties = Object.assign({}, properties);
    }
    MessageTemplate.prototype.render = function (properties) {
        if (!this.tokens.length) {
            return this.template;
        }
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
    MessageTemplate.prototype.enrichWith = function (properties) {
        Object.assign(this.properties, properties);
    };
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

var Logger = (function (_super) {
    __extends(Logger, _super);
    function Logger(pipeline) {
        var _this = _super.call(this) || this;
        if (!pipeline) {
            throw new Error('Argument "pipeline" cannot be null or undefined.');
        }
        _this.pipeline = pipeline;
        return _this;
    }
    /**
     * Logs a message with the `Fatal` level.
     */
    Logger.prototype.fatal = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.fatal, messageTemplate, properties);
    };
    /**
     * Logs a message with the `Error` level.
     */
    Logger.prototype.error = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.error, messageTemplate, properties);
    };
    /**
     * Logs a message with the `Warning` level.
     */
    Logger.prototype.warn = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.warning, messageTemplate, properties);
    };
    /**
     * Logs a message with the `Information` level.
     */
    Logger.prototype.info = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.information, messageTemplate, properties);
    };
    /**
     * Logs a message with the `Debug` level.
     */
    Logger.prototype.debug = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.debug, messageTemplate, properties);
    };
    /**
     * Logs a message with the `Verbose` level.
     */
    Logger.prototype.verbose = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.verbose, messageTemplate, properties);
    };
    /**
     * @inheritdoc
     */
    Logger.prototype.flush = function () {
        return this.pipeline.flush();
    };
    Logger.prototype.emit = function (events) {
        return this.pipeline.emit(events);
    };
    Logger.prototype.write = function (level, rawMessageTemplate, properties) {
        try {
            var messageTemplate = new MessageTemplate(rawMessageTemplate);
            var eventProperties = messageTemplate.bindProperties(properties);
            var event = {
                timestamp: new Date().toISOString(),
                level: level,
                messageTemplate: messageTemplate,
                properties: eventProperties
            };
            this.pipeline.emit([event]);
        }
        catch (error) {
            if (this.pipeline.yieldErrors) {
                throw error;
            }
        }
    };
    return Logger;
}(Sink));

/**
 * Represents a stage in the pipeline that emits events to a sink.
 */
var SinkStage = (function (_super) {
    __extends(SinkStage, _super);
    function SinkStage(sink) {
        var _this = _super.call(this) || this;
        if (typeof sink === 'undefined' || !sink) {
            throw new Error('Argument "sink" cannot be undefined or null.');
        }
        _this.sink = sink;
        return _this;
    }
    /**
     * Emits events to the sink, as well as the next stage in the pipeline (if any).
     * @param {LogEvent[]} events The events to emit.
     * @returns {Promise<void>} Promise that will be resolved when all subsequent
     * pipeline stages have resolved.
     */
    SinkStage.prototype.emit = function (events) {
        return Promise.all([_super.prototype.emit.call(this, events), this.sink.emit(events)]);
    };
    /**
     * Flushes the sink, as well as the next stage in the pipeline (if any).
     */
    SinkStage.prototype.flush = function () {
        return Promise.all([_super.prototype.flush.call(this), this.sink.flush()]);
    };
    return SinkStage;
}(PipelineStage));

var consoleProxy = {
    error: (typeof console !== 'undefined' && console && (console.error || console.log)) || function () { },
    warn: (typeof console !== 'undefined' && console && (console.warn || console.log)) || function () { },
    info: (typeof console !== 'undefined' && console && (console.info || console.log)) || function () { },
    debug: (typeof console !== 'undefined' && console && (console.debug || console.log)) || function () { },
    log: (typeof console !== 'undefined' && console && console.log) || function () { }
};
var ConsoleSink = (function (_super) {
    __extends(ConsoleSink, _super);
    function ConsoleSink(options) {
        var _this = _super.call(this) || this;
        _this.options = options || {};
        return _this;
    }
    ConsoleSink.prototype.emit = function (events) {
        var _this = this;
        return Promise.resolve().then(function () {
            for (var i = 0; i < events.length; ++i) {
                var e = events[i];
                switch (e.level) {
                    case LogEventLevel.fatal:
                        _this.writeToConsole(consoleProxy.error, 'Fatal', e);
                        break;
                    case LogEventLevel.error:
                        _this.writeToConsole(consoleProxy.error, 'Error', e);
                        break;
                    case LogEventLevel.warning:
                        _this.writeToConsole(consoleProxy.warn, 'Warning', e);
                        break;
                    case LogEventLevel.information:
                        _this.writeToConsole(consoleProxy.info, 'Information', e);
                        break;
                    case LogEventLevel.debug:
                        _this.writeToConsole(consoleProxy.debug, 'Debug', e);
                        break;
                    case LogEventLevel.verbose:
                        _this.writeToConsole(consoleProxy.debug, 'Verbose', e);
                        break;
                }
            }
        });
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
}(Sink));

var LoggerConfiguration = (function () {
    function LoggerConfiguration() {
        var _this = this;
        this.pipeline = null;
        this.minLevel = Object.assign(function (level) {
            return _this.filter(function (e) { return e.level <= level; });
        }, {
            fatal: function () { return _this.minLevel(LogEventLevel.fatal); },
            error: function () { return _this.minLevel(LogEventLevel.error); },
            warning: function () { return _this.minLevel(LogEventLevel.warning); },
            information: function () { return _this.minLevel(LogEventLevel.information); },
            debug: function () { return _this.minLevel(LogEventLevel.debug); },
            verbose: function () { return _this.minLevel(LogEventLevel.verbose); }
        });
        this.pipeline = new Pipeline();
    }
    LoggerConfiguration.prototype.writeTo = function (sink) {
        this.pipeline.addStage(new SinkStage(sink));
        return this;
    };
    LoggerConfiguration.prototype.enrich = function (enricher) {
        if (enricher instanceof Function) {
            this.pipeline.addStage(new EnrichStage(enricher));
        }
        else if (enricher instanceof Object) {
            this.pipeline.addStage(new EnrichStage(function () { return enricher; }));
        }
        else {
            throw new Error('Argument "enricher" must be either a function or an object.');
        }
        return this;
    };
    LoggerConfiguration.prototype.filter = function (predicate) {
        if (predicate instanceof Function) {
            this.pipeline.addStage(new FilterStage(predicate));
        }
        else {
            throw new Error('Argument "predicate" must be a function.');
        }
        return this;
    };
    LoggerConfiguration.prototype.create = function (yieldErrors) {
        if (yieldErrors === void 0) { yieldErrors = false; }
        if (!this.pipeline) {
            throw new Error('The logger for this configuration has already been created.');
        }
        this.pipeline.yieldErrors = yieldErrors;
        return new Logger(this.pipeline);
    };
    return LoggerConfiguration;
}());
function configure() {
    return new LoggerConfiguration();
}

exports.configure = configure;
exports.LoggerConfiguration = LoggerConfiguration;
exports.ConsoleSink = ConsoleSink;

Object.defineProperty(exports, '__esModule', { value: true });

})));

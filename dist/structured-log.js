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
     * Logs an event with the {@link LogEventLevel.fatal} severity.
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
     * Logs an event with the {@link LogEventLevel.error} severity.
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
     * Logs an event with the {@link LogEventLevel.warning} severity.
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
     * Logs an event with the {@link LogEventLevel.information} severity.
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
     * Logs an event with the {@link LogEventLevel.debug} severity.
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
     * Logs an event with the {@link LogEventLevel.verbose} severity.
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
    Logger.prototype.write = function (level, rawMessageTemplate) {
        var unboundProperties = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            unboundProperties[_i - 2] = arguments[_i];
        }
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

var LoggerConfiguration = (function () {
    function LoggerConfiguration() {
    }
    return LoggerConfiguration;
}());

function configure() {
    return new LoggerConfiguration();
}

exports.configure = configure;
exports.LoggerConfiguration = LoggerConfiguration;
exports.Logger = Logger;
exports.ConsoleSink = ConsoleSink;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=structured-log.js.map

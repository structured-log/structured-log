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
 * @returns True if the checked level contains the target level.
 */

/**
 * Represents a log event.
 */
class LogEvent {
    /**
     * Creates a new log event instance.
     */
    constructor(timestamp, level, messageTemplate, properties) {
        this.timestamp = timestamp;
        this.level = level;
        this.messageTemplate = messageTemplate;
        this.properties = properties || {};
    }
}

const tokenizer = /\{@?\w+}/g;
/**
 * Represents a message template that can be rendered into a log message.
 */
class MessageTemplate {
    /**
     * Creates a new MessageTemplate instance with the given template.
     */
    constructor(messageTemplate) {
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
    render(properties) {
        if (!this.tokens.length) {
            return this.raw;
        }
        properties = properties || {};
        const result = [];
        for (var i = 0; i < this.tokens.length; ++i) {
            const token = this.tokens[i];
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
    }
    /**
     * Binds the given set of args to their matching tokens.
     * @param {any} positionalArgs Arguments.
     * @returns Object containing the properties.
     */
    bindProperties(positionalArgs) {
        const result = {};
        let nextArg = 0;
        for (var i = 0; i < this.tokens.length && nextArg < positionalArgs.length; ++i) {
            const token = this.tokens[i];
            if (typeof token.name === 'string') {
                let p = positionalArgs[nextArg];
                result[token.name] = this.capture(p, token.destructure);
                nextArg++;
            }
        }
        while (nextArg < positionalArgs.length) {
            const arg = positionalArgs[nextArg];
            if (typeof arg !== 'undefined') {
                result['a' + nextArg] = this.capture(arg);
            }
            nextArg++;
        }
        return result;
    }
    tokenize(template) {
        const tokens = [];
        let result;
        let textStart;
        while ((result = tokenizer.exec(template)) !== null) {
            if (result.index !== textStart) {
                tokens.push({ text: template.slice(textStart, result.index) });
            }
            let destructure = false;
            let token = result[0].slice(1, -1);
            if (token.indexOf('@') === 0) {
                token = token.slice(1);
                destructure = true;
            }
            tokens.push({
                name: token,
                destructure,
                raw: result[0]
            });
            textStart = tokenizer.lastIndex;
        }
        if (textStart >= 0 && textStart < template.length) {
            tokens.push({ text: template.slice(textStart) });
        }
        return tokens;
    }
    toText(property) {
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
            let s = JSON.stringify(property);
            if (s.length > 70) {
                s = s.slice(0, 67) + '...';
            }
            return s;
        }
        return property.toString();
    }
    ;
    capture(property, destructure) {
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
    }
}

/**
 * Logs events.
 */
class Logger {
    /**
     * Creates a new logger instance using the specified pipeline.
     */
    constructor(pipeline) {
        this.pipeline = pipeline;
    }
    /**
     * Logs an event with the {@link LogEventLevel.fatal} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    fatal(messageTemplate, ...properties) {
        this.write(LogEventLevel.fatal, messageTemplate, properties);
    }
    /**
     * Logs an event with the {@link LogEventLevel.error} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    error(messageTemplate, ...properties) {
        this.write(LogEventLevel.error, messageTemplate, properties);
    }
    /**
     * Logs an event with the {@link LogEventLevel.warning} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    warn(messageTemplate, ...properties) {
        this.write(LogEventLevel.warning, messageTemplate, properties);
    }
    /**
     * Logs an event with the {@link LogEventLevel.information} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    info(messageTemplate, ...properties) {
        this.write(LogEventLevel.information, messageTemplate, properties);
    }
    /**
     * Logs an event with the {@link LogEventLevel.debug} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    debug(messageTemplate, ...properties) {
        this.write(LogEventLevel.debug, messageTemplate, properties);
    }
    /**
     * Logs an event with the {@link LogEventLevel.verbose} severity.
     * @param {string} messageTemplate Message template for the log event.
     * @param {any[]} properties Properties that can be used to render the message template.
     */
    verbose(messageTemplate, ...properties) {
        this.write(LogEventLevel.verbose, messageTemplate, properties);
    }
    /**
     * Flushes the pipeline of this logger.
     * @returns A {Promise<any>} that will resolve when the pipeline has been flushed.
     */
    flush() {
        return this.pipeline.flush();
    }
    write(level, rawMessageTemplate, ...unboundProperties) {
        const messageTemplate = new MessageTemplate(rawMessageTemplate);
        const properties = messageTemplate.bindProperties(unboundProperties);
        const logEvent = new LogEvent(new Date().toISOString(), level, messageTemplate, properties);
        this.pipeline.emit([logEvent]);
    }
}

class ConsoleSink {
    constructor(options) {
        this.options = options || {};
        const internalConsole = this.options.consoleProxy || typeof console !== 'undefined' && console || null;
        const stub = function () { };
        this.consoleProxy = {
            error: (internalConsole && (internalConsole.error || internalConsole.log)) || stub,
            warn: (internalConsole && (internalConsole.warn || internalConsole.log)) || stub,
            info: (internalConsole && (internalConsole.info || internalConsole.log)) || stub,
            debug: (internalConsole && (internalConsole.debug || internalConsole.log)) || stub,
            log: (internalConsole && internalConsole.log) || stub
        };
    }
    emit(events) {
        for (let i = 0; i < events.length; ++i) {
            const e = events[i];
            switch (e.level) {
                case LogEventLevel.fatal:
                    this.writeToConsole(this.consoleProxy.error, 'Fatal', e);
                    break;
                case LogEventLevel.error:
                    this.writeToConsole(this.consoleProxy.error, 'Error', e);
                    break;
                case LogEventLevel.warning:
                    this.writeToConsole(this.consoleProxy.warn, 'Warning', e);
                    break;
                case LogEventLevel.debug:
                    this.writeToConsole(this.consoleProxy.debug, 'Debug', e);
                    break;
                case LogEventLevel.verbose:
                    this.writeToConsole(this.consoleProxy.debug, 'Verbose', e);
                    break;
                case LogEventLevel.information:
                default:
                    this.writeToConsole(this.consoleProxy.info, 'Information', e);
                    break;
            }
        }
    }
    flush() {
        return Promise.resolve();
    }
    writeToConsole(logMethod, prefix, e) {
        let output = '[' + prefix + '] ' + e.messageTemplate.render(e.properties);
        if (this.options.includeTimestamps) {
            output = e.timestamp + ' ' + output;
        }
        const values = [];
        if (this.options.includeProperties) {
            for (const key in e.properties) {
                if (e.properties.hasOwnProperty(key)) {
                    values.push(e.properties[key]);
                }
            }
        }
        logMethod(output, ...values);
    }
}

class LoggerConfiguration {
}

function configure() {
    return new LoggerConfiguration();
}

export { configure, LoggerConfiguration, LogEventLevel, Logger, ConsoleSink };
//# sourceMappingURL=structured-log.es6.js.map

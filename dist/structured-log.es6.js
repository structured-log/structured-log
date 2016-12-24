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
 * Represents the event pipeline.
 */
class Pipeline {
    /**
     * Creates a new Pipeline instance.
     */
    constructor() {
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
    addStage(stage) {
        if (typeof stage === 'undefined' || !stage) {
            throw new Error('Argument "stage" cannot be undefined or null.');
        }
        this.stages.push(stage);
        if (this.stages.length > 1) {
            this.stages[this.stages.length - 2].next = this.stages[this.stages.length - 1];
        }
    }
    /**
     * Emits events through the pipeline.
     * @param {LogEvent[]} events The events to emit.
     * @returns {Promise<any>} Promise that will be resolved when all
     * pipeline stages have resolved.
     */
    emit(events) {
        try {
            if (this.stages.length === 0) {
                return Promise.resolve();
            }
            return this.stages[0].emit(events).catch(e => {
                if (this.yieldErrors) {
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
    }
    /**
     * Flushes any events through the pipeline
     * @returns {Promise<any>} Promise that will be resolved when all
     * pipeline stages have been flushed.
     */
    flush() {
        try {
            if (this.stages.length === 0) {
                return Promise.resolve();
            }
            return this.stages[0].flush().catch(e => {
                if (this.yieldErrors) {
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
    }
}

/**
 * Represents a stage in the event pipeline.
 */
class PipelineStage {
    constructor() {
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
    emit(events) {
        return this.next ? this.next.emit(events) : Promise.resolve();
    }
    /**
     * Flushes this pipeline stage, as well as the next stage in the pipeline (if any).
     * @returns {Promise<any>} Promise that will be resolved when all subsequent
     * pipeline stages have been flushed.
     */
    flush() {
        return this.next ? this.next.flush() : Promise.resolve();
    }
}

class FilterStage extends PipelineStage {
    constructor(filter) {
        super();
        this.filter = filter;
    }
    emit(events) {
        if (!this.next) {
            return Promise.resolve();
        }
        return Promise.resolve()
            .then(() => events.filter(this.filter))
            .then(filteredEvents => this.next.emit(filteredEvents));
    }
}

class EnrichStage extends PipelineStage {
    constructor(enricher) {
        super();
        this.enricher = enricher;
    }
    emit(events) {
        if (!this.next) {
            return Promise.resolve();
        }
        return Promise.resolve()
            .then(() => {
            for (var i = 0; i < events.length; ++i) {
                const e = events[i];
                e.properties = Object.assign({}, e.properties, this.enricher());
            }
            return events;
        })
            .then(enrichedEvents => this.next.emit(enrichedEvents));
    }
}

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

class Sink {
    flush() {
        return Promise.resolve();
    }
}

const tokenizer = /\{@?\w+}/g;
class MessageTemplate {
    get raw() {
        return this._raw;
    }
    constructor(messageTemplate) {
        this._raw = messageTemplate;
        this.tokens = this.tokenize(messageTemplate);
    }
    /**
     * Renders this template using the given properties.
     * @param {Object?} properties Object containing the properties.
     * @returns Rendered message.
     */
    render(properties) {
        if (!this.tokens.length) {
            return this._raw;
        }
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
     * @param positionalArgs Array of arguments.
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

class Logger extends Sink {
    constructor(pipeline) {
        super();
        if (!pipeline) {
            throw new Error('Argument "pipeline" cannot be null or undefined.');
        }
        this.pipeline = pipeline;
    }
    /**
     * Logs a message with the `Fatal` level.
     */
    fatal(messageTemplate, ...properties) {
        this.write(LogEventLevel.fatal, messageTemplate, properties);
    }
    /**
     * Logs a message with the `Error` level.
     */
    error(messageTemplate, ...properties) {
        this.write(LogEventLevel.error, messageTemplate, properties);
    }
    /**
     * Logs a message with the `Warning` level.
     */
    warn(messageTemplate, ...properties) {
        this.write(LogEventLevel.warning, messageTemplate, properties);
    }
    /**
     * Logs a message with the `Information` level.
     */
    info(messageTemplate, ...properties) {
        this.write(LogEventLevel.information, messageTemplate, properties);
    }
    /**
     * Logs a message with the `Debug` level.
     */
    debug(messageTemplate, ...properties) {
        this.write(LogEventLevel.debug, messageTemplate, properties);
    }
    /**
     * Logs a message with the `Verbose` level.
     */
    verbose(messageTemplate, ...properties) {
        this.write(LogEventLevel.verbose, messageTemplate, properties);
    }
    /**
     * @inheritdoc
     */
    flush() {
        return this.pipeline.flush();
    }
    emit(events) {
        return this.pipeline.emit(events);
    }
    write(level, rawMessageTemplate, properties) {
        try {
            const messageTemplate = new MessageTemplate(rawMessageTemplate);
            const eventProperties = messageTemplate.bindProperties(properties);
            const event = {
                timestamp: new Date().toISOString(),
                level,
                messageTemplate,
                properties: eventProperties
            };
            this.pipeline.emit([event]);
        }
        catch (error) {
            if (this.pipeline.yieldErrors) {
                throw error;
            }
        }
    }
}

/**
 * Represents a stage in the pipeline that emits events to a sink.
 */
class SinkStage extends PipelineStage {
    constructor(sink) {
        super();
        if (typeof sink === 'undefined' || !sink) {
            throw new Error('Argument "sink" cannot be undefined or null.');
        }
        this.sink = sink;
    }
    /**
     * Emits events to the sink, as well as the next stage in the pipeline (if any).
     * @param {LogEvent[]} events The events to emit.
     * @returns {Promise<void>} Promise that will be resolved when all subsequent
     * pipeline stages have resolved.
     */
    emit(events) {
        return Promise.all([super.emit(events), this.sink.emit(events)]);
    }
    /**
     * Flushes the sink, as well as the next stage in the pipeline (if any).
     */
    flush() {
        return Promise.all([super.flush(), this.sink.flush()]);
    }
}

class LoggerConfiguration {
    constructor() {
        this.pipeline = null;
        this.minLevel = Object.assign((level) => {
            return this.filter(e => e.level <= level);
        }, {
            fatal: () => this.minLevel(LogEventLevel.fatal),
            error: () => this.minLevel(LogEventLevel.error),
            warning: () => this.minLevel(LogEventLevel.warning),
            information: () => this.minLevel(LogEventLevel.information),
            debug: () => this.minLevel(LogEventLevel.debug),
            verbose: () => this.minLevel(LogEventLevel.verbose)
        });
        this.pipeline = new Pipeline();
    }
    writeTo(sink) {
        this.pipeline.addStage(new SinkStage(sink));
        return this;
    }
    enrich(enricher) {
        if (enricher instanceof Function) {
            this.pipeline.addStage(new EnrichStage(enricher));
        }
        else if (enricher instanceof Object) {
            this.pipeline.addStage(new EnrichStage(() => enricher));
        }
        else {
            throw new Error('Argument "enricher" must be either a function or an object.');
        }
        return this;
    }
    filter(predicate) {
        if (predicate instanceof Function) {
            this.pipeline.addStage(new FilterStage(predicate));
        }
        else {
            throw new Error('Argument "predicate" must be a function.');
        }
        return this;
    }
    create(yieldErrors = false) {
        if (!this.pipeline) {
            throw new Error('The logger for this configuration has already been created.');
        }
        this.pipeline.yieldErrors = yieldErrors;
        return new Logger(this.pipeline);
    }
}

const consoleProxy = {
    error: (typeof console !== 'undefined' && console && (console.error || console.log)) || function () { },
    warn: (typeof console !== 'undefined' && console && (console.warn || console.log)) || function () { },
    info: (typeof console !== 'undefined' && console && (console.info || console.log)) || function () { },
    debug: (typeof console !== 'undefined' && console && (console.debug || console.log)) || function () { },
    log: (typeof console !== 'undefined' && console && console.log) || function () { }
};
class ConsoleSink extends Sink {
    constructor(options) {
        super();
        this.options = options || {};
    }
    emit(events) {
        return Promise.resolve().then(() => {
            for (let i = 0; i < events.length; ++i) {
                const e = events[i];
                switch (e.level) {
                    case LogEventLevel.fatal:
                        this.writeToConsole(consoleProxy.error, 'Fatal', e);
                        break;
                    case LogEventLevel.error:
                        this.writeToConsole(consoleProxy.error, 'Error', e);
                        break;
                    case LogEventLevel.warning:
                        this.writeToConsole(consoleProxy.warn, 'Warning', e);
                        break;
                    case LogEventLevel.information:
                        this.writeToConsole(consoleProxy.info, 'Information', e);
                        break;
                    case LogEventLevel.debug:
                        this.writeToConsole(consoleProxy.debug, 'Debug', e);
                        break;
                    case LogEventLevel.verbose:
                        this.writeToConsole(consoleProxy.debug, 'Verbose', e);
                        break;
                }
            }
        });
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

function configure() {
    return new LoggerConfiguration();
}

export { LoggerConfiguration, configure, ConsoleSink };

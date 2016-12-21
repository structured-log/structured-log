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
     * @returns {Promise<void>} Promise that will be resolved when all subsequent
     * pipeline stages have resolved.
     */
    emit(events) {
        return this.next ? this.next.emit(events) : Promise.resolve();
    }
    /**
     * Flushes this pipeline stage, as well as the next stage in the pipeline (if any).
     */
    flush() {
        return this.next ? this.next.flush() : Promise.resolve();
    }
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
        if (!stage || !(stage instanceof PipelineStage)) {
            throw new Error('Argument "stage" must be a valid Stage instance.');
        }
        this.stages.push(stage);
        if (this.stages.length > 1) {
            this.stages[this.stages.length - 2].next = this.stages[this.stages.length - 1];
        }
    }
    emit(events) {
        if (this.stages.length === 0) {
            return Promise.resolve();
        }
        return this.stages[0].emit(events).catch(e => {
            if (this.yieldErrors) {
                throw e;
            }
        });
    }
    flush() {
        if (this.stages.length === 0) {
            return Promise.resolve();
        }
        return this.stages[0].flush().catch(e => {
            if (this.yieldErrors) {
                throw e;
            }
        });
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
                e.messageTemplate.enrichWith(this.enricher());
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
    constructor(messageTemplate, ...properties) {
        this.template = messageTemplate;
        this.tokens = this.tokenize(messageTemplate);
        this.properties = Object.assign({}, properties);
    }
    render(properties) {
        if (!this.tokens.length) {
            return this.template;
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
    enrichWith(properties) {
        Object.assign(this.properties, properties);
    }
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
    write(level, rawMessageTemplate, ...properties) {
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
        if (!sink) {
            throw new Error('Argument "sink" cannot be null or undefined.');
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
        return Promise.all([this.sink.emit(events), super.emit(events)]);
    }
    /**
     * Flushes the sink, as well as the next stage in the pipeline (if any).
     */
    flush() {
        return Promise.all([this.sink.flush(), super.flush()]);
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
        if (!events) {
            const error = new Error('Argument "events" cannot be null or undefined.');
            return Promise.reject(error);
        }
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

class LoggerConfiguration {
    constructor() {
        this.pipeline = null;
        this.minLevel = Object.assign((level) => {
            this.pipeline.addStage(new FilterStage(e => e.level <= level));
            return this;
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
    create(yieldErrors = false) {
        if (!this.pipeline) {
            throw new Error('The logger for this configuration has already been created.');
        }
        this.pipeline.yieldErrors = yieldErrors;
        return new Logger(this.pipeline);
    }
}
function configure() {
    return new LoggerConfiguration();
}

export { configure, LoggerConfiguration, ConsoleSink };

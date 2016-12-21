class PipelineStage {
    constructor() {
        this.next = null;
    }
    flush() {
        return !!this.next ? this.next.flush() : Promise.resolve();
    }
}
class Pipeline {
    constructor() {
        this.yieldErrors = false;
        this.stages = [];
    }
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
class SinkStage extends PipelineStage {
    constructor(sink) {
        super();
        if (!sink || !(sink instanceof Sink)) {
            throw new Error('Argument "sink" must be a valid Sink instance.');
        }
        this.sink = sink;
    }
    emit(events) {
        return Promise.all([this.sink.emit(events), this.next ? this.next.emit(events) : Promise.resolve()]);
    }
    flush() {
        return Promise.all([this.sink.flush(), super.flush()]);
    }
}

const tokenizer = /\{@?\w+}/g;
class MessageTemplate {
    constructor(messageTemplate, ...properties) {
        this.template = messageTemplate;
        this.tokens = this.tokenize(messageTemplate);
        this.properties = Object.assign({}, properties);
    }
    render() {
        return this.template;
    }
    enrichWith(properties) {
        Object.assign(this.properties, properties);
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
}

class Logger extends Sink {
    constructor(pipeline) {
        super();
        if (!pipeline || !(pipeline instanceof Pipeline)) {
            throw new Error('Argument "pipeline" must be a valid Pipeline instance.');
        }
        this.pipeline = pipeline;
    }
    fatal(messageTemplate, ...properties) {
        this.write(LogEventLevel.fatal, messageTemplate, properties);
    }
    error(messageTemplate, ...properties) {
        this.write(LogEventLevel.error, messageTemplate, properties);
    }
    warn(messageTemplate, ...properties) {
        this.write(LogEventLevel.warning, messageTemplate, properties);
    }
    info(messageTemplate, ...properties) {
        this.write(LogEventLevel.information, messageTemplate, properties);
    }
    debug(messageTemplate, ...properties) {
        this.write(LogEventLevel.debug, messageTemplate, properties);
    }
    verbose(messageTemplate, ...properties) {
        this.write(LogEventLevel.verbose, messageTemplate, properties);
    }
    flush() {
        return this.pipeline.flush();
    }
    emit(events) {
        return this.pipeline.emit(events);
    }
    write(level, rawMessageTemplate, ...properties) {
        try {
            const messageTemplate = new MessageTemplate(rawMessageTemplate, properties);
            const event = {
                level,
                messageTemplate
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

const consoleProxy = {
    error: console.error || console.log || function () { },
    warn: console.warn || console.log || function () { },
    info: console.info || console.log || function () { },
    debug: console.debug || console.log || function () { },
    log: console.log || function () { }
};
class ConsoleSink extends Sink {
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
                        consoleProxy.error('[Fatal] ' + e.messageTemplate.render());
                        break;
                    case LogEventLevel.error:
                        consoleProxy.error('[Error] ' + e.messageTemplate.render());
                        break;
                    case LogEventLevel.warning:
                        consoleProxy.warn('[Warning] ' + e.messageTemplate.render());
                        break;
                    case LogEventLevel.information:
                        consoleProxy.info('[Information] ' + e.messageTemplate.render());
                        break;
                    case LogEventLevel.debug:
                        consoleProxy.debug('[Debug] ' + e.messageTemplate.render());
                        break;
                    case LogEventLevel.verbose:
                        consoleProxy.debug('[Verbose] ' + e.messageTemplate.render());
                        break;
                }
            }
        });
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

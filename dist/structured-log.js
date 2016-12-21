(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.structuredLog = global.structuredLog || {})));
}(this, (function (exports) { 'use strict';

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var PipelineStage = (function () {
    function PipelineStage() {
        this.next = null;
    }
    PipelineStage.prototype.flush = function () {
        return !!this.next ? this.next.flush() : Promise.resolve();
    };
    return PipelineStage;
}());
var Pipeline = (function () {
    function Pipeline() {
        this.yieldErrors = false;
        this.stages = [];
    }
    Pipeline.prototype.addStage = function (stage) {
        if (!stage || !(stage instanceof PipelineStage)) {
            throw new Error('Argument "stage" must be a valid Stage instance.');
        }
        this.stages.push(stage);
        if (this.stages.length > 1) {
            this.stages[this.stages.length - 2].next = this.stages[this.stages.length - 1];
        }
    };
    Pipeline.prototype.emit = function (events) {
        var _this = this;
        if (this.stages.length === 0) {
            return Promise.resolve();
        }
        return this.stages[0].emit(events).catch(function (e) {
            if (_this.yieldErrors) {
                throw e;
            }
        });
    };
    Pipeline.prototype.flush = function () {
        var _this = this;
        if (this.stages.length === 0) {
            return Promise.resolve();
        }
        return this.stages[0].flush().catch(function (e) {
            if (_this.yieldErrors) {
                throw e;
            }
        });
    };
    return Pipeline;
}());
var FilterStage = (function (_super) {
    __extends(FilterStage, _super);
    function FilterStage(filter) {
        _super.call(this);
        this.filter = filter;
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
        _super.call(this);
        this.enricher = enricher;
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
var SinkStage = (function (_super) {
    __extends(SinkStage, _super);
    function SinkStage(sink) {
        _super.call(this);
        if (!sink || !(sink instanceof Sink)) {
            throw new Error('Argument "sink" must be a valid Sink instance.');
        }
        this.sink = sink;
    }
    SinkStage.prototype.emit = function (events) {
        return Promise.all([this.sink.emit(events), this.next ? this.next.emit(events) : Promise.resolve()]);
    };
    SinkStage.prototype.flush = function () {
        return Promise.all([this.sink.flush(), _super.prototype.flush.call(this)]);
    };
    return SinkStage;
}(PipelineStage));

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
    MessageTemplate.prototype.render = function () {
        return this.template;
    };
    MessageTemplate.prototype.enrichWith = function (properties) {
        Object.assign(this.properties, properties);
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
                destructure,
                raw: result[0]
            });
            textStart = tokenizer.lastIndex;
        }
        if (textStart >= 0 && textStart < template.length) {
            tokens.push({ text: template.slice(textStart) });
        }
        return tokens;
    };
    return MessageTemplate;
}());

var Logger = (function (_super) {
    __extends(Logger, _super);
    function Logger(pipeline) {
        _super.call(this);
        if (!pipeline || !(pipeline instanceof Pipeline)) {
            throw new Error('Argument "pipeline" must be a valid Pipeline instance.');
        }
        this.pipeline = pipeline;
    }
    Logger.prototype.fatal = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.fatal, messageTemplate, properties);
    };
    Logger.prototype.error = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.error, messageTemplate, properties);
    };
    Logger.prototype.warn = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.warning, messageTemplate, properties);
    };
    Logger.prototype.info = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.information, messageTemplate, properties);
    };
    Logger.prototype.debug = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.debug, messageTemplate, properties);
    };
    Logger.prototype.verbose = function (messageTemplate) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        this.write(LogEventLevel.verbose, messageTemplate, properties);
    };
    Logger.prototype.flush = function () {
        return this.pipeline.flush();
    };
    Logger.prototype.emit = function (events) {
        return this.pipeline.emit(events);
    };
    Logger.prototype.write = function (level, rawMessageTemplate) {
        var properties = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            properties[_i - 2] = arguments[_i];
        }
        try {
            var messageTemplate = new MessageTemplate(rawMessageTemplate, properties);
            var event = {
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
    };
    return Logger;
}(Sink));

var consoleProxy = {
    error: console.error || console.log || function () { },
    warn: console.warn || console.log || function () { },
    info: console.info || console.log || function () { },
    debug: console.debug || console.log || function () { },
    log: console.log || function () { }
};
var ConsoleSink = (function (_super) {
    __extends(ConsoleSink, _super);
    function ConsoleSink() {
        _super.apply(this, arguments);
    }
    ConsoleSink.prototype.emit = function (events) {
        if (!events) {
            var error = new Error('Argument "events" cannot be null or undefined.');
            return Promise.reject(error);
        }
        return Promise.resolve().then(function () {
            for (var i = 0; i < events.length; ++i) {
                var e = events[i];
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
    };
    return ConsoleSink;
}(Sink));

var LoggerConfiguration = (function () {
    function LoggerConfiguration() {
        var _this = this;
        this.pipeline = null;
        this.minLevel = Object.assign(function (level) {
            _this.pipeline.addStage(new FilterStage(function (e) { return e.level <= level; }));
            return _this;
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

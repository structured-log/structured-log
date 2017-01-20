# structured-log

A structured logging framework for JavaScript, inspired by [Serilog](http://serilog.net/).

[![npm](https://img.shields.io/npm/v/structured-log.svg)](https://www.npmjs.com/package/structured-log)
[![Bower](https://img.shields.io/bower/v/structured-log.svg)]()
[![Build Status](https://travis-ci.org/structured-log/structured-log.svg?branch=master)](https://travis-ci.org/structured-log/structured-log)

## Basic Example

```js
const structuredLog = require('structured-log');

const log = structuredLog.configure()
  .writeTo(new structuredLog.ConsoleSink())
  .create();

log.info('Hello {Name}!', 'Greg');
```

The above code will print the following to the console:

    [Information] Hello Greg!

## Installation

**structured-log** is distributed through [npm](https://www.npmjs.com/package/structured-log) and [Bower](https://bower.io/). Run the following:

    npm i --save structured-log

Or, using Bower:

    bower install structured-log

> Note: **structured-log** embeds a polyfill for `Object.assign`, but you will need to bring your own
> `Promise` polyfill to use it in an environment that doesn't support Promises natively.

## Configuration

Configuring **structured-log** is a straightforward process, going through three steps.
First, we initialize a new logging pipeline configuration by calling `configure()`:

```js
const log = structuredLog.configure()
```

The second step is the main step. Configuration of different
filters and targets is done by chaining methods together in a fluent syntax.
Events flow through the pipeline from top to bottom, so new filters and
enrichers can be inserted between the different sinks to build a highly
controllable pipeline.

```js
  .writeTo(new structuredLog.ConsoleSink())
  .minLevel.warning()
  .writeTo(new OtherExampleSink({ url: 'http://example.com' }))
  .writeTo(...)
```

The chain is closed by calling `create()`, which instantiates a new logger
instance based on the pipeline configuration.

```js
  .create();

// The logger is ready for use!
log.verbose('Hello structured-log!');
```

### Log Levels

There are 6 log levels available by default, in addition to a setting to disable logging completely.
In decreasing order of severity (with descriptions borrowed from [Seq](https://github.com/serilog/serilog/wiki/Writing-Log-Events#log-event-levels)):

|Label|Description|Bitfield|
|---|---|---|
|`off`|When the minimum level is set to this, nothing will be logged.|0|
|`fatal`|Critical errors causing complete failure of the application.|1|
|`error`|Indicates failures within the application or connected systems.|3|
|`warning`|Indicators of possible issues or service/functionality degradatio.|7|
|`information`|Events of interest or that have relevance to outside observers.|15|
|`debug`|Internal control flow and diagnostic state dumps to facilitate pinpointing of recognised problems.|31|
|`verbose`|Tracing information and debugging minutiae; generally only switched on in unusual situations.|63|

The log levels can also be represented as bitfields, and each log level also includes any levels of higher severity.
For example, `warning` will also allow events of the `error` level through, but block `information`,
`debug` and `verbose`.

A minimum level can be set anywhere in the pipeline to only allow events matching that level
level or lower to pass further through the pipeline.

The below examples will all set the minimum level to `warning`:

```js
  .minLevel.warning()
// or
  .minLevel(7)
// or
  .minLevel('warning')
```

There is no minimum level set by default, but a common choice is `Information`. Note that if a restrictive level is set
early in the pipeline, and a more permissive level is set further down, the events that are filtered out by the more
restrictive level will never reach the more permissive filter.

The Logger object contains shorthand methods for logging to each level.

```js
log.fatal('Application startup failed due to a missing configuration file');
log.error('Could not parse response message');
log.warn('Execution time of {time} exceeded budget of {budget}ms', actualTime, budgetTime);
log.info('Started a new session');
log.debug('Accept-Encoding header value: {acceptEncoding}', response.acceptEncoding);
log.verbose('Exiting getUsers()');
```

You can also pass an error object as the first argument to any of the logging methods, which will pass it along with
the event and allow it to be processed by the pipeline:

```js
try {
  // something that fails here
 } catch (error) {
   log.error(error, error.message);
 }
```

#### Dynamically controlling the minimum level

You can also control the minimum level dynamically using the `DynamicLevelSwitch` class.
Pass an instance to the `minLevel()` function:

```js
const dynamicLevelSwitch = new DynamicLevelSwitch();

// ...

  .minLevel(dynamicLevelSwitch)
```

You can then call the same shorthand methods as those present on the `minLevel` object (`error()`, `debug()` etc.) to
dynamically change the minimum level for the subsequent stages in the pipeline.

```js
logger.debug('This message will be logged');
dynamicLevelSwitch.warning();
logger.debug('This message won\'t');
```

### Sinks

A *sink* is a recipient for log events going through the pipeline, and is generally used to publish events to some
external source such as the developer console, file system or an online service.

To add a sink as a target for log events in the pipeline, pass an instance to the `writeTo()` function.

```js
  .writeTo(new ExampleSink())
```

The `Logger` object that's created with the `create()` method is also a valid sink,
so you can pass it to another pipeline.

```js
const logger1 = structuredLog.configure()
  // ...
  .create();

const logger2 = structuredLog.configure()
  .writeTo(logger1)
  .create();
```

#### Built-in sinks
|Name|Description|
|---|---|
|[ConsoleSink](#console-sink)|Outputs events through the `console` object in Node or the browser.|

#### 3rd party sinks
|Name|Description|
|---|---|
|[SeqSink](https://github.com/Wedvich/structured-log-seq-sink)|Outputs events to a [Seq](https://getseq.net) server.|

### Filtering

You can *filter* which events are passed through the pipeline using the `filter()` function. It takes
a single function parameter that will be used to test events going into the filter, and if it returns `true`,
the events will be allowed to continue through the pipeline.

The below example will filter out any log events with template properties, only
allowing pure text events through to the next pipeline stage.

```js
  .filter(logEvent => logEvent.properties.length === 0)
```

The predicate should take a log event as its only parameter, and return true or false.

### Enrichment

Log events going through the pipeline can be *enriched* with additional properties
by using the `enrich()` function.

```js
  .enrich({
    'version': 2,
    'source': 'Client Application'
  })
```

You can also pass a function as the first argument, and return an object with the properties to enrich with.
This can be useful to dynamically add properties based on the current context or state of the application.

```js
const state = {
  user: null
};

// ...

  .enrich(() => ({ user: state.user.name }))
```

### Errors

Errors in the logger are suppressed by default. To disable suppression, and allow errors to be propagated to
the environment, use the `suppressErrors()` function to set suppression to `false`.

```js
  .suppressErrors(false)
```

This setting is global for the pipeline, so if it is called multiple times in the configuration chain, the value of
the last call will be used.

> Only errors throw in the logging pipeline will be suppressed.
> Errors that occur during configuration will always propagate.

### Console Sink

The `ConsoleSink`, which outputs event to the Node.js or browser console, is provided by default.
The following line creates a new instance that can be passed to the logger configuration:

```js
var consoleSink = new ConsoleSink({ /* options */ });
```

The `options` object is optional, but can be used to modify the functionality of the sink.
It supports the following properties:

|Key|Description|Default|
|---|---|---|
|`console`|An object with a console interface (providing `log()`, `info()`, etc.) that will be used by the sink when writing output.|`console` global|
|`includeProperties`|If `true`, the properties of the log event will be written to the console in addition to the message.|`false`|
|`includeTimestamps`|If `true`, timestamps will be included in the message that is written to the console.|`false`|
|`restrictedToMinimumLevel`|If set, only events of the specified level or higher will be output to the console.||

### Batched Sink

The `BatchedSink` allows for batching events periodically and by size.

It can either be used as a wrapper around existing sinks:

```js
var batchedSink = new BatchedSink(new ConsoleSink(), { /* options */ });
```

Or, if developing a sink and using ES6 or TypeScript, you can use it as a base class to add batching capabilities:

```js
class MySink extends BatchedSink {
  constructor() {
    super(null, { /* options */ });
  }

  // Override emitCore and/or flushCore to add your own sink's behavior

  emitCore(events) {
    // ...
  }

  flushCore() {
    // ...

    return Promise.resolve();
    // If you don't return a promise,
    // a resolved promise will be returned for you
  }
}
```

The `options` object is optional, but can be used to modify the batching thresholds.
It supports the following properties:

|Key|Description|Default|
|---|---|---|
|`maxSize`|The maximum number of events in a single batch. The sink will be flushed immediately when this limit is hit.|`100`|
|`period`|The interval for autmoatic flushing of batches, in seconds.|`10`|

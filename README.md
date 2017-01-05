# structured-log [![Build Status](https://travis-ci.org/structured-log/structured-log.svg)](https://travis-ci.org/structured-log/structured-log) [![Coverage Status](https://coveralls.io/repos/github/Wedvich/structured-log/badge.svg?branch=dev)](https://coveralls.io/github/Wedvich/structured-log?branch=dev)

A structured logging framework for JavaScript, inspired by [Serilog](http://serilog.net/).

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

> Note: **structured-log** embeds a polyfill for `Object.assign`, but you will need to bring your own `Promise` polyfill to use it in an environment that doesn't support Promises natively.

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
  .writeTo(new ConsoleSink())
  .minLevel.warning()
  .writeTo(new HttpSink({ url: 'http://example.com' }))
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
In decreasing order of severity (borrowing descriptions from [Seq](https://github.com/serilog/serilog/wiki/Writing-Log-Events)):

|Label|Description|Bitfield|
|---|---|---|
|off|When the minimum level is set to this, nothing will be logged.|0|
|fatal|Critical errors causing complete failure of the application.|1|
|error|Indicates failures within the application or connected systems.|3|
|warning|Indicators of possible issues or service/functionality degradatio.|7|
|information|Events of interest or that have relevance to outside observers.|15|
|debug|Internal control flow and diagnostic state dumps to facilitate pinpointing of recognised problems.|31|
|verbose|Tracing information and debugging minutiae; generally only switched on in unusual situations.|63|

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

There is no minimum level set by default, but a common choice is `Information`. Note that if a restrictive level is set early in the pipeline,
and a more permissive level is set further down, the events that are filtered out by the more restrictive level
will never reach the more permissive filter.

The Logger object contains shorthand methods for logging to each level.

```js
log.fatal('Application startup failed due to a missing configuration file');
log.error('Could not parse response message');
log.warn('Execution time of {time} exceeded budget of {budget}ms', actualTime, budgetTime);
log.info('Started a new session');
log.debug('Accept-Encoding header value: {acceptEncoding}', response.acceptEncoding);
log.verbose('Exiting getUsers()');
```

#### Dynamically controlling the minimum level

You can also control the minimum level dynamically using the `DynamicLevelSwitch` class. Pass an instance to the `minLevel()` function:
```js
var dynamicLevelSwitch = new DynamicLevelSwitch();

// ...
  .minLevel(dynamicLevelSwitch)
```

You can then call the same shorthand methods as those present on the `minLevel` object (`error()`, `debug()` etc.) to dynamically change
the minimum level for the subsequent stages in the pipeline.

```js
logger.debug('This message will be logged');
dynamicLevelSwitch.warning();
logger.debug('This message won\'t');
```

### Sinks

A sink is a target for log events going through the pipeline.

#### Built-in sinks
|Name|Description|
|---|---|
|ConsoleSink|Outputs events through the `console` object in Node or the browser.|

#### 3rd party sinks
|Name|Description|
|---|---|
|[SeqSink](https://github.com/Wedvich/structured-log-seq-sink)|Outputs events to a Seq server.|

### Filters

You can add filters to the pipeline by using the `filter()` function. It takes
a single predicate that will be applied to events passing through the filter.

The below example will filter out any log events with template properties, only
allowing pure text events through to the next pipeline stage.

```js
  .filter(logEvent => logEvent.properties.length === 0)
```

### Enrichers

Log events going through the pipeline can be enriched with additional properties
by using the `enrich()` function.

```js
  .enrich({
    'version': 2,
    'source': 'Client Application'
  })
```

You can also pass a function as the first argument, and return an object with
the properties to enrich with.

```js
function getEnrichersFromState() {
  return {
    'user': state.user
  };
}

// ...

  .enrich(getEnrichersFromState)

```

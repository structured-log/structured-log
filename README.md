# structured-log [![Build Status](https://travis-ci.org/structured-log/structured-log.svg)](https://travis-ci.org/structured-log/structured-log)

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

There are 6 log levels available. From most to least restrictive:
- `0 - Fatal`
- `1 - Error`
- `2 - Warning`
- `3 - Information`
- `4 - Debug`
- `5 - Verbose`

Each log level also includes all levels with a lower value. For example, `Warning` will also
allow events of the `Error` level through, but block `Information`, `Debug` and
`Verbose`.

A minimum level can be set anywhere in the pipeline to only allow events matching that level
level or lower to pass further through the pipeline.

The below examples will all set the minimum level to `Warning`:

```js
  .minLevel.warning()
// or
  .minLevel(2)
// or
  .minLevel('Warning')
```

There is no default minimum level, but a common choice is `Information`. Note that if a restrictive level is set early in the pipeline,
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

In addition, `warning()` and `information()` are aliases for `warn()` and `info()`, respectively.

### Sinks

A sink is a target for log events going through the pipeline.

#### Built-in sinks
|Name|Description|
|---|---|
|ConsoleSink|Outputs events through the `console` object in Node or the browser|

#### 3rd party sinks
|Name|Description|
|---|---|
|[SeqSink](https://github.com/Wedvich/structured-log-seq-sink)|Outputs events to a Seq server|

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

  .enrich(getEnrichersFromState())

```

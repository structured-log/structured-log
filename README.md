# structured-log [![Build Status](https://travis-ci.org/structured-log/structured-log.svg)](https://travis-ci.org/structured-log/structured-log)

A structured logging framework for JavaScript, inspired by [Serilog](http://serilog.net/).

## Basic Example

```js
import structuredLog, { ConsoleSink } from 'structured-log';

const log = structuredLog.configure()
  .writeTo(new ConsoleSink())
  .create();

log.info('Hello {Name}!', 'Greg');
```

The above code will print the following to the console:

    [INF] Hello Greg!

## Installation

structured-log is distributed through [npm](https://www.npmjs.com/package/structured-log) and [Bower](https://bower.io/). Run the following:

    npm i --save structured-log

Or, using Bower:

    bower install structured-log

## Configuration

Configuring structured-log goes through three steps:

```js
 // 1. This initializes a new pipeline pipeline configuration.
const log = structuredLog.configure()

// 2. This is the main configuration step. Here you can add new stages to the
//    logging pipeline using a fluent syntax. Events flow through the pipeline
//    from top to bottom, so new filters and enrichers can be inserted between
//    the different sinks to create a highly controllable pipeline.
  .writeTo(new ConsoleSink())
  .minLevel(logLevels.WARN)
  .writeTo(new HttpSink({ url: 'http://example.com' }))
  .writeTo(...)

// 3. Create a new logger object from the configuration.
  .create();

// The new logger instance is ready to be used.
log.verbose(...);
```

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

### Log Levels

A minimum level can be set anywhere in the pipeline to only allow events of that
level or higher through.

There are 5 log levels available. From least to most inclusive:
- `ERROR`
- `WARN`
- `INFO`
- `DEBUG`
- `VERBOSE`

Each log level also includes all levels above it. For example, `WARN` will also
allow events of the `ERROR` level through, but block `INFO`, `DEBUG` and
`VERBOSE`.

The below example will set the minimum level to `WARN`:

```js
.minLevel('WARN')
```

The default minimum level is `INFO`. Note that if a minimum level is set lower
down the pipeline, and the default minimum level of the pipeline does not
inlcude the new minimum level, the default minimum level for the pipeline will
be set to include the new minimum level.

### Enrichers

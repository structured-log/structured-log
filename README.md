# structured-log [![Build Status](https://travis-ci.org/structured-log/structured-log.svg)](https://travis-ci.org/structured-log/structured-log)

A structured logging framework for JavaScript, inspired by [Serilog](http://serilog.net/).

## Example

```js
var structuredLog = require('structured-log');
var consoleSink =   require('structured-log/console-sink');

var logger = structuredLog.configure()
  .writeTo(consoleSink())
  .create();

logger.info('Hello {Name}!', 'Fred');
```

The above code will print the following to the console:

    [INF] Hello Greg!

## Installation

structured-log is distributed through [npm](https://www.npmjs.com/package/structured-log) and [Bower](https://bower.io/). Run the following:

    npm i --save structured-log

Or, using Bower:

    bower install structured-log

serilog.js
==========

A sketch pad for exploring what a JavaScript implementation of Serilog might look like.

Why?
----

First and foremost, it's an interesting project. There doesn't seem to be an analogue of Serilog available for JavaScript, yet the overall platform (ubiquitous serializable data) makes it really natural to approach things the Serilog way.

It's also nice as a user of both .NET and the JavaScript platforms (node and the browser) to get one coherent logging experience across them all.

Goals
-----

Loosely, this is what we're heading towards. First, a pipelined configuration syntax that feels 'like Serilog' but fits naturally into JavaScript.

```js
var log = serilog.configuration()
  .minimumLevel('WARNING')
  .filter(function(evt) { return !evt.properties.isNoisy; })
  .enrich('username', identity.username)
  .writeTo(serilog.sink.console())
  .writeTo(serilog.sink.http({url: 'http://my-app/logs'}))
  .createLogger();
```

Unlike the .NET Serilog, the pipeline is executed strictly top-to-bottom, so filtering and enrichment can be applied selectively between sinks, and so-on.

Out of the box there will be some basic sinks: _console_, _process.stdout/stderr_, _file_ and _http_. Additionally, a 'skeleton' for periodic/batching sinks will be important, and the HTTP sink will be based on it.

The logger itself will support the standard Serilog message templates including property names and destructuring hints:

```js
log('Starting up on {machine}...', hostname);
```

Calling the logger as a function will log an `INFORMATION` event. A simple set of levels will be supported:

```js
log.trace('This is a verbose message');
log.warning('Look out, trouble is brewing!');
log.error('Boom...');
```

We'll create packages for NPM and Bower to make it easy to get started.

Design
------

The pipelined implementation of _serilog.js_ borrows from _gulp.js_ and reactive event processing. Each method on the configuration object (e.g. `minimumLevel()`, `enrich()`, `filter()` and `writeTo()`) is implemented using the `pipe()` primitive.

`pipe()` can make arbitrary transformations on the event stream - simple ones like those above, replacement of events, and more complex many-to-one and one-to-many tranforms.

For example, one to many:

```
var warningsToday = 0;

var log = serilog.configuration()
  .pipe(function(evt, next){
    next(evt);
    if (evt.level === 'WARNING') {
      warningsToday++;
      var agg = serilog.event('INFORMATION', 'Today: {warnings}', warningsToday);
      next(agg);
    }
  })
  .createLogger();
```



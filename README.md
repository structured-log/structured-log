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

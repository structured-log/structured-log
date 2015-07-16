#serilog.js

The Javascript version of [Serilog](http://serilog.net/).

todo: a bit more on structured logging, sinks and generally why else serilog is awesome.

## Installation

### Server-side ([Node.js](https://nodejs.org/)) via [npm](https://www.google.com.au/webhp?sourceid=chrome-instant&ion=1&espv=2&es_th=1&ie=UTF-8#es_th=1&q=npm)

  npm install --save serilog

### Client-side (Web Browser) via [Bower](http://bower.io/)

  bower install --save serilog
 
## Basic Setup

This section describes the most basic Serilog setup for both server and client.

### Server-side

In your NodeJS script:

	var coloredConsoleSink = require('serilog-colored-console-sink');
	var serilog = require('serilog');

	var log = serilog.configuration()
    	.writeTo(coloredConsoleSink())
	    .createLogger();
    
### Client-side

In your HTML file:

```
  <script type='text/javascript' src='bower_components/serilog/serilog.js />
```

In your Javascript code:

	var log = serilog.configuration() 
    	.writeTo(serilog.consoleSink())
	    .createLogger();
  
### Multiple sinks

Serilog configuration is a *fluent API* that can be used to configure a logger. One example of this is to specify multilple sinks, eg:

	var log = serilog.configuration() 
		.writeTo(consoleSink)
		.writeTo(httpSink({ url: '<some-url>' }))
		.createLogger();

### Writing to another log

A log can easily be piped to another log:

	var someOtherLog = serilog.configuration()
		// ... setup ...
		.createLogger(); 

	var log = serilog.configuration() 
		.writeTo(consoleSink)
		.writeTo(someOtherLog)
		.createLogger();


## Basic Usage

Debugging:

	log.trace('My debug message!');
	log.debug('My debug message!');
	log.verbose('My debug message!');
 
Information:

	log.info('Something happened in the application...');

Information alternative:

	log('Something happened in the application...');

Warnings:
  
	log.warn('Some not-fatal error happened...');

Errors:

	log.error('Something bad happened...');
	log.error(exceptionOrErrorObject, 'Something bad happend...');
	log.fatal('Something bad happened...');
	log.fatal(exceptionOrErrorObject, 'Something bad happend...');

## Structured Logging

All the logging functions accept a message template and a set of key/value properties that are used to render the template when constring the log message for display. The properties are maintained separately to the template and rendered message which is what makes Serilog a structured logging system.

Here are some examples that have been adapted for Javascript from the [Serilog C# examples](http://serilog.net/):
 
	var position = { Latitude: 25, Longitude: 134 };
	var elapsedMs = 34;
	
	log.information("Processed {@Position} in {Elapsed:000} ms.", {
		Position: position,
		Elapsed: elapsedMs
	});

Properties can also be specified by positional parameters, the same as how it works in Serilog C#: 

	log.information("Processed {@Position} in {Elapsed:000} ms.", position, elapsedMs);

## Included Sinks

A *sink* is a plugin that is invoked for each *log event*. Usualy a sink defines an *output method* for logs, such as the ability to output to the [console]( https://developer.mozilla.org/en/docs/Web/API/console).  

Seriogjs includes a number of built-in sinks.

### Server-side

All sinks are imported using the Nodejs *require* function as follows:

	var someSink = require('<sink-name>');

| Name | Description | Batched/Unbatched |
| ---- | ----------- | ----------------- |
| console-sink | Writes formatted log events to the *console* | Unbatched |
| colored-console-sink | Same as above, but with colors | Unbatched |
| json-console-sink | Writes structured json to the console for each log event | Unbatched |
| stream-sink | Writes formatted log events to a Nodejs stream | Unbatched |
| json-stream-sink | Writes structured json tot he console for each log event | Unbatched |
| http-sink | Outputs structured json log events via HTTP post |  Batched |

### Client-side

| Name | Description |
| ---- | ------------- |
| console-sink | Writes formatted log events to the *console* | Unbatched |
| json-console-sink | Writes structured json to the console for each log event | Unbatched |
| http-sink | Outputs structured json log events via HTTP post | Batched |

## Batching

Some of the sinks are batched. Batched sinks process multiple log events at once usually for increased performance or to reduce timing issues (eg HTTP logs being received out of order). 

### Configuring Batched Sinks

All batched sinks (even custom batched sinks) have the same standard configuration options.

	var httpSink = require('serilog-http-sink'); 
	
	var log = serilog.configuration()
		.writeTo(httpSink({
			url: 'http://somelogreceiver',    // Configuration for the custom sink.
			batchSize: 1000,          // Flush the queue every 1000 logs.
			timeDuration: 3000,         // Milliseconds to wait before flushing the queue.            
		})
		.createLogger();

*batchSize* specifies the amount of logs to include in a batch. When this number of logs are in the queue the queue will be flushed and processed by the sink.

*timeDuration* specifies the amount of time that will pass before the log queue is flushed. This ensure that the queue is periodically flushed even if not enought logs events have been queued to trigger the *batchSize* flush. 

Either of these options can be omitted and be set to default values.

### Flushing Queued Logs

The queue of batched logs can be flushed at any time by calling the *flush* function.

If it suits your purpose you can simply call flush:

  log.flush();

If you need a callback when the flush has completed you have two options.

The first option is the standard Javascript-style callback:

	log.flush(function (err) {
		if (err) {
			// An error occurred while flushing.
		}
		else {
			// The queue was flushed successfully.
		}
	});
 
The second option is to use the promise that is returned by *flush*:

	log.flush()
		.then(function () {
			// The queue was flushed successfully.
		})
		.catch(function (err) {
			// An error occurred while flushing.
		})
		.done(); // Terminate the promise chain.

## 3rd-party Sinks

A number of additional sinks are available as separate packages.

If you release your own custom sink for Serilogjs please let us know and we'll add it to the list!  

### Server-side (via npm)

| Name | Description |
| ---- | ------------- |
| [email-sink](???) | Outputs formattted log messages via SMTP |
| [mongodb-sink](???) | Writes structure json log events to the MongoDB database |

### Client-side (via bower)

| Name | Description |
| ---- | ------------- |
| [websockets-sink](???) | Outputs formattted log messages via websockets |
| [socketio-sink](???) | Outputs formattted log messages via [the Socket.IO library](http://socket.io/) |

## Make your own sink

It is very easy to make your own sink. You first have to decide if the sink should process log events individually or as a batch.

There are plenty of built-in examples of sinks. So can you can always copy and modify an existing sink.

### Non-batched custom sink

Non-batched sinks process each log event individually:

	var myCustomSink = function (options) {
		return {
			emit: function (logEvent) {
				//
				// ... your custom log event processing goes here ...
				//
			}
		};
	};
	
	var customSinkOptions = {
		// Whatever custom options you need...
	};
	
	var log = serilog.configure()
		.writeTo(myCustomSink(customSinkOptions))
		.createLogger();

### As a Nodejs module

MyCustomSink.js:

	module.exports = function (options) {
		return {
			emit: function (logEvent) {
				//
				// ... your custom log event processing goes here ...
				//
			}
		};
	};

SomewhereElse.js:

	var myCustomSink = require('./MyCustomSink');
	
	var customSinkOptions = {
		// Whatever custom options you need...
	};
	
	var log = serilog.configure()
		.writeTo(myCustomSink(customSinkOptions))
		.createLogger();


### Batched custom sink

Batched sinks process a batch of log events at a time. Serilogjs buffers log events until the log queue is flushed. By simply replacing the *emit* function with *emitBatch* you can convert your sink to work in batched mode, accepting an *array* of log events instead of just a single  log event.

	var myCustomSink = function (options) {
		return {
			emitBatch: function (logEvents) {
				//
				// ... process the array of log events ...
				//
			}
		};
	};

## Advanced Setup

The Serilog *fluent API* has a number of functions used to configure your log.

### Log Levels

Set the minimum log level that is output:

	var log = serilog.configuration()
		.minimumLevel('WARN')
		.writeTo(consoleSink())
		.createLogger();

*minimumLevel* applies to subsequent sinks in the configuration, so you can use it to set a different level for each sink: 

	var log = serilog.configuration()
		.minimumLevel('VERBOSE')
		.writeTo(consoleSink())
		.minimumLevel('INFO')
		.writeTo(httpSink())
		.minimumLevel('ERROR')
		.writeTo(emailSink())
		.createLogger();

### Filtering

Custom filtering can be applied to include/exclude logging based on a predicate function. 

	var log = serilog.configuration()
		.filter(function (logEvent) {
			return someCondition(logEvent);
		})
		.writeTo(consoleSink())
		.createLogger();

This kind of filtering affects subsequent sinks in the configuration, you can use it in combination with *clearFilter* to provide different filters for different sinks: 

	var log = serilog.configuration()
		.filter(function (logEvent) {
			return okForConsole(logEvent);
		}))
		.writeTo(consoleSink())
		.resetFilter()
		.filter(function (logEvent) {
			return okForHttp(logEvent);
		}))
		.createLogger();

Logs can also be filtered after configuration, this effectively creates a new log with the added filter:

	var log2 = log.filter(function (logEvent) {
		// ... some condition ...
	});
	
	log2.info("This log is filtered by the new criteria!");   


### Enrichment

Enrichment can be used to add key/value properties to all logs output via a particular logger.

	var log = serilog.configuration()
		.enrich({
			UserId: getCurUserId(),
			SessionId: getCurSessionId(),
		})
		.writeTo(consoleSink())
		.createLogger();

Any number of properties can be attached to log messages in this manner. The properties may then be used in the log messages themselves:

	log.info("Current user {UserId} has done something.");

As with other configuration, the *enrich* only affects subsequent sinks.

Logs can also be enriched after configuration, this effectively creates a new log with additional properties:

	var log2 = log.enrich({ NewProperty: 'just for log2' };
	
	log2.info("I've added a new property: {NewProperty}");   
	
### Tagging

Logs can be tagged with string values. This is useful to filter and categories logs generated by an application:

	var log = serilog.configuration()
		.tag("authentication-system")
		.writeTo(consoleSink())
		.createLogger();

Logs can also be tagged after configuration, this effectively creates a new log that has the desired tag:
	
	var log2 = log.tag('some-new-tag');
	
	log2.info("This log is tagged with 'some-new-tag'");
	

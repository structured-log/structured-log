
var structuredLog = require('../../src/core/structured-log');
var consoleSink = require('../../src/npm/console-sink');

var log = structuredLog.configure()
	.minLevel('VERBOSE')
	.writeTo(consoleSink())
    .create();

log.info('Hello this is some {info}.', 'information');

log('Hello this is more information.');

log.warn('This is a warning.');

log.error('This is an error.');

log.verbose('This is verbose!');

var position = { Latitude: 25, Longitude: 134 };
var elapsedMs = 34;

log.info("Processed {@Position} in {Elapsed} ms.", position, elapsedMs);


var structuredLog = require('structured-log');
var consoleSink = require('structured-log/console-sink');

var log = structuredLog.configure()
	.minLevel('VERBOSE')
	.writeTo(consoleSink())
    .create();

log.info('Hello this is some information.');

log('Hello this is more information.');

log.warn('This is a warning.');

log.error('This is an error.');

log.verbose('This is verbose!');
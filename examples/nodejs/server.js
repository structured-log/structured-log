
var structuredLog = require('structured-log-dev');
var consoleSink = require('structured-log-dev/console-sink');

var log = structuredLog.configure()
	.writeTo(consoleSink())
    .create();

log.info('Hello this is some information.');

log('Hello this is more information.');

log.warn('This is a warning.');

log.error('This is an error.');
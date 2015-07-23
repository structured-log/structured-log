
var structuredLog = require('structured-log-dev');
var consoleSink = require('structured-log-dev/console-sink');

var log = structuredLog.configuration()
	.writeTo(consoleSink())
    .createLogger();

log.information('Hello this is some information.');

log.warning('This is a warning.');

log.error('This is an error.');
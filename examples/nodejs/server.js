
var serilog = require('structured-log-dev');
var consoleSink = require('structured-log-dev/serilog-console-sink');

var log = serilog.configuration()
	.writeTo(consoleSink())
    .createLogger();

log.information('Hello this is some information.');

log.warning('This is a warning.');

log.error('This is an error.');
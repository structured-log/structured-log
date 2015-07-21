
var serilog = require('structured-log');
var consoleSink = require('structured-log/serilog-console-sink');

var log = serilog.configuration()
	.writeTo(consoleSink())
    .createLogger();

log.information('Hello this is some information.');

log.warning('This is a warning.');

log.error('This is an error.');
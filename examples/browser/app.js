
var log = structuredLog.configuration() 
    .writeTo(structuredLog.sink.console())
    .createLogger();

log.information('Hello this is some information.');

log.warning('This is a warning.');

log.error('This is an error.');
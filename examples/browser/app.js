
var log = structuredLog.configuration() 
    .writeTo(structuredLog.sink.console())
    .createLogger();

log.info('Hello this is some information.');

log.warn('This is a warning.');

log.error('This is an error.');
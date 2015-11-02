
var log = structuredLog.configure() 
    .writeTo(structuredLog.consoleSink())
    .create();

log.info('Hello this is some information.');

log('Hello this is more information.');

log.warn('This is a warning.');

log.error('This is an error.');
var logger = structuredLog.configure()
  .minLevel.information()
  .writeTo(new structuredLog.ConsoleSink())
  .create(true);

logger.info('You should see this in the console!');
logger.verbose('But you shouldn\'t see this.');

var secondLogger = structuredLog.configure()
  .minLevel.debug()
  .writeTo(new structuredLog.ConsoleSink())
  .writeTo(logger)
  .create(true);

secondLogger.debug('This should also be visible, but only {times} time.', 1);
secondLogger.verbose('But not this.');
secondLogger.info('However, this should show up twice in the console!');

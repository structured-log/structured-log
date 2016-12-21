var logger = structuredLog.configure()
  .minLevel.information()
  .writeTo(new structuredLog.ConsoleSink())
  .create(true);

logger.info('You should see this in the console!');
logger.verbose('But you shouldn\'t see this.');

var secondLogger = structuredLog.configure()
  .minLevel.verbose()
  .writeTo(new structuredLog.ConsoleSink())
  .writeTo(logger)
  .create(true);

secondLogger.verbose('And you should see this too, but only {times}.', 'once');
secondLogger.info('However, this should show up twice in the console!');

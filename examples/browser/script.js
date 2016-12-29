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

var levelSwitch = new structuredLog.LogEventLevelSwitch(4);
levelSwitch.warning();
var thirdLogger = structuredLog.configure()
  .minLevel(levelSwitch)
  .writeTo(new structuredLog.ConsoleSink())
  .create(true);
  
/*thirdLogger.warn('You can also dynamically control the log level, which allows you to see this...');
Promise.resolve().then(() => {
  levelSwitch.fatal();
  thirdLogger.error('... but not this.');
});*/

thirdLogger.warn('You can also dynamically control the log level, which allows you to see this...');
levelSwitch.fatal();
thirdLogger.error('... but not this.');
thirdLogger.fatal('And still this!');
levelSwitch.error();
thirdLogger.error('And then this again!');

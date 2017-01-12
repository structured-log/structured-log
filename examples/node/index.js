const structuredLog = require('../../dist/structured-log');

const logger = structuredLog.configure()
  .minLevel.information()
  .writeTo(new structuredLog.ConsoleSink())
  .create(true);

logger.info('You should see this in the console!');
logger.verbose('But you shouldn\'t see this.');

const secondLogger = structuredLog.configure()
  .minLevel.debug()
  .writeTo(new structuredLog.ConsoleSink())
  .writeTo(logger)
  .create(true);

secondLogger.debug('This should also be visible, but only {times} time.', 1);
secondLogger.verbose('But not this.');
secondLogger.info('However, this should show up twice in the console!');

var dynamicLevelSwitch = new structuredLog.DynamicLevelSwitch();
dynamicLevelSwitch.warning();
var thirdLogger = structuredLog.configure()
  .minLevel(dynamicLevelSwitch)
  .writeTo(new structuredLog.ConsoleSink())
  .create(true);

thirdLogger.flush()
  .then(() => {
    thirdLogger.warn(new Error('Something bad must have happened here'),
      'You can also dynamically control the log level, which allows you to see this stack trace:');
    return dynamicLevelSwitch.fatal();
  })
  .then(() => {
    thirdLogger.error(new Error('Hidden'), '... but not this one.');
    thirdLogger.fatal('And still this!');
    return dynamicLevelSwitch.error();
  })
  .then(() => {
    thirdLogger.error('And then this again!');
  });

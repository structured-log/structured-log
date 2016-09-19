import { expect } from 'chai';
import LoggerConfiguration from '../src/loggerConfiguration';
import LevelMap from '../src/levelMap';
import * as logLevels from '../src/logLevels';
import { createWrappedSinkStage } from './testHelpers';

describe('LoggerConfiguration', () => {
  it('should enrich log events with properties from an object', () => {
    let loggedEvents = [];
    const logSink = createWrappedSinkStage(logEvents => loggedEvents = logEvents);

    const logger = new LoggerConfiguration()
      .writeTo(logSink)
      .enrich({
        'Source': 'Client'
      })
      .create();

    logger.info('Hello world!');

    expect(loggedEvents.length).to.equal(1);
    expect(loggedEvents[0].properties).to.have.property('Source', 'Client');
  });

  it('should enrich log events with properties from a function', () => {
    let loggedEvents = [];
    const logSink = createWrappedSinkStage(logEvents => loggedEvents = logEvents);

    let version;

    const logger = new LoggerConfiguration()
      .writeTo(logSink)
      .enrich(() => {
        return {
          'Version': version
        };
      })
      .create();

    version = 2;

    logger.info('Hello world!');

    expect(loggedEvents.length).to.equal(1);
    expect(loggedEvents[0].properties).to.have.property('Version', 2);
  });

  it('should accept a LevelMap instance for dynamically log minimum level', () => {
    let loggedEvents = [];
    const logSink = createWrappedSinkStage(logEvents => loggedEvents = logEvents);

    const levelMap = new LevelMap();

    const logger = new LoggerConfiguration()
      .minLevel(levelMap)
      .writeTo(logSink)
      .create();

    logger.debug('No');
    levelMap.minLevel = logLevels.DEBUG;
    logger.debug('Yes');

    expect(logger.isEnabled(logLevels.DEBUG)).to.be.true;
    expect(loggedEvents.length).to.equal(1);
    expect(loggedEvents[0].messageTemplate.raw).to.equal('Yes');
  });
});

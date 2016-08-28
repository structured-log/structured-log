import { expect } from 'chai';
import LoggerConfiguration from '../src/loggerConfiguration';
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
});

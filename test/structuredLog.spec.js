import { expect } from 'chai';
import StructuredLog from '../src/structuredLog';
import LoggerConfiguration from '../src/loggerConfiguration';
import ConsoleSink from '../src/sinks/consoleSink';

describe('StructuredLog', () => {
  it('should configure a new LoggerConfiguration instance', () => {
    const configuration1 = StructuredLog.configure();
    const configuration2 = StructuredLog.configure();

    expect(configuration1).to.be.instanceof(LoggerConfiguration);
    expect(configuration2).to.be.instanceof(LoggerConfiguration);
    expect(configuration1).to.not.equal(configuration2);
  });

  it('should be able to log stuff', () => {
    const logger = StructuredLog.configure()
      .minLevel('VERBOSE')
      .writeTo(new ConsoleSink())
      .create();
  });
});

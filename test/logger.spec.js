import { expect } from 'chai';
import sinon from 'sinon';
import Logger from '../src/logger';
import * as logLevels from '../src/logLevels';

describe('Logger', () => {
  it('should call write with the appropriate arguments', () => {
    const logger = new Logger();
    const writeSpy = sinon.spy(logger, 'write');

    logger.info('Hello!');
    logger.debug('Hello {person}!', 'you');

    expect(writeSpy.calledWithExactly(logLevels.INFO, 'Hello!')).to.be.true;
    expect(writeSpy.calledWithExactly(logLevels.DEBUG, 'Hello {person}!', 'you')).to.be.true;
    expect(writeSpy.calledWithExactly(logLevels.ERROR, 'Oh no!')).to.be.false;
  });

  it('should flush the pipeline when flush is called', () => {
    const pipeline = { flush: () => null };
    const flushSpy = sinon.spy(pipeline, 'flush');

    const logger = new Logger(null, pipeline);
    logger.flush();

    expect(flushSpy.calledOnce).to.be.true;
  });

  it('should close the pipeline when close is called', () => {
    const pipeline = { close: () => null };
    const closeSpy = sinon.spy(pipeline, 'close');

    const logger = new Logger(null, pipeline);
    logger.close();

    expect(closeSpy.calledOnce).to.be.true;
  });
});

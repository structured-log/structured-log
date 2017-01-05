/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { Logger } from '../src/logger';
import { LogEvent, LogEventLevel } from '../src/logEvent';
import { Pipeline } from '../src/pipeline';

function verifyLevel(level: LogEventLevel) {
  return (events: LogEvent[]) => events.length && events[0].level === level;
}

describe('Logger', () => {
  it('logs with fatal severity', () => {
    const mockPipeline = TypeMoq.Mock.ofType<Pipeline>();
    mockPipeline.setup(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.fatal))));
    const logger = new Logger(mockPipeline.object);
    logger.fatal('Test');
    mockPipeline.verify(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.fatal))), TypeMoq.Times.once());
  });

  it('logs with error severity', () => {
    const mockPipeline = TypeMoq.Mock.ofType<Pipeline>();
    mockPipeline.setup(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.error))));
    const logger = new Logger(mockPipeline.object);
    logger.error('Test');
    mockPipeline.verify(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.error))), TypeMoq.Times.once());
  });

  it('logs with warning severity', () => {
    const mockPipeline = TypeMoq.Mock.ofType<Pipeline>();
    mockPipeline.setup(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.warning))));
    const logger = new Logger(mockPipeline.object);
    logger.warn('Test');
    mockPipeline.verify(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.warning))), TypeMoq.Times.once());
  });
  
  it('logs with information severity', () => {
    const mockPipeline = TypeMoq.Mock.ofType<Pipeline>();
    mockPipeline.setup(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.information))));
    const logger = new Logger(mockPipeline.object);
    logger.info('Test');
    mockPipeline.verify(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.information))), TypeMoq.Times.once());
  });
  
  it('logs with debug severity', () => {
    const mockPipeline = TypeMoq.Mock.ofType<Pipeline>();
    mockPipeline.setup(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.debug))));
    const logger = new Logger(mockPipeline.object);
    logger.debug('Test');
    mockPipeline.verify(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.debug))), TypeMoq.Times.once());
  });

  it('logs with verbose severity', () => {
    const mockPipeline = TypeMoq.Mock.ofType<Pipeline>();
    mockPipeline.setup(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.verbose))));
    const logger = new Logger(mockPipeline.object);
    logger.verbose('Test');
    mockPipeline.verify(m => m.emit(TypeMoq.It.is(verifyLevel(LogEventLevel.verbose))), TypeMoq.Times.once());
  });

  describe('flush()', () => {
    it('flushes the pipeline', () => {
      const mockPipeline = TypeMoq.Mock.ofType<Pipeline>();
      mockPipeline.setup(m => m.flush());
      const logger = new Logger(mockPipeline.object);
      logger.flush();
      mockPipeline.verify(m => m.flush(), TypeMoq.Times.once());
    });
  });
});

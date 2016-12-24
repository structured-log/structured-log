/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { ILogEvent, LogEventLevel } from '../src/logEvent';
import { Pipeline } from '../src/pipeline';
import { Logger } from '../src/logger';

describe('Logger', () => {
  let pipeline: TypeMoq.IMock<Pipeline>;
  let logger: Logger;
  let resolveCallback: () => void;
  let emitPromise;
  let emittedEvents: ILogEvent[];

  beforeEach(() => {
    pipeline = TypeMoq.Mock.ofType<Pipeline>();
    pipeline.setup(m => m.emit(TypeMoq.It.isAny()))
      .returns(events => {
        emittedEvents = [...events];
        resolveCallback();
        return Promise.resolve();
      });
    emitPromise = new Promise(resolve => resolveCallback = resolve);
    logger = new Logger(pipeline.object);
  });

  describe('debug()', () => {
    it('logs events with the Debug level', () => {
      logger.debug('Test');
      return emitPromise
        .then(() => {
          expect(emittedEvents).to.have.length(1);
          expect(emittedEvents[0]).to.have.property('level', LogEventLevel.debug);
        });
    });
  });

  describe('emit()', () => {
    it('calls emit on the pipeline', () => {
      pipeline.setup(m => m.emit(TypeMoq.It.isAny())).returns(events => Promise.resolve(events));
      return logger.emit([]).then(() => pipeline.verify(m => m.emit(TypeMoq.It.isAny()), TypeMoq.Times.once()));
    });
  });

  describe('error()', () => {
    it('logs events with the Error level', () => {
      logger.error('Test');
      return emitPromise
        .then(() => {
          expect(emittedEvents).to.have.length(1);
          expect(emittedEvents[0]).to.have.property('level', LogEventLevel.error);
        });
    });
  });

  describe('fatal()', () => {
    it('logs events with the Fatal level', () => {
      logger.fatal('Test');
      return emitPromise
        .then(() => {
          expect(emittedEvents).to.have.length(1);
          expect(emittedEvents[0]).to.have.property('level', LogEventLevel.fatal);
        });
    });
  });

  describe('flush()', () => {
    it('calls flush on the pipeline', () => {
      pipeline.setup(m => m.flush()).returns(() => Promise.resolve());
      return logger.flush().then(() => pipeline.verify(m => m.flush(), TypeMoq.Times.once()));
    });
  });

  describe('info()', () => {
    it('logs events with the Information level', () => {
      logger.info('Test');
      return emitPromise
        .then(() => {
          expect(emittedEvents).to.have.length(1);
          expect(emittedEvents[0]).to.have.property('level', LogEventLevel.information);
        });
    });
  });

  describe('warn()', () => {
    it('logs events with the Warning level', () => {
      logger.warn('Test');
      return emitPromise
        .then(() => {
          expect(emittedEvents).to.have.length(1);
          expect(emittedEvents[0]).to.have.property('level', LogEventLevel.warning);
        });
    });
  });

  describe('verbose()', () => {
    it('logs events with the Debug level', () => {
      logger.verbose('Test');
      return emitPromise
        .then(() => {
          expect(emittedEvents).to.have.length(1);
          expect(emittedEvents[0]).to.have.property('level', LogEventLevel.verbose);
        });
    });
  });
});

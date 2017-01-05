/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { LoggerConfiguration } from '../src/loggerConfiguration';
import { Logger } from '../src/logger';
import { LogEventLevel } from '../src/logEvent';
import { Pipeline, PipelineStage } from '../src/pipeline';
import { Sink, SinkStage } from '../src/sink';
import { DynamicLevelSwitch } from '../src/dynamicLevelSwitch';

describe('LoggerConfiguration', () => {
  describe('create()', () => {
    it('creates a new logger instance', () => {
      const loggerConfiguration = new LoggerConfiguration();
      const logger = loggerConfiguration.create();
      expect(logger).to.be.instanceof(Logger);
    });
  });

  describe('enrich()', () => {
    it('adds an enricher to the pipeline', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .enrich({ c: 3 })
        .enrich(() => ({ d: 4 }))
        .writeTo(sink.object)
        .create();

      logger.info('C is the third letter');

      return logger.flush().then(() => {
        expect(emittedEvents[0]).to.have.deep.property('properties.c', 3);
        expect(emittedEvents[0]).to.have.deep.property('properties.d', 4);
      });
    });
  });

  describe('filter()', () => {
    it('adds a filter to the pipeline', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .filter(e => e.messageTemplate.raw.indexOf('C') === 0)
        .writeTo(sink.object)
        .create();

      logger.info('A is the first letter');
      logger.info('B is the second letter');
      logger.info('C is the third letter');
      logger.info('D is the fourth letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(1);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'C is the third letter');
      });
    });
  });

  describe('minLevel()', () => {
    it('throws if no level or switch is provided', () => {
      const loggerConfiguration = new LoggerConfiguration();
      expect(() => loggerConfiguration.minLevel(undefined)).to.throw();
      expect(() => loggerConfiguration.minLevel(null)).to.throw();
    });

    it('sets the minimum level', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel(LogEventLevel.debug)
        .writeTo(sink.object)
        .create();

      logger.fatal('A is the first letter');
      logger.verbose('B is the second letter');
      logger.info('C is the third letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(2);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'A is the first letter');
        expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'C is the third letter');
      });
    });

    it('sets the minimum by bit flags', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel(23)
        .writeTo(sink.object)
        .create();

      logger.error('A is the first letter');
      logger.info('B is the second letter');
      logger.debug('C is the third letter');
      logger.warn('D is the fourth letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(2);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'A is the first letter');
        expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'D is the fourth letter');
      });
    });

    it('sets the minimum level by label (case-insensitive)', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel('WaRninG')
        .writeTo(sink.object)
        .create();

      logger.fatal('A is the first letter');
      logger.warn('B is the second letter');
      logger.info('C is the third letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(2);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'A is the first letter');
        expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
      });
    });

    it('throws if an invalid label is provided', () => {
      const loggerConfiguration = new LoggerConfiguration();
      expect(() => loggerConfiguration.minLevel('oogabooga')).to.throw();
    });

    it('sets the specified dynamic switch', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const dynamicLevelSwitch = new DynamicLevelSwitch();
      const logger = new LoggerConfiguration()
        .minLevel(dynamicLevelSwitch)
        .writeTo(sink.object)
        .create();

      logger.fatal('A is the first letter');
      logger.verbose('B is the second letter');

      return dynamicLevelSwitch.information()
        .then(() => {
          logger.verbose('C is the third letter');
          logger.info('D is the fourth letter');
        })
        .then(() => logger.flush())
        .then(() => {
          expect(emittedEvents).to.have.length(3);
          expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'A is the first letter');
          expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
          expect(emittedEvents[2]).to.have.deep.property('messageTemplate.raw', 'D is the fourth letter');
        });
    });
    
    it('sets minimum level through the fatal() alias', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel.fatal()
        .writeTo(sink.object)
        .create();

      logger.error('A is the first letter');
      logger.fatal('B is the second letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(1);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
      });
    });
    
    it('sets minimum level through the error() alias', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel.error()
        .writeTo(sink.object)
        .create();

      logger.warn('A is the first letter');
      logger.error('B is the second letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(1);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
      });
    });
    
    it('sets minimum level through the warning() alias', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel.warning()
        .writeTo(sink.object)
        .create();

      logger.info('A is the first letter');
      logger.warn('B is the second letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(1);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
      });
    });
    
    it('sets minimum level through the information() alias', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel.information()
        .writeTo(sink.object)
        .create();

      logger.debug('A is the first letter');
      logger.info('B is the second letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(1);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
      });
    });
    
    it('sets minimum level through the debug() alias', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel.debug()
        .writeTo(sink.object)
        .create();

      logger.verbose('A is the first letter');
      logger.debug('B is the second letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(1);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
      });
    });
    
    it('sets minimum level through the verbose() alias', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .minLevel.verbose()
        .writeTo(sink.object)
        .create();

      logger.verbose('A is the first letter');
      logger.debug('B is the second letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(2);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'A is the first letter');
        expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
      });
    });
  });

  describe('writeTo()', () => {
    it('adds a sink to the pipeline', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));

      const logger = new LoggerConfiguration()
        .writeTo(sink.object)
        .create();

      logger.info('A is the first letter');
      logger.info('B is the second letter');
      logger.info('C is the third letter');

      return logger.flush().then(() => {
        expect(emittedEvents).to.have.length(3);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'A is the first letter');
        expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'B is the second letter');
        expect(emittedEvents[2]).to.have.deep.property('messageTemplate.raw', 'C is the third letter');
      });
    });
  });
});

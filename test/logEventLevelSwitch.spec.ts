/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { ILogEvent, LogEventLevel } from '../src/logEvent';
import { Pipeline } from '../src/pipeline';
import { FilterStage } from '../src/filterStage';
import { Sink } from '../src/sink';
import PipelineStage from '../src/pipelineStage';
import MessageTemplate from '../src/messageTemplate';
import { LogEventLevelSwitch } from '../src/logEventLevelSwitch';

describe('LogEventLevelSwitch', () => {
  describe('debug()', () => {
    it('sets the minimum level to Debug for the switch', () => {
      var levelSwitch = new LogEventLevelSwitch();
      return levelSwitch.debug()
        .then(() => {
          expect(levelSwitch.isEnabled(LogEventLevel.debug)).to.be.true;
          expect(levelSwitch.isEnabled(LogEventLevel.verbose)).to.be.false;
        });
    });

    it('calls the injected flush function', () => {
      var flushWasCalled = false;
      var flush = () => new Promise(resolve => {
        flushWasCalled = true;
        resolve();
      });
      var levelSwitch = new LogEventLevelSwitch();
      levelSwitch.setFlushCallback(flush);
      return levelSwitch.debug()
        .then(() => expect(flushWasCalled).to.be.true);
    });
  });

  describe('error()', () => {
    it('sets the minimum level to Error for the switch', () => {
      var levelSwitch = new LogEventLevelSwitch();
      return levelSwitch.error()
        .then(() => {
          expect(levelSwitch.isEnabled(LogEventLevel.error)).to.be.true;
          expect(levelSwitch.isEnabled(LogEventLevel.warning)).to.be.false;
        });
    });

    it('calls the injected flush function', () => {
      var flushWasCalled = false;
      var flush = () => new Promise(resolve => {
        flushWasCalled = true;
        resolve();
      });
      var levelSwitch = new LogEventLevelSwitch();
      levelSwitch.setFlushCallback(flush);
      return levelSwitch.error()
        .then(() => expect(flushWasCalled).to.be.true);
    });
  });

  describe('fatal()', () => {
    it('sets the minimum level to Fatal for the switch', () => {
      var levelSwitch = new LogEventLevelSwitch();
      return levelSwitch.fatal()
        .then(() => {
          expect(levelSwitch.isEnabled(LogEventLevel.fatal)).to.be.true;
          expect(levelSwitch.isEnabled(LogEventLevel.error)).to.be.false;
        });
    });

    it('calls the injected flush function', () => {
      var flushWasCalled = false;
      var flush = () => new Promise(resolve => {
        flushWasCalled = true;
        resolve();
      });
      var levelSwitch = new LogEventLevelSwitch();
      levelSwitch.setFlushCallback(flush);
      return levelSwitch.fatal()
        .then(() => expect(flushWasCalled).to.be.true);
    });
  });

  describe('filter()', () => {
    it('filters based on the current level', () => {
      let receivedEvents = [];

      const pipeline = new Pipeline();
      pipeline.yieldErrors = true;
      const levelSwitch = new LogEventLevelSwitch();
      const filterStage = new FilterStage(levelSwitch.filter);
      pipeline.addStage(filterStage);
      const nextStage = TypeMoq.Mock.ofType<PipelineStage>();
      nextStage.setup(m => m.emit(TypeMoq.It.isAny()))
        .returns(events => {
          receivedEvents = receivedEvents.concat([...events]);
          return Promise.resolve();
        });
      pipeline.addStage(nextStage.object);

      levelSwitch.information();
      return Promise.all([
        pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('1'), level: LogEventLevel.debug }]),
        pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('2'), level: LogEventLevel.verbose }]),
        pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('3'), level: LogEventLevel.warning }])
      ])
        .then(() => levelSwitch.error())
        .then(() => Promise.all([
          pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('4'), level: LogEventLevel.warning }]),
          pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('5'), level: LogEventLevel.error }]),
          pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('6'), level: LogEventLevel.fatal }])
        ]))
        .then(() => levelSwitch.verbose())
        .then(() => Promise.all([
          pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('7'), level: LogEventLevel.information }]),
          pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('8'), level: LogEventLevel.error }]),
          pipeline.emit([{ timestamp: new Date().toISOString(), messageTemplate: new MessageTemplate('9'), level: LogEventLevel.verbose }])
        ]))
        .then(() => {
          expect(receivedEvents).to.have.length(6);
          expect(receivedEvents[0]).to.have.deep.property('messageTemplate.raw', '3');
          expect(receivedEvents[1]).to.have.deep.property('messageTemplate.raw', '5');
          expect(receivedEvents[2]).to.have.deep.property('messageTemplate.raw', '6');
          expect(receivedEvents[3]).to.have.deep.property('messageTemplate.raw', '7');
          expect(receivedEvents[4]).to.have.deep.property('messageTemplate.raw', '8');
          expect(receivedEvents[5]).to.have.deep.property('messageTemplate.raw', '9');
        });
    });
  });

  describe('information()', () => {
    it('sets the minimum level to Information for the switch', () => {
      var levelSwitch = new LogEventLevelSwitch();
      return levelSwitch.information()
        .then(() => {
          expect(levelSwitch.isEnabled(LogEventLevel.information)).to.be.true;
          expect(levelSwitch.isEnabled(LogEventLevel.debug)).to.be.false;
        });
    });

    it('calls the injected flush function', () => {
      var flushWasCalled = false;
      var flush = () => new Promise(resolve => {
        flushWasCalled = true;
        resolve();
      });
      var levelSwitch = new LogEventLevelSwitch();
      levelSwitch.setFlushCallback(flush);
      return levelSwitch.information()
        .then(() => expect(flushWasCalled).to.be.true);
    });
  });

  describe('verbose()', () => {
    it('sets the minimum level to Verbose for the switch', () => {
      var levelSwitch = new LogEventLevelSwitch();
      return levelSwitch.debug()
        .then(() => expect(levelSwitch.isEnabled(LogEventLevel.verbose)).to.be.false)
        .then(() => levelSwitch.verbose())
        .then(() => expect(levelSwitch.isEnabled(LogEventLevel.verbose)).to.be.true);
    });

    it('calls the injected flush function', () => {
      var flushWasCalled = false;
      var flush = () => new Promise(resolve => {
        flushWasCalled = true;
        resolve();
      });
      var levelSwitch = new LogEventLevelSwitch();
      levelSwitch.setFlushCallback(flush);
      return levelSwitch.verbose()
        .then(() => expect(flushWasCalled).to.be.true);
    });
  });

  describe('warning()', () => {
    it('sets the minimum level to Warning for the switch', () => {
      var levelSwitch = new LogEventLevelSwitch();
      return levelSwitch.warning()
        .then(() => {
          expect(levelSwitch.isEnabled(LogEventLevel.warning)).to.be.true;
          expect(levelSwitch.isEnabled(LogEventLevel.information)).to.be.false;
        });
    });

    it('calls the injected flush function', () => {
      var flushWasCalled = false;
      var flush = () => new Promise(resolve => {
        flushWasCalled = true;
        resolve();
      });
      var levelSwitch = new LogEventLevelSwitch();
      levelSwitch.setFlushCallback(flush);
      return levelSwitch.warning()
        .then(() => expect(flushWasCalled).to.be.true);
    });
  });
});

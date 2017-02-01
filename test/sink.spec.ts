/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { Pipeline } from '../src/pipeline';
import { PipelineStage } from '../src/pipeline';
import { LogEvent, LogEventLevel } from '../src/logEvent';
import { MessageTemplate } from '../src/messageTemplate';
import { Sink, SinkStage } from '../src/sink';
import { ConcreteSink } from './helpers';

describe('SinkStage', () => {
  describe('emit()', () => {
    it('emits events to the sink', () => {
      let emittedEvents = [];
      const sink = TypeMoq.Mock.ofType(ConcreteSink);
      sink.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = events);
      const sinkStage = new SinkStage(sink.object);
      const events = [
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 1')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 2'))
      ];
      sinkStage.emit(events);
      expect(emittedEvents).to.have.length(2);
      expect(emittedEvents[0]).to.equal(events[0]);
      expect(emittedEvents[1]).to.equal(events[1]);
    });

    it('returns the emitted events', () => {
      const sink = TypeMoq.Mock.ofType(ConcreteSink);
      const sinkStage = new SinkStage(sink.object);
      const events = [
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 1')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 2'))
      ];
      const emittedEvents = sinkStage.emit(events);
      expect(emittedEvents).to.have.length(2);
      expect(emittedEvents[0]).to.equal(events[0]);
      expect(emittedEvents[1]).to.equal(events[1]);
    });
  });

  describe('flush()', () => {
    it('flushes the sink', () => {
      const sink = TypeMoq.Mock.ofType(ConcreteSink);
      sink.setup(m => m.flush()).returns(() => Promise.resolve());
      const sinkStage = new SinkStage(sink.object);
      return sinkStage.flush().then(() => {
        sink.verify(m => m.flush(), TypeMoq.Times.once());
      });
    });
  });
});

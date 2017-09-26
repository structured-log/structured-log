/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/jest/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { Pipeline } from '../src/pipeline';
import { PipelineStage } from '../src/pipeline';
import { LogEvent, LogEventLevel } from '../src/logEvent';
import { MessageTemplate } from '../src/messageTemplate';
import { ConcretePipelineStage } from './helpers';

describe('Pipeline', () => {
  describe('emit()', () => {
    it('emits events through its stages', () => {
      let emittedEvents = [];
      const pipeline = new Pipeline();
      const pipelineStage1 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      const pipelineStage2 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      const pipelineStage3 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      pipelineStage1.setup(m => m.emit(TypeMoq.It.isAny())).returns(events => events);
      pipelineStage2.setup(m => m.emit(TypeMoq.It.isAny())).returns(events => events);
      pipelineStage3.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = events);
      pipeline.addStage(pipelineStage1.object);
      pipeline.addStage(pipelineStage2.object);
      pipeline.addStage(pipelineStage3.object);
      const events = [
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 1'), {}),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 2'), {}),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 3'), {})
      ];
      return pipeline.emit(events).then(() => {
        expect(emittedEvents).to.have.length(3);
        expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'Message 1');
        expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'Message 2');
        expect(emittedEvents[2]).to.have.deep.property('messageTemplate.raw', 'Message 3');
      });
    });

    it('queues events if a flush is in progress', () => {
      let emittedEvents = [];
      const pipeline = new Pipeline();
      const pipelineStage1 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      const pipelineStage2 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      pipelineStage1.setup(m => m.emit(TypeMoq.It.isAny())).returns(events => events);
      pipelineStage1.setup(m => m.flush()).returns(() => new Promise(resolve => setTimeout(resolve, 1)));
      pipelineStage2.setup(m => m.emit(TypeMoq.It.isAny())).callback(events => emittedEvents = emittedEvents.concat(events));
      pipelineStage2.setup(m => m.flush()).returns(() => Promise.resolve());
      pipeline.addStage(pipelineStage1.object);
      pipeline.addStage(pipelineStage2.object);
      const events = [
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 1'), {}),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 2'), {}),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 3'), {}),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 4'), {})
      ];
      
      return pipeline.emit(events.slice(0, 2))
        .then(() => {
          expect(emittedEvents).to.have.length(2);
          expect(emittedEvents[0]).to.have.deep.property('messageTemplate.raw', 'Message 1');
          expect(emittedEvents[1]).to.have.deep.property('messageTemplate.raw', 'Message 2');
        })
        .then(() => Promise.all([pipeline.flush(), pipeline.emit(events.slice(2))]))
        .then(() => {
          expect(emittedEvents).to.have.length(4);
          expect(emittedEvents[2]).to.have.deep.property('messageTemplate.raw', 'Message 3');
          expect(emittedEvents[3]).to.have.deep.property('messageTemplate.raw', 'Message 4');
        });
    });
  });

  describe('flush()', () => {
    it('flushes events through its stages', () => {
      const pipeline = new Pipeline();
      const pipelineStage1 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      const pipelineStage2 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      const pipelineStage3 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      pipelineStage1.setup(m => m.flush()).returns(() => Promise.resolve());
      pipelineStage2.setup(m => m.flush()).returns(() => Promise.resolve());
      pipelineStage3.setup(m => m.flush()).returns(() => Promise.resolve());
      pipeline.addStage(pipelineStage1.object);
      pipeline.addStage(pipelineStage2.object);
      pipeline.addStage(pipelineStage3.object);
      return pipeline.flush().then(() => {
        pipelineStage1.verify(m => m.flush(), TypeMoq.Times.once());
        pipelineStage2.verify(m => m.flush(), TypeMoq.Times.once());
        pipelineStage3.verify(m => m.flush(), TypeMoq.Times.once());
      });
    });

    it('does nothing if a flush is already in progress', () => {
      const pipeline = new Pipeline();
      const pipelineStage1 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      const pipelineStage2 = TypeMoq.Mock.ofType(ConcretePipelineStage);
      pipelineStage1.setup(m => m.flush()).returns(() => new Promise(resolve => setTimeout(resolve, 1)));
      pipelineStage2.setup(m => m.flush()).returns(() => Promise.resolve());
      pipeline.addStage(pipelineStage1.object);
      pipeline.addStage(pipelineStage2.object);
      const flushPromise1 = pipeline.flush();
      const flushPromise2 = pipeline.flush();
      return flushPromise1.then(() => {
        expect(flushPromise2).to.equal(flushPromise1);
        pipelineStage2.verify(m => m.flush(), TypeMoq.Times.once());
      });
    });

    it('does nothing if the pipeline has no stages', () => {
      const pipeline = new Pipeline();
      return pipeline.flush();
    });
  });
});

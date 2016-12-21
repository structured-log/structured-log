/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { ILogEvent } from '../src/logEvent';
import { EnrichStage } from '../src/enrichStage';
import PipelineStage from '../src/pipelineStage';
import MessageTemplate from '../src/messageTemplate';

describe('EnrichStage', () => {
  describe('emit()', () => {
    it('calls emit on the next stage', () => {
      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      mockStage.setup(m => m.emit(TypeMoq.It.isAny())).returns(() => Promise.resolve());
      const enrichStage = new EnrichStage(() => ({}));
      enrichStage.next = mockStage.object;

      return enrichStage.emit([])
        .then(() => mockStage.verify(m => m.emit(TypeMoq.It.isAny()), TypeMoq.Times.once()));
    });

    it('enriches the events with the correct properties', () => {
      let emittedEvents: ILogEvent[];
      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      mockStage.setup(m => m.emit(TypeMoq.It.isAny())).returns(events => {
        emittedEvents = [...events];
        return Promise.resolve();
      });
      const enrichStage = new EnrichStage(() => ({
        extra1: 'Answer',
        extra2: 42
      }));
      enrichStage.next = mockStage.object;
      const events: ILogEvent[] = [{
        timestamp: new Date().toISOString(),
        level: 1,
        messageTemplate: new MessageTemplate('A is the first letter')
      }, {
        timestamp: new Date().toISOString(),
        level: 2,
        messageTemplate: new MessageTemplate('B is the first letter')
      }];

      return enrichStage.emit(events)
        .then(() => {
          expect(emittedEvents).to.have.length(2);
          expect(emittedEvents[0]).to.have.deep.property('properties.extra1', 'Answer');
          expect(emittedEvents[0]).to.have.deep.property('properties.extra2', 42);
          expect(emittedEvents[1]).to.have.deep.property('properties.extra1', 'Answer');
          expect(emittedEvents[1]).to.have.deep.property('properties.extra2', 42);
        });
    });
  });

  describe('flush()', () => {
    it('calls flush on the next stage', () => {
      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      mockStage.setup(m => m.flush()).returns(() => Promise.resolve());
      const enrichStage = new EnrichStage(() => ({}));
      enrichStage.next = mockStage.object;

      return enrichStage.flush()
        .then(() => mockStage.verify(m => m.flush(), TypeMoq.Times.once()));
    });
  });
});

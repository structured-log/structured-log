/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { FilterStage } from '../src/filterStage';
import { LogEvent } from '../src/logEvent';
import PipelineStage from '../src/pipelineStage';
import MessageTemplate from '../src/messageTemplate';

describe('FilterStage', () => {
  describe('emit()', () => {
    it('filters events based on the predicate', () => {
      let filteredEvents: LogEvent[];

      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      mockStage.setup(m => m.emit(TypeMoq.It.isAny()))
        .callback(events => filteredEvents = events);
      const filterStage = new FilterStage(e => e.messageTemplate.render().indexOf('B') !== 0);
      filterStage.next = mockStage.object;

      const rawEvents: LogEvent[] = [{
        timestamp: new Date().toISOString(),
        level: 1,
        messageTemplate: new MessageTemplate('A is the first letter')
      }, {
        timestamp: new Date().toISOString(),
        level: 2,
        messageTemplate: new MessageTemplate('B is the first letter')
      }, {
        timestamp: new Date().toISOString(),
        level: 3,
        messageTemplate: new MessageTemplate('C is the first letter')
      }];

      return filterStage.emit(rawEvents)
        .then(() =>{
          expect(filteredEvents.length).to.equal(2);
          expect(filteredEvents[0].level).to.equal(1);
          expect(filteredEvents[1].level).to.equal(3);
        });
    });

    it('calls emit on the next stage', () => {
      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      mockStage.setup(m => m.emit(TypeMoq.It.isAny())).returns(() => Promise.resolve());
      const filterStage = new FilterStage(() => true);
      filterStage.next = mockStage.object;

      return filterStage.emit([])
        .then(() => mockStage.verify(m => m.emit(TypeMoq.It.isAny()), TypeMoq.Times.once()));
    });
  });

  describe('flush()', () => {
    it('calls flush on the next stage', () => {
      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      mockStage.setup(m => m.flush()).returns(() => Promise.resolve());
      const filterStage = new FilterStage(() => true);
      filterStage.next = mockStage.object;

      return filterStage.flush()
        .then(() => mockStage.verify(m => m.flush(), TypeMoq.Times.once()));
    });
  });
});

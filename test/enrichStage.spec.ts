/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
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

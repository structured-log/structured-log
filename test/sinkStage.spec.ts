/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { Sink } from '../src/sink';
import { SinkStage } from '../src/sinkStage';
import { PipelineStage } from '../src/pipelineStage';
import MessageTemplate from '../src/messageTemplate';

describe('SinkStage', () => {
  describe('()', () => {
    it('requires a sink to be passed', () => {
      expect(() => new SinkStage(null)).to.throw();
    });
  });

  describe('emit()', () => {
    it('calls emit on the inner sink', () => {
      const mockSink = TypeMoq.Mock.ofType<Sink>();
      const sinkStage = new SinkStage(mockSink.object);

      return sinkStage.emit([{
        timestamp: new Date().toISOString(),
        level: 0,
        messageTemplate: new MessageTemplate('test')
      }])
        .then(() => mockSink.verify(m => m.emit(TypeMoq.It.isAny()), TypeMoq.Times.once()));
    });

    it('calls emit on the next stage', () => {
      const mockSink = TypeMoq.Mock.ofType<Sink>();
      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      const sinkStage = new SinkStage(mockSink.object);
      sinkStage.next = mockStage.object;

      return sinkStage.emit([{
        timestamp: new Date().toISOString(),
        level: 0,
        messageTemplate: new MessageTemplate('test')
      }])
        .then(() => mockStage.verify(m => m.emit(TypeMoq.It.isAny()), TypeMoq.Times.once()));
    });
  });

  describe('flush()', () => {
    it('calls flush on the inner sink', () => {
      const mockSink = TypeMoq.Mock.ofType<Sink>();
      mockSink.setup(m => m.flush()).returns(() => Promise.resolve());
      const sinkStage = new SinkStage(mockSink.object);

      return sinkStage.flush()
        .then(() => mockSink.verify(m => m.flush(), TypeMoq.Times.once()));
    });

    it('calls flush on the next stage', () => {
      const mockSink = TypeMoq.Mock.ofType<Sink>();
      const mockStage = TypeMoq.Mock.ofType<PipelineStage>();
      mockStage.setup(m => m.flush()).returns(() => Promise.resolve());
      const sinkStage = new SinkStage(mockSink.object);
      sinkStage.next = mockStage.object;

      return sinkStage.flush()
        .then(() => mockStage.verify(m => m.flush(), TypeMoq.Times.once()));
    });
  });
});

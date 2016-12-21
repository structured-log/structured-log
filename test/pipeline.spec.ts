/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { Pipeline } from '../src/pipeline';
import PipelineStage from '../src/pipelineStage';
import { Sink } from '../src/sink';
import { SinkStage } from '../src/sinkStage';
import MessageTemplate from '../src/messageTemplate';
import { ILogEvent, LogEventLevel } from '../src/logEvent';

describe('Pipeline', () => {

  describe('addStage', () => {
    it('connects stages to the pipeline in the correct order', () => {
      class PassThroughStage extends PipelineStage {
        private emitCallback: Function;
        constructor(emitCallback: Function) {
          super();
          this.emitCallback = emitCallback;
        }
        public emit(events: ILogEvent[]): Promise<void> {
          this.emitCallback();
          return super.emit(events);
        }
      }

      const pipeline = new Pipeline();
      
      let stageMarker = 0;
      let stageMarkerSnapshot1 = 0;
      let stageMarkerSnapshot2 = 0;
      let stageMarkerSnapshot3 = 0;

      const stage1 = new PassThroughStage(() => stageMarkerSnapshot1 = ++stageMarker);
      pipeline.addStage(stage1);

      const stage2 = new PassThroughStage(() => stageMarkerSnapshot2 = ++stageMarker);
      pipeline.addStage(stage2);

      const stage3 = new PassThroughStage(() => stageMarkerSnapshot3 = ++stageMarker);
      pipeline.addStage(stage3);

      const events = [{
        timestamp: new Date().toISOString(),
        level: LogEventLevel.debug,
        messageTemplate: new MessageTemplate('Test')
      }];

      return pipeline.emit(events)
        .then(() => {
          expect(stageMarkerSnapshot1).to.equal(1);
          expect(stageMarkerSnapshot2).to.equal(2);
          expect(stageMarkerSnapshot3).to.equal(3);
        });
    });
  });
  
  describe('yieldErrors', () => {
    let pipeline: Pipeline;
    let stage: SinkStage;
    let sink: TypeMoq.IMock<Sink>;
    let events: ILogEvent[];

    beforeEach(() => {
      pipeline = new Pipeline();
      sink = TypeMoq.Mock.ofType<Sink>();
      sink.setup(m => m.emit(TypeMoq.It.isAny())).throws(new Error());
      stage = new SinkStage(sink.object);
      pipeline.addStage(stage);
      events = [{
        timestamp: new Date().toISOString(),
        level: LogEventLevel.debug,
        messageTemplate: new MessageTemplate('Test')
      }];
    });

    it('suppresses errors in the pipeline when false', () => {
      pipeline.yieldErrors = false;
      expect(() => pipeline.emit(events)).to.not.throw();
    });
    
    it('allows errors in the pipeline to propagate when true', () => {
      pipeline.yieldErrors = true;
      expect(() => pipeline.emit(events)).to.throw();
    });
  });
});

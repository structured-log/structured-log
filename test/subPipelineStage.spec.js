import { expect } from 'chai';
import sinon from 'sinon';
import SubPipelineStage from '../src/subPipelineStage';
import Pipeline from '../src/pipeline';
import PipelineStage from '../src/pipelineStage';
import { createWrappedSinkStage } from './testHelpers';

describe('SubPipelineStage', () => {
  it('should write events to the sub-pipeline', () => {
    const subSinkEmitSpy = sinon.spy();
    const subSinkStage = createWrappedSinkStage(subSinkEmitSpy);
    const subPipeline = new Pipeline([subSinkStage]);
    const subPipelineStage = new SubPipelineStage(subPipeline);

    const pipeline = new Pipeline([subPipelineStage]);

    return pipeline.emit([{}]).then(() => expect(subSinkEmitSpy.calledOnce).to.be.true);
  });

  it('should write events to the next stage', () => {
    const subPipeline = new Pipeline([new PipelineStage()]);
    const subPipelineStage = new SubPipelineStage(subPipeline);

    const nextSinkEmitSpy = sinon.spy();
    const nextSinkStage = createWrappedSinkStage(nextSinkEmitSpy);

    const pipeline = new Pipeline([subPipelineStage, nextSinkStage]);

    return pipeline.emit([{}]).then(() => expect(nextSinkEmitSpy.calledOnce).to.be.true);
  });

  it('should flush the sub-pipeline', () => {
    const subPipeline = new Pipeline([new PipelineStage()]);
    const subPipelineFlushSpy = sinon.spy(subPipeline, 'flush');
    const subPipelineStage = new SubPipelineStage(subPipeline);

    const pipeline = new Pipeline([subPipelineStage]);

    return pipeline.flush().then(() => expect(subPipelineFlushSpy.calledOnce).to.be.true);
  });

  it('should close the sub-pipeline', () => {
    const subPipeline = new Pipeline([new PipelineStage()]);
    const subPipelineCloseSpy = sinon.spy(subPipeline, 'close');
    const subPipelineStage = new SubPipelineStage(subPipeline);

    const pipeline = new Pipeline([subPipelineStage]);

    return pipeline.close().then(() => expect(subPipelineCloseSpy.calledOnce).to.be.true);
  });
});

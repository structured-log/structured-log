import { expect } from 'chai';
import sinon from 'sinon';
import PipelineStage from '../src/PipelineStage';

describe('PipelineStage', () => {
  it('should call emit on the next stage', () => {
    const stage1 = new PipelineStage();
    const stage2 = new PipelineStage();
    const nextStageEmitSpy = sinon.spy(stage2, 'emit');
    stage1.setNextStage(stage2);

    stage1.emit([]);

    expect(nextStageEmitSpy.calledOnce).to.be.true;
  });
});

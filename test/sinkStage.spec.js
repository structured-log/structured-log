import { expect } from 'chai';
import sinon from 'sinon';
import SinkStage from '../src/sinkStage';
import { createWrappedSinkStage } from './testHelpers';

describe('SinkStage', () => {
  it('should call emit on the sink', () => {
    const sinkEmitSpy = sinon.spy();
    const stage = createWrappedSinkStage(sinkEmitSpy);

    return stage.emit([]).then(() => expect(sinkEmitSpy.calledOnce).to.be.true);
  });

  it('should call emit on the next stage', () => {
    const nextStage = new SinkStage();
    const nextStageEmitSpy = sinon.spy(nextStage, 'emit');

    const stage = new SinkStage();
    stage.setNextStage(nextStage);

    return stage.emit([]).then(() => expect(nextStageEmitSpy.calledOnce).to.be.true);
  });
});

import { expect } from 'chai';
import sinon from 'sinon';
import Pipeline from '../src/pipeline';
import SinkStage from '../src/sinkStage';
import WrappedSink from '../src/wrappedSink';

describe('Pipeline', () => {
  it('should throw when it is constructed without a stage array', () => {
    expect(() => new Pipeline('not an array')).to.throw(Error);
  });

  it('should set the first stage of the array as the head stage', () => {
    const sinkSpy1 = sinon.spy();
    const sinkSpy2 = sinon.spy();
    const stage1 = new SinkStage(new WrappedSink(sinkSpy1));
    const stage2 = new SinkStage(new WrappedSink(sinkSpy2));
    const pipeline = new Pipeline([stage1, stage2]);

    return pipeline.emit([{}]).then(() => {
      expect(sinkSpy1.calledOnce).to.be.true;
      expect(sinkSpy2.calledOnce).to.be.true;
      expect(sinkSpy1.calledBefore(sinkSpy2)).to.be.true;
    });
  });

  it('should connect the stages', () => {
    const stage1 = { setNextStage: nextStage => stage1.nextStage = nextStage };
    const stage2 = { setNextStage: nextStage => stage2.nextStage = nextStage };
    const stage3 = { setNextStage: nextStage => stage3.nextStage = nextStage };

    const pipeline = new Pipeline([stage1, stage2, stage3]);

    expect(stage1.nextStage).to.equal(stage2);
    expect(stage2.nextStage).to.equal(stage3);
    expect(stage3.nextStage).to.be.undefined;
  });

  it('should emit events to the head stage', () => {
    const stage = { emit: logEvents => null };
    const emitSpy = sinon.spy(stage, 'emit');

    const pipeline = new Pipeline([stage]);
    const logEvents = [{}];

    pipeline.emit(logEvents);

    expect(emitSpy.calledWithExactly(logEvents)).to.be.true;
  });
});

import { expect } from 'chai';
import sinon from 'sinon';
import Pipeline from '../src/pipeline';

describe('Pipeline', () => {
  it('should throw when it is constructed without a stage array', () => {
    expect(() => new Pipeline('not an array')).to.throw(Error);
  });

  it('should set the first stage of the array as the head stage', () => {
    const stage1 = { setNextStage: () => this };
    const stage2 = { setNextStage: () => this };

    const pipeline = new Pipeline([stage1, stage2]);

    expect(pipeline.headStage).to.equal(stage1);
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
    const stage = { emit: (logEvents, done) => null };
    const emitSpy = sinon.spy(stage, 'emit');

    const pipeline = new Pipeline([stage]);
    const logEvents = [{}];
    const done = () => null;

    pipeline.emit(logEvents, done);

    expect(emitSpy.calledWithExactly(logEvents, done)).to.be.true;
  });
});

import { expect } from 'chai';
import sinon from 'sinon';
import WrappedSink from '../src/wrappedSink';

describe('WrappedSink', () => {
  it('should call the wrapped function', () => {
    const sink = sinon.spy();
    const wrapper = new WrappedSink(sink);
    return wrapper.emit([]).then(() => expect(sink.calledOnce).to.be.true);
  });
});

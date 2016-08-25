import SinkStage from '../src/sinkStage';
import WrappedSink from '../src/wrappedSink';

export function createWrappedSinkStage(fn) {
  const wrappedSink = new WrappedSink(fn);
  return new SinkStage(wrappedSink);
}

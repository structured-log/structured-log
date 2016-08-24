import PipelineStage from './pipelineStage';

const _sink = new WeakMap();

export default class SinkStage extends PipelineStage {
  constructor(sink) {
    super();
    _sink.set(this, sink);
  }

  emit(logEvents) {
    const sink = _sink.get(this);
    const sinkPromise = sink ? sink.emit(logEvents) : null;
    const superPromise = super.emit(logEvents);
    return Promise.all([sinkPromise, superPromise]);
  }

  flush() {
    const sink = _sink.get(this);
    const sinkPromise = sink ? sink.flush() : null;
    const superPromise = super.flush();
    return Promise.all([sinkPromise, superPromise]);
  }

  close() {
    const sink = _sink.get(this);
    const sinkPromise = sink ? sink.close() : null;
    const superPromise = super.close();
    return Promise.all([sinkPromise, superPromise]);
  }
}

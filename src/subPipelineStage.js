import PipelineStage from './pipelineStage';

const _pipeline = new WeakMap();

export default class SubPipelineStage extends PipelineStage {
  constructor(pipeline) {
    super();
    _pipeline.set(this, pipeline);
  }

  emit(logEvents) {
    return Promise.all([
      _pipeline.get(this).emit(logEvents),
      super.emit(logEvents)
    ]);
  }

  flush() {
    return Promise.all([
      _pipeline.get(this).flush(),
      super.flush()
    ]);
  }

  close() {
    return this.flush().then(() => Promise.all([
      _pipeline.get(this).close(),
      super.close()
    ]));
  }
}

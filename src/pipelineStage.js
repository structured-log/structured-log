const _nextStage = new WeakMap();

export default class PipelineStage {
  setNextStage(nextStage) {
    _nextStage.set(this, nextStage);
  }

  emit(logEvents) {
    const nextStage = _nextStage.get(this);
    return nextStage ? nextStage.emit(logEvents) : Promise.resolve();
  }

  flush() {
    const nextStage = _nextStage.get(this);
    return nextStage ? nextStage.flush() : Promise.resolve();
  }

  close() {
    const nextStage = _nextStage.get(this);
    return nextStage ? nextStage.close() : Promise.resolve();
  }
}

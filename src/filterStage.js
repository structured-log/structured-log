import PipelineStage from './pipelineStage';

const _predicate = new WeakMap();

export default class FilterStage extends PipelineStage {
  constructor(predicate) {
    super();
    _predicate.set(this, predicate);
  }

  emit(logEvents) {
    const filteredEvents = logEvents.filter(_predicate.get(this));
    return filteredEvents.length > 0 && this.nextStage
      ? this.nextStage.emit(filteredEvents) : Promise.resolve();
  }
}

import PipelineStage from './pipelineStage';
import { capture } from './messageTemplate';

const _enrichFn = new WeakMap();
const _destructure = new WeakMap();

export default class EnrichStage extends PipelineStage {
  constructor(enrichFn, destructure) {
    super();
    _enrichFn.set(this, enrichFn);
    _destructure.set(this, destructure);
  }

  emit(logEvents) {
    const properties = _enrichFn.get(this)();
    const destructure = _destructure.get(this);
    logEvents.forEach(ev => {
      for (const p in properties) {
        if (properties.hasOwnProperty(p) && !ev.properties.hasOwnProperty(p)) {
          ev.properties[p] = capture(properties[p], destructure);
        }
      }
    });

    return super.emit(logEvents);
  }
}

const _emit = new WeakMap();

export default class WrappedSink {
  constructor(sink) {
    if (typeof sink !== 'function') {
      throw new Error('Wrapped sink must be a function.');
    }

    _emit.set(this, sink);
  }

  emit(logEvents) {
    return Promise.resolve(_emit.get(this)(logEvents));
  }

  flush() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

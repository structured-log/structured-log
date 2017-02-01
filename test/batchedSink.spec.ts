/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/es6-promise/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { Logger } from '../src/logger';
import { LogEvent, LogEventLevel } from '../src/logEvent';
import { MessageTemplate } from '../src/messageTemplate';
import { BatchedSink, defaultBatchedSinkOptions } from '../src/batchedSink';
import { ConcreteSink, ConcreteStorage } from './helpers';

describe('BatchedSink', () => {
  describe('constructor()', () => {
    it('uses the default options if no options are passed', () => {
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      const batchedSink = new BatchedSink(innerSink.object);

      expect(batchedSink).to.have.deep.property('options.maxSize', defaultBatchedSinkOptions.maxSize);
      expect(batchedSink).to.have.deep.property('options.period', defaultBatchedSinkOptions.period);
    });
    
    it('uses the passed options', () => {
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      const batchedSink = new BatchedSink(innerSink.object, {
        maxSize: 50,
        period: 2
      });

      expect(batchedSink).to.have.deep.property('options.maxSize', 50);
      expect(batchedSink).to.have.deep.property('options.period', 2);
    });
  });
  
  describe('emit()', () => {
    it('disables periodic batching if the period is not a positive number', () => {
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      const batchedSink = new BatchedSink(innerSink.object, {
        period: 0
      });

      batchedSink.emit([new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 1'))]);
      batchedSink.emit([new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 2'))]);
      batchedSink.emit([new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 3'))]);

      innerSink.verify(m => m.emit(TypeMoq.It.isAny()), TypeMoq.Times.never());

      return batchedSink.flush().then(() => {
        innerSink.verify(m => m.emit(TypeMoq.It.isAny()), TypeMoq.Times.once());
      });
    });

    it('batches events up to the maximum batch size', () => {
      const emittedBatches = [];
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      innerSink.setup(m => m.emit(TypeMoq.It.isAny())).callback(batch => emittedBatches.push(batch));
      innerSink.setup(m => m.flush()).returns(() => Promise.resolve());
      const batchedSink = new BatchedSink(innerSink.object, {
        maxSize: 3
      });
      
      batchedSink.emit([
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 1')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 2'))
      ]);
      
      batchedSink.emit([
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 3')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 4'))
      ]);
      
      batchedSink.emit([
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 5')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 6')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 7')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 8')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 9')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 10')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 11'))
      ]);

      return batchedSink.flush().then(() => {
        expect(emittedBatches[0]).to.have.length(3);
        expect(emittedBatches[1]).to.have.length(3);
        expect(emittedBatches[1][2]).to.have.deep.property('messageTemplate.raw', 'Test 6');
        expect(emittedBatches[2]).to.have.length(3);
        expect(emittedBatches[3]).to.have.length(2);
        expect(emittedBatches[3][1]).to.have.deep.property('messageTemplate.raw', 'Test 11');
      });
    });

    it('sends batches in periodic intervals', () => {
      const emittedBatches = [];
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      innerSink.setup(m => m.emit(TypeMoq.It.isAny())).callback(batch => emittedBatches.push(batch));
      innerSink.setup(m => m.flush()).returns(() => Promise.resolve());
      const batchedSink = new BatchedSink(innerSink.object, {
        period: 0.02
      });

      return new Promise(resolve => {
        batchedSink.emit([
          new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 1')),
          new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 2')),
          new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 3'))
        ]);

        setTimeout(() => {
          batchedSink.emit([
            new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 4')),
            new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 5')),
            new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 6'))
          ]);

          expect(emittedBatches).to.have.length(1);
          expect(emittedBatches[0]).to.have.length(3);
          expect(emittedBatches[0][1]).to.have.deep.property('messageTemplate.raw', 'Test 2');

          resolve();
        }, 25);
      });
    });

    it('calls the emitCore and flushCore methods of derived classes', () => {
      let emitCoreCalled = 0;
      let flushCoreCalled = 0;
      
      class DerivedSink extends BatchedSink {
        constructor() {
          super(null, { maxSize: 1 });
        }

        emitCore(events: LogEvent[]) {
          ++emitCoreCalled;
        }

        flushCore() {
          ++flushCoreCalled;
          return Promise.resolve();
        }
      }

      const sink = new DerivedSink();

      sink.emit([
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 1')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 2'))
      ]);

      return sink.flush().then(() => {
        expect(emitCoreCalled).to.equal(2);
        expect(flushCoreCalled).to.equal(1);
      });
    });

    it('returns a promise if the emitCore override of derived classes does not', () => {
      class DerivedSink extends BatchedSink {
        constructor() {
          super(null, { maxSize: 1 });
        }

        emitCore(events: LogEvent[]) { }
        flushCore() { return null; }
      }

      const sink = new DerivedSink();

      const flushPromise = sink.flush();
      expect(flushPromise).to.be.instanceOf(Promise);
      return flushPromise;
    });
  });
  
  describe('flush()', () => {
    it('calls flush on the underlying sink', () => {
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      innerSink.setup(m => m.flush()).returns(() => Promise.resolve());
      const batchedSink = new BatchedSink(innerSink.object);
      return batchedSink.flush().then(() => {
        innerSink.verify(m => m.flush(), TypeMoq.Times.once());
      });
    });
  });

  describe('when it has a durable store', () => {
    it('flushes any previously stored events on creation', () => {
      const durableStore = new ConcreteStorage();
      const initialEvents = [
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 1')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 2'))
      ];
      durableStore.setItem('structured-log-batched-sink-durable-cache-123', JSON.stringify(initialEvents));

      const emittedBatches = [];
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      innerSink.setup(m => m.emit(TypeMoq.It.isAny())).callback(batch => emittedBatches.push(batch));
      innerSink.setup(m => m.flush()).returns(() => Promise.resolve());
      const batchedSink = new BatchedSink(innerSink.object, {
        period: 0,
        maxSize: 2,
        durableStore: <Storage> durableStore
      });

      return batchedSink.flush().then(() => {
        expect(emittedBatches[0][0]).to.have.deep.property('messageTemplate.raw', 'Test 1');
        expect(emittedBatches[0][1]).to.have.deep.property('messageTemplate.raw', 'Test 2');
      });
    });

    it('stores events in a durable storage', () => {
      const durableStore = new ConcreteStorage();
      const batchedSink = new BatchedSink(null, {
        period: 0,
        maxSize: 3,
        durableStore: <Storage> durableStore
      });

      batchedSink.emit([
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 1')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 2'))
      ]);
      
      expect(durableStore.length).to.equal(1);
    });

    it('cleans up the stored events once they have been shipped', () => {
      const durableStore = new ConcreteStorage();
      const innerSink = TypeMoq.Mock.ofType(ConcreteSink);
      innerSink.setup(m => m.flush()).returns(() => Promise.resolve());
      const batchedSink = new BatchedSink(innerSink.object, {
        period: 0,
        maxSize: 2,
        durableStore: <Storage> durableStore
      });

      batchedSink.emit([
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 1')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test 2'))
      ]);

      return batchedSink.flush().then(() => {
        expect(durableStore.length).to.equal(0);
      });
    });
  });
});

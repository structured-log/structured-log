/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { Logger } from '../src/logger';
import { LogEvent, LogEventLevel } from '../src/logEvent';
import { ConsoleSink, ConsoleProxy } from '../src/consoleSink';
import { MessageTemplate } from '../src/messageTemplate';

describe('ConsoleSink', () => {
  describe('emit()', () => {
    it('logs error messages', () => {
      const consoleProxy = TypeMoq.Mock.ofType<ConsoleProxy>();
      const consoleSink = new ConsoleSink({ console: consoleProxy.object });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.fatal, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.error, new MessageTemplate('Test'))
      ]);
      consoleProxy.verify(m => m.error(TypeMoq.It.isAny()), TypeMoq.Times.exactly(2));
    });
    
    it('logs warning messages', () => {
      const consoleProxy = TypeMoq.Mock.ofType<ConsoleProxy>();
      const consoleSink = new ConsoleSink({ console: consoleProxy.object });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.warning, new MessageTemplate('Test'))
      ]);
      consoleProxy.verify(m => m.warn(TypeMoq.It.isAny()), TypeMoq.Times.once());
    });
    
    it('logs info messages', () => {
      const consoleProxy = TypeMoq.Mock.ofType<ConsoleProxy>();
      const consoleSink = new ConsoleSink({ console: consoleProxy.object });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test'))
      ]);
      consoleProxy.verify(m => m.info(TypeMoq.It.isAny()), TypeMoq.Times.once());
    });
    
    it('logs debug and verbose messages', () => {
      const consoleProxy = TypeMoq.Mock.ofType<ConsoleProxy>();
      const consoleSink = new ConsoleSink({ console: consoleProxy.object });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.debug, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.verbose, new MessageTemplate('Test'))
      ]);
      consoleProxy.verify(m => m.debug(TypeMoq.It.isAny()), TypeMoq.Times.exactly(2));
    });
    
    it('logs messages with an unknown log level', () => {
      const consoleProxy = TypeMoq.Mock.ofType<ConsoleProxy>();
      const consoleSink = new ConsoleSink({ console: consoleProxy.object });
      consoleSink.emit([
        new LogEvent('', 100, new MessageTemplate('Test'))
      ]);
      consoleProxy.verify(m => m.log(TypeMoq.It.isAny()), TypeMoq.Times.once());
    });
    
    it('falls back to log when the more specific methods are unavailable', () => {
      const consoleProxy = TypeMoq.Mock.ofInstance({ log: (message?: any, ...properties: any[]) => {} });
      const consoleSink = new ConsoleSink({ console: consoleProxy.object });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.error, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.warning, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.debug, new MessageTemplate('Test'))
      ]);
      consoleProxy.verify(m => m.log(TypeMoq.It.isAny()), TypeMoq.Times.exactly(4));
    });
    
    it('does nothing if no log methods are available', () => {
      const consoleProxy = TypeMoq.Mock.ofInstance({});
      const consoleSink = new ConsoleSink({ console: consoleProxy.object });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.error, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.warning, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.debug, new MessageTemplate('Test'))
      ]);
    });
    
    it('does not log events lower than the restricted level', () => {
      const consoleProxy = TypeMoq.Mock.ofInstance({ log: (message?: any, ...properties: any[]) => {} });
      const consoleSink = new ConsoleSink({
        console: consoleProxy.object,
        restrictedToMinimumLevel: LogEventLevel.information
      });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.error, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.information, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.debug, new MessageTemplate('Test')),
        new LogEvent('', LogEventLevel.verbose, new MessageTemplate('Test'))
      ]);
      consoleProxy.verify(m => m.log(TypeMoq.It.isAny()), TypeMoq.Times.exactly(2));
    });

    it('includes timestamps when specified in options', () => {
      const timestamp = new Date().toISOString();
      let loggedMessage;
      const consoleProxy = { log: (message?: any, ...properties: any[]) => {
        loggedMessage = message;
      } };
      const consoleSink = new ConsoleSink({
        console: consoleProxy,
        includeTimestamps: true
      });
      consoleSink.emit([
        new LogEvent(timestamp, LogEventLevel.error, new MessageTemplate('Test'))
      ]);
      expect(loggedMessage).to.contain(timestamp);
    });

    it('includes properties when specified in options', () => {
      let loggedMessage;
      let loggedProperties;
      const consoleProxy = { log: (message?: any, ...properties: any[]) => {
        loggedMessage = message;
        loggedProperties = properties;
      } };
      const consoleSink = new ConsoleSink({
        console: consoleProxy,
        includeProperties: true
      });
      consoleSink.emit([
        new LogEvent('', LogEventLevel.error, new MessageTemplate('Test'), { a: 'property 1', b: 'property 2' })
      ]);
      expect(loggedProperties).to.have.length(2);
      expect(loggedProperties[0]).to.equal('property 1');
      expect(loggedProperties[1]).to.equal('property 2');
    });
  });
  
  describe('flush()', () => {
    it('does nothing when flushed', () => {
      return new ConsoleSink().flush();
    });
  });
});

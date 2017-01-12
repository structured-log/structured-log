/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import { LogEvent, LogEventLevel } from '../src/logEvent';
import { MessageTemplate } from '../src/messageTemplate';
import { EnrichStage } from '../src/enrichStage';

describe('EnrichStage', () => {
  it('enriches events with properties returned from a function', () => {
    const enricher = () => ({ b: 2 });
    const enrichStage = new EnrichStage(enricher);
    const events = [
      new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 1'), { a: 1 }),
      new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 2'), { a: 1 })
    ];
    const enrichedEvents = enrichStage.emit(events);
    expect(enrichedEvents).to.have.length(2);
    expect(enrichedEvents[0]).to.have.deep.property('properties.b', 2);
    expect(enrichedEvents[1]).to.have.deep.property('properties.b', 2);
  });

  it('enriches events with properties from a plain object', () => {
    const enricher = { b: 2 };
    const enrichStage = new EnrichStage(enricher);
    const events = [
      new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 1'), { a: 1 }),
      new LogEvent('', LogEventLevel.information, new MessageTemplate('Message 2'), { a: 1 })
    ];
    const enrichedEvents = enrichStage.emit(events);
    expect(enrichedEvents).to.have.length(2);
    expect(enrichedEvents[0]).to.have.deep.property('properties.b', 2);
    expect(enrichedEvents[1]).to.have.deep.property('properties.b', 2);
  });

  it('does nothing when flushed', () => {
    return new EnrichStage({}).flush();
  });
});

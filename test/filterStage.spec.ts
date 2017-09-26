/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/jest/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import { LogEvent, LogEventLevel } from '../src/logEvent';
import { MessageTemplate } from '../src/messageTemplate';
import { FilterStage } from '../src/filterStage';

describe('FilterStage', () => {
  it('filters events according to the filter predicate', () => {
    const predicate = (e: LogEvent) => e.messageTemplate.raw.indexOf('B') === 0;
    const filterStage = new FilterStage(predicate);
    const events = [
      new LogEvent('', LogEventLevel.information, new MessageTemplate('A Message 1'), {}),
      new LogEvent('', LogEventLevel.information, new MessageTemplate('B Message 1'), {}),
      new LogEvent('', LogEventLevel.information, new MessageTemplate('B Message 2'), {}),
      new LogEvent('', LogEventLevel.information, new MessageTemplate('C Message 1'), {})
    ];
    const filteredEvents = filterStage.emit(events);
    expect(filteredEvents).to.have.length(2);
    expect(filteredEvents[0]).to.have.deep.property('messageTemplate.raw', 'B Message 1');
    expect(filteredEvents[1]).to.have.deep.property('messageTemplate.raw', 'B Message 2');
  });

  it('does nothing when flushed', () => {
    return new FilterStage(() => true).flush();
  });
});

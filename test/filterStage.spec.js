import { expect } from 'chai';
import FilterStage from '../src/filterStage';
import * as logLevels from '../src/logLevels';
import { createWrappedSinkStage } from './testHelpers';

describe('FilterStage', () => {
  it('should not pass on that are caught by the filter', () => {
    const event1 = { level: logLevels.INFO };
    const event2 = { level: logLevels.DEBUG };
    const event3 = { level: logLevels.INFO };

    let filteredEvents = [];
    const sinkStage = createWrappedSinkStage(logEvents => filteredEvents = logEvents);
    const filterStage = new FilterStage(logEvent => logEvent.level === logLevels.INFO);
    filterStage.setNextStage(sinkStage);

    return filterStage.emit([event1, event2, event3]).then(() => {
      expect(filteredEvents).to.include(event1);
      expect(filteredEvents).to.not.include(event2);
      expect(filteredEvents).to.include(event3);
    });
  });
});

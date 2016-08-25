import { expect } from 'chai';
import EnrichStage from '../src/enrichStage';
import Pipeline from '../src/pipeline';
import LogEvent from '../src/logEvent';
import { createWrappedSinkStage } from './testHelpers';

describe('EnrichStage', () => {
  it('should enrich events with the added properties', () => {
    const event1 = new LogEvent();
    const event2 = new LogEvent();
    const event3 = new LogEvent();

    const enrichStage = new EnrichStage(() => {
      return {
        'a': 1
      };
    });

    let enrichedEvents = [];
    const postEnrichStage = createWrappedSinkStage(logEvents => enrichedEvents = logEvents);

    const pipeline = new Pipeline([enrichStage, postEnrichStage]);

    return pipeline.emit([event1, event2, event3]).then(() => {
      expect(enrichedEvents.length).to.equal(3);
      expect(enrichedEvents[0].properties).to.have.property('a', 1);
      expect(enrichedEvents[1].properties).to.have.property('a', 1);
      expect(enrichedEvents[2].properties).to.have.property('a', 1);
    });
  });
});

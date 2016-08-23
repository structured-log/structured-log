import { expect } from 'chai';
import LevelMap from '../src/levelMap';
import * as logLevels from '../src/logLevels';

describe('LevelMap', () => {
  it('should enable the correct logging levels', () => {
    const levelMap = new LevelMap(logLevels.DEBUG);

    expect(levelMap.isEnabled(logLevels.ERROR)).to.be.true;
    expect(levelMap.isEnabled(logLevels.WARN)).to.be.true;
    expect(levelMap.isEnabled(logLevels.INFO)).to.be.true;
    expect(levelMap.isEnabled(logLevels.DEBUG)).to.be.true;
    expect(levelMap.isEnabled(logLevels.VERBOSE)).to.be.false;
  });

  it('should set INFO as the default logging level', () => {
    const levelMap = new LevelMap('UNKNOWN');

    expect(levelMap.isEnabled(logLevels.INFO)).to.be.true;
    expect(levelMap.isEnabled(logLevels.DEBUG)).to.be.false;
  });

  it('should not enable unrecognized logging levels', () => {
    const levelMap = new LevelMap(logLevels.VERBOSE);

    expect(levelMap.isEnabled('UNKNOWN')).to.be.false;
  });
});

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

  it('should update the logging level when set', () => {
    const levelMap = new LevelMap(logLevels.INFO);
    levelMap.minLevel = logLevels.DEBUG;

    expect(levelMap.isEnabled(logLevels.DEBUG)).to.be.true;
  });

  it('should allow subscriptions to minimum level changes', () => {
    const levelMap = new LevelMap(logLevels.INFO);
    let level = levelMap.minLevel;
    levelMap.subscribe(newLevel => level = newLevel);
    levelMap.minLevel = logLevels.DEBUG;
    expect(level).to.equal(logLevels.DEBUG);
  });

  it('should allow subscriptions to be removed', () => {
    const levelMap = new LevelMap(logLevels.INFO);
    let called = false;
    const subscriber = () => called = true;
    levelMap.subscribe(subscriber);
    levelMap.unsubscribe(subscriber);
    levelMap.minLevel = logLevels.DEBUG;
    expect(called).to.be.false;
  });
});

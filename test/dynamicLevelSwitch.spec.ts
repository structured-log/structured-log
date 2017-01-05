/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { DynamicLevelSwitchStage, DynamicLevelSwitch } from '../src/dynamicLevelSwitch';
import { LogEventLevel, LogEvent } from '../src/logEvent';
import { MessageTemplate } from '../src/messageTemplate';

describe('DynamicLevelSwitch', () => {
  it('sets the minimum level to fatal', () => {
    const dynamicLevelSwitch = new DynamicLevelSwitch();
    return dynamicLevelSwitch.fatal().then(() => {
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.fatal)).to.be.true;
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.error)).to.be.false;
    });
  });

  it('sets the minimum level to error', () => {
    const dynamicLevelSwitch = new DynamicLevelSwitch();
    return dynamicLevelSwitch.error().then(() => {
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.error)).to.be.true;
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.warning)).to.be.false;
    });
  });
  
  it('sets the minimum level to warning', () => {
    const dynamicLevelSwitch = new DynamicLevelSwitch();
    return dynamicLevelSwitch.warning().then(() => {
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.warning)).to.be.true;
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.information)).to.be.false;
    });
  });
  
  it('sets the minimum level to information', () => {
    const dynamicLevelSwitch = new DynamicLevelSwitch();
    return dynamicLevelSwitch.information().then(() => {
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.information)).to.be.true;
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.debug)).to.be.false;
    });
  });
  
  it('sets the minimum level to debug', () => {
    const dynamicLevelSwitch = new DynamicLevelSwitch();
    return dynamicLevelSwitch.debug().then(() => {
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.debug)).to.be.true;
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.verbose)).to.be.false;
    });
  });
  
  it('sets the minimum level to verbose', () => {
    const dynamicLevelSwitch = new DynamicLevelSwitch();
    return dynamicLevelSwitch.verbose().then(() => {
      expect(dynamicLevelSwitch.isEnabled(LogEventLevel.verbose)).to.be.true;
    });
  });
});

describe('DynamicLevelSwitchStage', () => {
  describe('constructor()', () => {
    it('sets the switch to be used for filtering', () => {
      const dynamicLevelSwitch = new DynamicLevelSwitch();
      const stage = new DynamicLevelSwitchStage(dynamicLevelSwitch);
      const events = [
        new LogEvent('', LogEventLevel.verbose, new MessageTemplate('Message 1')),
        new LogEvent('', LogEventLevel.debug, new MessageTemplate('Message 2')),
        new LogEvent('', LogEventLevel.warning, new MessageTemplate('Message 3'))
      ];
      return dynamicLevelSwitch.debug().then(() => {
        const filteredEvents = stage.emit(events);
        expect(filteredEvents).to.have.length(2);
        expect(filteredEvents[0]).to.have.deep.property('messageTemplate.raw', 'Message 2');
        expect(filteredEvents[1]).to.have.deep.property('messageTemplate.raw', 'Message 3');
      });
    });
  });

  describe('setFlushDelegate()', () => {
    it('sets the flush delegate of the switch', () => {
      const dynamicLevelSwitch = new DynamicLevelSwitch();
      const stage = new DynamicLevelSwitchStage(dynamicLevelSwitch);
      let flushDelegateCalled;
      const flushDelegate = () => Promise.resolve(flushDelegateCalled = true);
      stage.setFlushDelegate(flushDelegate);

      return dynamicLevelSwitch.debug().then(() => expect(flushDelegateCalled).to.be.true);
    });
  });
});

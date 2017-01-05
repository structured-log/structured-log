/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import { LogEventLevel, isEnabled } from '../src/logEvent';

describe('LogEventLevel', () => {
  it('off includes nothing', () => {
    expect(LogEventLevel.off & LogEventLevel.fatal).to.equal(0);
  });

  it('error includes fatal', () => {
    expect(LogEventLevel.error & LogEventLevel.fatal).to.equal(LogEventLevel.fatal);
  });

  it('warning includes error', () => {
    expect(LogEventLevel.warning & LogEventLevel.error).to.equal(LogEventLevel.error);
  });

  it('information includes warning', () => {
    expect(LogEventLevel.information & LogEventLevel.warning).to.equal(LogEventLevel.warning);
  });

  it('debug includes information', () => {
    expect(LogEventLevel.debug & LogEventLevel.information).to.equal(LogEventLevel.information);
  });

  it('verbose includes debug', () => {
    expect(LogEventLevel.verbose & LogEventLevel.debug).to.equal(LogEventLevel.debug);
  });
});

describe('isEnabled()', () => {
  it('shows which levels are enabled', () => {
    expect(isEnabled(LogEventLevel.information, LogEventLevel.fatal)).to.be.true;
    expect(isEnabled(LogEventLevel.information, LogEventLevel.error)).to.be.true;
    expect(isEnabled(LogEventLevel.information, LogEventLevel.information)).to.be.true;
    expect(isEnabled(LogEventLevel.information, LogEventLevel.debug)).to.be.false;
    expect(isEnabled(LogEventLevel.information, LogEventLevel.verbose)).to.be.false;
  });
  
  it('supports custom log levels', () => {
    const customLogEventLevel = LogEventLevel.warning | 1 << 10;
    expect(isEnabled(LogEventLevel.warning, customLogEventLevel)).to.be.false;
    expect(isEnabled(customLogEventLevel, LogEventLevel.fatal)).to.be.true;
    expect(isEnabled(customLogEventLevel, LogEventLevel.error)).to.be.true;
    expect(isEnabled(customLogEventLevel, LogEventLevel.information)).to.be.false;
    expect(isEnabled(customLogEventLevel, LogEventLevel.debug)).to.be.false;
    expect(isEnabled(customLogEventLevel, LogEventLevel.verbose)).to.be.false;
    expect(isEnabled(customLogEventLevel, customLogEventLevel)).to.be.true;
  });
});

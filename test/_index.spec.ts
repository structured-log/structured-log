/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { LoggerConfiguration } from '../src/loggerConfiguration';
import * as structuredLog from '../src/index';

describe('configure()', () => {
  it('returns a new LoggerConfiguration instance', () => {
    const loggerConfiguration = structuredLog.configure();
    expect(loggerConfiguration).to.be.an.instanceof(LoggerConfiguration);
  });
});

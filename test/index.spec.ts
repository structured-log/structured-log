/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/jest/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import { LoggerConfiguration } from '../src/loggerConfiguration';
import * as structuredLog from '../src/index';

describe('configure()', () => {
  it('returns a new LoggerConfiguration instance', () => {
    const loggerConfiguration = structuredLog.configure();
    expect(loggerConfiguration).to.be.an.instanceof(LoggerConfiguration);
  });
});

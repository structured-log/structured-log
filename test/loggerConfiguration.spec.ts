/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import * as TypeMoq from 'typemoq';
import { expect } from 'chai';
import { ILogEvent, LogEventLevel } from '../src/logEvent';
import { LoggerConfiguration } from '../src/loggerConfiguration';
import { Logger } from '../src/logger';
import { Pipeline } from '../src/pipeline';
import { EnrichStage } from '../src/enrichStage';
import { FilterStage } from '../src/filterStage';

describe('LoggerConfiguration', () => {
  describe('()', () => {
    it('creates a new pipeline if none is passed', () => {
      const loggerConfiguration = new LoggerConfiguration();
      expect(() => loggerConfiguration.create()).to.not.throw();
    });
    
    it('uses the provided pipeline', () => {
      const pipeline = TypeMoq.Mock.ofType<Pipeline>();
      const loggerConfiguration = new LoggerConfiguration(pipeline.object);
      loggerConfiguration.filter(() => true);
      pipeline.verify(m => m.addStage(TypeMoq.It.isAny()), TypeMoq.Times.once());
    });
  });

  describe('create()', () => {
    it('creates a new Logger instance', () => {
      const loggerConfiguration = new LoggerConfiguration();
      const logger = loggerConfiguration.create();
      expect(logger).to.be.an.instanceof(Logger);
    });
    
    it('can only be called once per configuration', () => {
      const loggerConfiguration = new LoggerConfiguration();
      loggerConfiguration.create();
      expect(() => loggerConfiguration.create()).to.throw();
    });
  });

  describe('enrich()', () => {
    it('adds an enricher stage with the given function', () => {
      const pipeline = TypeMoq.Mock.ofType<Pipeline>();
      let enrichStage;
      pipeline.setup(m => m.addStage(TypeMoq.It.isAny()))
        .callback(stage => enrichStage = stage);
      const loggerConfiguration = new LoggerConfiguration(pipeline.object);
      loggerConfiguration.enrich(() => ({
        index: 2
      }));
      expect(enrichStage).to.be.an.instanceof(EnrichStage);
    });

    it ('adds an enricher stage with the given object', () => {
      const pipeline = TypeMoq.Mock.ofType<Pipeline>();
      let enrichStage;
      pipeline.setup(m => m.addStage(TypeMoq.It.isAny()))
        .callback(stage => enrichStage = stage);
      const loggerConfiguration = new LoggerConfiguration(pipeline.object);
      loggerConfiguration.enrich({
        index: 4
      });
      expect(enrichStage).to.be.an.instanceof(EnrichStage);
    });
  });

  describe('filter()', () => {
    it('adds a filter stage to the pipeline', () => {
      const pipeline = TypeMoq.Mock.ofType<Pipeline>();
      let filterStage;
      pipeline.setup(m => m.addStage(TypeMoq.It.isAny()))
        .callback(stage => filterStage = stage);
      const loggerConfiguration = new LoggerConfiguration(pipeline.object);
      loggerConfiguration.filter(() => true);
      expect(filterStage).to.be.an.instanceof(FilterStage);
    });
  });

  describe('minLevel()', () => {
    
  });
});

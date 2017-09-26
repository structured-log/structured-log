/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/jest/index.d.ts" />
/// <reference path="../node_modules/typemoq/dist/typemoq.d.ts" />

import { expect } from 'chai';
import { MessageTemplate } from '../src/messageTemplate';

describe('MessageTemplate', () => {
  describe('constructor()', () => {
    it('requires a message', () => {
      expect(() => new MessageTemplate(null)).to.throw();
    });
  });
  
  describe('bindProperties()', () => {
    it('binds properties from arguments', () => {
      let boundProperties;
      ((...properties: any[]) => {
        const messageTemplate = new MessageTemplate('Happy {age}th birthday, {name}!');
        boundProperties = messageTemplate.bindProperties(properties);
      })(30, 'Fred');
      expect(boundProperties).to.have.property('age', 30);
      expect(boundProperties).to.have.property('name', 'Fred');
    });

    it('destructures bound properties from arguments', () => {
      let boundProperties;
      ((...properties: any[]) => {
        const messageTemplate = new MessageTemplate('Hello, {@person}!');
        boundProperties = messageTemplate.bindProperties(properties);
      })({ firstName: 'Leeroy', lastName: 'Jenkins' });
      expect(boundProperties).to.have.deep.property('person.firstName', 'Leeroy');
      expect(boundProperties).to.have.deep.property('person.lastName', 'Jenkins');
    });

    it('binds properties not in the message template', () => {
      let boundProperties;
      const f = function () { };
      const o = null;
      ((...properties: any[]) => {
        const messageTemplate = new MessageTemplate('Happy {age}th birthday, {name}!');
        boundProperties = messageTemplate.bindProperties(properties);
      })(30, 'Fred', undefined, 'Not in template', f, o, {});
      expect(boundProperties).to.have.property('age', 30);
      expect(boundProperties).to.have.property('name', 'Fred');
      expect(boundProperties).to.have.property('a3', 'Not in template');
      expect(boundProperties).to.have.property('a4', f.toString());
      expect(boundProperties).to.have.property('a5', null);
      expect(boundProperties).to.have.property('a6', {}.toString());
    });
  });

  describe('render()', () => {
    it('renders a message', () => {
      const messageTemplate = new MessageTemplate('Happy {age}th birthday, {name}!');
      const message = messageTemplate.render({ age: 30, name: 'Fred' });

      expect(message).to.equal('Happy 30th birthday, Fred!');
    });

    it('renders a message without any parameters', () => {
      const messageTemplate = new MessageTemplate('Happy 30th birthday, Fred!');
      const message = messageTemplate.render();

      expect(message).to.equal('Happy 30th birthday, Fred!');
    });

    it('renders a message with destructured parameters', () => {
      const messageTemplate = new MessageTemplate('Hello, {@person}!');
      const message = messageTemplate.render({ person: { firstName: 'Leeroy', lastName: 'Jenkins' } });

      expect(message).to.equal('Hello, {"firstName":"Leeroy","lastName":"Jenkins"}!');
    });

    it('renders a message with missing properties', () => {
      const messageTemplate = new MessageTemplate('Hello, {@person}!');
      const message = messageTemplate.render();

      expect(message).to.equal('Hello, {@person}!');
    });

    it('renders string representations of primitive properties', () => {
      const messageTemplate = new MessageTemplate('{p}');
      expect(messageTemplate.render({ p: undefined })).to.equal('undefined');
      expect(messageTemplate.render({ p: null })).to.equal('null');
      expect(messageTemplate.render({ p: 'text' })).to.equal('text');
      expect(messageTemplate.render({ p: 123 })).to.equal('123');
      expect(messageTemplate.render({ p: true })).to.equal(true.toString());
    });

    it('renders string representations of complex properties', () => {
      const messageTemplate = new MessageTemplate('{p}');
      const date = new Date();
      expect(messageTemplate.render({ p: date })).to.equal(date.toISOString());
      const complex = {
        aaaa: {
          bbbb: {
            cccc: {
              dddd: 'eeee'
            }
          },
          ffff: {
            gggg: {
              hhhh: {
                ijkl: 'mnopqrstuvwxyz'
              }
            }
          }
        }
      };
      const complexMessage = messageTemplate.render({ p: complex });
      expect(complexMessage).to.have.length(70);
      expect(complexMessage.indexOf('...')).to.equal(67);
      expect(messageTemplate.render({ p: Symbol('sym') })).to.equal('Symbol(sym)');
      const f = function () { };
      expect(messageTemplate.render({ p: f })).to.equal(f.toString());
    });
  });
});

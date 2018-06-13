const FunctorProvider = require('../../src/engine/FunctorProvider');

const chai = require('chai');
const expect = chai.expect;

const noop = () => {};

describe('FunctorProvider', () => {
  describe('define(name, func)', () => {
    it('should throw error for invalid names', () => {
      let provider = new FunctorProvider(() => {
        return [];
      });
      expect(() => {
        provider.define('*invalidName*/2', noop);
      }).to.throw();
      expect(() => {
        provider.define('invalidName/+2', noop);
      }).to.throw();
      expect(() => {
        provider.define('invalidNum/02', noop);
      }).to.throw();
      expect(() => {
        provider.define('invalidName/Abc', noop);
      }).to.throw();
      expect(() => {
        provider.define('__/5', noop);
      }).to.throw();
      expect(() => {
        provider.define('Bad/5', noop);
      }).to.throw();
    });

    it('should not throw error for valid names', () => {
      let provider = new FunctorProvider(() => {
        return [];
      });
      expect(() => {
        provider.define('valid/2', noop);
      }).to.not.throw();
      expect(() => {
        provider.define('+/5', noop);
      }).to.not.throw();
      expect(() => {
        provider.define('!/1', noop);
      }).to.not.throw();
      expect(() => {
        provider.define('good_func/1', noop);
      }).to.not.throw();
      expect(() => {
        provider.define('camelCase/3', noop);
      }).to.not.throw();
    });

    it('should define the functor as expected', () => {
      let provider = new FunctorProvider(() => {
        return [];
      });
      provider.define('testingName', (arg) => {});
      expect(provider.has('testingName/1')).to.be.true;

      provider.define('testingName/2', noop);
      expect(provider.has('testingName/2')).to.be.true;
    });
  });
});

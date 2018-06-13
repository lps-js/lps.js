const FunctorProvider = require('../../src/engine/FunctorProvider');
const Functor = require('../../src/engine/Functor');
const Variable = require('../../src/engine/Variable');

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

  describe('has(name)', () => {
    it('should return true for built-in functors', () => {
      let provider = new FunctorProvider(() => {
        return [];
      });
      expect(provider.has('!/1')).to.be.true;
      expect(provider.has('+/2')).to.be.true;
      expect(provider.has('=/2')).to.be.true;
      expect(provider.has('==/2')).to.be.true;
      expect(provider.has('member/2')).to.be.true;
      expect(provider.has('floor/1')).to.be.true;
      expect(provider.has('*/2')).to.be.true;
      expect(provider.has('-/2')).to.be.true;
      expect(provider.has('sin/2')).to.be.true;
      expect(provider.has('cos/2')).to.be.true;
      expect(provider.has('tan/2')).to.be.true;
      expect(provider.has('append/2')).to.be.true;

      let literal = new Functor('!', [new Variable('X')]);
      expect(provider.has(literal)).to.be.true;
      let literal2 = new Functor('append', [new Variable('X'), new Variable('Y'), new Variable('Z')]);
      expect(provider.has(literal2)).to.be.true;
    });
  });
});

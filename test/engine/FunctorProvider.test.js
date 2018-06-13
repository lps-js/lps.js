const FunctorProvider = require('../../src/engine/FunctorProvider');
const Functor = require('../../src/engine/Functor');
const Variable = require('../../src/engine/Variable');
const Value = require('../../src/engine/Value');
const Program = require('../../src/parser/Program');

const chai = require('chai');
const expect = chai.expect;

const noop = () => {};

describe('FunctorProvider', () => {
  describe('define(name, func)', () => {
    it('should throw error for invalid names', () => {
      let provider = new FunctorProvider(null);
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
      let provider = new FunctorProvider(null);
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
      let provider = new FunctorProvider(null);
      provider.define('testingName', (arg) => {});
      expect(provider.has('testingName/1')).to.be.true;

      provider.define('testingName/2', noop);
      expect(provider.has('testingName/2')).to.be.true;
    });
  });

  describe('has(name)', () => {
    it('should return true for built-in functors', () => {
      let provider = new FunctorProvider(null);
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
    it('should return false for undefined functors', () => {
      let provider = new FunctorProvider(null);
      expect(provider.has('_/1')).to.be.false;
      expect(provider.has('+/5')).to.be.false;
      expect(provider.has('===/2')).to.be.false;
      expect(provider.has('==/3')).to.be.false;
      expect(provider.has('member?/2')).to.be.false;
      expect(provider.has('Floor/1')).to.be.false;

      let literal = new Functor('!!!', [new Variable('X')]);
      expect(provider.has(literal)).to.be.false;
      let literal2 = new Functor('appends', [new Variable('X'), new Variable('Y'), new Variable('Z')]);
      expect(provider.has(literal2)).to.be.false;
    });

    it('should return true for user-defined functors', () => {
      let provider = new FunctorProvider(null);

      expect(provider.has('test/2')).to.be.false;
      provider.define('test/2', noop);
      expect(provider.has('test/2')).to.be.true;

      expect(provider.has('test/1')).to.be.false;
      provider.define('test/1', (arg) => {});
      expect(provider.has('test/1')).to.be.true;
    });
  });

  describe('execute(literal)', () => {
    it('should execute built-in functors', () => {
      let program = new Program();
      let provider = new FunctorProvider(program);
      let result = provider.execute(Program.literal('!fact(1)'));
      expect(result).to.be.instanceof(Array);
      expect(result).to.be.length(1);
      expect(Object.keys(result[0].theta)).to.be.empty;
    });

    it('should execute built-in functors', () => {
      let program = new Program();
      let provider = new FunctorProvider(program);
      let result = provider.execute(Program.literal('1+2'));
      expect(result).to.be.instanceof(Array);
      expect(result).to.be.length(1);
      expect(Object.keys(result[0].theta)).to.be.empty;
      expect(result[0].replacement).to.be.not.undefined;
      expect(result[0].replacement).to.be.instanceof(Value);
      expect(result[0].replacement.evaluate()).to.be.equal(3);
    });

    it('should throw error for undefined functor', () => {
      let program = new Program();
      let provider = new FunctorProvider(program);
      expect(() => {
        let result = provider.execute(Program.literal('what(5)'));
      }).to.throw();
    });
  });
});

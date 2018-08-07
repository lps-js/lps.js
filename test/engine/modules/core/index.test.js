const coreModule = lpsRequire('engine/modules/core');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Engine = lpsRequire('engine/Engine');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Program = lpsRequire('parser/Program');

const chai = require('chai');
const expect = chai.expect;

describe('coreModule', () => {
  describe('!/1', () => {
    it('should be defined', () => {
      let program = new Program();
      coreModule(null, program);
      let functorProvider = program.getFunctorProvider();
      expect(functorProvider.has('!/1')).to.be.true;
    });

    it('should return correct negation result', () => {
      let program = new Program();
      let engine = new Engine(program);

      let result = program.query(Program.literal('!fact(a)'));
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.an('object');
      expect(result[0].theta).to.be.empty;
    });

    it('should return correct negation result', () => {
      let facts = new LiteralTreeMap();
      let program = new Program();
      let engine = new Engine(program);

      facts.add(Program.literal('fact(a)'));

      program.setFacts(facts);

      let result = program.query(Program.literal('!fact(a)'));
      expect(result).to.be.an('array');
      expect(result).to.be.length(0);
    });
  });

  describe('+/2', () => {
    let program;
    beforeEach(() => {
      program = new Program();

      // core module is loaded by Engine
      coreModule(null, program);
    });

    it('should be defined', () => {
      let functorProvider = program.getFunctorProvider();
      expect(functorProvider.has('+/2')).to.be.true;
    });

    it('should return addition correctly', () => {
      let functorProvider = program.getFunctorProvider();
      let params = [
        new Value(1),
        new Value(2)
      ]
      let result = functorProvider.execute(new Functor('+', params));
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.an('object');
      expect(result[0].theta).to.be.empty;
      expect(result[0]).to.have.property('replacement');
      expect(result[0].replacement).to.be.an('object');
      expect(result[0].replacement).to.be.instanceof(Value);
      expect(result[0].replacement.evaluate()).to.be.equal(3);
    });
  });

  describe('-/2', () => {
    let program;
    beforeEach(() => {
      program = new Program();

      // core module is loaded by Engine
      coreModule(null, program);
    });

    it('should be defined', () => {
      let functorProvider = program.getFunctorProvider();
      expect(functorProvider.has('-/2')).to.be.true;
    });

    it('should return subtraction correctly', () => {
      let functorProvider = program.getFunctorProvider();
      let params = [
        new Value(2),
        new Value(1)
      ]
      let result = functorProvider.execute(new Functor('-', params));
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.an('object');
      expect(result[0].theta).to.be.empty;
      expect(result[0]).to.have.property('replacement');
      expect(result[0].replacement).to.be.an('object');
      expect(result[0].replacement).to.be.instanceof(Value);
      expect(result[0].replacement.evaluate()).to.be.equal(1);
    });
  });

  describe('*/2', () => {
    let program;
    beforeEach(() => {
      program = new Program();

      // core module is loaded by Engine
      coreModule(null, program);
    });

    it('should be defined', () => {
      let functorProvider = program.getFunctorProvider();
      expect(functorProvider.has('*/2')).to.be.true;
    });

    it('should return multiplication correctly', () => {
      let functorProvider = program.getFunctorProvider();
      let params = [
        new Value(2),
        new Value(3)
      ]
      let result = functorProvider.execute(new Functor('*', params));
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.an('object');
      expect(result[0].theta).to.be.empty;
      expect(result[0]).to.have.property('replacement');
      expect(result[0].replacement).to.be.an('object');
      expect(result[0].replacement).to.be.instanceof(Value);
      expect(result[0].replacement.evaluate()).to.be.equal(6);
    });
  });

  describe('//2', () => {
    let program;
    beforeEach(() => {
      program = new Program();

      // core module is loaded by Engine
      coreModule(null, program);
    });

    it('should be defined', () => {
      let functorProvider = program.getFunctorProvider();
      expect(functorProvider.has('//2')).to.be.true;
    });

    it('should return multiplication correctly', () => {
      let functorProvider = program.getFunctorProvider();
      let params = [
        new Value(6),
        new Value(2)
      ]
      let result = functorProvider.execute(new Functor('/', params));
      expect(result).to.be.an('array');
      expect(result).to.be.length(1);
      expect(result[0]).to.have.property('theta');
      expect(result[0].theta).to.be.an('object');
      expect(result[0].theta).to.be.empty;
      expect(result[0]).to.have.property('replacement');
      expect(result[0].replacement).to.be.an('object');
      expect(result[0].replacement).to.be.instanceof(Value);
      expect(result[0].replacement.evaluate()).to.be.equal(3);
    });
  });
});

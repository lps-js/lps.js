/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const coreModule = lpsRequire('engine/modules/core');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const Program = lpsRequire('engine/Program');
const Engine = lpsRequire('engine/Engine');

const chai = require('chai');
const expect = chai.expect;

describe('coreModule', () => {
  let program = new Program();
  let engine = new Engine(program);
  coreModule(engine, program);

  let functorProvider = engine.getFunctorProvider();

  describe('math', () => {
    describe('+/2', () => {
      it('should be defined', () => {
        expect(functorProvider.has('+/2')).to.be.true;
      });

      it('should return addition correctly', () => {
        let params = [
          new Value(1),
          new Value(2)
        ];
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

      it('should return no result for variables in argument 1', () => {
        let params = [
          new Variable('A'),
          new Value(2)
        ];
        let result = functorProvider.execute(new Functor('+', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });

      it('should return no result for variables in argument 2', () => {
        let params = [
          new Value(2),
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('+', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe +/2

    describe('-/2', () => {
      it('should be defined', () => {
        expect(functorProvider.has('-/2')).to.be.true;
      });

      it('should return subtraction correctly', () => {
        let params = [
          new Value(2),
          new Value(1)
        ];
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

      it('should return no result for variables in argument 1', () => {
        let params = [
          new Variable('A'),
          new Value(2)
        ];
        let result = functorProvider.execute(new Functor('-', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });

      it('should return no result for variables in argument 2', () => {
        let params = [
          new Value(2),
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('-', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe -/2

    describe('*/2', () => {
      it('should be defined', () => {
        expect(functorProvider.has('*/2')).to.be.true;
      });

      it('should return multiplication correctly', () => {
        let params = [
          new Value(2),
          new Value(3)
        ];
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

      it('should return no result for variables in argument 1', () => {
        let params = [
          new Variable('A'),
          new Value(2)
        ];
        let result = functorProvider.execute(new Functor('*', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });

      it('should return no result for variables in argument 2', () => {
        let params = [
          new Value(2),
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('*', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe */2

    describe('//2', () => {
      it('should be defined', () => {
        expect(functorProvider.has('//2')).to.be.true;
      });

      it('should return division correctly', () => {
        let params = [
          new Value(6),
          new Value(2)
        ];
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

      it('should return no result for variables in argument 1', () => {
        let params = [
          new Variable('A'),
          new Value(2)
        ];
        let result = functorProvider.execute(new Functor('/', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });

      it('should return no result for variables in argument 2', () => {
        let params = [
          new Value(2),
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('/', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe //2

    describe('**/2', () => {
      it('should be defined', () => {
        expect(functorProvider.has('**/2')).to.be.true;
      });

      it('should return power correctly', () => {
        let params = [
          new Value(6),
          new Value(2)
        ];
        let result = functorProvider.execute(new Functor('**', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
        expect(result[0]).to.have.property('replacement');
        expect(result[0].replacement).to.be.an('object');
        expect(result[0].replacement).to.be.instanceof(Value);
        expect(result[0].replacement.evaluate()).to.be.equal(36);
      });

      it('should return no result for variables in argument 1', () => {
        let params = [
          new Variable('A'),
          new Value(2)
        ];
        let result = functorProvider.execute(new Functor('**', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });

      it('should return no result for variables in argument 2', () => {
        let params = [
          new Value(2),
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('**', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe **/2

    describe('-/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('-/1')).to.be.true;
      });

      it('should return negative number correctly', () => {
        let params = [
          new Value(6)
        ];
        let result = functorProvider.execute(new Functor('-', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
        expect(result[0]).to.have.property('replacement');
        expect(result[0].replacement).to.be.an('object');
        expect(result[0].replacement).to.be.instanceof(Value);
        expect(result[0].replacement.evaluate()).to.be.equal(-6);
      });

      it('should return negative number correctly', () => {
        let params = [
          ProgramFactory.literal('2 + 6')
        ];
        let result = functorProvider.execute(new Functor('-', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
        expect(result[0]).to.have.property('replacement');
        expect(result[0].replacement).to.be.an('object');
        expect(result[0].replacement).to.be.instanceof(Value);
        expect(result[0].replacement.evaluate()).to.be.equal(-8);
      });


      it('should return no result for variables in argument', () => {
        let params = [
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('-', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe -/1

    describe('abs/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('abs/1')).to.be.true;
      });

      it('should return negative number as positive number', () => {
        let params = [
          new Value(-6)
        ];
        let result = functorProvider.execute(new Functor('abs', params));
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

      it('should return positive number as positive number', () => {
        let params = [
          new Value(6)
        ];
        let result = functorProvider.execute(new Functor('abs', params));
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


      it('should throw error for variables in argument', () => {
        let params = [
          new Variable('A')
        ];

        let result = functorProvider.execute(new Functor('abs', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe abs/1

    describe('sin/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('sin/1')).to.be.true;
      });

      it('should return correct result', () => {
        let params = [
          new Value(30)
        ];
        let result = functorProvider.execute(new Functor('sin', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;

        expect(result[0]).to.have.property('replacement');
        expect(result[0].replacement).to.be.an('object');
        expect(result[0].replacement).to.be.instanceof(Value);
        expect(result[0].replacement.evaluate()).to.be.equal(Math.sin(30));
      });

      it('should return no result for variables in argument', () => {
        let params = [
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('sin', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // describe sin/1

    describe('pi/0', () => {
      it('should be defined', () => {
        expect(functorProvider.has('pi/0')).to.be.true;
      });

      it('should return correct result', () => {
        let result = functorProvider.execute(new Functor('pi', []));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;

        expect(result[0]).to.have.property('replacement');
        expect(result[0].replacement).to.be.an('object');
        expect(result[0].replacement).to.be.instanceof(Value);
        expect(result[0].replacement.evaluate()).to.be.equal(Math.PI);
      });
    }); // describe pi/0
  });
});

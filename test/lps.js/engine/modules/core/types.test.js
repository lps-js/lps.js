/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const coreModule = lpsRequire('engine/modules/core');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const List = lpsRequire('engine/List');
const Engine = lpsRequire('engine/Engine');

const chai = require('chai');
const expect = chai.expect;

describe('coreModule', () => {
  let engine = new Engine();
  coreModule(engine, null);
  let functorProvider = engine.getFunctorProvider();

  describe('types', () => {
    describe('is_ground/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('is_ground/1')).to.be.true;
      });

      it('should return is_ground() correctly for ground term', () => {
        let params = [
          new Value(1)
        ];
        let result = functorProvider.execute(new Functor('is_ground', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_ground() correctly for unground term', () => {
        let params = [
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('is_ground', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // is_ground/1

    describe('is_list/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('is_list/1')).to.be.true;
      });

      it('should return is_list() correctly for a list', () => {
        let params = [
          new List([])
        ];
        let result = functorProvider.execute(new Functor('is_list', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_list() correctly for non-list term', () => {
        let params = [
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('is_list', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // is_list/1

    describe('is_variable/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('is_variable/1')).to.be.true;
      });

      it('should return is_variable() correctly for a variable', () => {
        let params = [
          new Variable('A')
        ];
        let result = functorProvider.execute(new Functor('is_variable', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_variable() correctly for non-variable term', () => {
        let params = [
          new Value('a')
        ];
        let result = functorProvider.execute(new Functor('is_variable', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // is_variable/1

    describe('is_number/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('is_number/1')).to.be.true;
      });

      it('should return is_number() correctly for an integer number value', () => {
        let params = [
          new Value(5)
        ];
        let result = functorProvider.execute(new Functor('is_number', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_number() correctly for a float number value', () => {
        let params = [
          new Value(0.885)
        ];
        let result = functorProvider.execute(new Functor('is_number', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_number() correctly for a non-number value', () => {
        let params = [
          new Value('test')
        ];
        let result = functorProvider.execute(new Functor('is_number', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // is_number/1

    describe('is_integer/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('is_integer/1')).to.be.true;
      });

      it('should return is_integer() correctly for an integer number value', () => {
        let params = [
          new Value(5)
        ];
        let result = functorProvider.execute(new Functor('is_integer', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_integer() correctly for a float number value', () => {
        let params = [
          new Value(0.885)
        ];
        let result = functorProvider.execute(new Functor('is_integer', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });

      it('should return is_integer() correctly for a non-number value', () => {
        let params = [
          new Value('test')
        ];
        let result = functorProvider.execute(new Functor('is_integer', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // is_integer/1

    describe('is_float/1', () => {
      it('should be defined', () => {
        expect(functorProvider.has('is_float/1')).to.be.true;
      });

      it('should return is_float() correctly for an integer number value', () => {
        let params = [
          new Value(5)
        ];
        let result = functorProvider.execute(new Functor('is_float', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });

      it('should return is_float() correctly for a float number value', () => {
        let params = [
          new Value(0.885)
        ];
        let result = functorProvider.execute(new Functor('is_float', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(1);
        expect(result[0]).to.have.property('theta');
        expect(result[0].theta).to.be.an('object');
        expect(result[0].theta).to.be.empty;
      });

      it('should return is_float() correctly for a non-number value', () => {
        let params = [
          new Value('test')
        ];
        let result = functorProvider.execute(new Functor('is_float', params));
        expect(result).to.be.an('array');
        expect(result).to.be.length(0);
      });
    }); // is_float/1
  });
});

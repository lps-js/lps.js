const FunctorProvider = require('../../src/engine/FunctorProvider');

const chai = require('chai');
const expect = chai.expect;

const noop = () => {};

describe('FunctorProvider', () => {
  describe('define(name, func)', () => {
    it('should throw error for invalid name', () => {
      let provider = new FunctorProvider(() => {
        return [];
      });
      expect(() => {
        provider.define('*invalidName*/2', noop);
      }).to.throw();
    });
  });
});

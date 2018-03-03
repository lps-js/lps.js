const Variable = require('../../src/engine/Variable');
const variableArrayRename = require('../../src/utility/variableArrayRename');

const chai = require('chai');
const expect = chai.expect;

describe('variableArrayRename', () => {
  it('should return an empty array if given an empty one', () => {
    let theta = variableArrayRename([]);
    expect(Object.keys(theta)).to.be.empty;
  });

  it('should return a correct substitution given a variable', () => {
    let theta = variableArrayRename([new Variable('X')]);
    expect(Object.keys(theta)).to.be.not.empty;
    expect(theta.X).to.be.not.equal(null);
    expect(theta.X).to.be.instanceof(Variable);
    expect(theta.X.evaluate()).to.be.equal('VXX');
  });

  it('should throw error when invalid rename pattern given', () => {
    expect(() => { variableArrayRename([new Variable('X')], 5) }).to.throw();
  });

  it('should return a correct substitution given a variable and rename pattern', () => {
    let theta = variableArrayRename([new Variable('X')], '_aa*');
    expect(Object.keys(theta)).to.be.not.empty;
    expect(theta.X).to.be.not.equal(null);
    expect(theta.X).to.be.instanceof(Variable);
    expect(theta.X.evaluate()).to.be.equal('_aaX');
  });
});

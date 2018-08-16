/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Variable = lpsRequire('engine/Variable');
const variableArrayRename = lpsRequire('utility/variableArrayRename');

const chai = require('chai');
const expect = chai.expect;

describe('variableArrayRename()', () => {
  it('should return an empty array if given an empty one', () => {
    let theta = variableArrayRename([]);
    expect(Object.keys(theta)).to.be.empty;
  });

  it('should return a correct substitution given a variable', () => {
    let theta = variableArrayRename([new Variable('X')]);
    expect(Object.keys(theta)).to.be.not.empty;
    expect(theta.X).to.be.not.equal(null);
    expect(theta.X).to.be.instanceof(Variable);
    expect(theta.X.evaluate()).to.be.equal('$_X');
  });

  it('should throw error when invalid rename pattern given', () => {
    expect(() => { variableArrayRename([new Variable('X')], 5); }).to.throw();
  });

  it('should return a correct substitution given a variable and rename pattern', () => {
    let theta = variableArrayRename([new Variable('X')], '_aa*');
    expect(Object.keys(theta)).to.be.not.empty;
    expect(theta.X).to.be.not.equal(null);
    expect(theta.X).to.be.instanceof(Variable);
    expect(theta.X.evaluate()).to.be.equal('_aaX');
  });
});

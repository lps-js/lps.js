const LPS = require('../../index');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

describe('main', () => {
  it('should return LPS correctly', () => {
    expect(LPS).to.be.a('function');
    expect(LPS.Value).to.be.a('function');
    expect(LPS.Variable).to.be.a('function');
    expect(LPS.Functor).to.be.a('function');
    expect(LPS.List).to.be.a('function');
    expect(LPS.Program).to.be.a('function');
    expect(LPS.ProgramFactory).to.be.a('function');
    expect(LPS.Tester).to.be.a('function');
    expect(LPS.loadString).to.be.a('function');
    expect(LPS.createFromString).to.be.a('function');
    expect(LPS.loadFile).to.be.a('function');
    expect(LPS.createFromFile).to.be.a('function');
    expect(LPS.literal).to.be.a('function');
    expect(LPS.literalSet).to.be.a('function');
  });
});

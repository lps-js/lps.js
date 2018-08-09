const LPS = lpsRequire('../index');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

describe('index', () => {
  it('should return LPS correctly', () => {
    expect(LPS).to.be.a('function');
  });
});

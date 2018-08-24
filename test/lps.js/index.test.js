/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const LPS = lpsRequire('LPS');

const chai = require('chai');
const expect = chai.expect;
require('mocha-sinon');

describe('index', () => {
  it('should return LPS correctly', () => {
    expect(LPS).to.be.a('function');
  });
});

/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const stringLiterals = lpsRequire('utility/strings');
const messages = lpsRequire('utility/strings/store');

const chai = require('chai');
const expect = chai.expect;

describe('stringLiterals', () => {
  it('should return a string correctly', () => {
    let recursiveExploreMessages = (current, path) => {
      Object.keys(current).forEach((key) => {
        let item = current[key];
        let currentPath = path.concat([key]);
        if (typeof item !== 'object') {
          expect(stringLiterals(currentPath, [])).to.be.equal(item);
          return;
        }
        recursiveExploreMessages(item, currentPath);
      });
    };
    recursiveExploreMessages(messages, []);
  });

  it('should throw error when incorrect path is given', () => {
    expect(() => {
      stringLiterals(['non', 'exists', 'path'], []);
    }).to.throw();
    expect(() => {
      stringLiterals(['modules'], []);
    }).to.throw();
  });

  it('should replace for value', () => {
    expect(stringLiterals(['modules', 'browserModeModuleLoadFailure'], ['test']))
      .to.be.equal('Not possible to use \'test\' module when in browser.');
  });
});

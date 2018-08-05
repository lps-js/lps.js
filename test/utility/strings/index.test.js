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
});

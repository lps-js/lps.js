const forEachPromise = lpsRequire('utility/forEachPromise');

const chai = require('chai');
const expect = chai.expect;

describe('forEachPromise', () => {
  it('should iterate an array correctly', (done) => {
    let arr = [1, 2, 3, 4, 5];
    let lastSeenIndex = -1;
    forEachPromise(arr)
      .do((item, index) => {
        expect(item).to.be.equal(arr[index]);
        lastSeenIndex = index;
      })
      .then(() => {
        expect(lastSeenIndex).to.be.equal(arr.length - 1);
        done();
      });
  });
});

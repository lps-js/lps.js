/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Manager = lpsRequire('utility/observer/Manager');

const chai = require('chai');
const expect = chai.expect;

describe('Manager', () => {
  it('should add observers, notify and clear correctly', () => {
    let manager = new Manager();

    let receivedSender = null;
    manager.addListener('test', (sender) => {
      receivedSender = sender;
    });

    expect(receivedSender).to.be.null;
    manager.notify('test', manager);
    expect(receivedSender).to.be.equal(manager);

    receivedSender = null;
    manager.clearListeners('test');
    expect(receivedSender).to.be.null;
    manager.notify('test', manager);
    expect(receivedSender).to.be.null;
  });
});

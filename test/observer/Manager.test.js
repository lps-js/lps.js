const Manager = lpsRequire('observer/Manager');

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

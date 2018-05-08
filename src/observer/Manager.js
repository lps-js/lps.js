function Manager() {
  let _events = {};

  this.addListener = function addListener(event, listener) {
    if (_events[event] === undefined) {
      _events[event] = [];
    }

    _events[event].push(listener);
  };

  this.clearListeners = function clearListeners(event) {
    delete _events[event];
  };

  this.notify = function notify(event, sender) {
    if (_events[event] === undefined) {
      return;
    }

    _events[event].forEach((listener) => {
      listener(sender);
    });
  };
}

module.exports = Manager;

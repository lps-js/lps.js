/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

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
      return Promise.resolve();
    }

    _events[event].forEach((listener) => {
      listener(sender);
    });
    return Promise.resolve();
  };
}

module.exports = Manager;

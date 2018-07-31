module.exports = (engine, program) => {
  engine.define('testPrint', (message) => {
    console.log('testPrint: ' + message.evaluate());
    return [{ theta: {} }];
  });
};

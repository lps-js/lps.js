const LPS = require('./src/LPS');

let engine = new LPS();

engine.addFluents(['lightsOn', 'lightsOff']);
engine.addEvent('switch');
engine.initially(['lightsOff']);

engine.addInitiator('switch', 'lightsOn', /* if */ 'lightsOff');
engine.addTerminator('switch', 'lightsOff', /* if */ 'lightsOff');

engine.addInitiator('switch', 'lightsOff', /* if */ 'lightsOn');
engine.addTerminator('switch', 'lightsOn', /* if */ 'lightsOn');

engine.observe('switch');
engine.step();
engine.step();
engine.observe('switch');
engine.step();
engine.step();
engine.step();
engine.step();
engine.step();
engine.step();
engine.step();
engine.observe('switch');
engine.step();

module.exports = LPS;
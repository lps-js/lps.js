const Program = require('../../parser/Program');
const Value = require('../Value');

const observeLiteral = Program.literal('observe(O, ST, ET)');

function Observation() {

}

Observation.processDeclarations = function processDeclarations(engine, program) {
  let result = program.query(observeLiteral);
  result.forEach((r) => {
    if (r.theta.O === undefined || r.theta.ST === undefined || r.theta.ET === undefined) {
      return;
    }
    let observation = r.theta.O;
    let startTime = r.theta.ST;
    let endTime = r.theta.ET;

    if (!(startTime instanceof Value)) {
      throw new Error('Start time given to observe/3 must be a value.');
    }
    if (!(endTime instanceof Value)) {
      throw new Error('End time given to observe/3 must be a value.');
    }
    let sTime = startTime.evaluate();
    let eTime = endTime.evaluate();
    if (eTime < sTime) {
      throw new Error('Invalid ordering of time given to observe/3: Start time must come before end time.');
    }

    engine.scheduleObservation(observation, sTime, eTime);
  });
};

module.exports = Observation;

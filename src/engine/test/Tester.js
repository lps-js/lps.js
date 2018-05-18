const Parser = require('../../parser/Parser');
const Program = require('../../engine/Program');
const Functor = require('../../engine/Functor');
const Variable = require('../../engine/Variable');
const Value = require('../../engine/Value');

function Tester(engine) {
  let expectations = {};
  let checkAndCreateExpectation = function checkAndCreateExpectation(time) {
    if (expectations[time] === undefined) {
      expectations[time] = [];
    }
  };

  let processTypeOneExpectations = function processTypeOneExpectations(program) {
    let queryResult1 = program.query([new Functor('expect', [new Variable('Type'), new Variable('T'), new Variable('F')])]);

    queryResult1.forEach((r) => {
      if (r.unresolved.length > 0) {
        return;
      }
      let time = r.theta.T.evaluate();
      let type = r.theta.Type.evaluate();
      checkAndCreateExpectation(time);

      expectations[time].push({
        literal: r.theta.F,
        type: type,
        endTime: time + 1
      });
    });
  };

  let processTypeTwoExpectations = function processTypeTwoExpectations(program) {
    let queryResult2 = program.query([new Functor('expect', [new Variable('Type'), new Variable('T1'), new Variable('T2'), new Variable('F')])]);
    queryResult2.forEach((r) => {
      if (r.unresolved.length > 0) {
        return;
      }
      let time1 = r.theta.T1.evaluate();
      let time2 = r.theta.T2.evaluate();
      let type = r.theta.Type.evaluate();

      checkAndCreateExpectation(time1 + 1);

      expectations[time1 + 1].push({
        literal: r.theta.F,
        type: type,
        endTime: time2
      });
    });
  };

  this.test = function test(specFile) {
    expectations = {};
    return Parser.parseFile(specFile)
      .then((specNode) => {
        let program = new Program(specNode);
        processTypeOneExpectations(program);
        processTypeTwoExpectations(program);

        let totalExpectations = 0;
        let passedExpectations = 0;
        let errors = [];

        engine.on('postStep', () => {
          let engineTime = engine.getCurrentTime();
          if (expectations[engineTime] === undefined) {
            return;
          }
          expectations[engineTime].forEach((entry) => {
            let qResult = engine.query(entry.literal, entry.type);
            totalExpectations += 1;
            if (qResult.length > 0) {
              passedExpectations += 1;
            } else {
              errors.push('Expecting ' + entry.literal + ' at time ' + engineTime);
            }
            if (entry.endTime > engineTime + 1) {
              checkAndCreateExpectation(engineTime + 1);
              expectations[engineTime + 1].push(entry);
            }
          });
        });

        engine.run();

        return Promise.resolve({
          success: passedExpectations === totalExpectations,
          passed: passedExpectations,
          total: totalExpectations,
          errors: errors
        });
      });
  };
}

module.exports = Tester;

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

  // expect/3
  // expect(Type, Time, L)
  let processTypeOneExpectations = function processTypeOneExpectations(program) {
    let queryResult = program.query([new Functor('expect', [new Variable('Type'), new Variable('T'), new Variable('F')])]);

    queryResult.forEach((r) => {
      if (r.unresolved.length > 0) {
        return;
      }
      let time = r.theta.T.evaluate();
      let type = r.theta.Type.evaluate();
      checkAndCreateExpectation(time);

      expectations[time].push({
        literal: r.theta.F,
        type: type,
        endTime: time
      });
    });
  };

  // expect/4
  // expect(Type, T1, T2, L)
  let processTypeTwoExpectations = function processTypeTwoExpectations(program) {
    let queryResult = program.query([new Functor('expect', [new Variable('Type'), new Variable('T1'), new Variable('T2'), new Variable('F')])]);
    queryResult.forEach((r) => {
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

  // expect_num_of/3
  // expect_num_of(Type, Time, Num)
  let processTypeThreeExpectations = function processTypeThreeExpectations(program) {
    let queryResult = program.query([new Functor('expect_num_of', [new Variable('Type'), new Variable('T'), new Variable('F')])]);

    queryResult.forEach((r) => {
      if (r.unresolved.length > 0) {
        return;
      }
      let time = r.theta.T.evaluate();
      let type = r.theta.Type.evaluate();
      checkAndCreateExpectation(time);

      expectations[time].push({
        num_of: r.theta.F.evaluate(),
        type: type,
        endTime: time
      });
    });
  };

  // expect_num_of/4
  // expect_num_of(Type, T1, T2, Num)
  let processTypeThreeExpectations = function processTypeThreeExpectations(program) {
    let queryResult = program.query([new Functor('expect_num_of', [new Variable('Type'), new Variable('T1'), new Variable('T2'), new Variable('F')])]);
    queryResult.forEach((r) => {
      if (r.unresolved.length > 0) {
        return;
      }
      let time1 = r.theta.T1.evaluate();
      let time2 = r.theta.T2.evaluate();
      let type = r.theta.Type.evaluate();

      checkAndCreateExpectation(time1 + 1);

      expectations[time1 + 1].push({
        num_of: r.theta.F.evaluate(),
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
        processTypeThreeExpectations(program);

        let totalExpectations = 0;
        let passedExpectations = 0;
        let errors = [];

        engine.on('postStep', () => {
          let engineTime = engine.getCurrentTime();
          if (expectations[engineTime] === undefined) {
            return;
          }
          expectations[engineTime].forEach((entry) => {
            let testResult = false;
            totalExpectations += 1;
            if (entry.literal !== undefined) {
              let qResult = engine.query(entry.literal, entry.type);
              testResult = qResult.length > 0;
            }
            if (entry.num_of !== undefined) {
              switch (entry.type) {
                case 'fluent':
                  testResult = entry.num_of === engine.getNumActiveFluents();
                break;
                case 'action':
                  testResult = entry.num_of === engine.getNumLastStepActions();
                break;
                case 'observation':
                  testResult = entry.num_of === engine.getNumLastStepObservations();
                break;
                default:
                  errors.push('Invalid number of type "' + entry.type + '" encountered.');
              }
            }
            if (testResult) {
              passedExpectations += 1;
            } else {
              errors.push('Expecting ' + entry.literal + ' at time ' + engineTime);
            }
            if (entry.endTime > engineTime) {
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

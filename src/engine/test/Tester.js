const Program = require('../../parser/Program');
const Functor = require('../../engine/Functor');
const Variable = require('../../engine/Variable');
const Value = require('../../engine/Value');

function Tester(engine) {
  let expectations = {};
  let timelessExpectations = [];
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
  let processTypeFourExpectations = function processTypeFourExpectations(program) {
    let queryResult = program.query([new Functor('expect_num_of', [new Variable('Type'), new Variable('T1'), new Variable('T2'), new Variable('F')])]);
    queryResult.forEach((r) => {
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

  // expect/1
  // expect(L)
  let processTypeFiveExpectations = function processTypeFiveExpectations(program) {
    let queryResult = program.query([new Functor('expect', [new Variable('F')])]);
    queryResult.forEach((r) => {
      timelessExpectations.push({
        fact: r.theta.F
      });
    });
  };

  this.test = function test(specFile) {
    expectations = {};
    timelessExpectations = [];
    return Program.fromFile(specFile)
      .then((program) => {
        processTypeOneExpectations(program);
        processTypeTwoExpectations(program);
        processTypeThreeExpectations(program);
        processTypeFourExpectations(program);
        processTypeFiveExpectations(program);

        let totalExpectations = 0;
        let passedExpectations = 0;
        let errors = [];

        // prevent delay as we're testing
        engine.setContinuousExecution(true);

        engine.on('run', () => {
          timelessExpectations.forEach((entry) => {
            let testResult = false;
            totalExpectations += 1;
            if (entry.fact !== undefined) {
              let qResult = engine.query(entry.fact);
              testResult = qResult.length > 0;
              if (!testResult) {
                errors.push('Expecting ' + entry.fact + ' to hold.');
              }
            }
            if (testResult) {
              passedExpectations += 1;
            }
          });
        });

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
              if (!testResult) {
                errors.push('Expecting ' + entry.literal + ' at time ' + engineTime);
              }
            }
            if (entry.num_of !== undefined) {
              let test_number = 0;
              switch (entry.type) {
                case 'fluent':
                  test_number = engine.getNumActiveFluents();
                  break;
                case 'action':
                  test_number = engine.getNumLastStepActions();
                  break;
                case 'observation':
                  test_number = engine.getNumLastStepObservations();
                  break;
                default:
                  errors.push('Invalid number of type "' + entry.type + '" encountered.');
              }
              testResult = entry.num_of === test_number;
              if (!testResult) {
                errors.push('Expecting number of ' + entry.type + ' at time ' + engineTime + ' to be ' + entry.num_of + ', program has ' + test_number);
              }
            }
            if (testResult) {
              passedExpectations += 1;
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

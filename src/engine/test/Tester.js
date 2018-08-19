/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Program = lpsRequire('parser/Program');
const Value = lpsRequire('engine/Value');
const Functor = lpsRequire('engine/Functor');
const Variable = lpsRequire('engine/Variable');
const BuiltinLoader = lpsRequire('engine/builtin/BuiltinLoader');
const ObserveDeclarationProcessor = lpsRequire('engine/builtin/Observe');
const coreModule = lpsRequire('engine/modules/core');

const numComparatorProcessor = function numComparatorProcessor(actual, expectedArg) {
  let expected = expectedArg;
  if (expected instanceof Value) {
    // by default, we wrap value as equality
    expected = new Functor('eq', [expected]);
  }

  if (!(expected instanceof Functor) || expected.getArgumentCount() < 1) {
    throw new Error('Invalid value given for comparator ' + expected);
  }

  switch (expected.getId()) {
    case 'eq/1':
    case 'equal/1':
      return actual === expected.getArguments()[0].evaluate();
    case 'not_eq/1':
    case 'notequal/1':
    case 'not_equal/1':
      return actual !== expected.getArguments()[0].evaluate();
    case 'atleast/1':
    case 'at_least/1':
    case 'min/1':
      return actual >= expected.getArguments()[0].evaluate();
    case 'atmost/1':
    case 'at_most/1':
    case 'max/1':
      return actual <= expected.getArguments()[0].evaluate();
    case 'between/2':
      return expected.getArguments()[0].evaluate() <= actual
        && actual <= expected.getArguments()[1].evaluate();
    default:
      throw new Error('Unknown comparator given ' + expected);
  }
};

function Tester(engine) {
  let expectations = {};
  let timelessExpectations = [];
  let numCyclesExpectations = [];

  let checkAndCreateExpectation = function checkAndCreateExpectation(time) {
    if (expectations[time] === undefined) {
      expectations[time] = [];
    }
  };

  // expect/3
  // expect(Type, Time, L)
  let processTypeOneExpectations = function processTypeOneExpectations(program) {
    let queryResult = program.query(Program.literal('expect(Type, T, F)'));

    queryResult.forEach((r) => {
      let type = r.theta.Type.evaluate();
      let time = r.theta.T.evaluate();
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
    let queryResult = program.query(Program.literal('expect(Type, T1, T2, F)'));
    queryResult.forEach((r) => {
      let time1 = r.theta.T1.evaluate();
      let time2;
      if (r.theta.T2 === undefined || r.theta.T2 instanceof Variable) {
        time2 = null;
      } else {
        time2 = r.theta.T2.evaluate();
      }
      let type = r.theta.Type.evaluate();

      if (time2 !== null && time1 > time2) {
        throw new Error('The start time must not be more than the end time specified in expect/4');
      }

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
    let queryResult = program.query(Program.literal('expect_num_of(Type, T, Num)'));

    queryResult.forEach((r) => {
      let time = r.theta.T.evaluate();
      let type = r.theta.Type.evaluate();
      checkAndCreateExpectation(time);

      expectations[time].push({
        num_of: r.theta.Num,
        type: type,
        endTime: time
      });
    });
  };

  // expect_num_of/4
  // expect_num_of(Type, T1, T2, Num)
  let processTypeFourExpectations = function processTypeFourExpectations(program) {
    let queryResult = program.query(Program.literal('expect_num_of(Type, T1, T2, Num)'));
    queryResult.forEach((r) => {
      let time1 = r.theta.T1.evaluate();
      let time2;
      if (r.theta.T2 === undefined || r.theta.T2 instanceof Variable) {
        time2 = null;
      } else {
        time2 = r.theta.T2.evaluate();
      }
      let type = r.theta.Type.evaluate();

      if (time2 !== null && time1 > time2) {
        throw new Error('The start time must not be more than the end time specified in expect/4');
      }

      checkAndCreateExpectation(time1 + 1);

      expectations[time1 + 1].push({
        num_of: r.theta.Num,
        type: type,
        endTime: time2
      });
    });
  };

  // expect/1
  // expect(L)
  let processTypeFiveExpectations = function processTypeFiveExpectations(program) {
    let queryResult = program.query(Program.literal('expect(L)'));
    queryResult.forEach((r) => {
      timelessExpectations.push({
        fact: r.theta.L
      });
    });
  };

  // expect_num_cycles/1
  // expect_num_cycles(L)
  let processTypeSixExpectations = function processTypeSixExpectations(program) {
    let queryResult = program.query(Program.literal('expect_num_cycles(N)'));
    queryResult.forEach((r) => {
      let expectation = r.theta.N;
      numCyclesExpectations.push(expectation);
    });
  };

  this.test = function test(specFile) {
    expectations = {};
    timelessExpectations = [];
    let program;
    return Program.fromFile(specFile)
      .then((p) => {
        program = p;
        coreModule(engine, program);

        return BuiltinLoader.load(engine, program);
      })
      .then(() => {
        ObserveDeclarationProcessor.processDeclarations(engine, program);
        processTypeOneExpectations(program);
        processTypeTwoExpectations(program);
        processTypeThreeExpectations(program);
        processTypeFourExpectations(program);
        processTypeFiveExpectations(program);
        processTypeSixExpectations(program);

        let totalExpectations = 0;
        let passedExpectations = 0;
        let errors = [];

        let engineMaxTime = engine.getMaxTime();

        // prevent delay as we're testing
        engine.setContinuousExecution(true);

        engine.on('run', () => {
          // process timeless expectations
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

        engine.on('postCycle', () => {
          // process expectations after each cycle
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
                errors.push('Expecting ' + entry.type + ' "' + entry.literal + '" at time ' + engineTime);
              }
            }
            if (entry.num_of !== undefined) {
              let testNumber = 0;
              switch (entry.type) {
                case 'fluent':
                  testNumber = engine.getNumActiveFluents();
                  break;
                case 'action':
                  testNumber = engine.getNumLastCycleActions();
                  break;
                case 'observation':
                  testNumber = engine.getNumLastCycleObservations();
                  break;
                default:
                  errors.push('Invalid number of type "' + entry.type + '" encountered.');
              }
              testResult = numComparatorProcessor(testNumber, entry.num_of);
              if (!testResult) {
                errors.push('Expecting number of ' + entry.type + ' at time ' + engineTime + ' to be ' + entry.num_of + ', program has ' + testNumber);
              }
            }
            if (testResult) {
              passedExpectations += 1;
            }
            if (entry.endTime === null || entry.endTime > engineTime) {
              if (entry.endTime === null && engineTime + 1 > engineMaxTime) {
                return;
              }
              checkAndCreateExpectation(engineTime + 1);
              expectations[engineTime + 1].push(entry);
            }
          });
          delete expectations[engineTime];
        });

        return new Promise((resolve) => {
          // only resolve promise when execution is done
          engine.on('done', () => {
            const nonExecutedExpectations = Object.keys(expectations);
            if (nonExecutedExpectations.length > 0) {
              totalExpectations += 1;
              errors.push(nonExecutedExpectations.length + ' expectation cycles not executed');
              nonExecutedExpectations.forEach((key) => {
                errors.push('Expectations for cycle ' + key + ' were not executed');
              });
            }

            let lastCycleTime = engine.getCurrentTime();
            numCyclesExpectations.forEach((expectation) => {
              totalExpectations += 1;
              if (numComparatorProcessor(lastCycleTime, expectation)) {
                passedExpectations += 1;
              } else {
                errors.push('Expecting number of cycles executed to be '
                  + expectation
                  + ', program executed '
                  + lastCycleTime
                  + ' cycles');
              }
            });

            resolve({
              success: passedExpectations === totalExpectations,
              passed: passedExpectations,
              total: totalExpectations,
              errors: errors
            });
          });

          // start engine now
          engine.run();
        });
      });
  };
}

module.exports = Tester;

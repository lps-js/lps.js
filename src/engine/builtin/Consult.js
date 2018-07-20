const Program = require('../../parser/Program');
const LiteralTreeMap = require('../LiteralTreeMap');
const Value = require('../Value');
const Clause = require('../Clause');

const consultLiteral1 = Program.literal('consult(File)');
const consultLiteral2 = Program.literal('consult(File, Id)');
const processIdLiteral = Program.literal('processId(Id)');

function Consult(targetProgram) {
  this.consultFile = function consultFile(file) {
    return Program.fromFile(file)
      .then((loadedProgram) => {
        targetProgram.augment(loadedProgram);
        return Promise.resolve(loadedProgram);
      });
  };

  let createReplacementFunc = function createReplacementFunc(set, treeMap) {
    return (statement) => {
      let bodyLiterals = statement.getBodyLiterals();
      bodyLiterals.forEach((conjunct, idx) => {
        let unifications = treeMap.unifies(conjunct);
        if (unifications.length === 0) {
          return;
        }

        let bodyLiteralsClone = bodyLiterals.concat([]);
        bodyLiteralsClone.splice(idx, 1);
        let newStatement = new Clause(statement.getHeadLiterals(), bodyLiteralsClone);
        unifications.forEach((u) => {
          set.push(newStatement.substitute(u.theta));
        });
      });
    }
  }

  let processProgramWithId = function processProgramWithId(program, id) {
    let treeMap = new LiteralTreeMap();
    let theta = {
      Id: new Value(id)
    };
    treeMap.add(processIdLiteral.substitute(theta));

    let rules = program.getRules();
    let newRules = [];
    rules.forEach(createReplacementFunc(newRules, treeMap));
    program.updateRules(newRules);

    let clauses = program.getClauses();
    let newClauses = [];
    clauses.forEach(createReplacementFunc(newClauses, treeMap));
    program.setClauses(newClauses);
  };

  this.consultFileWithId = function consultFileWithId(file, id) {
    return Program.fromFile(file)
      .then((loadedProgram) => {
        processProgramWithId(loadedProgram, id);
        targetProgram.augment(loadedProgram);
        return Promise.resolve(loadedProgram);
      });
  };

  let processConsultDeclarations = function processConsultDeclarations(currentProgram) {
    let promises = [];
    let result = [];
    result = result.concat(currentProgram.query(consultLiteral1));
    result = result.concat(currentProgram.query(consultLiteral2));
    result.forEach((r) => {
      if (r.theta.File === undefined || !(r.theta.File instanceof Value)) {
        return;
      }
      let promise;
      if (r.theta.Id === undefined || !(r.theta.Id instanceof Value)) {
        promise = this.consultFile(r.theta.File.evaluate());
      } else {
        promise = this.consultFileWithId(r.theta.File.evaluate(), r.theta.Id.evaluate());
      }

      promise
        .then((loadedProgram) => {
          // recursively process consult declarations in loaded targetProgram
          return processConsultDeclarations.call(this, loadedProgram);
        });
      promises.push(promise);
    });
    return Promise.all(promises);
  };

  this.process = function process() {
    return processConsultDeclarations.call(this, targetProgram);
  };
}

Consult.processDeclarations = function processDeclarations(program) {
  let consult = new Consult(program);
  return consult.process();
};

module.exports = Consult;

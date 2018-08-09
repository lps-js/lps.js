const Program = lpsRequire('parser/Program');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Value = lpsRequire('engine/Value');
const Clause = lpsRequire('engine/Clause');
const List = lpsRequire('engine/List');
const path = require('path');

const consultLiteral1 = Program.literal('consult(File)');
const consultLiteral2 = Program.literal('consult(File, Id)');
const processIdLiteral = Program.literal('processId(Id)');

const loadModuleLiteral = Program.literal('loadModule(Module)');

const builtinModulePath = path.join(__dirname, '../modules');
const builtinModules = [
  'fs',
  'p2p'
];

function Consult(engine, targetProgram) {
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
    };
  };

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

    let newClauses = [];
    program
      .getClauses()
      .forEach(createReplacementFunc(newClauses, treeMap));
    program.setClauses(newClauses);
  };

  this.consultFile = function consultFile(file, id) {
    return Program.fromFile(file)
      .then((loadedProgram) => {
        if (id !== undefined) {
          processProgramWithId(loadedProgram, id);
        }
        targetProgram.augment(loadedProgram);
        return Promise.resolve(loadedProgram);
      });
  };

  let processConsultDeclarations = function processConsultDeclarations(
    currentProgram,
    workingDirectoryArg
  ) {
    let workingDirectory = workingDirectoryArg;
    if (workingDirectory === undefined) {
      workingDirectory = '';
    }
    let promises = [];
    let result = [];
    result = result.concat(currentProgram.query(consultLiteral1));
    result = result.concat(currentProgram.query(consultLiteral2));

    let handleEntry = (theta) => {
      if (!(theta.File instanceof Value)) {
        return Promise.reject();
      }
      let promise;
      let filepath = theta.File.evaluate();
      if (!path.isAbsolute(filepath) && workingDirectory !== '') {
        // work path from the current working directory given
        filepath = path.resolve(workingDirectory, filepath);
      }
      if (theta.Id === undefined || !(theta.Id instanceof Value)) {
        promise = this.consultFile(filepath);
      } else {
        promise = this.consultFile(filepath, theta.Id.evaluate());
      }

      promise.then((loadedProgram) => {
        // recursively process consult declarations in loaded targetProgram
        // also pass in the working directory from this loaded file
        return processConsultDeclarations
          .call(this, loadedProgram, path.dirname(filepath));
      });
      return promise;
    };

    result.forEach((r) => {
      if (r.theta.File === undefined) {
        return;
      }
      if (r.theta.File instanceof List) {
        let files = r.theta.File.flatten();
        files.forEach((file) => {
          let theta = {};
          theta.File = new Value(file);
          theta.Id = r.theta.Id;
          promises.push(handleEntry(theta));
        });
        return;
      }
      promises.push(handleEntry(r.theta));
    });

    let moduleResult = currentProgram.query(loadModuleLiteral);
    moduleResult.forEach((r) => {
      if (r.theta.Module === undefined) {
        return;
      }
      let moduleArg = r.theta.Module.evaluate();
      let builtinIndex = builtinModules.indexOf(moduleArg);

      if (builtinIndex !== -1) {
        let moduleName = builtinModules[builtinIndex];
        let module = require(path.join(builtinModulePath, moduleName));
        module(engine, targetProgram);
        return;
      }
      let pathname = path.resolve(workingDirectory, moduleArg);
      let module = require(pathname);
      module(engine, targetProgram);
    });

    return Promise.all(promises);
  };

  this.process = function process(workingDirectory) {
    return processConsultDeclarations
      .call(this, targetProgram, workingDirectory);
  };
}

Consult.processDeclarations = function processDeclarations(
  engine,
  program,
  workingDirectory
) {
  let consult = new Consult(engine, program);
  return consult.process(workingDirectory);
};

module.exports = Consult;

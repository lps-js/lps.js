/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../lpsRequire');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Value = lpsRequire('engine/Value');
const Clause = lpsRequire('engine/Clause');
const List = lpsRequire('engine/List');
const Functor = lpsRequire('engine/Functor');
const path = require('path');

/**
 * The consult/1 definition
 * @type {Functor}
 */
const consultLiteral1 = ProgramFactory.literal('consult(File)');

/**
 * The consult/2 definition
 * @type {Functor}
 */
const consultLiteral2 = ProgramFactory.literal('consult(File, Id)');

/**
 * The processId/1 definition
 * @type {Functor}
 */
const processIdLiteral = ProgramFactory.literal('processId(Id)');

/**
 * The loadModule/1 definition
 * @type {Functor}
 */
const loadModuleLiteral = ProgramFactory.literal('loadModule(Module)');

// path to the built-in modules
const builtinModulePath = 'engine/modules';
// set of built-in modules
const builtinModules = [
  'fs',
  'p2p'
];

const processLoadModules = function processLoadModules(
  currentProgram,
  targetProgram,
  engine,
  workingDirectory
) {
  let moduleResult = currentProgram.query(loadModuleLiteral, engine);
  moduleResult.forEach((r) => {
    if (r.theta.Module === undefined) {
      return;
    }
    let moduleArg = r.theta.Module.evaluate();
    let builtinIndex = builtinModules.indexOf(moduleArg);

    if (builtinIndex !== -1) {
      let moduleName = builtinModules[builtinIndex];
      let module = lpsRequire(`${builtinModulePath}/${moduleName}`);
      module(engine, targetProgram);
      return;
    }
    let pathname = path.resolve(workingDirectory, moduleArg);
    let module = require(pathname);
    module(engine, targetProgram);
  });
};

const handleConsultEntry = function handleConsultEntry(
  theta,
  workingDirectory,
  consultFile,
  processConsultDeclarations
) {
  if (!(theta.File instanceof Functor && theta.File.getArgumentCount() === 0)
      && !(theta.File instanceof Value)) {
    return Promise.reject(new Error('Consult file not value: ' + theta.File));
  }
  let promise;
  let filepath = theta.File.evaluate();
  if (!path.isAbsolute(filepath) && workingDirectory !== '') {
    // work path from the current working directory given
    filepath = path.resolve(workingDirectory, filepath);
  }

  if (theta.Id === undefined
      || !(theta.Id instanceof Functor
      || theta.Id instanceof Value)) {
    promise = consultFile(filepath);
  } else {
    promise = consultFile(filepath, theta.Id);
  }

  return promise
    .then((loadedProgram) => {
      // recursively process consult declarations in loaded targetProgram
      // also pass in the working directory from this loaded file
      return processConsultDeclarations(loadedProgram, path.dirname(filepath));
    });
};

function consultProcessor(engine, targetProgram) {
  let createReplacementFunc = function createReplacementFunc(set, treeMap) {
    return (statement) => {
      let bodyLiterals = statement.getBodyLiterals();
      bodyLiterals.forEach((conjunct, idx) => {
        let unifications = treeMap.unifies(conjunct);
        if (unifications.length === 0) {
          return;
        }

        let bodyLiteralsClone = bodyLiterals.concat();
        bodyLiteralsClone.splice(idx, 1);
        let newStatement = new Clause(statement.getHeadLiterals(), bodyLiteralsClone);
        unifications.forEach((u) => {
          set.push(newStatement.substitute(u.theta));
        });
      });
    };
  };

  const processProgramWithId = function processProgramWithId(program, id) {
    let treeMap = new LiteralTreeMap();
    let theta = {
      Id: id
    };
    treeMap.add(processIdLiteral.substitute(theta));

    let rules = program.getRules();
    let newRules = [];
    rules.forEach(createReplacementFunc(newRules, treeMap));
    program.setRules(newRules);

    let newClauses = [];
    program
      .getClauses()
      .forEach(createReplacementFunc(newClauses, treeMap));
    program.setClauses(newClauses);

    let newConstraints = [];
    program
      .getConstraints()
      .forEach(createReplacementFunc(newConstraints, treeMap));
    program.setConstraints(newConstraints);
  };

  const consultFile = function consultFile(file, id) {
    // we removed caching because of sometimes augmented files are updated
    // but we still load the cached version
    return ProgramFactory.fromFile(file)
      .then((loadedProgram) => {
        // cache loaded program
        if (id !== undefined) {
          processProgramWithId(loadedProgram, id);
        }
        targetProgram.augment(loadedProgram);
        return Promise.resolve(loadedProgram);
      });
  };

  const processConsultDeclarations = function processConsultDeclarations(
    currentProgram,
    workingDirectory
  ) {
    let promises = [];
    let result = [];
    result = result.concat(currentProgram.query(consultLiteral1, engine));
    result = result.concat(currentProgram.query(consultLiteral2, engine));

    result.forEach((r) => {
      if (r.theta.File === undefined) {
        return;
      }
      if (r.theta.File instanceof List) {
        let files = r.theta.File.flatten();
        files.forEach((file) => {
          let theta = {};
          theta.File = new Functor(file, []);
          theta.Id = r.theta.Id;
          promises.push(handleConsultEntry(
            theta,
            workingDirectory,
            consultFile,
            processConsultDeclarations
          ));
        });
        return;
      }
      promises.push(handleConsultEntry(
        r.theta,
        workingDirectory,
        consultFile,
        processConsultDeclarations
      ));
    });

    processLoadModules(currentProgram, targetProgram, engine, workingDirectory);
    return Promise.all(promises);
  };

  return processConsultDeclarations(targetProgram, targetProgram.getWorkingDirectory());
}

module.exports = consultProcessor;

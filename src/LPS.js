/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const path = require('path');

const lpsRequire = require('./lpsRequire');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const Engine = lpsRequire('engine/Engine');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const Functor = lpsRequire('engine/Functor');
const Tester = lpsRequire('engine/tester/Tester');
const List = lpsRequire('engine/List');
const Program = lpsRequire('engine/Program');
const stringLiterals = lpsRequire('utility/strings');

const programArgsPredicate = ProgramFactory.literal('lpsArgs(List)');

/**
 * The LPS type
 * @constructor
 */
function LPS() {

}

/**
 * Parse a string of a single literal into its appropriate type for lps.js
 * @param  {string} str The literal in string representation
 * @return {Functor}    Returns the functor representation
 */
LPS.literal = function literal(str) {
  return ProgramFactory.literal(str);
};

/**
 * Parse a string of literal conjunction into its appropriate type for lps.js
 * @param  {string} str The conjunction in string representation
 * @return {Array<Functor>}    Returns the array of functors.
 */
LPS.literalSet = function literalSet(str) {
  return ProgramFactory.literalSet(str);
};

/**
 * Construct the program arguments predicate
 * @private
 * @param  {array} programArgs The array of program arguments
 * @return {Functor}             The constructed predicate that contains the program arguments
 */
const buildProgramArgsPredicate = function (programArgs) {
  let _programArgs = programArgs;
  if (programArgs === undefined) {
    _programArgs = [];
  }
  // map to values
  _programArgs = _programArgs.map(arg => new Value(arg));
  let argsList = new List(_programArgs);
  let theta = {
    List: argsList
  };
  return programArgsPredicate.substitute(theta);
};

/**
 * Create a function to update a given program with the given program arguments
 * @param  {array} programArgs Array of program arguments
 * @return {[type]}             [description]
 */
const createProgramArgsUpdaterFunc = function createProgramArgsUpdaterFunc(programArgs) {
  return (program) => {
    let programArgsFact = buildProgramArgsPredicate(programArgs);
    program.getFacts().add(programArgsFact);
    return Promise.resolve(program);
  };
};

/**
 * Create an Engine instance from a string representation of a LPS program without initialisation.
 * @param  {string} source      The LPS program source code
 * @param  {array} programArgs  Optional, the array of program arguments to pass to the LPS program.
 *                              Defaults to an empty list
 * @return {Promise}            Returns a promise that when fulfilled, provides the Engine instance
 *                              that was created.
 */
LPS.createFromString = function createFromString(source, programArgs) {
  return ProgramFactory.fromString(source)
    .then(createProgramArgsUpdaterFunc(programArgs))
    .then((program) => {
      let engine = new Engine(program);
      return Promise.resolve(engine);
    });
};

/**
 * Create and initialise an Engine instance from a string representation of a LPS program
 * @param  {string} source      The LPS program source code
 * @param  {array} programArgs  Optional, the array of program arguments to pass to the LPS program.
 *                              Defaults to an empty list
 * @return {Promise}            Returns a promise that when fulfilled, provides the Engine instance
 *                              that was created.
 */
LPS.loadString = function loadString(source, programArgs) {
  return LPS.createFromString(source, programArgs)
    .then((engine) => {
      return engine.load();
    });
};

/**
 * Create an Engine instance from a LPS program file without initialisation.
 * @param  {string} fileArg     Pathname to the LPS program file on the file system.
 * @param  {array} programArgs  Optional, the array of program arguments to pass to the LPS program.
 *                              Defaults to an empty list
 * @return {Promise}            Returns a promise that when fulfilled, provides the Engine instance
 *                              that was created.
 */
LPS.createFromFile = function createFromFile(fileArg, programArgs) {
  if (process.browser) {
    return Promise.reject(new Error(stringLiterals('browserContext.loadProgramFromFile')));
  }
  let file = fileArg;
  file = path.resolve(file);

  return ProgramFactory.fromFile(file)
    .then(createProgramArgsUpdaterFunc(programArgs))
    .then((program) => {
      program.setWorkingDirectory(path.dirname(file));
      let engine = new Engine(program);
      return Promise.resolve(engine);
    });
};

/**
 * Create and initialise an Engine instance from a LPS program file.
 * @param  {string} fileArg     Pathname to the LPS program file on the file system.
 * @param  {array} programArgs  Optional, the array of program arguments to pass to the LPS program.
 *                              Defaults to an empty list
 * @return {Promise}            Returns a promise that when fulfilled, provides the Engine instance
 *                              that was created.
 */
LPS.loadFile = function loadFile(fileArg, programArgs) {
  return LPS.createFromFile(fileArg, programArgs)
    .then((engine) => {
      return engine.load();
    });
};

/**
 * The lps.js Value type
 * @type {Value}
 */
LPS.Value = Value;

/**
 * The lps.js Variable type
 * @type {Variable}
 */
LPS.Variable = Variable;

/**
 * The lps.js List type
 * @type {List}
 */
LPS.List = List;

/**
 * The lps.js Functor type
 * @type {Functor}
 */
LPS.Functor = Functor;

/**
 * The Tester class for access to testing API
 * @type {Tester}
 */
LPS.Tester = Tester;

/**
 * The lps.js Program data structure
 * @type {Program}
 */
LPS.Program = Program;

/**
 * The lps.js ProgramFactory API
 * @type {ProgramFactory}
 */
LPS.ProgramFactory = ProgramFactory;

module.exports = LPS;

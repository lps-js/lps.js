const FunctorProvider = require('./FunctorProvider');
const Functor = require('./Functor');
const List = require('./List');
const Clause = require('./Clause');
const LiteralTreeMap = require('./LiteralTreeMap');
const Resolutor = require('./Resolutor');
const Program = require('../parser/Program');
const Unifier = require('./Unifier');
const Value = require('./Value');
const Variable = require('./Variable');
const processRules = require('../utility/processRules');
const compactTheta = require('../utility/compactTheta');
const EventManager = require('../observer/Manager');
const expandRuleAntecedent = require('../utility/expandRuleAntecedent');
const variableArrayRename = require('../utility/variableArrayRename');
const constraintCheck = require('../utility/constraintCheck');
const Tester = require('./test/Tester');
const forEachPromise = require('../utility/forEachPromise');

function Engine(program) {
  let _maxTime = 20;
  let _cycleInterval = 100; // milliseconds
  let _isContinuousExecution = false;
  let _isInCycle = false;

  let _loadingPromises = [];

  let _engineEventManager = new EventManager();

  let _observations = {};

  let _goals = [];

  let _possibleActions = new LiteralTreeMap();
  let _currentTime = 0;

  let _lastCycleExecutionTime = null;
  let _lastStepActions = null;
  let _lastStepObservations = null;

  let fluentSyntacticSugarProcessing = function fluentSyntacticSugarProcessing(literalArg, timingVariableArg) {
    let literal = literalArg;
    let timingVariable = timingVariableArg;
    if (timingVariable === undefined) {
      timingVariable = new Variable('$T');
    }
    if (literal instanceof Value) {
      literal = new Functor(literal.evaluate(), []);
    }
    if (!(literal instanceof Functor)) {
      throw new Error('Unexpected value "' + literal.toString() + '" provided for a literal.');
    }
    literal = new Functor(literal.getName(), literal.getArguments().concat([timingVariable]));
    return literal;
  };

  let actionSyntacticSugarProcessing = function actionSyntacticSugarProcessing(literalArg) {
    let literal = literalArg;
    let timingVariable1 = new Variable('$T1');
    let timingVariable2 = new Variable('$T2');
    let additionalArguments = [
      timingVariable1,
      timingVariable2
    ];
    if (literal instanceof Value) {
      literal = new Functor(literal.evaluate(), []);
    }
    if (!(literal instanceof Functor)) {
      throw new Error('Unexpected value "' + literal.toString() + '" provided for an event literal.');
    }
    literal = new Functor(literal.getName(), literal.getArguments().concat(additionalArguments));
    return literal;
  };

  let updateTimableFunctor = function updateTimableFunctor(literal, time) {
    if (!(literal instanceof Functor) || literal.getArguments() === 0) {
      throw new Error('Invalid timable functor provided');
    }
    let args = literal.getArguments();
    args[args.length - 1] = new Value(time);
    return new Functor(literal.getName(), args);
  };

  let processMaxTimeDeclarations = function processMaxTimeDeclarations() {
    let result = program.query(Program.literal('maxTime(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined || !(r.theta.X instanceof Value)) {
        return;
      }
      _maxTime = r.theta.X.evaluate();
    });
  };

  let processCycleIntervalDeclarations = function processCycleIntervalDeclarations() {
    let result = program.query(Program.literal('cycleInterval(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined || !(r.theta.X instanceof Value)) {
        return;
      }
      _cycleInterval = r.theta.X.evaluate();
    });
  };

  let processContinuousExecutionDeclarations = function processContinuousExecutionDeclarations() {
    let result = program.query(Program.literal('continuousExecution(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined || !(r.theta.X instanceof Value)) {
        return;
      }
      let value = r.theta.X.evaluate();
      _isContinuousExecution = (value === 'yes' || value === 'on' || value === 'true' || value === 1);
    });
  };

  let processFluentDeclarations = function processFluentDeclarations() {
    let result = program.query(Program.literal('fluent(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let fluent = fluentSyntacticSugarProcessing(r.theta.X);
      program.defineFluent(fluent);
    });
  };

  let processActionDeclarations = function processActionDeclarations() {
    let result = program.query(Program.literal('action(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let literal = actionSyntacticSugarProcessing(r.theta.X);
      program.defineAction(literal);
      _possibleActions.add(literal);
    });
  };

  let processEventDeclarations = function processEventDeclarations() {
    let result = program.query(Program.literal('event(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let literal = actionSyntacticSugarProcessing(r.theta.X);
      program.defineEvent(literal);
    });
  };

  let processInitialFluentDeclarations = function processInitialFluentDeclarations() {
    let result = program.query(Program.literal('initially(F)'));
    let processInitialFluent = (valueArg) => {
      let value = valueArg;
      if (value instanceof Value) {
        let name = value.evaluate();
        if (!program.isFluent(name + '/1')) {
          // invalid fluent
          throw new Error('Invalid fluent "' + name + '/1" given in initially declaration');
          return;
        }
        program
          .getState()
          .add(new Functor(name, [new Value(0)]));
        return;
      }
      if (!(value instanceof Functor)) {
        // invalid in initially
        return;
      }
      let initialFluent = new Functor(value.getName(), value.getArguments().concat([new Value(0)]));
      if (!program.isFluent(initialFluent)) {
        // invalid fluent
        return;
      }
      program
        .getState()
        .add(initialFluent);
    };
    result.forEach((r) => {
      if (r.theta.F === undefined) {
        return;
      }
      let value = r.theta.F;
      if (value instanceof List) {
        let list = value.flatten();
        list.forEach((v) => {
          processInitialFluent(v);
        });
        return;
      }
      processInitialFluent(value);
    });
  };

  let processObservationDeclarations = function processObservationDeclarations() {
    let result = program.query(Program.literal('observe(O, ST, ET)'));
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
      try {
        observation = actionSyntacticSugarProcessing(observation);
      } catch (_) {
        throw new Error('Invalid action value given for observe/3');
      }

      if (_observations[sTime] === undefined) {
        _observations[sTime] = [];
      }

      _observations[sTime].push({
        action: observation,
        endTime: eTime
      });
    });
  };

  let preProcessRules = function preProcessRules() {
    let newRules = [];
    let rules = program.getRules();

    rules.forEach((rule) => {
      if (rule.getBodyLiteralsCount() === 0) {
        newRules.push(rule);
        return;
      }
      let antecedent = rule.getBodyLiterals();
      let ruleResult = [];
      expandRuleAntecedent(ruleResult, antecedent, [], program);
      if (ruleResult.length === 0) {
        // nothing to do for this rule
        newRules.push(rule);
        return;
      }
      let consequent = rule.getHeadLiterals();

      let antecedentVariables = {};
      antecedent.forEach((literal) => {
        literal.getVariables().forEach((vName) => {
          antecedentVariables[vName] = true;
        });
      });

      let commonVariables = {};
      let consequentVariables = {};
      consequent.forEach((literal) => {
        literal.getVariables().forEach((vName) => {
          if (antecedentVariables[vName]) {
            commonVariables[vName] = true;
          }
          consequentVariables[vName] = true;
        });
      });

      ruleResult.forEach((tuple) => {
        let newAntecedentVariables = {};
        tuple.literalSet.forEach((literal) => {
          literal.getVariables().forEach((vName) => {
            newAntecedentVariables[vName] = true;
          });
        });

        let renameSet = [];
        Object.keys(newAntecedentVariables).forEach((vName) => {
          if (consequentVariables[vName] !== undefined && commonVariables[vName] === undefined) {
            renameSet.push(vName);
          }
        });

        let tupleConsequent = consequent.concat([]);
        let replacement = {};
        Object.keys(commonVariables).forEach((k) => {
          replacement[k] = new Variable(k);
        });
        tuple.thetaPath.forEach((theta) => {
          Object.keys(replacement).forEach((k) => {
            if (replacement[k] instanceof Variable) {
              let vName = replacement[k].evaluate();
              if (theta[vName] !== undefined) {
                replacement[k] = theta[vName];
              } else if (replacement[vName] !== undefined) {
                replacement[k] = replacement[vName];
              }
            }
          });
        });
        let renameTheta = variableArrayRename(renameSet);
        tupleConsequent = tupleConsequent.map(literal => literal.substitute(replacement).substitute(renameTheta));
        newRules.push(new Clause(tupleConsequent, tuple.literalSet));
      });
    });
    program.updateRules(newRules);
  };

  let processObservations = function processObservations(state) {
    let observationTerminated = [];
    let observationInitiated = [];
    let activeObservations = [];

    if (_observations[_currentTime] === undefined) {
      // no observations for current time
      return [];
    }

    // process observations
    let theta = { $T1: new Value(_currentTime), $T2: new Value(_currentTime + 1) };
    let nextTime = _currentTime + 1;
    _observations[_currentTime].forEach((ob) => {
      let action = ob.action.substitute(theta);
      activeObservations.push(action);

      if (ob.endTime > nextTime) {
        if (_observations[nextTime] === undefined) {
          _observations[nextTime] = [];
        }
        _observations[nextTime].push(ob);
      }
    });

    return activeObservations;
  };

  const fluentActorDeclarationLiteral = Program.literal('fluentActorDeclare(T, A, Old, New)');
  let updateStateWithFluentActors = function updateStateWithFluentActors(actions, state) {
    let functorProvider = program.getFunctorProvider();
    let newState = new LiteralTreeMap();
    state
      .forEach((literal) => {
        newState.add(literal);
      });
    let fluentActors = [];

    // query has to be done on the spot as some of the declarations
    // may be intensional instead of static
    let result = program.query(fluentActorDeclarationLiteral);

    result.forEach((r) => {
      let type = r.theta.T;
      let action = r.theta.A;
      let oldFluent = r.theta.Old;
      let newFluent = r.theta.New;
      action = actionSyntacticSugarProcessing(action);
      if (type === undefined
          || action === undefined
          || !(action instanceof Functor)
          || newFluent === undefined
          || oldFluent === undefined) {
        return;
      }
      type = type.evaluate();

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent updating actor, the action must have the last argument as the time variable.');
      }

      let terminatingFluent;
      let initiatingFluent;
      switch(type) {
        case 'update':
          terminatingFluent = fluentSyntacticSugarProcessing(oldFluent, lastArgument);
          initiatingFluent = fluentSyntacticSugarProcessing(newFluent, lastArgument);
          fluentActors.push({
            action: action,
            initiate: initiatingFluent,
            terminate: terminatingFluent
          });
          break;
        case 'initiate':
          initiatingFluent = fluentSyntacticSugarProcessing(newFluent, lastArgument);
          fluentActors.push({
            action: action,
            initiate: initiatingFluent
          });
          break;
        case 'terminate':
          terminatingFluent = fluentSyntacticSugarProcessing(oldFluent, lastArgument);
          fluentActors.push({
            action: action,
            terminate: terminatingFluent
          });
          break;
      }
    });

    fluentActors.forEach((actor) => {
      let thetaSets = actions.unifies(actor.action);
      thetaSets.forEach((node) => {
        let initiateThetaSet = [node.theta];

        // start processing terminate.
        // when terminating, we also take note of the appropriate theta sets
        // in case we are performing an update
        if (actor.terminate) {
          let terminatedGroundFluent = actor.terminate.substitute(node.theta);
          let stateThetaSet = newState.unifies(terminatedGroundFluent);
          initiateThetaSet = [];
          stateThetaSet.forEach((terminatedNode) => {
            let currentTheta = compactTheta(node.theta, terminatedNode.theta);
            initiateThetaSet.push(currentTheta);
            let terminatedFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, terminatedGroundFluent.substitute(currentTheta));
            terminatedFluentSet.forEach((fluent) => {
              newState.remove(fluent);
            });
          });
        }

        if (actor.initiate) {
          // perform initiate
          // take note of theta sets given by termination
          initiateThetaSet.forEach((theta) => {
            let initiatedGroundFluent = actor.initiate.substitute(theta);
            let initiatedFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, initiatedGroundFluent);
            initiatedFluentSet.forEach((fluent) => {
              newState.add(fluent);
            });
          });
        }
      });
    });

    return newState;
  };

  let actionsSelector = function actionsSelector(goalTrees, updatedState, possibleActions, program, executedActions) {
    let selectionDone = false;
    let recursiveActionsSelector = function (actionsSoFar, programSoFar, l) {
      if (l >= goalTrees.length) {
        selectionDone = true;
        let actions = new LiteralTreeMap();
        actionsSoFar.forEach((map) => {
          map.forEach((literal) => {
            actions.add(literal);
          });
        });
        return Promise.resolve(actions);
      }
      if (selectionDone) {
        return Promise.resolve();
      }
      let goalTree = goalTrees[l];
      let finalResult = null;
      let promises = [];
      // console.log('l = ' + l);
      goalTree.forEachCandidateActions(program, possibleActions, (candidateActions, subtrees) => {
        let cloneProgram = programSoFar.clone();
        let newState = cloneProgram.getState();
        newState = updateStateWithFluentActors(candidateActions, newState);
        candidateActions.forEach((l) => {
          newState.add(l);
        });

        cloneProgram.updateState(newState);
        if (!constraintCheck(cloneProgram)) {
          return;
        }

        let numFailed = 0;
        let subtreePromises = subtrees.map((subtree) => {
          return subtree.evaluate(cloneProgram, _currentTime + 1, possibleActions)
            .then((val) => {
              if (val === null) {
                numFailed += 1;
                return Promise.resolve();
              }
              return Promise.reject(subtree.getRootClause());
            });
        });

        let promise = Promise
          .all(subtreePromises)
          .then(() => {
            return Promise.reject();
          },
          (clause) => {
            return recursiveActionsSelector(
              actionsSoFar.concat([candidateActions]),
              cloneProgram,
              l + 1);
          });

        promises.push(promise);
      });

      // race for any first resolve
      return Promise
        .all(
          promises.map((p) => {
            return p.then(
              (val) => Promise.reject(val),
              (err) => Promise.resolve(err)
            );
          })
        )
        .then(
          (errs) => {
            // console.log(errs);
            return recursiveActionsSelector(
              actionsSoFar,
              programSoFar,
              l + 1);
          },
          (val) => Promise.resolve(val)
        );
    };
    let cloneProgram = program.clone();
    let cloneState = cloneProgram.getState();
    updatedState.forEach((l) => {
      cloneState.add(l);
    });
    executedActions.forEach((l) => {
      cloneState.add(l);
    });
    return recursiveActionsSelector([], cloneProgram, 0);
  };

  let possibleActionsGenerator = function possibleActionsGenerator(time) {
    let timedPossibleActions = new LiteralTreeMap();
    let timeTheta = {
      $T1: new Value(time),
      $T2: new Value(time + 1)
    };
    _possibleActions.forEach((l) => {
      timedPossibleActions.add(l.substitute(timeTheta));
    });
    return timedPossibleActions;
  };

  /*
    Perform Cycle
  */
  let performCycle = function performCycle() {
    let nextTime = _currentTime + 1;

    let rules = program.getRules();
    let facts = program.getFacts();
    let executedActions = new LiteralTreeMap();

    let result = {
      terminated: [],
      initiated: [],
      activeActions: []
    };

    let updatedState = new LiteralTreeMap();
    program.getState()
      .forEach((literal) => {
        updatedState.add(updateTimableFunctor(literal, nextTime));
      });

    // update with observations
    let cycleObservations = processObservations(updatedState);
    cycleObservations.forEach((observation) => {
      executedActions.add(observation);
    });

    // to handle time for this iteration
    let currentTimePossibleActions = possibleActionsGenerator(_currentTime);
    program.setExecutedActions(executedActions);

    // decide which actions from set of candidate actions to execute
    return actionsSelector(_goals, updatedState, currentTimePossibleActions, program, executedActions)
      .then((selectedActions) => {
        // process selected actions
        selectedActions.forEach((l) => {
          if (executedActions.contains(l)) {
            return;
          }
          result.activeActions.push(l);
          let selectedLiterals = Resolutor.handleBuiltInFunctorArgumentInLiteral(program.getFunctorProvider(), l);
          selectedLiterals.forEach((literal) => {
            executedActions.add(literal);
          });
        });

        updatedState = updateStateWithFluentActors(executedActions, updatedState);

        // preparation for next cycle
        program.updateState(updatedState);
        program.setExecutedActions(executedActions);

        // build goal clauses for each rule
        // we need to derive the partially executed rule here too
        let newRules = processRules(program, _goals);
        program.updateRules(newRules);
        let nextTimePossibleActions = possibleActionsGenerator(_currentTime + 1);

        let newGoals = [];
        let goalTreeProcessingPromises = [];
        let i = 0;
        let promise = forEachPromise(_goals)
          .do((goalTree) => {
            let treePromise = goalTree
              .evaluate(program, _currentTime + 1, nextTimePossibleActions)
              .then((evaluationResult) => {
                if (evaluationResult === null) {
                  return;
                }

                // goal tree has been resolved
                if (evaluationResult.length > 0) {
                  return;
                }

                if (goalTree.checkTreeFailed()) {
                  return;
                }

                // goal tree has not been resolved, so let's persist the tree
                // to the next cycle
                newGoals.push(goalTree);
                return Promise.resolve();
              });
            goalTreeProcessingPromises.push(treePromise);
          });

        return promise
          .then(() => {
            return Promise
              .all(goalTreeProcessingPromises);
          })
          .then(() => {
            _goals = newGoals;

            _lastStepActions = new LiteralTreeMap();
            result.activeActions.forEach((action) => {
              _lastStepActions.add(action);
            });
            _lastStepObservations = new LiteralTreeMap();
            cycleObservations.forEach((observation) => {
              _lastStepObservations.add(observation);
            });

            return Promise.resolve();
          });
      });
  };

  this.getCurrentTime = function getCurrentTime() {
    return _currentTime;
  };

  this.getCycleInterval = function getCycleInterval() {
    return _cycleInterval;
  };

  this.setCycleInterval = function setCycleInterval(newCycleInterval) {
    if (typeof newCycleInterval !== 'number' || newCycleInterval <= 0) {
      throw new Error('Argument for setCycleInterval() must be a number greater than zero.');
    }
    if (_isInCycle || _currentTime > 0) {
      throw new Error('Cycle Interval can only be set before the LPS program starts.');
    }
    _cycleInterval = newCycleInterval;
  };

  this.isContinuousExecution = function isContinuousExecution() {
    return _isContinuousExecution;
  };

  this.setContinuousExecution = function setContinuousExecution(val) {
    if (typeof val !== 'boolean') {
      throw new Error('Argument for setContinuousExecution() must be a boolean value.');
    }
    if (_isInCycle || _currentTime > 0) {
      throw new Error('Continuous Execution can only be set before the LPS program starts.');
    }
    _isContinuousExecution = val;
  };

  this.getLastCycleExecutionTime = function getLastCycleExecutionTime() {
    return _lastCycleExecutionTime;
  };

  this.getLastStepActions = function getLastStepActions() {
    let actions = [];
    _lastStepActions.forEach((action) => {
      actions.push(action.toString());
    });
    return actions;
  };

  this.getNumLastStepActions = function getNumLastStepActions() {
    if (_lastStepActions === null) {
      return 0;
    }
    return _lastStepActions.size();
  };

  this.getLastStepObservations = function getLastStepObservations() {
    let observations = [];
    _lastStepObservations.forEach((observation) => {
      observations.push(observation.toString());
    });
    return observations;
  };

  this.getNumLastStepObservations = function getNumLastStepObservations() {
    if (_lastStepObservations === null) {
      return 0;
    }
    return _lastStepObservations.size();
  };

  this.getActiveFluents = function getActiveFluents() {
    let fluents = [];
    program.getState()
      .forEach((fluent) => {
        fluents.push(fluent.toString());
      });
    return fluents;
  };

  this.getNumActiveFluents = function getNumActiveFluents() {
    return program.getState().size();
  };

  this.query = function query(literalArg, type) {
    let literal = literalArg;
    if (type === 'fluent') {
      literal = fluentSyntacticSugarProcessing(literalArg);
      return program.getState().unifies(literal);
    }

    if (type === 'action') {
      literal = actionSyntacticSugarProcessing(literalArg);
      return _lastStepActions.unifies(literal);
    }

    if (type === 'observation') {
      literal = actionSyntacticSugarProcessing(literalArg);
      return _lastStepObservations.unifies(literal)
    }

    return program.query(literal);
  };

  this.hasTerminated = function hasTerminated() {
    return _maxTime !== null && _currentTime >= _maxTime;
  };

  this.terminate = function terminate() {
    _maxTime = _currentTime;
  };

  this.step = function step() {
    if (_isInCycle) {
      // previous cycle has not ended.
      this.terminate();
      throw new Error('Previous cycle has exceeded its time limit of ' + _cycleInterval + 'ms. LPS will now terminate.');
    }
    _engineEventManager.notify('preCycle', this);
    _isInCycle = true;
    if (this.hasTerminated()) {
      return;
    }
    let startTime = Date.now();
    return performCycle()
      .then(() => {
        _currentTime += 1;
        _lastCycleExecutionTime = Date.now() - startTime;
        _isInCycle = false;
        _engineEventManager.notify('postCycle', this);
      });
  };

  this.run = function run() {
    if (this.hasTerminated()) {
      return null;
    }
    let result = [];
    _engineEventManager.notify('run', this);
    if (_isContinuousExecution) {
      let continuousExecutionFunc = () => {
        let timer = setTimeout(() => {
          this.terminate();
          throw new Error('Previous cycle has exceeded its time limit of ' + _cycleInterval + 'ms. LPS will now terminate.');
        }, _cycleInterval);
        this.step()
          .then(() => {
            clearTimeout(timer);
            if (this.hasTerminated()) {
              _engineEventManager.notify('done', this);
              return;
            }
            continuousExecutionFunc();
          });
      };
      continuousExecutionFunc();
      return;
    }

    let timer = setInterval(() => {
      if (this.hasTerminated()) {
        clearInterval(timer);
        _engineEventManager.notify('done', this);
        return;
      }
      this.step();
    }, _cycleInterval);
  };

  this.define = function define(name, callback) {
    program.getFunctorProvider().define(name, callback);
  };

  this.on = function on(event, listener) {
    _engineEventManager.addListener(event, listener);
    return this;
  };

  this.observe = function(observation) {
    let observationStartTime = _currentTime;
    if (_isInCycle) {
      // already in a cycle, so process it in the next cycle
      observationStartTime += 1;
    }
    if (_observations[observationStartTime] === undefined) {
      _observations[observationStartTime] = [];
    }
    _observations[observationStartTime].push({
      action: actionSyntacticSugarProcessing(observation),
      endTime: observationStartTime + 1
    });
  };

  this.test = function test(specFile) {
    let tester = new Tester(this);
    return tester.test(specFile);
  };

  let consultFile = function consultFile(file) {
    return Program.fromFile(file)
      .then((loadedProgram) => {
        program.augment(loadedProgram);
        return Promise.resolve(loadedProgram);
      });
  };

  let processConsultDeclarations = function processConsultDeclarations(currentProgram) {
    let promises = [];
    let result = currentProgram.query(Program.literal('consult(File)'));
    result.forEach((r) => {
      if (r.theta.File === undefined || !(r.theta.File instanceof Value)) {
        return;
      }
      let promise = consultFile(r.theta.File.evaluate())
        .then((loadedProgram) => {
          return processConsultDeclarations(loadedProgram);
        });
      promises.push(promise);
    });
    return Promise.all(promises);
  };

  // we preprocess some of the built-in processors by looking at the facts
  // of the program.
  this.on('loaded', () => {
    processMaxTimeDeclarations();
    processCycleIntervalDeclarations();
    processContinuousExecutionDeclarations();
    processFluentDeclarations();
    processActionDeclarations();
    processEventDeclarations();
    processInitialFluentDeclarations();
    processObservationDeclarations();
    preProcessRules();
    _engineEventManager.notify('ready', this);
  });

  let builtinFiles = [
    'declarations',
    'math'
  ];

  builtinFiles.forEach((filename) => {
    let path = __dirname + '/builtin/' + filename + '.lps';
    let promise = Program.fromFile(path)
      .then((loadedProgram) => {
        program.augment(loadedProgram);
        return Promise.resolve();
      });
    _loadingPromises.push(promise);
  });

  Promise.all(_loadingPromises)
    .then(() => {
      _engineEventManager.notify('loaded', this);
    });
}

module.exports = Engine;

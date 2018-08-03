const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const Clause = lpsRequire('engine/Clause');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Resolutor = lpsRequire('engine/Resolutor');
const Program = lpsRequire('parser/Program');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');
const processRules = lpsRequire('utility/processRules');
const compactTheta = lpsRequire('utility/compactTheta');
const EventManager = lpsRequire('observer/Manager');
const expandRuleAntecedent = lpsRequire('utility/expandRuleAntecedent');
const variableArrayRename = lpsRequire('utility/variableArrayRename');
const constraintCheck = lpsRequire('utility/constraintCheck');
const Tester = lpsRequire('engine/test/Tester');
const forEachPromise = lpsRequire('utility/forEachPromise');
const BuiltinLoader = lpsRequire('engine/builtin/BuiltinLoader');
const SyntacticSugarProcessor = lpsRequire('engine/builtin/SyntacticSugarProcessor');
const ObserveDeclarationProcessor = lpsRequire('engine/builtin/Observe');

const stringLiterals = lpsRequire('utility/strings');

function Engine(program, workingDirectory) {
  let _maxTime = 20;
  let _cycleInterval = 100; // milliseconds
  let _isContinuousExecution = false;
  let _isInCycle = false;
  let _isPaused = false;
  let _isRunning = false;

  let _engineEventManager = new EventManager();

  let _observations = {};

  let _goals = [];

  let _possibleActions = new LiteralTreeMap();
  let _currentTime = 0;

  let _lastCycleExecutionTime = null;
  let _lastStepActions = null;
  let _lastStepObservations = null;

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
      let fluent = SyntacticSugarProcessor.fluent(r.theta.X);
      program.defineFluent(fluent);
    });
  };

  let processActionDeclarations = function processActionDeclarations() {
    let result = program.query(Program.literal('action(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let literal = SyntacticSugarProcessor.action(r.theta.X);
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
      let literal = SyntacticSugarProcessor.action(r.theta.X);
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

  let processCycleObservations = function processCycleObservations() {
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
      action = SyntacticSugarProcessor.action(action);
      if (type === undefined
          || action === undefined
          || !(action instanceof Functor)
          || newFluent === undefined
          || oldFluent === undefined) {
        return;
      }
      type = type.evaluate();

      // take end-time argument because updates are observed in post-execution of actions
      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent updating actor, the action must have the last argument as the time variable.');
      }

      let terminatingFluent;
      let initiatingFluent;
      switch(type) {
        case 'update':
          terminatingFluent = SyntacticSugarProcessor.fluent(oldFluent, lastArgument);
          initiatingFluent = SyntacticSugarProcessor.fluent(newFluent, lastArgument);
          fluentActors.push({
            action: action,
            initiate: initiatingFluent,
            terminate: terminatingFluent
          });
          break;
        case 'initiate':
          initiatingFluent = SyntacticSugarProcessor.fluent(newFluent, lastArgument);
          fluentActors.push({
            action: action,
            initiate: initiatingFluent
          });
          break;
        case 'terminate':
          terminatingFluent = SyntacticSugarProcessor.fluent(oldFluent, lastArgument);
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
    let selection;
    let recursiveActionsSelector = function (actionsSoFar, programSoFar, l) {
      if (l >= goalTrees.length) {
        let actions = new LiteralTreeMap();
        actionsSoFar.forEach((map) => {
          map.forEach((literal) => {
            actions.add(literal);
          });
        });
        selectionDone = true;
        selection = actions;
        return Promise.resolve(actions);
      }
      if (selectionDone) {
        return Promise.resolve(selection);
      }
      let goalTree = goalTrees[l];
      let finalResult = null;
      let promises = [];
      goalTree.forEachCandidateActions(program, possibleActions, _currentTime, (candidateActions) => {
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
        let promise = recursiveActionsSelector(
            actionsSoFar.concat([candidateActions]),
            cloneProgram,
            l + 1);
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
    // observation needs to take precedence in processing over
    // action selection so that we "cleverly" do not select
    // actions for exection that has been observed in the same cycle.
    // the idea of "someone else has done something I needed to do, thanks anyway"
    let cycleObservations = processCycleObservations();
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

        program.setExecutedActions(executedActions);

        // preparation for next cycle
        updatedState = updateStateWithFluentActors(executedActions, updatedState);
        program.updateState(updatedState);

        // build goal clauses for each rule
        // we need to derive the partially executed rule here too
        let newRules = processRules(program, _goals, _currentTime);
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
    if (_isRunning) {
      throw new Error('Cannot set cycle interval. Cycle Interval can only be set before the LPS program starts.');
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
    if (_isRunning) {
      throw new Error('Cannot set execution mode. Continuous Execution can only be set before the LPS program starts.');
    }
    _isContinuousExecution = val;
  };

  this.getLastCycleExecutionTime = function getLastCycleExecutionTime() {
    return _lastCycleExecutionTime;
  };

  this.getLastStepActions = function getLastStepActions() {
    let actions = [];
    if (_lastStepActions === null) {
      return actions;
    }
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
    if (_lastStepObservations === null) {
      return actions;
    }
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
      literal = SyntacticSugarProcessor.fluent(literalArg);
      return program.getState().unifies(literal);
    }

    if (type === 'action') {
      literal = SyntacticSugarProcessor.action(literalArg);
      return _lastStepActions.unifies(literal);
    }

    if (type === 'observation') {
      literal = SyntacticSugarProcessor.action(literalArg);
      return _lastStepObservations.unifies(literal)
    }

    return program.query(literal);
  };

  this.hasTerminated = function hasTerminated() {
    return _maxTime !== null && _currentTime >= _maxTime;
  };

  this.terminate = function terminate() {
    _maxTime = _currentTime;
    if (_isPaused) {
      _engineEventManager.notify('done', this);
    }
    _isPaused = false;
  };

  this.step = function step() {
    if (_isInCycle) {
      // previous cycle has not ended.
      this.terminate();
      throw new Error('Previous cycle has exceeded its time limit of ' + _cycleInterval + 'ms. LPS will now terminate.');
    }
    if (_isPaused) {
      return Promise.resolve();
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

  let _startContinuousExecution = () => {
    let continuousExecutionFunc = () => {
      if (_isPaused) {
        return;
      }
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
  };

  let _startNormalExecution = () => {
    let timer = setInterval(() => {
      if (this.hasTerminated()) {
        clearInterval(timer);
        _engineEventManager.notify('done', this);
        return;
      }
      if (_isPaused) {
        clearInterval(timer);
        return;
      }
      this.step();
    }, _cycleInterval);
  };

  this.run = function run() {
    if (this.hasTerminated()) {
      return;
    }
    _isRunning = true;
    let result = [];
    _engineEventManager.notify('run', this);
    if (_isContinuousExecution) {
      _startContinuousExecution();
      return;
    }
    _startNormalExecution();
  };

  this.define = function define(name, callback) {
    if (_isRunning) {
      throw new Error('Cannot define JS predicates after starting LPS execution');
    }
    program.getFunctorProvider().define(name, callback);
  };

  this.on = function on(event, listener) {
    _engineEventManager.addListener(event, listener);
    return this;
  };

  this.observe = function observe(observation) {
    this.scheduleObservation(observation, _currentTime);
  };

  this.pause = function pause() {
    if (this.hasTerminated()) {
      return;
    }
    _isPaused = true;
    _engineEventManager.notify('paused', this);
  };

  this.unpause = function unpause() {
    if (this.hasTerminated()) {
      return;
    }
    _isPaused = false;
    _engineEventManager.notify('unpaused', this);
    if (_isContinuousExecution) {
      _startContinuousExecution();
      return;
    }
    _startNormalExecution();
  };

  this.scheduleObservation = function scheduleObservation(observation, startTime, endTime) {
    if (startTime === undefined || startTime < _currentTime) {
      throw new Error('Invalid start time for observation scheduling for ' + observation);
    }

    if (startTime === _currentTime && _isInCycle) {
      // already in a cycle, so process it in the next cycle
      startTime += 1;
    }

    if (endTime === undefined) {
      endTime = startTime + 1;
    }

    if (endTime <= startTime) {
      throw new Error('Invalid end time for observation scheduling for ' + observation);
    }

    if (_observations[startTime] === undefined) {
      _observations[startTime] = [];
    }

    let processSingleObservation = (obsArg) => {
      let obs;
      try {
        obs = SyntacticSugarProcessor.action(obsArg);
      } catch (_) {
        throw new Error('Invalid observation for scheduling: ' + obs);
      }
      _observations[startTime].push({
        action: obs,
        endTime: endTime
      });
    };

    if (observation instanceof Array) {
      observation.forEach((obs) => {
        processSingleObservation(obs);
      });
      return;
    }
    processSingleObservation(observation);
  };

  this.test = function test(specFile) {
    if (_isRunning) {
      throw new Error('Cannot test LPS program with specification file after starting LPS execution');
    }
    let tester = new Tester(this);
    return tester.test(specFile);
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
    ObserveDeclarationProcessor.processDeclarations(this, program);
    preProcessRules();
    _engineEventManager.notify('ready', this);
  });

  let coreModule = require('./modules/core');
  coreModule(this, program);

  BuiltinLoader
    .load(this, program)
    .then((consult) => {
      // start processing consult/1, consult/2 and loadModule/1 declarations in main program
      return consult.process(workingDirectory);
    })
    .then(() => {
      _engineEventManager.notify('loaded', this);
    });
}

module.exports = Engine;

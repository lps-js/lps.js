const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
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

  let _fluents = {};
  let _actions = {};
  let _events = {};

  let _loadingPromises = [];

  let _engineEventManager = new EventManager();

  let _terminators = [];
  let _initiators = [];
  let _updaters = [];
  let _observations = {};

  let _program = program;
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
      _fluents[fluent.getId()] = fluent;
    });
  };

  let processActionDeclarations = function processActionDeclarations() {
    let result = program.query(Program.literal('action(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let literal = actionSyntacticSugarProcessing(r.theta.X);
      _actions[literal.getId()] = true;
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
      _events[literal.getId()] = true;
    });
  };

  let processInitialFluentDeclarations = function processInitialFluentDeclarations() {
    let result = program.query(Program.literal('initially(F)'));
    let processInitialFluent = (valueArg) => {
      let value = valueArg;
      if (value instanceof Value) {
        let name = value.evaluate();
        if (_fluents[name + '/1'] === undefined) {
          // invalid fluent
          throw new Error('Invalid fluent ' + name + '/1');
          return;
        }
        program.getState().add(new Functor(name, [new Value(0)]));
        return;
      }
      if (!(value instanceof Functor)) {
        // invalid in initially
        return;
      }
      let initialFluent = new Functor(value.getName(), value.getArguments().concat([new Value(0)]));
      if (_fluents[initialFluent.getId()] === undefined) {
        // invalid fluent
        return;
      }
      program.getState().add(initialFluent);
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

  let processTerminateDeclarations = function processTerminateDeclarations() {
    let result = program.query(Program.literal('terminates(A, F)'));
    result.forEach((r) => {
      if (r.theta.A === undefined || r.theta.F === undefined) {
        return;
      }
      let action = r.theta.A;
      let fluent = r.theta.F;

      action = actionSyntacticSugarProcessing(action);

      if (!(action instanceof Functor)) {
        return;
      }
      if (_actions[action.getId()] === undefined) {
        throw new Error('Action "' + action.toString() + '" was not previously declared in action/1 or actions/1.');
      }

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent terminator as a literal, the action must have the last argument as the time variable.');
      }
      fluent = fluentSyntacticSugarProcessing(fluent, lastArgument);

      if (_fluents[fluent.getId()] === undefined) {
        throw new Error('Fluent "' + fluent.getId() + '" was not previously declared in fluent/1 or fluents/1.');
      }
      _terminators.push({ action: action, fluent: fluent });
    });
  };

  let processInitiateDeclarations = function processInitiateDeclarations() {
    let result = program.query(Program.literal('initiates(A, F)'));
    result.forEach((r) => {
      if (r.theta.A === undefined || r.theta.F === undefined) {
        return;
      }
      let action = r.theta.A;
      let fluent = r.theta.F;

      action = actionSyntacticSugarProcessing(action);

      if (!(action instanceof Functor)) {
        return;
      }
      if (_actions[action.getId()] === undefined) {
        throw new Error('Action "' + action.toString() + '" was not previously declared in action/1 or actions/1.');
      }

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent terminator as a literal, the action must have the last argument as the time variable.');
      }
      fluent = fluentSyntacticSugarProcessing(fluent, lastArgument);

      if (_fluents[fluent.getId()] === undefined) {
        throw new Error('Fluent "' + fluent.getId() + '" was not previously declared in fluent/1 or fluents/1.');
      }
      _initiators.push({ action: action, fluent: fluent });
    });
  };

  let processUpdateDeclarations = function processUpdateDeclarations() {
    let result = program.query(Program.literal('updates(A, OF, NF)'));
    result.forEach((r) => {
      if (r.theta.A === undefined || r.theta.OF === undefined || r.theta.NF === undefined) {
        return;
      }
      let action = r.theta.A;
      let terminatingFluent = r.theta.OF;
      let initiatingFluent = r.theta.NF;

      action = actionSyntacticSugarProcessing(action);

      if (!(action instanceof Functor)) {
        return;
      }
      if (_actions[action.getId()] === undefined) {
        throw new Error('Action "' + action.toString() + '" was not previously declared in action/1 or actions/1.');
      }

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent terminator as a literal, the action must have the last argument as the time variable.');
      }
      terminatingFluent = fluentSyntacticSugarProcessing(terminatingFluent, lastArgument);
      initiatingFluent = fluentSyntacticSugarProcessing(initiatingFluent, lastArgument);

      if (_fluents[terminatingFluent.getId()] === undefined) {
        throw new Error('Fluent "' + terminatingFluent.getId() + '" was not previously declared in fluent/1 or fluents/1.');
      }
      if (_fluents[initiatingFluent.getId()] === undefined) {
        throw new Error('Fluent "' + initiatingFluent.getId() + '" was not previously declared in fluent/1 or fluents/1.');
      }

      _updaters.push({ action: action, old: terminatingFluent, new: initiatingFluent });
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

  let isTimable = function isTimable(literal) {
    return _fluents[literal.getId()]
      || _actions[literal.getId()]
      || _events[literal.getId()];
  };

  let preProcessRules = function preProcessRules() {
    let newRules = [];
    let rules = _program.getRules();

    rules.forEach((rule) => {
      if (rule.getBodyLiteralsCount() === 0) {
        newRules.push(rule);
        return;
      }
      let antecedent = rule.getBodyLiterals();
      let ruleResult = [];
      expandRuleAntecedent(ruleResult, antecedent, [], _program);
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
    _program.updateRules(newRules);
  }

  let findFluentActors = function findFluentActors(action, timeStepFacts) {
    let initiated = [];
    let terminated = [];
    let functorProvider = program.getFunctorProvider();

    _updaters.forEach((u) => {
      let theta = Unifier.unifies([[u.action, action]]);
      if (theta === null) {
        return;
      }

      let factThetaSet = timeStepFacts.unifies(u.old.substitute(theta));
      factThetaSet.forEach((pair) => {
        let currentTheta = compactTheta(theta, pair.theta);

        let oldFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, u.old.substitute(currentTheta));
        oldFluentSet.forEach((oldFluent) => {
          terminated.push(oldFluent);
        });

        let newFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, u.new.substitute(currentTheta));
        newFluentSet.forEach((newFluent) => {
          initiated.push(newFluent);
        });
      });
    });

    _terminators.forEach((t) => {
      let theta = Unifier.unifies([[t.action, action]]);
      if (theta === null) {
        return;
      }
      let oldFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, t.fluent.substitute(theta));
      oldFluentSet.forEach((oldFluent) => {
        terminated.push(oldFluent);
      });
    });

    _initiators.forEach((i) => {
      let theta = Unifier.unifies([[i.action, action]]);
      if (theta === null) {
        return;
      }

      let newFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(functorProvider, i.fluent.substitute(theta));
      newFluentSet.forEach((newFluent) => {
        initiated.push(newFluent);
      });
    });

    return {
      t: terminated,
      i: initiated
    };
  };

  let processObservations = function processObservations(timeStepFacts) {
    let observationTerminated = [];
    let observationInitiated = [];
    let activeObservations = [];

    if (_observations[_currentTime] === undefined) {
      // no observations for current time
      return {
        activeObservations: [],
        terminated: [],
        initiated: []
      };
    }

    // process observations
    let theta = { $T1: new Value(_currentTime), $T2: new Value(_currentTime + 1) };
    let nextTime = _currentTime + 1;
    _observations[_currentTime].forEach((ob) => {
      let action = ob.action.substitute(theta);
      activeObservations.push(action);
      let result = findFluentActors(action, timeStepFacts);
      observationTerminated = observationTerminated.concat(result.t);
      observationInitiated = observationInitiated.concat(result.i);

      if (ob.endTime > nextTime) {
        if (_observations[nextTime] === undefined) {
          _observations[nextTime] = [];
        }
        _observations[nextTime].push(ob);
      }
    });

    return {
      activeObservations: activeObservations,
      terminated: observationTerminated,
      initiated: observationInitiated
    };
  };

  let actionsSelector = function actionsSelector(goalTrees, possibleActions, program, executedActions) {
    let recursiveSelector = function (actionsSoFar, l) {
      if (l >= goalTrees.length) {
        if (actionsSoFar.length === 0) {
          return new LiteralTreeMap();
        }
        if (!constraintCheck(program, actionsSoFar)) {
          return null;
        }

        let actions = new LiteralTreeMap();
        actionsSoFar.forEach((map) => {
          map.forEach((literal) => {
            actions.add(literal);
          });
        });
        return actions;
      }
      let goalTree = goalTrees[l];
      let finalResult = null;
      goalTree.forEachCandidateActions(program, possibleActions, (candidateActions) => {
        let result = recursiveSelector(actionsSoFar.concat([candidateActions]), l + 1);
        if (result !== null) {
          finalResult = result;
          return false;
        }
        // continue
        return true;
      });
      if (finalResult) {
        return finalResult;
      }
      return recursiveSelector(actionsSoFar, l + 1);
    };
    return recursiveSelector([], 0);
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
    return timedPossibleActions
  };

  let updateFluentsChange = function updateFluentsChange(result, updatedState) {
    let deltaTerminated = new LiteralTreeMap();
    let deltaInitiated = new LiteralTreeMap();
    result.terminated.forEach((terminatedFluent) => {
      deltaTerminated.add(terminatedFluent);
    });

    // resolve those fluents that are initiated and terminated in the same cycle
    result.initiated.forEach((initiatedFluent) => {
      if (!deltaTerminated.remove(initiatedFluent)) {
        deltaInitiated.add(initiatedFluent);
      }
    });

    deltaTerminated.forEach((fluent) => {
      updatedState.remove(fluent);
    });

    deltaInitiated.forEach((fluent) => {
      updatedState.add(fluent);
    });
  };

  /*
    Perform Cycle
  */
  let performCycle = function performCycle() {
    let nextTime = _currentTime + 1;

    let actions = Object.keys(_actions);

    let rules = _program.getRules();
    let facts = _program.getFacts();
    let executedActions = new LiteralTreeMap();

    let result = {
      terminated: [],
      initiated: [],
      activeActions: []
    };

    let updatedState = new LiteralTreeMap();
    _program.getState()
      .forEach((literal) => {
        updatedState.add(updateTimableFunctor(literal, nextTime));
      });

    // update with observations
    let observationResult = processObservations(updatedState);
    observationResult.activeObservations.forEach((observation) => {
      executedActions.add(observation);
    });
    result.terminated = observationResult.terminated.concat(result.terminated);
    result.initiated = observationResult.initiated.concat(result.initiated);

    // to handle time for this iteration
    let currentTimePossibleActions = possibleActionsGenerator(_currentTime);
    _program.setExecutedActions(executedActions);

    // decide which actions from set of candidate actions to execute
    let selectedActions = actionsSelector(_goals, currentTimePossibleActions, program, executedActions);
    if (selectedActions === null) {
      selectedActions = [];
    }
    // process selected actions
    selectedActions.forEach((l) => {
      if (executedActions.contains(l)) {
        return;
      }
      result.activeActions.push(l);
      let actors = findFluentActors(l, updatedState);
      result.terminated = result.terminated.concat(actors.t);
      result.initiated = result.initiated.concat(actors.i);
      let selectedLiterals = Resolutor.handleBuiltInFunctorArgumentInLiteral(program.getFunctorProvider(), l);
      selectedLiterals.forEach((literal) => {
        executedActions.add(literal);
      });
    });

    updateFluentsChange(result, updatedState);

    // preparation for next cycle
    _program.updateState(updatedState);
    _program.setExecutedActions(executedActions);

    // build goal clauses for each rule
    // we need to derive the partially executed rule here too
    let newRules = processRules(_program, _goals, isTimable);
    _program.updateRules(newRules);

    let nextTimePossibleActions = possibleActionsGenerator(_currentTime + 1);

    let newGoals = [];
    let goalTreeProcessingPromises = [];
    let i = 0;
    let promise = forEachPromise(_goals)
      .do((goalTree) => {
        let treePromise = goalTree
          .evaluate(program, isTimable, nextTimePossibleActions)
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

    return promise.then(() => {
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
        observationResult.activeObservations.forEach((observation) => {
          _lastStepObservations.add(observation);
        });

        return Promise.resolve();
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

    return _program.query(literal);
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

  this.define = function define(identifier, callback) {
    if (_externalActions[identifier] !== undefined) {
      throw new Error('External action "' + identifier + '" has been previously defined.');
    }
    _externalActions[identifier] = callback;
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

  this.reset = function reset() {

  };

  this.test = function test(specFile) {
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
    processInitiateDeclarations();
    processTerminateDeclarations();
    processUpdateDeclarations();
    processObservationDeclarations();
    preProcessRules();
    _engineEventManager.notify('ready', this);
  });

  let addOnProgramPromise = Program.fromFile(__dirname + '/options/syntacticSugar.lps')
    .then((program) => {
      _program.augment(program);
      return Promise.resolve();
    });
  _loadingPromises.push(addOnProgramPromise);

  Promise.all(_loadingPromises)
    .then(() => {
      _engineEventManager.notify('loaded', this);
    });
}

module.exports = Engine;

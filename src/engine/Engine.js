/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const Functor = lpsRequire('engine/Functor');
const List = lpsRequire('engine/List');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const Resolutor = lpsRequire('engine/Resolutor');
const Program = lpsRequire('parser/Program');
const ProgramFactory = lpsRequire('parser/ProgramFactory');
const FunctorProvider = lpsRequire('engine/FunctorProvider');
const Value = lpsRequire('engine/Value');
const processRules = lpsRequire('utility/processRules');
const compactTheta = lpsRequire('utility/compactTheta');
const EventManager = lpsRequire('observer/Manager');
const constraintCheck = lpsRequire('utility/constraintCheck');
const BuiltinLoader = lpsRequire('engine/builtin/BuiltinLoader');
const SyntacticSugarProcessor = lpsRequire('engine/builtin/SyntacticSugarProcessor');
const ObserveDeclarationProcessor = lpsRequire('engine/builtin/Observe');
const rulePreProcessor = lpsRequire('engine/builtin/RulePreProcessor');
const TimableProcessor = lpsRequire('engine/builtin/TimableProcessor');
const stringLiterals = lpsRequire('utility/strings');
const evaluateGoalTrees = lpsRequire('utility/evaluateGoalTrees');

function Engine(programArg, workingDirectory) {
  let _program = programArg;
  let _maxTime = 20;
  let _cycleInterval = 100; // milliseconds
  let _isContinuousExecution = false;
  let _isInCycle = false;
  let _isPaused = false;
  let _isRunning = false;

  let _engineEventManager = new EventManager();

  let _observations = {};

  let _goals = [];

  let _currentTime = 0;

  let _lastCycleExecutionTime = null;
  let _numLastCycleActions = 0;
  let _numLastCycleObservations = 0;
  let _numLastCycleFiredRules = 0;
  let _numLastCycleResolvedRules = 0;
  let _numLastCycleFailedRules = 0;

  let _lastCycleActions = null;
  let _lastCycleObservations = null;

  let _functorProvider = new FunctorProvider(this);

  let checkConstraintSatisfaction = function checkConstraintSatisfaction(otherProgram) {
    let originalProgram = _program;
    _program = otherProgram;
    let result = constraintCheck(this, otherProgram);
    _program = originalProgram;
    return result;
  };

  let processMaxTimeDeclarations = function processMaxTimeDeclarations() {
    let result = this.query(ProgramFactory.literal('maxTime(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined || !(r.theta.X instanceof Value)) {
        return;
      }
      _maxTime = r.theta.X.evaluate();
    });
  };

  let processCycleIntervalDeclarations = function processCycleIntervalDeclarations() {
    let result = this.query(ProgramFactory.literal('cycleInterval(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined || !(r.theta.X instanceof Value)) {
        return;
      }
      _cycleInterval = r.theta.X.evaluate();
    });
  };

  let processContinuousExecutionDeclarations = function processContinuousExecutionDeclarations() {
    let result = this.query(ProgramFactory.literal('continuousExecution(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined || !(r.theta.X instanceof Value)) {
        return;
      }
      let value = r.theta.X.evaluate();
      _isContinuousExecution = (value === 'yes'
        || value === 'on'
        || value === 'true'
        || value === 1);
    });
  };

  let processFluentDeclarations = function processFluentDeclarations() {
    let result = this.query(ProgramFactory.literal('fluent(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }

      let fluent = SyntacticSugarProcessor.shorthand(r.theta.X);
      _program.defineFluent(fluent);
    });
  };

  let processActionDeclarations = function processActionDeclarations() {
    let result = this.query(ProgramFactory.literal('action(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let literal = SyntacticSugarProcessor.shorthand(r.theta.X);
      _program.defineAction(literal);
    });
  };

  let processEventDeclarations = function processEventDeclarations() {
    let result = this.query(ProgramFactory.literal('event(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let literal = SyntacticSugarProcessor.shorthand(r.theta.X);
      _program.defineEvent(literal);
    });
  };

  let processInitialFluentDeclarations = function processInitialFluentDeclarations() {
    let result = this.query(ProgramFactory.literal('initially(F)'));
    let processInitialFluent = (valueArg) => {
      let value = valueArg;
      if (!(value instanceof Functor)) {
        // invalid in initially
        return;
      }
      let initialFluent = new Functor(value.getName(), value.getArguments());
      if (!_program.isFluent(initialFluent)) {
        // invalid fluent
        return;
      }
      _program
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

  const fluentActorDeclarationLiteral = ProgramFactory
    .literal('fluentActorDeclare(T, A, Old, New, Conds)');
  let updateStateWithFluentActors = function updateStateWithFluentActors(actions, state) {
    let newState = new LiteralTreeMap();
    state
      .forEach((literal) => {
        newState.add(literal);
      });
    let fluentActors = [];

    // query has to be done on the spot as some of the declarations
    // may be intensional instead of static
    let result = this.query(fluentActorDeclarationLiteral);

    result.forEach((r) => {
      let type = r.theta.T;
      let action = r.theta.A;
      let oldFluent = r.theta.Old;
      let newFluent = r.theta.New;
      let conditions = r.theta.Conds;
      if (type === undefined
          || action === undefined
          || !(action instanceof Functor)
          || newFluent === undefined
          || oldFluent === undefined
          || !(conditions instanceof List)) {
        return;
      }
      type = type.evaluate();

      switch (type) {
        case 'update':
          fluentActors.push({
            a: action,
            i: newFluent,
            t: oldFluent,
            c: conditions
          });
          break;
        case 'initiate':
          fluentActors.push({
            a: action,
            i: newFluent,
            c: conditions
          });
          break;
        case 'terminate':
          fluentActors.push({
            a: action,
            t: oldFluent,
            c: conditions
          });
          break;
        default:
          break;
      }
    });

    fluentActors.forEach((actor) => {
      let thetaSets = [];
      actions.unifies(actor.a)
        .forEach((node) => {
          let substitutedCondition = actor.c.substitute(node.theta);
          let subQueryResult = this.query(substitutedCondition.flatten());
          subQueryResult.forEach((tuple) => {
            thetaSets.push({
              theta: compactTheta(node.theta, tuple.theta)
            });
          });
        });

      thetaSets.forEach((node) => {
        let initiateThetaSet = [node.theta];

        // start processing terminate.
        // when terminating, we also take note of the appropriate theta sets
        // in case we are performing an update
        if (actor.t) {
          let terminatedGroundFluent = actor.t.substitute(node.theta);
          let stateThetaSet = newState.unifies(terminatedGroundFluent);
          initiateThetaSet = [];
          stateThetaSet.forEach((terminatedNode) => {
            let currentTheta = compactTheta(node.theta, terminatedNode.theta);
            initiateThetaSet.push(currentTheta);
            let terminatedFluentSet = Resolutor
              .handleBuiltInFunctorArgumentInLiteral(
                _functorProvider,
                terminatedGroundFluent.substitute(currentTheta)
              );
            terminatedFluentSet.forEach((fluent) => {
              newState.remove(fluent);
            });
          });
        }

        if (actor.i) {
          // perform initiate
          // take note of theta sets given by termination
          initiateThetaSet.forEach((theta) => {
            let initiatedGroundFluent = actor.i.substitute(theta);
            let initiatedFluentSet = Resolutor
              .handleBuiltInFunctorArgumentInLiteral(
                _functorProvider,
                initiatedGroundFluent
              );
            initiatedFluentSet.forEach((fluent) => {
              newState.add(fluent);
            });
          });
        }
      });
    });

    return newState;
  };

  // Process observations at each cycle
  let processCycleObservations = function processCycleObservations() {
    let activeObservations = new LiteralTreeMap();

    if (_observations[_currentTime] === undefined) {
      // no observations for current time
      return activeObservations;
    }
    let cloneProgram = _program.clone();

    cloneProgram.setExecutedActions(new LiteralTreeMap());

    // process observations
    _observations[_currentTime].forEach((ob) => {
      let action = ob.action;

      let tempTreeMap = new LiteralTreeMap();
      tempTreeMap.add(action);

      cloneProgram.getExecutedActions()
        .add(action);

      let postCloneProgram = cloneProgram.clone();
      let postState = postCloneProgram.getState();
      postCloneProgram.setExecutedActions(new LiteralTreeMap());
      postState = updateStateWithFluentActors.call(this, tempTreeMap, postState);
      postCloneProgram.setState(postState);

      // only perform pre-checks
      if (checkConstraintSatisfaction.call(this, cloneProgram)) {
        if (checkConstraintSatisfaction.call(this, postCloneProgram)) {
          activeObservations.add(action);
        }
      } else {
        // reject incoming observation
        cloneProgram.getExecutedActions()
          .remove(action);

        // notify
        _engineEventManager.notify('warning', {
          type: 'observation.reject',
          message: stringLiterals(
            'engine.rejectObservationWarning',
            action,
            _currentTime,
            _currentTime + 1
          )
        });
      }

      let nextTime = _currentTime + 1;
      if (ob.endTime > nextTime) {
        if (_observations[nextTime] === undefined) {
          _observations[nextTime] = [];
        }
        _observations[nextTime].push(ob);
      }
    });

    return activeObservations;
  };

  let actionsSelector = function actionsSelector(goalTrees) {
    let selectionDone = false;
    let selection;
    let recursiveActionsSelector = (actionsSoFar, programSoFar, l) => {
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
      let promises = [];
      goalTree.forEachCandidateActions(_currentTime, (candidateActions) => {
        if (selectionDone) {
          return;
        }
        let cloneProgram = programSoFar.clone();

        let cloneExecutedActions = cloneProgram.getExecutedActions();
        candidateActions.forEach((a) => {
          cloneExecutedActions.add(a);
        });

        // pre-condition check
        if (!checkConstraintSatisfaction.call(this, cloneProgram)) {
          return;
        }

        // post condition checks
        let clonePostProgram = programSoFar.clone();
        clonePostProgram.setExecutedActions(new LiteralTreeMap());
        let postState = clonePostProgram.getState();
        postState = updateStateWithFluentActors.call(this, candidateActions, postState);
        clonePostProgram.setState(postState);

        if (!checkConstraintSatisfaction.call(this, clonePostProgram)) {
          return;
        }

        let promise = recursiveActionsSelector(
          actionsSoFar.concat([candidateActions]),
          cloneProgram,
          l + 1
        );
        promises.push(promise);
      });

      // race for any first resolve
      let mappedPromises = promises.map((p) => {
        return p.then(
          (val) => Promise.reject(val),
          (err) => Promise.resolve(err)
        );
      });
      return Promise
        .all(mappedPromises)
        .then(
          () => {
            return recursiveActionsSelector(
              actionsSoFar,
              programSoFar,
              l + 1
            );
          },
          (val) => Promise.resolve(val)
        );
    };

    return recursiveActionsSelector([], _program, 0);
  };

  /*
    Perform Cycle
  */
  const performCycle = function performCycle() {
    let updatedState = new LiteralTreeMap();
    _program
      .getState()
      .forEach((literal) => {
        updatedState.add(literal);
      });

    // update with observations
    // observation needs to take precedence in processing over
    // action selection so that we "cleverly" do not select
    // actions for exection that has been observed in the same cycle.
    // the idea of "someone else has done something I needed to do, thanks anyway"
    let executedActions = new LiteralTreeMap();
    let cycleObservations = processCycleObservations.call(this);
    cycleObservations.forEach((observation) => {
      executedActions.add(observation);
    });

    // to handle time for this iteration
    _program.setExecutedActions(executedActions);

    // decide which actions from set of candidate actions to execute
    return actionsSelector.call(this, _goals)
      .then((selectedActions) => {
        let selectedAndExecutedActions = new LiteralTreeMap();
        // process selected actions
        selectedActions.forEach((l) => {
          if (executedActions.contains(l)) {
            return;
          }
          let selectedLiterals = Resolutor
            .handleBuiltInFunctorArgumentInLiteral(_functorProvider, l);
          selectedLiterals.forEach((literal) => {
            executedActions.add(literal);
            selectedAndExecutedActions.add(literal);
          });
        });

        updatedState = updateStateWithFluentActors.call(this, executedActions, updatedState);
        _program.setExecutedActions(executedActions);

        // reset statistics
        _numLastCycleFailedRules = 0;
        _numLastCycleResolvedRules = 0;

        let promise = Promise.resolve([]);
        let newFiredGoals = [];
        if (_currentTime > 0) {
          // skip pre-processing in cycle 0 to 1.
          newFiredGoals = processRules(this, _program, _goals, _currentTime);
          _goals = _goals.concat(newFiredGoals);
          promise = evaluateGoalTrees(_currentTime, _goals);
        }

        return promise
          .then((newGoals) => {
            _goals = newGoals;

            // preparation for next cycle
            _currentTime += 1;

            _program.setExecutedActions(new LiteralTreeMap());
            _program.setState(updatedState);

            // build goal clauses for each rule
            // we need to derive the partially executed rule here too
            newFiredGoals = processRules(this, _program, _goals, _currentTime);
            _goals = _goals.concat(newFiredGoals);
            return evaluateGoalTrees(_currentTime, _goals);
          })
          .then((newGoals) => {
            _goals = newGoals;

            _lastCycleActions = selectedAndExecutedActions;
            _lastCycleObservations = cycleObservations;

            // update statistics
            _numLastCycleActions = _lastCycleActions.size();
            _numLastCycleObservations = _lastCycleObservations.size();

            return Promise.resolve();
          });
      });
  };

  this.getCurrentTime = function getCurrentTime() {
    return _currentTime;
  };

  this.getMaxTime = function getMaxTime() {
    return _maxTime;
  };

  this.isInCycle = function isInCycle() {
    return _isInCycle;
  };

  this.isRunning = function isRunning() {
    return _isRunning;
  };

  this.isPaused = function isPaused() {
    return _isPaused;
  };

  this.getCycleInterval = function getCycleInterval() {
    return _cycleInterval;
  };

  this.setCycleInterval = function setCycleInterval(newCycleInterval) {
    if (typeof newCycleInterval !== 'number') {
      throw new Error(stringLiterals(
        'engine.parameterInvalidType',
        1,
        'Engine.setCycleInterval',
        'number',
        typeof val
      ));
    }
    if (newCycleInterval <= 0
        || !Number.isInteger(newCycleInterval)) {
      throw new Error(stringLiterals('engine.nonPositiveIntegerCycleInterval', newCycleInterval));
    }
    if (_isRunning) {
      throw new Error(stringLiterals('engine.updatingParametersWhileRunning', 'cycle interval'));
    }
    _cycleInterval = newCycleInterval;
  };

  this.isContinuousExecution = function isContinuousExecution() {
    return _isContinuousExecution;
  };

  this.setContinuousExecution = function setContinuousExecution(val) {
    if (typeof val !== 'boolean') {
      throw new Error(stringLiterals(
        'engine.parameterInvalidType',
        1,
        'Engine.setContinuousExecution',
        'boolean',
        typeof val
      ));
    }
    if (_isRunning) {
      throw new Error(stringLiterals(
        'engine.updatingParametersWhileRunning',
        'continuous execution mode'
      ));
    }
    _isContinuousExecution = val;
  };

  this.getLastCycleExecutionTime = function getLastCycleExecutionTime() {
    return _lastCycleExecutionTime;
  };

  this.getLastCycleActions = function getLastCycleActions() {
    let actions = [];
    if (_lastCycleActions === null) {
      return actions;
    }
    _lastCycleActions.forEach((action) => {
      actions.push(action.toString());
    });
    return actions;
  };

  this.getNumLastCycleActions = function getNumLastCycleActions() {
    if (_lastCycleActions === null) {
      return 0;
    }
    return _numLastCycleActions;
  };

  this.getLastCycleObservations = function getLastCycleObservations() {
    let observations = [];
    if (_lastCycleObservations === null) {
      return observations;
    }
    _lastCycleObservations.forEach((observation) => {
      observations.push(observation.toString());
    });
    return observations;
  };

  this.getNumLastCycleObservations = function getNumLastCycleObservations() {
    if (_lastCycleObservations === null) {
      return 0;
    }
    return _numLastCycleObservations;
  };

  this.getTimelessFacts = function getTimelessFacts() {
    let facts = [];
    _program.getFacts()
      .forEach((fact) => {
        facts.push(fact.toString());
      });
    return facts;
  };

  this.getActiveFluents = function getActiveFluents() {
    let fluents = [];
    _program.getState()
      .forEach((fluent) => {
        fluents.push(fluent.toString());
      });
    return fluents;
  };

  this.getNumActiveFluents = function getNumActiveFluents() {
    return _program.getState().size();
  };

  this.getNumLastCycleFiredRules = function getNumLastCycleFiredRules() {
    return _numLastCycleFiredRules;
  };

  this.getNumLastCycleResolvedRules = function getNumLastCycleResolvedRules() {
    return _numLastCycleResolvedRules;
  };

  this.getNumLastCycleFailedRules = function getNumLastCycleFailedRules() {
    return _numLastCycleFailedRules;
  };

  this.query = function query(literalArg, type) {
    let literal = literalArg;
    if (type === 'fluent') {
      return _program.getState().unifies(literal);
    }

    if (type === 'action') {
      return _lastCycleActions.unifies(literal);
    }

    if (type === 'observation') {
      return _lastCycleObservations.unifies(literal);
    }

    return _program.query(literal, this);
  };

  this.hasHalted = function hasHalted() {
    return _maxTime !== null
      && _currentTime >= _maxTime;
  };

  this.halt = function halt() {
    _maxTime = _currentTime;
    if (_isPaused) {
      _engineEventManager.notify('done', this);
    }
    _isPaused = false;
  };

  this.step = function step() {
    if (_isInCycle) {
      // previous cycle has not ended.
      this.halt();
      let error = stringLiterals.error(['engine', 'cycleIntervalExceeded'], [_cycleInterval]);
      return Promise.reject(error);
    }
    if (_isPaused) {
      return Promise.resolve();
    }
    if (this.hasHalted()) {
      return Promise.resolve();
    }
    _engineEventManager.notify('preCycle', this);
    _isInCycle = true;
    let startTime = Date.now();
    return performCycle.call(this)
      .then(() => {
        _lastCycleExecutionTime = Date.now() - startTime;
        _isInCycle = false;
        _engineEventManager.notify('postCycle', this);
      });
  };

  let _startContinuousExecution = () => {
    let continuousExecutionFunc = () => {
      if (_isPaused || this.hasHalted()) {
        return;
      }

      // schedule next cycle ahead
      let timer = setTimeout(continuousExecutionFunc, _cycleInterval);

      this.step()
        .then(() => {
          if (this.hasHalted()) {
            _engineEventManager.notify('done', this);
            return;
          }
          clearTimeout(timer);
          setImmediate(continuousExecutionFunc);
        })
        .catch((err) => {
          this.halt();
          clearTimeout(timer);
          _engineEventManager.notify('error', err);
        });
    };
    setImmediate(continuousExecutionFunc);
  };

  let _startNormalExecution = () => {
    let timer = setInterval(() => {
      if (this.hasHalted()) {
        clearInterval(timer);
        _engineEventManager.notify('done', this);
        return;
      }
      if (_isPaused) {
        clearInterval(timer);
        return;
      }
      this.step()
        .catch((err) => {
          clearInterval(timer);
          _engineEventManager.notify('error', err);
        });
    }, _cycleInterval);
  };

  this.run = function run() {
    if (_maxTime <= 0) {
      throw stringLiterals.error('engine.maxTimeInvalid', _maxTime);
    }
    if (this.hasHalted()) {
      return;
    }
    _isRunning = true;
    _engineEventManager.notify('run', this);
    if (_isContinuousExecution) {
      _startContinuousExecution();
      return;
    }
    _startNormalExecution();
  };

  this.define = function define(name, callback) {
    if (_isRunning) {
      throw stringLiterals.error('engine.definePredicatesWhileRunning');
    }
    _functorProvider.define(name, callback);
  };

  this.getFunctorProvider = function getFunctorProvider() {
    return _functorProvider;
  };

  this.on = function on(event, listener) {
    _engineEventManager.addListener(event, listener);
    return this;
  };

  this.observe = function observe(observation) {
    this.scheduleObservation(observation, _currentTime);
  };

  this.pause = function pause() {
    if (this.hasHalted()) {
      return;
    }
    _isPaused = true;
    _engineEventManager.notify('paused', this);
  };

  this.unpause = function unpause() {
    if (this.hasHalted()) {
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

  this.scheduleObservation = function scheduleObservation(observation, startTimeArg, endTimeArg) {
    let startTime = startTimeArg;
    let endTime = endTimeArg;
    if (startTime === undefined
        || startTime < _currentTime) {
      throw stringLiterals.error(
        'engine.invalidStartTimeObservationScheduling',
        [observation, startTime, _currentTime]
      );
    }

    if (startTime === _currentTime && _isInCycle) {
      // already in a cycle, so process it in the next cycle
      startTime += 1;
    }

    if (endTime === undefined) {
      endTime = startTime + 1;
    }

    if (endTime <= startTime) {
      throw stringLiterals.error(
        'engine.invalidObservationScheduling',
        [observation, startTime, endTime]
      );
    }

    if (_observations[startTime] === undefined) {
      _observations[startTime] = [];
    }

    let processSingleObservation = (obsArg) => {
      let obs = obsArg;
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

  // we preprocess some of the built-in processors by looking at the facts
  // of the _program.
  this.on('loaded', () => {
    processMaxTimeDeclarations.call(this);
    processCycleIntervalDeclarations.call(this);
    processContinuousExecutionDeclarations.call(this);
    processFluentDeclarations.call(this);
    processActionDeclarations.call(this);
    processEventDeclarations.call(this);
    processInitialFluentDeclarations.call(this);
    ObserveDeclarationProcessor.processDeclarations(this, _program);
    rulePreProcessor(this, _program);
    TimableProcessor(this, _program);

    _engineEventManager.notify('ready', this);
  });

  let _loaded = false;
  this.load = function load() {
    if (_loaded) {
      return Promise.reject(stringLiterals.error('engine.loadingLoadedEngine'));
    }
    _loaded = true;
    let coreModule = require('./modules/core');
    coreModule(this, _program);

    return BuiltinLoader
      .load(this, _program)
      .then((consult) => {
        // start processing consult/1, consult/2 and loadModule/1 declarations in main program
        return consult.process(workingDirectory);
      })
      .then(() => {
        _engineEventManager.notify('loaded', this);
        return Promise.resolve(this);
      });
  };
}

module.exports = Engine;

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
const constraintCheck = lpsRequire('utility/constraintCheck');
const Tester = lpsRequire('engine/test/Tester');
const forEachPromise = lpsRequire('utility/forEachPromise');
const BuiltinLoader = lpsRequire('engine/builtin/BuiltinLoader');
const SyntacticSugarProcessor = lpsRequire('engine/builtin/SyntacticSugarProcessor');
const ObserveDeclarationProcessor = lpsRequire('engine/builtin/Observe');
const goalTreeSorter = lpsRequire('utility/goalTreeSorter');
const rulePreProcessor = lpsRequire('engine/builtin/RulePreProcessor');

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
  let _numLastCycleActions = 0;
  let _numLastCycleObservations = 0;
  let _numLastCycleFiredRules = 0;
  let _numLastCycleResolvedRules = 0;
  let _numLastCycleFailedRules = 0;

  let _lastCycleActions = null;
  let _lastCycleObservations = null;

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

      let fluent = SyntacticSugarProcessor.shorthand(r.theta.X);
      fluent = SyntacticSugarProcessor.fluent(fluent);
      program.defineFluent(fluent);
    });
  };

  let processActionDeclarations = function processActionDeclarations() {
    let result = program.query(Program.literal('action(X)'));
    result.forEach((r) => {
      if (r.theta.X === undefined) {
        return;
      }
      let literal = SyntacticSugarProcessor.shorthand(r.theta.X);
      literal = SyntacticSugarProcessor.action(literal);
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
      let literal = SyntacticSugarProcessor.shorthand(r.theta.X);
      literal = SyntacticSugarProcessor.action(literal);
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

  let processCycleObservations = function processCycleObservations(updatedState) {
    let observationTerminated = [];
    let observationInitiated = [];
    let activeObservations = new LiteralTreeMap();

    if (_observations[_currentTime] === undefined) {
      // no observations for current time
      return activeObservations;
    }
    let cloneProgram = program.clone();
    let oldState = program.getState();
    updatedState.forEach((f) => {
      oldState.add(f);
    });
    cloneProgram.setExecutedActions(new LiteralTreeMap());

    // process observations
    let theta = { $T1: new Value(_currentTime), $T2: new Value(_currentTime + 1) };
    let nextTime = _currentTime + 1;
    _observations[_currentTime].forEach((ob) => {
      let action = ob.action.substitute(theta);

      let tempTreeMap = new LiteralTreeMap();
      tempTreeMap.add(action);
      cloneProgram.getExecutedActions().add(action);
      let newState = updateStateWithFluentActors(tempTreeMap, oldState);
      cloneProgram.updateState(newState);

      if (constraintCheck(cloneProgram)) {
        activeObservations.add(action);
        oldState = newState;
      } else {
        // reject incoming observation
        cloneProgram.updateState(oldState);
        cloneProgram.getExecutedActions().remove(action);

        // notify
        _engineEventManager.notify('warning', {
          type: 'observation.reject',
          message: 'Rejecting observation ' + action + ' to satisfy constraints.'
        });
      }

      if (ob.endTime > nextTime) {
        if (_observations[nextTime] === undefined) {
          _observations[nextTime] = [];
        }
        _observations[nextTime].push(ob);
      }
    });

    return activeObservations;
  };

  const fluentActorDeclarationLiteral = Program.literal('fluentActorDeclare(T, A, Old, New, Conds)');
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
      let conditions = r.theta.Conds;
      action = SyntacticSugarProcessor.action(action);
      if (type === undefined
          || action === undefined
          || !(action instanceof Functor)
          || newFluent === undefined
          || oldFluent === undefined
          || !(conditions instanceof List)) {
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
      switch (type) {
        case 'update':
          terminatingFluent = SyntacticSugarProcessor.fluent(oldFluent, lastArgument);
          initiatingFluent = SyntacticSugarProcessor.fluent(newFluent, lastArgument);
          fluentActors.push({
            action: action,
            initiate: initiatingFluent,
            terminate: terminatingFluent,
            conditions: conditions
          });
          break;
        case 'initiate':
          initiatingFluent = SyntacticSugarProcessor.fluent(newFluent, lastArgument);
          fluentActors.push({
            action: action,
            initiate: initiatingFluent,
            conditions: conditions
          });
          break;
        case 'terminate':
          terminatingFluent = SyntacticSugarProcessor.fluent(oldFluent, lastArgument);
          fluentActors.push({
            action: action,
            terminate: terminatingFluent,
            conditions: conditions
          });
          break;
        default:
          break;
      }
    });

    fluentActors.forEach((actor) => {
      let thetaSets = [];
      actions.unifies(actor.action)
        .forEach((node) => {
          let substitutedCondition = actor.conditions.substitute(node.theta);
          let subQueryResult = program.query(substitutedCondition.flatten());
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
      goalTree.forEachCandidateActions(possibleActions, _currentTime, (candidateActions) => {
        let cloneProgram = programSoFar.clone();
        let newState = cloneProgram.getState();
        newState = updateStateWithFluentActors(candidateActions, newState);
        candidateActions.forEach((a) => {
          newState.add(a);
        });

        cloneProgram.updateState(newState);
        if (!constraintCheck(cloneProgram)) {
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
    let executedActions = new LiteralTreeMap();

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
    let cycleObservations = processCycleObservations(updatedState);
    cycleObservations.forEach((observation) => {
      executedActions.add(observation);
    });

    // to handle time for this iteration
    let currentTimePossibleActions = possibleActionsGenerator(_currentTime);
    program.setExecutedActions(executedActions);

    // decide which actions from set of candidate actions to execute
    return actionsSelector(
      _goals,
      updatedState,
      currentTimePossibleActions,
      program,
      executedActions
    )
      .then((selectedActions) => {
        let selectedAndExecutedActions = new LiteralTreeMap();
        // process selected actions
        selectedActions.forEach((l) => {
          if (executedActions.contains(l)) {
            return;
          }
          selectedAndExecutedActions.add(l);
          let selectedLiterals = Resolutor
            .handleBuiltInFunctorArgumentInLiteral(program.getFunctorProvider(), l);
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
        let newFiredGoals = [];
        let newRules = processRules(program, newFiredGoals, _currentTime);
        _numLastCycleFiredRules = newFiredGoals.length;
        _goals = _goals.concat(newFiredGoals);
        program.updateRules(newRules);

        let nextTimePossibleActions = possibleActionsGenerator(_currentTime + 1);

        let newGoals = [];
        let goalTreeProcessingPromises = [];

        // reset statistics
        _numLastCycleFailedRules = 0;
        _numLastCycleResolvedRules = 0;

        let promise = forEachPromise(_goals)
          .do((goalTree) => {
            let treePromise = goalTree
              .evaluate(_currentTime + 1, nextTimePossibleActions)
              .then((evaluationResult) => {
                if (evaluationResult === null) {
                  _numLastCycleFailedRules += 1;
                  return Promise.reject();
                }

                // goal tree has been resolved
                if (evaluationResult.length > 0) {
                  _numLastCycleResolvedRules += 1;
                  return Promise.resolve();
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

            // ensure goal trees are sorted by their deadlines
            _goals.sort(goalTreeSorter(_currentTime + 1));

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
      return actions;
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
    program.getFacts()
      .forEach((fact) => {
        facts.push(fact.toString());
      });
    return facts;
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
      literal = SyntacticSugarProcessor.fluent(literalArg);
      return program.getState().unifies(literal);
    }

    if (type === 'action') {
      literal = SyntacticSugarProcessor.action(literalArg);
      return _lastCycleActions.unifies(literal);
    }

    if (type === 'observation') {
      literal = SyntacticSugarProcessor.action(literalArg);
      return _lastCycleObservations.unifies(literal);
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
          setTimeout(() => {
            continuousExecutionFunc();
          }, 0);
        })
        .catch((err) => {
          clearTimeout(timer);
          _engineEventManager.notify('error', err);
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
      this.step()
        .catch((err) => {
          clearInterval(timer);
          _engineEventManager.notify('error', err);
        });
    }, _cycleInterval);
  };

  this.run = function run() {
    if (this.hasTerminated()) {
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
    rulePreProcessor(this, program);
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

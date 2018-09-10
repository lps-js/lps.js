/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../lpsRequire');
const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');
const FunctorProvider = lpsRequire('engine/FunctorProvider');

const processRules = lpsRequire('utility/processRules');
const goalTreeSorter = lpsRequire('utility/goalTreeSorter');
const EventManager = lpsRequire('utility/observer/Manager');
const Profiler = lpsRequire('utility/profiler/Profiler');
const constraintCheck = lpsRequire('utility/constraintCheck');
const stringLiterals = lpsRequire('utility/strings');
const evaluateGoalTrees = lpsRequire('utility/evaluateGoalTrees');
const updateStateWithFluentActors = lpsRequire('utility/updateStateWithFluentActors');

const builtinProcessor = lpsRequire('engine/builtin/builtin');
const observeProcessor = lpsRequire('engine/processors/observe');
const initiallyProcessor = lpsRequire('engine/processors/initially');
const ruleAntecedentProcessor = lpsRequire('engine/processors/ruleAntecedent');
const settingsProcessor = lpsRequire('engine/processors/settings');
const timableProcessor = lpsRequire('engine/processors/timable');
const coreModule = lpsRequire('engine/modules/core');
const ConjunctionMap = lpsRequire('engine/ConjunctionMap');

const forEachToString = (arr) => {
  return (item) => {
    arr.push(item.toString());
  };
};

function Engine(programArg) {
  let _program = programArg;
  let _maxTime = 20;
  let _cycleInterval = 100; // milliseconds
  let _isContinuousExecution = false;
  let _isInCycle = false;
  let _isPaused = false;
  let _isRunning = false;

  let _engineEventManager = new EventManager();
  let _profiler = new Profiler();
  let _processedNodes = new ConjunctionMap();

  let _observations = {};

  let _goals = [];

  let _currentTime = 0;

  let _nextCycleObservations = new LiteralTreeMap();
  let _nextCycleActions = new LiteralTreeMap();

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

  // Process observations at each cycle
  let processCycleObservations = function processCycleObservations() {
    let activeObservations = new LiteralTreeMap();

    if (_observations[_currentTime] === undefined) {
      // no observations for current time
      return activeObservations;
    }
    let cloneProgram = _program.clone();

    cloneProgram.setExecutedActions(activeObservations);

    // process observations
    _observations[_currentTime].forEach((ob) => {
      let action = ob.action;

      let tempTreeMap = new LiteralTreeMap();
      tempTreeMap.add(action);

      activeObservations.add(action);

      let postCloneProgram = cloneProgram.clone();
      let postState = postCloneProgram.getState();
      postCloneProgram.setExecutedActions(new LiteralTreeMap());
      updateStateWithFluentActors(
        this,
        tempTreeMap,
        postState
      );
      postCloneProgram.setState(postState);

      // only perform pre-checks
      if (!checkConstraintSatisfaction.call(this, cloneProgram)
          || !checkConstraintSatisfaction.call(this, postCloneProgram)) {
        // reject incoming observation
        activeObservations.remove(action);

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
    let recursiveActionsSelector = (actionsSoFar, programSoFar, l) => {
      if (l >= goalTrees.length) {
        let actions = new LiteralTreeMap();
        actionsSoFar.forEach((map) => {
          map.forEach((literal) => {
            actions.add(literal);
          });
        });
        return actions;
      }
      let goalTree = goalTrees[l];
      let resultSet = null;
      goalTree.forEachCandidateActions(_currentTime, (candidateActions) => {
        let cloneProgram = programSoFar.clone();

        let cloneExecutedActions = cloneProgram.getExecutedActions();
        candidateActions.forEach((a) => {
          cloneExecutedActions.add(a);
        });

        // pre-condition check
        if (!checkConstraintSatisfaction.call(this, cloneProgram)) {
          return false;
        }

        // post condition checks
        let clonePostProgram = programSoFar.clone();
        clonePostProgram.setExecutedActions(new LiteralTreeMap());
        let postState = clonePostProgram.getState();
        updateStateWithFluentActors(
          this,
          candidateActions,
          postState
        );
        clonePostProgram.setState(postState);

        if (!checkConstraintSatisfaction.call(this, clonePostProgram)) {
          return false;
        }

        resultSet = recursiveActionsSelector(
          actionsSoFar.concat([candidateActions]),
          cloneProgram,
          l + 1
        );
        return true;
      });

      if (resultSet !== null) {
        return resultSet;
      }

      return recursiveActionsSelector(
        actionsSoFar,
        programSoFar,
        l + 1
      );
    };

    return recursiveActionsSelector([], _program, 0);
  };

  /*
    Perform Cycle
  */
  const performCycle = function performCycle() {
    _currentTime += 1;

    let selectedAndExecutedActions = new LiteralTreeMap();
    let executedObservations = new LiteralTreeMap();
    _processedNodes = new ConjunctionMap();

    let updatedState = _program.getState().clone();
    updateStateWithFluentActors(
      this,
      _program.getExecutedActions(),
      updatedState
    );
    _program.setState(updatedState);

    _nextCycleObservations.forEach((obs) => {
      executedObservations.add(obs);
    });
    _nextCycleActions.forEach((act) => {
      selectedAndExecutedActions.add(act);
    });

    let newFiredGoals = processRules(this, _program, _currentTime, _profiler);
    _goals = _goals.concat(newFiredGoals);
    return evaluateGoalTrees(_currentTime, _goals, _processedNodes, _profiler)
      .then((newGoals) => {
        _goals = newGoals;

        _program.setExecutedActions(new LiteralTreeMap());

        // preparation for next cycle
        _goals.sort(goalTreeSorter(_currentTime));
        return actionsSelector.call(this, _goals);
      })
      .then((nextCycleActions) => {
        _nextCycleActions = new LiteralTreeMap();
        nextCycleActions.forEach((l) => {
          _nextCycleActions.add(l);
        });
        _nextCycleObservations = new LiteralTreeMap();
        let cycleObservations = processCycleObservations.call(this);
        cycleObservations.forEach((observation) => {
          nextCycleActions.add(observation);
          _nextCycleObservations.add(observation);
        });

        _program.setExecutedActions(nextCycleActions);
        // update with observations
        // observation needs to take precedence in processing over
        // action selection so that we "cleverly" do not select
        // actions for exection that has been observed in the same cycle.
        // the idea of "someone else has done something I needed to do, thanks anyway"

        _lastCycleActions = selectedAndExecutedActions;
        _lastCycleObservations = executedObservations;

        return Promise.resolve();
      });
  };

  this.getProfiler = function getProfiler() {
    return _profiler;
  };

  this.getCurrentTime = function getCurrentTime() {
    return _currentTime;
  };

  this.getMaxTime = function getMaxTime() {
    return _maxTime;
  };

  this.setMaxTime = function setMaxTime(newMaxTime) {
    if (_isRunning) {
      throw stringLiterals.error(
        'engine.updatingParametersWhileRunning',
        'max cycle time'
      );
    }
    if (newMaxTime <= 0
        || !Number.isInteger(newMaxTime)) {
      throw stringLiterals.error('engine.nonPositiveIntegerMaxTime', newMaxTime);
    }

    _maxTime = newMaxTime;
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
    if (_isRunning) {
      throw stringLiterals.error('engine.updatingParametersWhileRunning', 'cycle interval');
    }
    if (typeof newCycleInterval !== 'number') {
      throw stringLiterals.error(
        'engine.parameterInvalidType',
        1,
        'Engine.setCycleInterval',
        'number',
        typeof val
      );
    }
    if (newCycleInterval <= 0
        || !Number.isInteger(newCycleInterval)) {
      throw stringLiterals.error('engine.nonPositiveIntegerCycleInterval', newCycleInterval);
    }
    _cycleInterval = newCycleInterval;
  };

  this.isContinuousExecution = function isContinuousExecution() {
    return _isContinuousExecution;
  };

  this.setContinuousExecution = function setContinuousExecution(val) {
    if (_isRunning) {
      throw stringLiterals.error(
        'engine.updatingParametersWhileRunning',
        'continuous execution mode'
      );
    }
    if (typeof val !== 'boolean') {
      throw stringLiterals.error(
        'engine.parameterInvalidType',
        1,
        'Engine.setContinuousExecution',
        'boolean',
        typeof val
      );
    }
    _isContinuousExecution = val;
  };

  this.getLastCycleActions = function getLastCycleActions() {
    let actions = [];
    if (_lastCycleActions === null) {
      return actions;
    }
    _lastCycleActions.forEach(forEachToString(actions));
    return actions;
  };

  this.getLastCycleObservations = function getLastCycleObservations() {
    let observations = [];
    if (_lastCycleObservations === null) {
      return observations;
    }
    _lastCycleObservations.forEach(forEachToString(observations));
    return observations;
  };

  this.getTimelessFacts = function getTimelessFacts() {
    let facts = [];
    _program.getFacts()
      .forEach(forEachToString(facts));
    return facts;
  };

  this.getActiveFluents = function getActiveFluents() {
    let fluents = [];
    _program.getState()
      .forEach(forEachToString(fluents));
    return fluents;
  };

  this.query = function query(literalArg, type) {
    try {
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
    } catch (err) {
      this.halt();
      _engineEventManager.notify('error', err);
    }
    return [];
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

    _profiler.set('lastCycleNumFiredRules', 0);
    _profiler.set('lastCycleNumFailedGoals', 0);
    _profiler.set('lastCycleNumResolvedGoals', 0);
    _profiler.set('lastCycleNumNewRules', 0);
    _profiler.set('lastCycleNumDiscardedRules', 0);

    _isInCycle = true;
    let startTime = Date.now();
    return performCycle.call(this)
      .then(() => {
        _profiler.set('lastCycleExecutionTime', Date.now() - startTime);

        // update statistics
        _profiler.set('numState', _program.getState().size());
        _profiler.set('lastCycleNumUnresolvedGoals', _goals.length);
        _profiler.set('lastCycleNumActions', _lastCycleActions.size());
        _profiler.set('lastCycleNumObservations', _lastCycleObservations.size());

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
    let scheduledTime = _currentTime;
    if (scheduledTime === 0) {
      scheduledTime = 1;
    }
    this.scheduleObservation(observation, scheduledTime);
  };

  this.pause = function pause() {
    if (this.hasHalted()) {
      return;
    }
    _isPaused = true;
    _engineEventManager.notify('paused', this);
    _profiler.increment('numPaused');
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

  this.loadModule = function loadModule(module) {
    if (_isRunning) {
      throw stringLiterals.error('engine.definePredicatesWhileRunning');
    }
    if (typeof module !== 'function') {
      throw stringLiterals.error('engine.loadModuleInvalidType');
    }
    return module(this, _program);
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
    settingsProcessor(this, _program);
    timableProcessor(this, _program);
    initiallyProcessor(this, _program);
    observeProcessor(this, _program);
    ruleAntecedentProcessor(this, _program);
  });

  let _loaded = false;
  this.load = function load() {
    if (_loaded) {
      return Promise.reject(stringLiterals.error('engine.loadingLoadedEngine'));
    }
    _loaded = true;
    coreModule(this, _program);

    return builtinProcessor(this, _program)
      .then(() => {
        if (process.browser) {
          // skip consult processing for browser context
          return Promise.resolve();
        }
        const consultProcessor = lpsRequire('engine/processors/consult');
        // start processing consult/1, consult/2 and loadModule/1 declarations in main program
        return consultProcessor(this, _program);
      })
      .then(() => {
        return _engineEventManager.notify('loaded', this);
      })
      .then(() => {
        _engineEventManager.notify('ready', this);
        return Promise.resolve(this);
      });
  };


  _profiler.set('numPaused', 0);
}

module.exports = Engine;

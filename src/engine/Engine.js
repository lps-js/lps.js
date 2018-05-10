const BuiltInFunctorProvider = require('./BuiltInFunctorProvider');
const Functor = require('./Functor');
const List = require('./List');
const Clause = require('./Clause');
const LiteralTreeMap = require('./LiteralTreeMap');
const Resolutor = require('./Resolutor');
const Program = require('./Program');
const Unifier = require('./Unifier');
const Value = require('./Value');
const Variable = require('./Variable');
const processRules = require('../utility/processRules');
const compactTheta = require('../utility/compactTheta');
const EventManager = require('../observer/Manager');
const expandRuleAntecedent = require('../utility/expandRuleAntecedent');
const variableArrayRename = require('../utility/variableArrayRename');
const constraintCheck = require('../utility/constraintCheck');

function Engine(nodes) {
  let _maxTime = 20;
  let _fluents = {};
  let _actions = {};
  let _events = {};

  let _engineEventManager = new EventManager();

  let _terminators = [];
  let _initiators = [];
  let _updaters = [];
  let _observations = {};

  let _program = new Program(nodes);
  let _goals = [];

  let _activeFluents = new LiteralTreeMap();
  let _possibleActions = new LiteralTreeMap();
  let _currentTime = 0;

  let _lastStepActions = [];
  let _lastStepObservations = [];

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

  let builtInProcessors = {
    'maxTime/1': (val) => {
      _maxTime = val.evaluate();
    },

    'fluent/1': (val) => {
      let fluent = val;
      try {
        fluent = fluentSyntacticSugarProcessing(fluent);
      } catch (_) {
        throw new Error('Unexpected value "' + val.toString() + '" in fluent/1 argument');
      }
      _fluents[fluent.getId()] = fluent;
    },
    'fluents/1': (val) => {
      if (!(val instanceof List)) {
        throw new Error('Value for fluents/1 expected to be a list.');
      }
      val.flatten().forEach((literal) => {
        try {
          builtInProcessors['fluent/1'].apply(null, [literal]);
        } catch (_) {
          throw new Error('Unexpected value "' + literal.toString() + '" in fluents/1 array argument');
        }
      });
    },

    'action/1': (val) => {
      let literal = val;
      try {
        literal = actionSyntacticSugarProcessing(literal);
      } catch (_) {
        throw new Error('Unexpected value "' + val.toString() + '" in action/1 argument');
      }
      _actions[literal.getId()] = true;
      _possibleActions.add(literal);
    },
    'actions/1': (val) => {
      if (!(val instanceof List)) {
        throw new Error('Value for actions/1 expected to be a list.');
      }
      val.flatten().forEach((literal) => {
        try {
          builtInProcessors['action/1'].apply(null, [literal]);
        } catch (_) {
          throw new Error('Unexpected value "' + literal.toString() + '" in actions/1 array argument');
        }
      });
    },

    'event/1': (val) => {
      let literal = val;
      try {
        literal = actionSyntacticSugarProcessing(literal);
      } catch (_) {
        throw new Error('Unexpected value "' + val.toString() + '" in event/1 argument');
      }
      _events[literal.getId()] = true;
    },
    'events/1': (val) => {
      if (!(val instanceof List)) {
        throw new Error('Value for events/1 expected to be a list.');
      }
      val.flatten().forEach((literal) => {
        try {
          builtInProcessors['event/1'].apply(null, [literal]);
        } catch (_) {
          throw new Error('Unexpected value "' + literal.toString() + '" in events/1 array argument');
        }
      });
    },

    'initially/1': (val) => {
      if (val instanceof List) {
        val.flatten().forEach((v) => {
          builtInProcessors['initially/1'].apply(null, [v]);
        });
        return;
      }
      if (val instanceof Value) {
        let name = val.evaluate();
        _activeFluents.add(new Functor(name, [new Value(1)]));
        return;
      }
      let initialFluent = new Functor(val.getName(), val.getArguments().concat([new Value(1)]));
      _activeFluents.add(initialFluent);
    },

    'terminates/2': (actionArg, fluentArg) => {
      let action = actionArg;
      let fluent = fluentArg;

      if (action instanceof Value) {
        action = new Functor(action.evaluate(), []);
      }

      action = actionSyntacticSugarProcessing(action);

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
    },

    'initiates/2': (actionArg, fluentArg) => {
      let action = actionArg;
      let fluent = fluentArg;

      if (action instanceof Value) {
        action = new Functor(action.evaluate(), []);
      }

      action = actionSyntacticSugarProcessing(action);

      if (_actions[action.getId()] === undefined) {
        throw new Error('Action "' + action.toString() + '" was not previously declared in action/1 or actions/1.');
      }

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent initiator as a literal, the action must have the last argument as the time variable.');
      }

      fluent = fluentSyntacticSugarProcessing(fluent, lastArgument);

      if (_fluents[fluent.getId()] === undefined) {
        throw new Error('Fluent "' + fluent.getId() + '" was not previously declared in fluent/1 or fluents/1.');
      }
      _initiators.push({ action: action, fluent: fluent });
    },

    'updates/3': (actionArg, terminatingFluentArg, initiatingFluentArg) => {
      let action = actionArg;
      let terminatingFluent = terminatingFluentArg;
      let initiatingFluent = initiatingFluentArg;

      if (action instanceof Value) {
        action = new Functor(action.evaluate(), []);
      }

      action = actionSyntacticSugarProcessing(action);

      if (_actions[action.getId()] === undefined) {
        throw new Error('Action "' + action.toString() + '" was not previously declared in action/1 or actions/1.');
      }

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent initiator as a literal, the action must have the last argument as the time variable.');
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
    },

    'observe/2': (fluent, time) => {
      if (!(time instanceof Value)) {
        throw new Error('Time given to observe/2 must be a value.');
      }
      try {
        builtInProcessors['observe/3'].apply(null, [fluent, time, new Value(Number(time.evaluate()) + 1)]);
      } catch (_) {
        throw new Error('Invalid fluent value given for observe/2.');
      }
    },
    'observe/3': (action, startTime, endTime) => {
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
      let literal = action;
      try {
        literal = actionSyntacticSugarProcessing(literal);
      } catch (_) {
        throw new Error('Invalid action value given for observe/3');
      }
      if (_observations[sTime] === undefined) {
        _observations[sTime] = [];
      }

      _observations[sTime].push({
        action: literal,
        endTime: eTime
      });
    }
  };

  let processFacts = function processFacts() {
    _program.getFacts().forEach((fact) => {
      let id = fact.getId();
      if (builtInProcessors[id] === undefined) {
        return;
      }
      builtInProcessors[id].apply(null, fact.getArguments());
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
      expandRuleAntecedent(ruleResult, antecedent, [], _program.getProgram());
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

  let findFluentActors = function findFluentActors(action, builtInFunctorProvider, timeStepFacts) {
    let initiated = [];
    let terminated = [];

    _updaters.forEach((u) => {
      let theta = Unifier.unifies([[u.action, action]]);
      if (theta === null) {
        return;
      }

      let factThetaSet = timeStepFacts.unifies(u.old.substitute(theta));
      factThetaSet.forEach((pair) => {
        let currentTheta = compactTheta(theta, pair.theta);

        let oldFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, u.old.substitute(currentTheta));
        oldFluentSet.forEach((oldFluent) => {
          terminated.push(oldFluent);
        });

        let newFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, u.new.substitute(currentTheta));
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
      let oldFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, t.fluent.substitute(theta));
      oldFluentSet.forEach((oldFluent) => {
        terminated.push(oldFluent);
      });
    });

    _initiators.forEach((i) => {
      let theta = Unifier.unifies([[i.action, action]]);
      if (theta === null) {
        return;
      }

      let newFluentSet = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, i.fluent.substitute(theta));
      newFluentSet.forEach((newFluent) => {
        initiated.push(newFluent);
      });
    });

    return {
      t: terminated,
      i: initiated
    };
  };

  let processObservations = function processObservations(builtInFunctorProvider, timeStepFacts) {
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
      let result = findFluentActors(action, builtInFunctorProvider, timeStepFacts);
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

  let actionsSelector = function actionsSelector(goalTrees, possibleActions, program, builtInFunctorProvider, facts) {
    let recursiveSelector = function (actionsSoFar, l) {
      if (l >= goalTrees.length) {
        if (actionsSoFar.length === 0) {
          return new LiteralTreeMap();
        }
        if (!constraintCheck(program, builtInFunctorProvider, facts, actionsSoFar)) {
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
      goalTree.forEachCandidateActions(program, builtInFunctorProvider, facts, possibleActions, (candidateActions) => {
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

  /*
    Perform Cycle
  */
  let performCycle = function performCycle(currentFluents) {
    let nextTime = _currentTime + 1;

    let actions = Object.keys(_actions);

    let rules = _program.getRules();
    let program = _program.getProgram();
    let facts = _program.getFacts();
    let executedActions = new LiteralTreeMap();

    let result = {
      terminated: [],
      initiated: [],
      activeActions: []
    };

    let updatedState = new LiteralTreeMap();
    currentFluents.forEach((literal) => {
      updatedState.add(updateTimableFunctor(literal, nextTime));
    });

    let builtInFunctorProvider = new BuiltInFunctorProvider((literal) => {
      return Resolutor.findUnifications(literal, [facts, currentFluents, executedActions]);
    });

    // update with observations
    let observationResult = processObservations(builtInFunctorProvider, updatedState);
    observationResult.activeObservations.forEach((observation) => {
      executedActions.add(observation);
    });
    result.terminated = observationResult.terminated.concat(result.terminated);
    result.initiated = observationResult.initiated.concat(result.initiated);

    // to handle time for this iteration
    let currentTimePossibleActions = new LiteralTreeMap();
    let timeTheta = {
      $T1: new Value(_currentTime),
      $T2: new Value(_currentTime + 1)
    };
    _possibleActions.forEach((l) => {
      currentTimePossibleActions.add(l.substitute(timeTheta));
    });

    // decide which actions from set of candidate actions to execute
    let selectedActions = actionsSelector(_goals, currentTimePossibleActions, program, builtInFunctorProvider, [facts, currentFluents, executedActions]);
    if (selectedActions === null) {
      selectedActions = [];
    }
    // process selected actions
    selectedActions.forEach((l) => {
      if (executedActions.contains(l)) {
        return;
      }
      result.activeActions.push(l);
      let actors = findFluentActors(l, builtInFunctorProvider, updatedState);
      result.terminated = result.terminated.concat(actors.t);
      result.initiated = result.initiated.concat(actors.i);
      let selectedLiterals = Resolutor.handleBuiltInFunctorArgumentInLiteral(builtInFunctorProvider, l);
      selectedLiterals.forEach((literal) => {
        executedActions.add(literal);
      });
    });

    let deltaTerminated = new LiteralTreeMap();
    let deltaInitiated = new LiteralTreeMap();
    result.terminated.forEach((terminatedFluent) => {
      // updatedState.forEach((fluent) => {
      //   if (Unifier.unifies([[fluent, terminatedFluent]]) !== null) {
      deltaTerminated.add(terminatedFluent);
      //   }
      // });
    });

    result.initiated.forEach((initiatedFluent) => {
      if (!deltaTerminated.remove(initiatedFluent)) {
        deltaInitiated.add(updateTimableFunctor(initiatedFluent, nextTime));
      }
    });

    deltaTerminated.forEach((fluent) => {
      updatedState.remove(fluent);
    });

    deltaInitiated.forEach((fluent) => {
      updatedState.add(fluent);
    });

    let builtInFunctorProvider2 = new BuiltInFunctorProvider((literal) => {
      return Resolutor.findUnifications(literal, [facts, updatedState, executedActions]);
    });

    // preparation for next cycle

    // build goal clauses for each rule
    // we need to derive the partially executed rule here too
    let newRules = processRules(rules, _goals, isTimable, builtInFunctorProvider2, [facts, updatedState, executedActions]);
    _program.updateRules(newRules);

    let newGoals = [];
    _goals.forEach((goalTree) => {
      let evaluationResult = goalTree.evaluate(program, isTimable, builtInFunctorProvider2, [facts, updatedState, executedActions]);
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

      newGoals.push(goalTree);
      // goal tree has not been resolved, so let's persist the tree
      // to the next cycle
    });
    _goals = newGoals;

    _lastStepActions = result.activeActions;
    _lastStepObservations = observationResult.activeObservations;
    return updatedState;
  };

  this.getCurrentTime = function getCurrentTime() {
    return _currentTime;
  };

  this.getLastStepActions = function getLastStepActions() {
    return _lastStepActions.map(action => action.toString());
  };

  this.getLastStepObservations = function getLastStepObservations() {
    return _lastStepObservations.map(action => action.toString());
  };

  this.getActiveFluents = function getActiveFluents() {
    let fluents = [];
    _activeFluents.forEach((fluent) => {
      fluents.push(fluent.toString());
    });
    return fluents;
  };

  this.step = function step() {
    _engineEventManager.notify('preStep', this);
    if (_maxTime !== null && _currentTime >= _maxTime) {
      return;
    }
    let nextStepActiveFluents = performCycle(_activeFluents);
    _activeFluents = nextStepActiveFluents;
    _currentTime += 1;
    _engineEventManager.notify('postStep', this);
  };

  this.run = function run() {
    if (_currentTime >= _maxTime) {
      return null;
    }
    let result = [];
    _engineEventManager.notify('run', this);
    while (_currentTime < _maxTime) {
      this.step();
      result.push({
        time: _currentTime,
        fluents: this.getActiveFluents(),
        actions: this.getLastStepActions(),
        observations: this.getLastStepObservations()
      });
    }
    return result;
  };

  this.runContinuous = function runContinuous(intervalArg) {
    let interval = intervalArg;
    if (intervalArg === undefined) {
      interval = 150;
    }
    _maxTime = null;
    _engineEventManager.notify('runContinuous', this);
    setInterval(() => {
      this.step();
    }, interval);
  };

  this.on = function on(event, listener) {
    _engineEventManager.addListener(event, listener);
    return this;
  };

  this.observe = function(observation) {
    if (_observations[_currentTime] === undefined) {
      _observations[_currentTime] = [];
    }
    _observations[_currentTime].push({
      action: actionSyntacticSugarProcessing(observation),
      endTime: _currentTime + 1
    });
  };

  this.reset = function reset() {

  };

  // we preprocess some of the built-in processors by looking at the facts
  // of the program.
  processFacts();
  preProcessRules();
}

module.exports = Engine;

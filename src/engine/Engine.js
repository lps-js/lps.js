const Clause = require('./Clause');
const Functor = require('./Functor');
const LiteralTreeMap = require('./LiteralTreeMap');
const Resolutor = require('./Resolutor');
const Program = require('./Program');
const Unifier = require('./Unifier');
const Value = require('./Value');
const Variable = require('./Variable');

function Engine(nodes) {
  let _maxTime = 20;
  let _fluents = {};
  let _actions = {};

  let _terminators = [];
  let _initiators = [];
  let _observations = {};

  let _program = new Program(nodes);

  let _activeFluents = new LiteralTreeMap();
  let _currentTime = 1;

  let _lastStepActions = [];
  let _lastStepObservations = [];

  let timableSyntacticSugarProcessing = function timableSyntacticSugarProcessing(literalArg, timingVariableArg) {
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

  let eventSyntacticSugarProcessing = function eventSyntacticSugarProcessing(literalArg) {
    let literal = literalArg;
    let timingVariable1 = new Variable('T1');
    let timingVariable2 = new Variable('T2');
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
        fluent = timableSyntacticSugarProcessing(fluent);
      } catch (_) {
        throw new Error('Unexpected value "' + val.toString() + '" in fluent/1 argument');
      }
      _fluents[fluent.getId()] = fluent;
    },
    'fluents/1': (val) => {
      if (!(val instanceof Array)) {
        throw new Error('Value for fluents/1 expected to be an array.');
      }
      val.forEach((literal) => {
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
        literal = timableSyntacticSugarProcessing(literal);
      } catch (_) {
        throw new Error('Unexpected value "' + val.toString() + '" in action/1 argument');
      }
      _actions[literal.getId()] = true;
    },
    'actions/1': (val) => {
      if (!(val instanceof Array)) {
        throw new Error('Value for actions/1 expected to be an array.');
      }
      val.forEach((literal) => {
        try {
          builtInProcessors['action/1'].apply(null, [literal]);
        } catch (_) {
          throw new Error('Unexpected value "' + literal.toString() + '" in actions/1 array argument');
        }
      });
    },

    'initially/1': (val) => {
      if (val instanceof Array) {
        val.forEach((v) => {
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

      action = timableSyntacticSugarProcessing(action);

      if (_actions[action.getId()] === undefined) {
        throw new Error('Action "' + action.toString() + '" was not previously declared in action/1 or actions/1.');
      }

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent terminator as a literal, the action must have the last argument as the time variable.');
      }

      fluent = timableSyntacticSugarProcessing(fluent, lastArgument);

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

      action = timableSyntacticSugarProcessing(action);

      if (_actions[action.getId()] === undefined) {
        throw new Error('Action "' + action.toString() + '" was not previously declared in action/1 or actions/1.');
      }

      let actionArguments = action.getArguments();
      let lastArgument = actionArguments.length > 0 ? actionArguments[actionArguments.length - 1] : null;
      if (actionArguments.length === 0 || !(lastArgument instanceof Variable)) {
        throw new Error('When declaring a fluent initiator as a literal, the action must have the last argument as the time variable.');
      }

      fluent = timableSyntacticSugarProcessing(fluent, lastArgument);

      if (_fluents[fluent.getId()] === undefined) {
        throw new Error('Fluent "' + fluent.getId() + '" was not previously declared in fluent/1 or fluents/1.');
      }
      _initiators.push({ action: action, fluent: fluent });
    },

    'observe/2': (fluent, time) => {
      if (!(time instanceof Value)) {
        throw new Error('Time given to observe/2 must be a value.');
      }
      try {
        builtInProcessors['observe/3'].apply(null, [fluent, time, time + 1]);
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
        literal = timableSyntacticSugarProcessing(literal);
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

  let findFluentActors = function findFluentActors(action) {
    let initiated = [];
    let terminated = [];

    _terminators.forEach((t) => {
      let theta = Unifier.unifies([[t.action, action]]);
      if (theta === null) {
        return;
      }

      terminated.push(t.fluent.substitute(theta));
    });

    _initiators.forEach((i) => {
      let theta = Unifier.unifies([[i.action, action]]);
      if (theta === null) {
        return;
      }

      initiated.push(i.fluent.substitute(theta));
    });

    return {
      t: terminated,
      i: initiated
    };
  };

  let performResolution = function performResolution(currentFluents) {
    let nextTime = _currentTime + 1;

    let actions = Object.keys(_actions);

    let activeEvents = [];
    let activeActions = [];
    let activeObservations = [];

    let terminated = [];
    let initiated = [];

    if (_observations[_currentTime] !== undefined) {
      // process observations
      let theta = { $T: _currentTime };
      _observations[_currentTime].forEach((ob) => {
        let action = ob.action;
        activeObservations.push(action.substitute(theta));
        let result = findFluentActors(action);
        terminated = terminated.concat(result.t);
        initiated = initiated.concat(result.i);

        if (ob.endTime > nextTime) {
          if (_observations[nextTime] === undefined) {
            _observations[nextTime] = [];
          }
          _observations[nextTime].push(ob);
        }
      });
    }

    let rulesWithFluents = _program.getRules();
    let programWithFluents = _program.getProgram();
    currentFluents.forEach((fluent) => {
      programWithFluents.push(new Clause([fluent], []));
      rulesWithFluents.push(new Clause([fluent], []));
    });

    currentFluents.forEach((fluent) => {
      let activatedEvents = Resolutor.query(rulesWithFluents, fluent, actions);
      activatedEvents.forEach((event) => {
        let query = event.actions.map(x => new Functor(x.action, x.arguments));
        activeEvents = activeEvents.concat(query);
      });
    });

    activeEvents.forEach((event) => {
      let strategies = Resolutor.reverseQuery(programWithFluents, null, event, actions);
      let numStrategies = strategies.length;
      for (let i = 0; i < numStrategies; i += 1) {
        let strategy = strategies[i];
        let isStrategyAccepted = true;
        strategy.actions.forEach((entry) => {
          // TODO: need to check for action constraints.
          let action = new Functor(entry.action, entry.arguments);
          let actionConstraintCheck = Resolutor.query(programWithFluents, action, []);
          if (actionConstraintCheck === null) {
            isStrategyAccepted = false;
            return;
          }
          isStrategyAccepted = true;
          let result = findFluentActors(action);
          action = updateTimableFunctor(action, nextTime);
          activeActions.push(action);
          terminated = terminated.concat(result.t);
          initiated = initiated.concat(result.i);
        });
        if (isStrategyAccepted) {
          return;
        }
      }
      throw new Error('No strategy executed for an active event ' + event.toString() + ' at time ' + _currentTime);
    });

    let updatedState = new LiteralTreeMap();
    currentFluents.forEach((fluent) => {
      updatedState.add(updateTimableFunctor(fluent, nextTime));
    });

    let deltaTerminated = new LiteralTreeMap();
    let deltaInitiated = new LiteralTreeMap();
    terminated.forEach((terminatedFluent) => {
      updatedState.forEach((fluent) => {
        if (Unifier.unifies([[fluent, terminatedFluent]]) !== null) {
          deltaTerminated.add(fluent);
        }
      });
    });

    initiated.forEach((initiatedFluent) => {
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

    _lastStepActions = activeActions;
    _lastStepObservations = activeObservations;
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
    if (_currentTime > _maxTime) {
      return;
    }
    let nextStepActiveFluents = performResolution(_activeFluents);
    _activeFluents = nextStepActiveFluents;
    _currentTime += 1;
  };

  this.run = function run() {
    if (_currentTime > _maxTime) {
      return null;
    }
    let result = [];

    result.push({
      time: _currentTime,
      activeFluents: this.getActiveFluents()
    });

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

  this.reset = function reset() {

  };

  // we preprocess some of the built-in processors by looking at the facts
  // of the program.
  processFacts();
}

module.exports = Engine;

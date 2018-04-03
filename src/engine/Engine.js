const Clause = require('./Clause');
const Functor = require('./Functor');
const Resolutor = require('./Resolutor');
const Program = require('./Program');
const Unifier = require('./Unifier');
const Value = require('./Value');
const Variable = require('./Variable');

function Engine(nodes) {
  let _maxTime = 20;
  let _fluents = {};
  let _actions = {};
  let _events = [];

  let _terminators = [];
  let _initiators = [];
  let _observations = [];

  let _program = new Program(nodes);

  let _activeFluents = {};
  let lastStepActions = [];
  let _currentTime = 1;

  let timableSyntacticSugarProcessing = function timableSyntacticSugarProcessing(literalArg, timingVariableArg) {
    let literal = literalArg;
    let timingVariable = timingVariableArg;
    if (timingVariable === undefined) {
      timingVariable = new Variable('T');
    }
    if (literal instanceof Value) {
      literal = new Functor(literal.evaluate(), []);
    }
    if (!(literal instanceof Functor)) {
      throw new Exception('Unexpected value "' + literal.toString() + '" provided for a literal.');
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
      throw new Exception('Unexpected value "' + literal.toString() + '" provided for an event literal.');
    }
    literal = new Functor(literal.getName(), literal.getArguments().concat(additionalArguments));
    return literal;
  };

  let updateTimableFunctor = function updateTimableFunctor(literal, time) {
    if (!(literal instanceof Functor) || literal.getArguments() === 0) {
      throw new Error('Invalid timable functor provided');
    }
    let arguments = literal.getArguments();
    arguments[arguments.length - 1] = new Value(time);
    return new Functor(literal.getName(), arguments);
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
      let argCount = val.getArguments().length + 1;
      _actions[literal.getId()] = true;
    },
    'actions/1': (val) => {
      if (!(val instanceof Array)) {
        throw new Error('Value for actions/1 expected to be an array.');
      }
      val.forEach((literal) => {
        try{
          builtInProcessors['action/1'].apply(null, [literal]);
        } catch (_) {
          throw new Error('Unexpected value "' + literal.toString() + '" in actions/1 array argument');
        }
      });
    },

    'event/1': (val) => {
      let event = val;
      try {
        event = eventSyntacticSugarProcessing(event);
      } catch (_) {
        throw new Error('Unexpected value "' + val.toString() + '" in event/1 argument');
      }
      _events.push(event.getId());
    },
    'events/1': (val) => {
      if (!(val instanceof Array)) {
        throw new Error('Value for events/1 expected to be an array.');
      }
      val.forEach((literal) => {
        try {
          builtInProcessors['event/1'].apply(null, [literal]);
        } catch (_) {
          throw new Error('Unexpected value "' + literal.toString() + '" in events/1 array argument');
        }
      });
    },

    'initially/1': (val) => {
      if (val instanceof Value) {
        let name = val.evaluate();
        _activeFluents[name + '/1'] = new Functor(name, [new Value(1)]);
        return;
      }
      let initialFluent = new Functor(val.getName(), val.getArguments().concat([new Value(1)]));
      _activeFluents[initialFluent.getId()] = initialFluent;
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
    }
  };

  let processFacts = function processFacts() {
    _program.getFacts().forEach((fact) => {
      let id = fact.getId();

      if (!builtInProcessors[id]) {
        return;
      }
      builtInProcessors[id].apply(null, fact.getArguments());
    });
  };

  processFacts();

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
      let theta = Unifier.unifies([[t.action, action]]);
      if (theta === null) {
        return;
      }

      initiated.push(t.fluent.substitute(theta));
    });

    return {
      t: terminated,
      i: initiated
    };
  };

  let performResolution = function performResolution(currentlyActiveFluents, newState) {
    let unresolvedRules = [].concat(_program.getRules());
    let unresolvedActions = [];

    let possibleEvents = [].concat(_events);
    let actions = Object.keys(_actions);

    let activeEvents = [];
    let activeActions = [];

    Object.keys(currentlyActiveFluents).forEach((key) => {
      let fluent = currentlyActiveFluents[key];

      let activatedEvents = Resolutor.query(_program.getRules(), null, fluent, possibleEvents);
      activatedEvents.forEach((event) => {
        let query = event.actions.map(x => new Functor(x.action, x.arguments));
        activeEvents = activeEvents.concat(query);
      });
    });

    let nextTime = _currentTime + 1
    let terminated = [];
    let initiated = [];
    activeEvents.forEach((event) => {
      let strategies = Resolutor.reverseQuery(_program.getProgram(), null, event, actions);
      strategies.forEach((strategy) => {
        strategy.actions.forEach((entry) => {
          let action = new Functor(entry.action, entry.arguments);
          let result = findFluentActors(action);
          if (result.i.length > 0 || result.t.length > 0) {
            action = updateTimableFunctor(action, nextTime);
            activeActions.push(action);
          }
          terminated = terminated.concat(result.t);
          initiated = initiated.concat(result.i);
        });
      });
    });

    terminated.forEach((terminatedFluent) => {
      Object.keys(newState).forEach((key) => {
        let fluent = newState[key];
        if (Unifier.unifies([[fluent, terminatedFluent]]) !== null) {
          delete newState[key];
        }
      });
    });
    initiated.forEach((initiatedFluent) => {
      newState[initiatedFluent.getId()] = initiatedFluent;
    });

    Object.keys(newState).forEach((key) => {
      newState[key] = updateTimableFunctor(newState[key], nextTime);
    });

    lastStepActions = activeActions;
  };

  this.getCurrentTime = function getCurrentTime() {
    return _currentTime;
  };

  this.getLastStepActions = function getLastStepActions() {
    return lastStepActions.map(action => action.toString());
  }

  this.getActiveFluents = function getActiveFluents() {
    let fluents = [];
    Object.keys(_activeFluents).forEach((key) => {
      fluents.push(_activeFluents[key].toString());
    });
    return fluents;
  };

  this.step = function step() {
    if (_currentTime > _maxTime) {
      return;
    }
    let nextStepActiveFluents = {};
    Object.keys(_activeFluents).forEach((key) => {
      nextStepActiveFluents[key] = _activeFluents[key];
    });
    performResolution(_activeFluents, nextStepActiveFluents);
    _activeFluents = nextStepActiveFluents;
    _currentTime += 1;
  };
}

module.exports = Engine;

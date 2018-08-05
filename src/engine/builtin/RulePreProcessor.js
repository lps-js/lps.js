const Clause = lpsRequire('engine/Clause');
const Variable = lpsRequire('engine/Variable');
const variableArrayRename = lpsRequire('utility/variableArrayRename');
const expandRuleAntecedent = lpsRequire('utility/expandRuleAntecedent');

let rulePreProcessor = function rulePreProcessor(engine, program) {
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
        if (consequentVariables[vName] !== undefined
            && commonVariables[vName] === undefined) {
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
      tupleConsequent = tupleConsequent.map((literal) => {
        return literal.substitute(replacement).substitute(renameTheta);
      });
      newRules.push(new Clause(tupleConsequent, tuple.literalSet));
    });
  });
  program.updateRules(newRules);
};

module.exports = rulePreProcessor;

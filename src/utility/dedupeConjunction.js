const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');

function dedupeConjunction(conjunction) {
  let map = new LiteralTreeMap();
  let result = []
  conjunction.forEach((conjunct) => {
    if (map.contains(conjunct)) {
      return;
    }
    map.add(conjunct);
    result.push(conjunct);
  });
  return result;
};

module.exports = dedupeConjunction;

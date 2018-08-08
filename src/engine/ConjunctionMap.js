const LiteralTreeMap = lpsRequire('engine/LiteralTreeMap');

function ConjunctionMap() {
  let _conjunctions = [];

  this.add = function add(conjunction, value) {
    let map = new LiteralTreeMap();
    conjunction.forEach((conjunct) => {
      map.add(conjunct);
    });
    _conjunctions.push([map.size(), map, value]);
  };

  this.get = function get(conjunction) {
    let result;
    for (let i = 0; i < _conjunctions.length; i += 1) {
      let pair = _conjunctions[i];
      let containMismatch = false;
      if (conjunction.length !== pair[0]) {
        continue;
      }
      for (let j = 0; j < conjunction.length; j += 1) {
        let conjunct = conjunction[j];
        if (!pair[1].contains(conjunct)) {
          containMismatch = true;
          break;
        }
      }
      if (!containMismatch) {
        result = pair[2];
        break;
      }
    }
    return result;
  };
}

module.exports = ConjunctionMap;

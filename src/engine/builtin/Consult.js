const Program = require('../../parser/Program');
const Value = require('../Value');

const consultLiteral1 = Program.literal('consult(File)');

function Consult(targetProgram) {
  this.consultFile = function consultFile(file) {
    return Program.fromFile(file)
      .then((loadedProgram) => {
        targetProgram.augment(loadedProgram);
        return Promise.resolve(loadedProgram);
      });
  };

  let processConsultDeclarations = function processConsultDeclarations(currentProgram) {
    let promises = [];
    let result = [];
    result = result.concat(currentProgram.query(consultLiteral1));
    result.forEach((r) => {
      if (r.theta.File === undefined || !(r.theta.File instanceof Value)) {
        return;
      }
      let promise = this.consultFile(r.theta.File.evaluate())
        .then((loadedProgram) => {
          // recursively process consult declarations in loaded targetProgram
          return processConsultDeclarations.call(this, loadedProgram);
        });
      promises.push(promise);
    });
    return Promise.all(promises);
  };

  this.process = function process() {
    return processConsultDeclarations.call(this, targetProgram);
  };
}

Consult.processDeclarations = function processDeclarations(program) {
  let consult = new Consult(program);
  return consult.process();
};

module.exports = Consult;

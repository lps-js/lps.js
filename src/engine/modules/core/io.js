const functors = {
  'write/1': function (term) {
    console.log(String(term));
    return [{ theta: {} }];
  }
};
module.exports = functors;

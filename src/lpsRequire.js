module.exports = function lpsRequire(name) {
  // let pathname = path.join(__dirname, name);
  return require(`${__dirname}/${name}`);
};

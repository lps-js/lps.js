module.exports = {
  "env": {
    "es6": true,
    "node": true,
    "mocha": true
  },
  "plugins": [
    "deprecate",
    "promise"
  ],
  "extends": "airbnb-base/legacy",
  "rules": {
    "no-console": ["warn", { "allow": ["log"] }],
    "no-underscore-dangle": "off",
    "func-names": "off",
    "no-continue": "off",
    "global-require": "off"
  },
  "overrides": [
    {
      files: "*.test.js",
      rules: {
        "no-unused-expressions": "off"
      }
    }
  ],
  "globals": {
    "lpsRequire": false
  },
  "parserOptions": {
    "sourceType": "module"
  }
};

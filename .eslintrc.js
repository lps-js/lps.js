module.exports = {
  "env": {
    "es6": true,
    "node": true,
    "jest": true
  },
  "extends": "airbnb-base/legacy",
  "rules": {
    "no-console": ["warn", { "allow": ["log"] }],
    "no-underscore-dangle": "off"
  },
  "parserOptions": {
    "sourceType": "module"
  }
};

module.exports = {
  "env": {
    "es6": true,
    "node": true,
    "mocha": true
  },
  "extends": "airbnb-base/legacy",
  "rules": {
    "no-console": ["warn", { "allow": ["log"] }],
    "no-underscore-dangle": "off",
    "func-names": "off",
  },
  overrides: [
    {
      files: "*.test.js",
      rules: {
        "no-unused-expressions": "off"
      }
    }
  ],
  "parserOptions": {
    "sourceType": "module"
  }
};

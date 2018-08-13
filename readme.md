# lps.js
[![Build Status](https://travis-ci.com/mauris/lps.js.svg?token=nG8zWvvk7DtqtXkE8Tff&branch=master)](https://travis-ci.com/mauris/lps.js)

[LPS](http://lps.doc.ic.ac.uk/) is a logic-based programming language and production system implemented in JavaScript based on research by Robert Kowalski and Fariba Sadri at Imperial College London.

# Usage

There are several ways lps.js can be used.

## As CLI Command
lps.js provides several CLI tools to run and interact with LPS programs. For instructions on how to use these CLI tools, see the [lps-cli](https://github.com/mauris/lps-cli) repository.

## As npm Library
To use lps.js as a npm library, you need to have a `package.json` ready for your application (see [npm documentation](https://docs.npmjs.com/getting-started/using-a-package.json)), then run the following command:

    $ npm install --save lps
    
Once installed, you may access lps.js in your JS code by `require()` or `import`. 

````javascript
const LPS = require('lps');
LPS.loadFile('program.lps')
  .then((engine) => {
      engine.run();
  });
````

## As Library in Browser Context
If you are using Webpack for bundling your client-side application, you can use lps.js as a normal Node.js library via `require()` or `import`. Webpack will automatically bundle lps.js into your client-side application.

Alternatively if you are not using Webpack, you may download a pre-bundled lps.js from [Releases](https://github.com/mauris/lps.js/releases) and use a `<script>` tag to include lps.js as a library in your web pages. If you wish, you may choose to create the bundled for browser lps.js yourself by following instructions below.

### Bundling for Browser

To bundle lps.js for the browser, you need to have `npm` installed on your system, and also to install all development dependencies described in `package.json` by running `npm install`. Once all development dependencies are installed, you can create a bundled version of lps.js for the browser by running:

    $ npm run build:browser

The output bundle JS file will then be found at `dist/lps.bundle.js`.


# Tests

To run all tests on lps.js, you you need to have `npm` installed on your system, and also to install all development dependencies described in `package.json` by running `npm install`. Once all development dependencies are installed, start full tests by running:

    $ npm test
    
If you only wish to run tests on lps.js using LPS programs, you may use the command:

    $ npm run test:programs


# Resources

- http://lps.doc.ic.ac.uk/ - LPS Homepage
- https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form
- http://shodhganga.inflibnet.ac.in/bitstream/10603/36935/12/12_chapter%204.pdf
- http://leodemoura.github.io/files/ICSM98.pdf
- http://parsingintro.sourceforge.net
- http://www.doc.ic.ac.uk/~rak/papers/LPS%20revision.pdf
- http://www.doc.ic.ac.uk/~rak/papers/KELPS%202015.pdf
- https://www.doc.ic.ac.uk/~rak/papers/LPS%20with%20CLOUT.pdf
- https://www.doc.ic.ac.uk/~rak/papers/newbook.pdf

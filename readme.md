# lps.js
[![Build Status](https://travis-ci.com/mauris/lps.js.svg?token=nG8zWvvk7DtqtXkE8Tff&branch=master)](https://travis-ci.com/mauris/lps.js)

[LPS](http://lps.doc.ic.ac.uk/) is a logic-based programming language and production system developed by [Robert Kowalski](https://www.doc.ic.ac.uk/~rak/) and [Fariba Sadri](https://www.doc.ic.ac.uk/~fs/) at [Imperial College London](https://www.imperial.ac.uk/). [lps.js](https://github.com/mauris/lps.js) is the LPS runtime implemented in JavaScript.

### What is a production system?

A [Production System](https://en.wikipedia.org/wiki/Production_system_(computer_science)) is a processes a set of rules that consists of conditions and actions. Whenever the conditions are met, the actions in the rules are executed by the production system. For example, the following pseudocode represents a rule (also known as production):

    IF hungry THEN locate(Food), eat(Food).

Production systems typically have the following:

- A working memory / database that contains
	- facts and its current state
	- inference rules
- An inference engine / interpreter

A typical production system that uses IF-THEN rules provides forward reasoning: Whenever the conditions of the rule hold in its knowledge, it actively tries to make the consequent of the rule true by executing the actions in the rule. External sensors and actions in the consequent can update the current state and thus triggering other rules as needed.

### What is LPS then?

LPS extends the notion of a production system by unifying both production rules and [logic programming](https://en.wikipedia.org/wiki/Logic_programming) into one single system. LPS also provides backward reasoning through the use of [SLD resolution](https://en.wikipedia.org/wiki/SLD_resolution), and logical clauses is in the form of `conclusion IF conditions`. In addition, facts and actions in LPS are timestamped. 

In LPS, the production rules can be seen as the goals of an agent while the logic program forms the beliefs of the agent. LPS can be used to model system dynamics, run simulations and build agent-oriented systems, multi-agent systems and teleo-reactive programs. 

### Atom Language Package

The syntax highlighting and autocomplete package for LPS supported by lps.js can be installed for Atom text editor. See https://github.com/mauris/language-lps for more details.

# Usage

### As CLI programs
lps.js provides several CLI programs to run and interact with LPS programs. For instructions on installation and how to use these CLI tools, see the [lps-cli](https://github.com/mauris/lps-cli) repository. Also see the [npm repository](https://www.npmjs.com/package/lps-cli).

### As npm Library
To use [lps.js as a npm library](npmjs.com/package/lps), you need to have a `package.json` ready for your application (see [npm documentation](https://docs.npmjs.com/getting-started/using-a-package.json)), then run the following command:

    $ npm install --save lps
    
Once installed, you may access lps.js in your JS code by `require()` or `import`. 

````javascript
const LPS = require('lps');
LPS.loadFile('program.lps')
  .then((engine) => {
      engine.run();
  });
````

### As Library in Browser Context
If you are using [Webpack](https://webpack.js.org/) for bundling your client-side application, you can use lps.js as a normal Node.js library via `require()` or `import`. Webpack will automatically bundle lps.js into your client-side application.

Alternatively if you are not using Webpack, you may download a pre-bundled lps.js (named `lps.bundle.js`) from [Releases](https://github.com/mauris/lps.js/releases) and use a `<script>` tag to include lps.js as a library in your web pages. If you wish, you may choose to create the bundled for browser lps.js yourself by following instructions below.

Once added to your web pages, the `LPS` object becomes globally accessible for use.

#### Bundling for Browser

To bundle lps.js for the browser, you need to have `npm` installed on your system, and also to install all development dependencies described in `package.json` by running `npm install`. Once all development dependencies are installed, you can create a bundled version of lps.js for the browser by running:

    $ npm run build:browser

The output bundle JS file will then be found at `dist/lps.bundle.js`.

### In LPS Studio

In addition to the other methods of running LPS programs, it is possible to write visualisation for LPS programs in [LPS Studio](https://github.com/mauris/lps-studio). See the other repository for more information on how to download, run and write LPS visualisation in LPS Studio.


# Tests

To run all tests on lps.js, you you need to have `npm` installed on your system, and also to install all development dependencies described in `package.json` by running `npm install`. Once all development dependencies are installed, start full tests by running:

    $ npm test
    
To only test the source code using the unit test suite, you may use the command:

	$ npm run test:source
    
Alternatively if you only wish to run tests on lps.js using LPS programs, you may use the command:

    $ npm run test:programs

# License

The lps.js implementation is open source and licensed under the BSD 3-Clause. The implementation is based on research and [Prolog implementation](https://bitbucket.org/lpsmasters/lps_corner) authored by [Robert Kowalski](https://www.doc.ic.ac.uk/~rak/), [Fariba Sadri](https://www.doc.ic.ac.uk/~fs/), [Miguel Calejo](http://calejo.com/) and [Jacinto Dávila](http://webdelprofesor.ula.ve/ingenieria/jacinto). The implementation of lps.js has also referenced David Wei's LPS implementation for his MSc Computer Science Individual Project and thesis at Imperial College London, supervised by Fariba Sadri and Krysia Broda, in 2015.

lps.js was implemented as part of [Sam Yong's](http://mauris.sg) MSc Computer Science Individual Project and thesis at Imperial College London in 2018.

# Resources

- [LPS Imperial College London DoC Website](http://lps.doc.ic.ac.uk/)
- [LPS Prolog Interpreter](https://bitbucket.org/lpsmasters/lps_corner)
- [Notes on how Parsers and Compilers work](http://parsingintro.sourceforge.net)
- [Computational Logic for Use in Teaching (CLOUT) with LPS](https://www.doc.ic.ac.uk/~rak/papers/LPS%20with%20CLOUT.pdf)
- Robert Kowalski and Fariba Sadri. Reactive Computing as Model Generation. New Generation Computing, 33(1):33–67, 2015 [link](http://www.doc.ic.ac.uk/~rak/papers/LPS%20revision.pdf)
- Robert Kowalski and Fariba Sadri. Programming in logic without logic programming. Theory and Practice of Logic Programming, 16:269–295, 2016. [link](http://www.doc.ic.ac.uk/~rak/papers/KELPS%202015.pdf)
- Robert Kowalski and Marek Sergot. A logic-based calculus of events. New Generation Computing, 4:67–94, 1986. [link](https://www.doc.ic.ac.uk/~rak/papers/event%20calculus.pdf)
- Robert Kowalski and Fariba Sadri. Towards a Logic-based Production System Language. Technical Report, Imperial College London, 2010. [link](https://www.doc.ic.ac.uk/~rak/papers/LPS.pdf)

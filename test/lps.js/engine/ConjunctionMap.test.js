/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const ConjunctionMap = lpsRequire('engine/ConjunctionMap');
const Functor = lpsRequire('engine/Functor');
const Value = lpsRequire('engine/Value');
const Variable = lpsRequire('engine/Variable');

const chai = require('chai');
const expect = chai.expect;

describe('ConjunctionMap', () => {
  describe('constructor', () => {
    it('should initialise the ConjunctionMap correctly', () => {
      let map = new ConjunctionMap();
      expect(map.add).to.be.a('function');
      expect(map.get).to.be.a('function');
      expect(map).to.be.instanceof(ConjunctionMap);
    });
  });

  describe('add() and get()', () => {
    it('should add conjunction to itself', () => {
      let map = new ConjunctionMap();
      let conjunction = [
        new Functor('act1', [new Value(5)]),
        new Functor('act2', [new Variable('A')])
      ];
      let value = {};
      map.add(conjunction, value);
      expect(map.get(conjunction)).to.be.equal(value);
    });

    it('should return undefined for non-existent conjunction', () => {
      let map = new ConjunctionMap();
      let conjunction = [
        new Functor('act1', [new Value(5)]),
        new Functor('act2', [new Variable('A')])
      ];
      expect(map.get(conjunction)).to.be.undefined;
    });

    it('should return undefined for part matching conjunction', () => {
      let map = new ConjunctionMap();
      let conjunction1 = [
        new Functor('act1', [new Value(5)]),
        new Functor('act2', [new Variable('A')])
      ];

      let conjunction2 = [
        new Functor('act1', [new Value(5)]),
        new Functor('act2', [new Variable('B')])
      ];
      let value = {};
      map.add(conjunction1, value);
      expect(map.get(conjunction1)).to.be.equal(value);
      expect(map.get(conjunction2)).to.be.undefined;
    });

    it('should return undefined for non-existent conjunction', () => {
      let map = new ConjunctionMap();
      let conjunction1 = [
        new Functor('act1', [new Value(5)]),
        new Functor('act2', [new Variable('A')])
      ];

      let conjunction2 = [
        new Functor('act1', [new Value(5)])
      ];
      let value = {};
      map.add(conjunction1, value);
      expect(map.get(conjunction1)).to.be.equal(value);
      expect(map.get(conjunction2)).to.be.undefined;
    });
  });
});

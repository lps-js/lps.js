/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const expandLiteral = lpsRequire('utility/expandLiteral');
const Functor = lpsRequire('engine/Functor');
const Clause = lpsRequire('engine/Clause');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const Program = lpsRequire('parser/Program');
const variableArrayRename = lpsRequire('utility/variableArrayRename');

const chai = require('chai');
const expect = chai.expect;

describe('expandLiteral', () => {
  it('should return correct expansion for simple case 1', () => {
    let clauses = [
      new Clause(
        Program.literalSet('head(X, Y)'),
        Program.literalSet('body1(X, Z), body2(Z, Y)')
      )
    ];

    let program = new Program();
    program.setClauses(clauses);

    let result = expandLiteral(Program.literal('head(1, 2)'), program, {});
    expect(result).to.be.an('array');
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('conjuncts');
    expect(result[0]).to.have.property('theta');
    expect(result[0].conjuncts).to.be.an('array');
    expect(result[0].conjuncts).to.have.length(2);
    expect(result[0].conjuncts[0]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[1]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[0].toString()).to.be.equal('body1(1, Z)');
    expect(result[0].conjuncts[1].toString()).to.be.equal('body2(Z, 2)');

    expect(result[0].theta).to.be.empty;
  });

  it('should return correct expansion with used variable names 3', () => {
    let clauses = [
      new Clause(
        Program.literalSet('head(X, Y)'),
        Program.literalSet('body1(X, Z), body2(Z, Y)')
      )
    ];

    let program = new Program();
    program.setClauses(clauses);

    let usedVariables = ['Z'];
    let renameTheta = variableArrayRename(usedVariables);

    let result = expandLiteral(Program.literal('head(1, 2)'), program, renameTheta);

    expect(result).to.be.an('array');
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('conjuncts');
    expect(result[0]).to.have.property('theta');
    expect(result[0].conjuncts).to.be.an('array');
    expect(result[0].conjuncts).to.have.length(2);
    expect(result[0].conjuncts[0]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[1]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[0].toString()).to.be.equal('body1(1, $_Z)');
    expect(result[0].conjuncts[1].toString()).to.be.equal('body2($_Z, 2)');

    expect(result[0].theta).to.be.empty;
  });

  it('should return correct expansion with used variable names 4', () => {
    let clauses = [
      new Clause(
        Program.literalSet('head(X, Y)'),
        Program.literalSet('body1(X, Z), body2(Z, Y)')
      )
    ];

    let program = new Program();
    program.setClauses(clauses);

    let usedVariables = ['X', 'Z'];
    let renameTheta = variableArrayRename(usedVariables);

    let result = expandLiteral(Program.literal('head(X, Z)'), program, renameTheta);

    expect(result).to.be.an('array');
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('conjuncts');
    expect(result[0]).to.have.property('theta');
    expect(result[0].conjuncts).to.be.an('array');
    expect(result[0].conjuncts).to.have.length(2);
    expect(result[0].conjuncts[0]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[1]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[0].toString()).to.be.equal('body1(X, $_Z)');
    expect(result[0].conjuncts[1].toString()).to.be.equal('body2($_Z, Z)');

    expect(result[0].theta).to.be.empty;
  });

  it('should return correct expansion for simple case 5', () => {
    let clauses = [
      new Clause(
        Program.literalSet('head(X, X)'),
        Program.literalSet('body1(X)')
      )
    ];

    let program = new Program();
    program.setClauses(clauses);

    let result = expandLiteral(Program.literal('head(A, B)'), program, {});

    expect(result).to.be.an('array');
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('conjuncts');
    expect(result[0]).to.have.property('theta');
    expect(result[0].conjuncts).to.be.an('array');
    expect(result[0].conjuncts).to.have.length(1);
    expect(result[0].conjuncts[0]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[0].toString()).to.be.equal('body1(A)');

    expect(result[0].theta).to.have.property('B');
    expect(result[0].theta.B).to.be.instanceof(Variable);
    expect(result[0].theta.B.evaluate()).to.be.equal('A');
  });

  it('should return correct expansion for simple case 6', () => {
    let clauses = [
      new Clause(
        Program.literalSet('head(X, X)'),
        Program.literalSet('body1(X)')
      )
    ];

    let program = new Program();
    program.setClauses(clauses);

    let result = expandLiteral(Program.literal('head(5, B)'), program, {});

    expect(result).to.be.an('array');
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('conjuncts');
    expect(result[0]).to.have.property('theta');
    expect(result[0].conjuncts).to.be.an('array');
    expect(result[0].conjuncts).to.have.length(1);
    expect(result[0].conjuncts[0]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[0].toString()).to.be.equal('body1(5)');

    expect(result[0].theta).to.have.property('B');
    expect(result[0].theta.B).to.be.instanceof(Value);
    expect(result[0].theta.B.evaluate()).to.be.equal(5);
  });

  it('should return correct expansion for simple case 7', () => {
    let clauses = [
      new Clause(
        Program.literalSet('head(X, X)'),
        Program.literalSet('body1(X)')
      )
    ];

    let program = new Program();
    program.setClauses(clauses);

    let result = expandLiteral(Program.literal('head(B, 5)'), program, {});

    expect(result).to.be.an('array');
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('conjuncts');
    expect(result[0]).to.have.property('theta');
    expect(result[0].conjuncts).to.be.an('array');
    expect(result[0].conjuncts).to.have.length(1);
    expect(result[0].conjuncts[0]).to.be.instanceof(Functor);
    expect(result[0].conjuncts[0].toString()).to.be.equal('body1(5)');

    expect(result[0].theta).to.have.property('B');
    expect(result[0].theta.B).to.be.instanceof(Value);
    expect(result[0].theta.B.evaluate()).to.be.equal(5);
  });
});

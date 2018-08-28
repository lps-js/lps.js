/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

const listenLiteral = ProgramFactory.literal('p2pListen(Port)');

const joinLiteral1 = ProgramFactory.literal('p2pJoin(NetworkId)');
const joinLiteral2 = ProgramFactory.literal('p2pJoin(NetworkId, Port)');
const joinLiteral3 = ProgramFactory.literal('p2pJoin(NetworkId, Address, Port)');

const defaultPort = 4100;
const defaultAddress = '127.0.0.1';

function P2PDeclarationProcessor(engine) {
  this.processListenDeclarations = function processListenDeclarations() {
    let result = [];
    result = result.concat(engine.query(listenLiteral));

    let port;
    result.forEach((r) => {
      if (r.theta.Port === undefined) {
        return;
      }

      port = r.theta.Port.evaluate();
    });

    return port;
  };

  this.processNetworkDeclarations = function processNetworkDeclarations() {
    let result = [];
    result = result.concat(engine.query(joinLiteral1));
    result = result.concat(engine.query(joinLiteral2));
    result = result.concat(engine.query(joinLiteral3));

    let networks = {};
    result.forEach((r) => {
      if (r.theta.NetworkId === undefined) {
        return;
      }

      let networkId = r.theta.NetworkId.evaluate();
      let address = defaultAddress;
      let port = defaultPort;

      if (r.theta.Address !== undefined) {
        address = r.theta.Address.evaluate();
      }

      if (r.theta.Port !== undefined) {
        port = r.theta.Port.evaluate();
      }

      networks[networkId] = {
        networkId: r.theta.NetworkId,
        address: address,
        port: port
      };
    });

    return networks;
  };
}

module.exports = P2PDeclarationProcessor;

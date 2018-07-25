const Program = require('../../../parser/Program');

const listenLiteral = Program.literal('p2pListen(Port)');

const joinLiteral1 = Program.literal('p2pJoin(NetworkId)');
const joinLiteral2 = Program.literal('p2pJoin(NetworkId, Port)');
const joinLiteral3 = Program.literal('p2pJoin(NetworkId, Address, Port)');

const defaultPort = 4100;
const defaultAddress = '127.0.0.1';

function P2PDeclarationProcessor(engine, program) {

  this.processListenDeclarations = function processListenDeclarations() {
    let result = [];
    result = result.concat(program.query(listenLiteral));

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
    result = result.concat(program.query(joinLiteral1));
    result = result.concat(program.query(joinLiteral2));
    result = result.concat(program.query(joinLiteral3));

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
        address: address,
        port: port
      };
    });

    return networks;
  };

}

module.exports = P2PDeclarationProcessor;

/*
  This file is part of the lps.js project, released open source under
  the BSD 3-Clause license. For more info, please see https://github.com/mauris/lps.js
 */

const lpsRequire = require('../../../lpsRequire');
const P2P2PDeclarationProcessor = lpsRequire('engine/modules/p2p/declaration');
const stringLiterals = lpsRequire('utility/strings');
const Functor = lpsRequire('engine/Functor');
const Variable = lpsRequire('engine/Variable');
const Value = lpsRequire('engine/Value');
const ProgramFactory = lpsRequire('parser/ProgramFactory');

const net = require('net');

const receiveEventLiteral = ProgramFactory.literal('p2pReceive(NetworkId, Peer, Message)');
const connectedEventLiteral = ProgramFactory.literal('p2pConnected(NetworkId)');
const peerConnectedEventLiteral = ProgramFactory.literal('p2pPeerConnected(NetworkId, node(Address, Port))');

const isPeerIdentifier = function isPeerIdentifier(peer) {
  if (!(peer instanceof Functor)) {
    return false;
  }

  if (peer.getId() !== 'node/2') {
    return false;
  }

  let functorArgs = peer.getArguments();
  if (!(functorArgs[0] instanceof Value)
      || !(functorArgs[1] instanceof Value)) {
    return false;
  }

  return true;
};

// eslint-disable-next-line no-unused-vars
module.exports = (engine, program) => {
  if (process.browser) {
    // in browserify mode
    throw new Error(stringLiterals(['modules', 'browserModeModuleLoadFailure'], ['p2p']));
  }
  // ensure that events are defined in the program so that developer do not
  // need to do it manually.
  program.defineEvent(receiveEventLiteral);
  program.defineEvent(connectedEventLiteral);
  program.defineEvent(peerConnectedEventLiteral);

  let declarationProcessor = new P2P2PDeclarationProcessor(engine);

  // check if a user-preferred port number is defined
  let listeningPort = declarationProcessor.processListenDeclarations();
  if (listeningPort === undefined) {
    // default to a random port
    listeningPort = 0;
  }

  // process network declarations
  let networks = declarationProcessor.processNetworkDeclarations();

  // start listening server
  const server = net.createServer((socket) => {
    socket.on('data', (buf) => {
      let data;
      try {
        data = JSON.parse(buf.toString('utf8'));
      } catch (e) {
        return;
      }

      if (data === undefined) {
        return;
      }

      let theta = {
        NetworkId: new Functor(data.networkId, []),
        Peer: new Functor('node', [new Value(socket.remoteAddress), new Value(data.port)]),
        Message: ProgramFactory.literal(data.message)
      };

      engine.observe(receiveEventLiteral.substitute(theta));
    });
  });

  server.on('error', (err) => {
    // TODO: log to universal logger instead
    // eslint-disable-next-line no-console
    console.error('[P2P Error] ' + err);
  });

  server.listen(listeningPort, () => {
    // update actual port in use, in case original listeningPort = 0
    listeningPort = server.address().port;

    // perform connection to each network defined
    Object.values(networks).forEach((networkArg) => {
      let network = networkArg;
      network.peers = [];
      let client = new net.Socket();

      client.connect(network.port, network.address, () => {
        let payload = {
          register: server.address().port
        };
        client.write(JSON.stringify(payload));
      });

      // update from tracking
      client.on('data', (data) => {
        let strData = data.toString('utf8');

        let info = JSON.parse(strData);
        let theta;

        if (info.peers !== undefined) {
          network.peers = info.peers;
          // initial connection
          theta = {
            NetworkId: network.networkId
          };
          engine.observe(connectedEventLiteral.substitute(theta));
        }

        if (info.newNode !== undefined) {
          network.peers.push(info.newNode);

          // new node connected, raise event for LPS
          theta = {
            NetworkId: network.networkId,
            Address: new Value(info.newNode[0]),
            Port: new Value(info.newNode[1])
          };
          engine.observe(peerConnectedEventLiteral.substitute(theta));
        }

        if (info.removeNode !== undefined) {
          network.peers = network.peers.filter((p) => {
            return p[0] !== info.removeNode[0]
              || p[1] !== info.removeNode[1];
          });
        }
      });

      network.client = client;
    });
  });

  let cleanUpConnections = () => {
    Object.values(networks).forEach((network) => {
      if (network.client) {
        network.client.destroy();
      }
    });
    server.close();
  };

  // assign engine event handlers to ensure clean up of connections
  engine.on('error', cleanUpConnections);
  engine.on('done', cleanUpConnections);

  let functors = {
    'p2pPeer/2': (networkIdArg, peer) => {
      let result = [];
      if (networkIdArg instanceof Variable) {
        Object.keys(networks)
          .forEach((network) => {
            let r = functors['p2pPeers/2'](new Value(network), peer);
            result = result.concat(r);
          });
        return result;
      }

      let networkId = networkIdArg.evaluate();
      let network = networks[networkId];

      if (peer instanceof Variable) {
        let variableName = peer.evaluate();
        network.peers.forEach((p) => {
          let theta = {};
          theta[variableName] = new Functor('node', [new Value(p[0]), new Value(p[1])]);
          result.push({
            theta: theta
          });
        });
        return result;
      }

      if (!isPeerIdentifier(peer)) {
        return result;
      }

      let functorArgs = peer.getArguments();
      let address = functorArgs[0].evaluate();
      let port = functorArgs[1].evaluate();

      for (let i = 0; i < network.peers.length; i += 1) {
        let p = network.peers[i];
        if (p[0] === address && p[1] === port) {
          result.push({ theta: {} });
          break;
        }
      }
      return result;
    },

    'p2pSend/3': (networkIdArg, peer, messageArg) => {
      let networkId = networkIdArg.evaluate();

      if (!isPeerIdentifier(peer)) {
        return [];
      }

      let message = messageArg.evaluate();

      let functorArgs = peer.getArguments();
      let address = functorArgs[0].evaluate();
      let port = functorArgs[1].evaluate();

      let client = new net.Socket();
      client.connect(port, address, () => {
        let payload = {
          networkId: networkId,
          port: listeningPort,
          message: message
        };
        client.write(JSON.stringify(payload));
        client.destroy();
      });
      return [{ theta: {} }];
    }
  };

  engine.getFunctorProvider().load(functors);
};

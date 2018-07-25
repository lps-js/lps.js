#!/usr/bin/env node
const net = require('net');

const args = process.argv.slice(2);
const port = args.length > 0 ? args[0] : 4100;

let nodes = [];
let addresses = [];

const server = net.createServer((socket) => {
  console.log('[Info] ' + socket.remoteAddress + ' has connected.');
  
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
    if (data.register !== undefined) {
      let entry = [socket.remoteAddress, data.register];
      socket.write(JSON.stringify({ peers: addresses }));
      nodes.forEach((node) => {
        node.write(JSON.stringify({ newNode: entry }))
      });
      nodes.push(socket);
      addresses.push(entry);
      console.log('[Info] ' + entry + ' has registered.');
    }
  });
  
  socket.on('end', () => {
    let indices = [];
    
    // announce node exit
    nodes.forEach((node, idx) => {
      if (node === socket) {
        indices.push(idx);
        return;
      }
    });
    
    indices.forEach((index) => {
      let address = addresses[index];
      nodes = nodes.slice(0, index).concat(nodes.slice(index + 1));
      addresses = addresses.slice(0, index).concat(addresses.slice(index + 1));
      
      nodes.forEach((node) => {
        node.write(JSON.stringify({ removeNode: address }));
      });
    });
    
    console.log('[Info] ' + socket.remoteAddress + ' has left.');
  });
});

server.on('error', (err) => {
  console.error('[Error] ' + err);
});

server.listen(port);

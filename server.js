const http = require('http');
const faye = require('faye');

const port = parseInt(process.env.FAYE_PORT);
const key = process.env.FAYE_KEY;
const endpoint_path = process.env.FAYE_ENDPOINT_PATH;

const server = http.createServer();
const bayeux = new faye.NodeAdapter({ mount: endpoint_path });

var serverAuth = {
  incoming: function (message, callback) {
    // Let non-subscribe messages through
    if (message.channel.match(/^\/meta\//)) {
      return callback(message);
    }

    // Check the token
    if (message['data'] && message['data']['token'] == key) {
      delete message['data']['token'];
    } else {
      message['error'] = 'No client posting is allowed';
    }

    // Call the server back now we're done
    callback(message);
  }
};
var fayeLogger = {
  incoming: function (message, callback) {
    if (!message.channel.match(/^\/meta\//)) {
      if (process.env.NODE_ENV == 'development') {
        console.log(`-> ${JSON.stringify(message)}`);
      }
    }

    // Call the server back now we're done
    callback(message);
  },
  outgoing: function (message, callback) {
    if (!message.channel.match(/^\/meta\//)) {
      if (process.env.NODE_ENV == 'development') {
        console.log(`<- ${JSON.stringify(message)}`);
      }
    }

    // Call the server back now we're done
    callback(message);
  }
};

// bayeux.on('handshake', function(client_id) {
//   console.log(`!! handshake of ${client_id}`)
// })
// bayeux.on('subscribe', function(client_id, channel) {
//   console.log(`!! subscription of ${client_id} for ${channel}`)
// })
// bayeux.on('publish', function(client_id, channel, data) {
//   console.log(`!! publish of ${client_id} for ${channel} with ${JSON.stringify(data)}`)
// })

bayeux.addExtension(serverAuth);
bayeux.addExtension(fayeLogger);
bayeux.attach(server);


if (process.env.NODE_ENV == 'development') {
  console.log('starting faye');
}

server.listen(port);

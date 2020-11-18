require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const SocketIO = require('socket.io');

const port = process.env.PORT || 8080;

// Always use UTC Timezone
process.env.TZ = 'Etc/UTC';

const pages = {};
const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', express.static('public'));

// Socket Callback Handlers
const onSocketConnection = (socket) => console.log('Socket Connected');
const onSocketDisconnection = (riderId) => console.log('Socket Disconnected');
const onSocketStreamData = (data) => console.log(data);


const createSocketServer = (httpServer) => {
  const socketServer = SocketIO(httpServer, {
    path: '/socketData',
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false,
  });

  // Set Event Listener
  socketServer.on('connection', (socket, data) => {
    let tabId = null;
    onSocketConnection(socket);
    socket.on('disconnect', () => onSocketDisconnection(tabId));
    socket.on('socketData', (event) => {
      if (tabId == null) {
        tabId = event.tabId; // Remember tab ID for when disconnection happens
        console.log(`Socket Data Established for Tab ID - ${tabId}`);
      }
      onSocketStreamData(event);
    });
  });
};


// Create Application HTTP Server
const httpServer = http.createServer(app);
createSocketServer(httpServer);


httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
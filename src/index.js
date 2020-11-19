require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const SocketIO = require('socket.io');
const uuid = require('uuid').v4;

const testerService = require('./tester');

const port = process.env.PORT || 8080;

// Always use UTC Timezone
process.env.TZ = 'Etc/UTC';

const sockets = {};
const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', express.static('public'));

app.post('/testers', async (req, res) => {
  try {
    const testerId = await testerService.createTester();
    res.json({ testerId });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.delete('/testers/:testerId', async (req, res) => {
  try {
    const { testerId } = req.params;
    await testerService.destroyTester(testerId);
    res.send('ok');
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.post('/testers/:testerId/tabs', async (req, res) => {
  try {
    const { testerId } = req.params;
    const { token } = req.body;
    const tabId = await testerService.openTab(testerId, token);
    res.json({ testerId, tabId });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.delete('/testers/:testerId/tabs/:tabId', async (req, res) => {
  try {
    const { testerId, tabId } = req.params;
    await testerService.closeTab(testerId, tabId);
    res.send('ok');
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.post('/testers/:testerId/tabs/:tabId/publishers', async (req, res) => {
  try {
    const { testerId, tabId } = req.params;
    if (sockets[tabId] == null) {
      throw new Error('Tab Socket does not exist');
    }

    const { video, audio } = req.body;
    const publisherId = uuid();

    const socket = sockets[tabId];
    socket.emit('userAction', {
      action: 'start_publisher',
      id: publisherId,
      video,
      audio,
    });
    res.json({ testerId, tabId, publisherId });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.delete('/testers/:testerId/tabs/:tabId/publishers/:publisherId', async (req, res) => {
  try {
    const { tabId, publisherId } = req.params;
    if (sockets[tabId] == null) {
      throw new Error('Tab Socket does not exist');
    }

    const socket = sockets[tabId];
    socket.emit('userAction', {
      action: 'stop_publisher',
      id: publisherId,
    });
    res.send('ok');
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.put('/testers/:testerId/tabs/:tabId/publishers/:publisherId', async (req, res) => {
  try {
    const { tabId, publisherId } = req.params;
    if (sockets[tabId] == null) {
      throw new Error('Tab Socket does not exist');
    }

    const { video, audio } = req.body;
    const socket = sockets[tabId];
    socket.emit('userAction', {
      action: 'stream_control',
      id: publisherId,
      video,
      audio,
    });
    res.send('ok');
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

// Socket Callback Handlers
const onSocketConnection = (socket) => console.log('Socket Connected');
const onSocketDisconnection = (tabId) => {
  console.log('Socket Disconnected');
  delete sockets[tabId];
};
const onSocketData = (data) => console.log(data);
const onSocketError = (tabId, error) => {
  console.error(`Error in Browser: ${tabId}`);
  console.error(error);
}


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
        sockets[tabId] = socket;
        console.log(`Socket Data Established for Tab ID - ${tabId}`);
      }
      onSocketData(event);
    });
    socket.on('socketError', (event) => {
      onSocketError(tabId, event);
    });
  });
};


// Create Application HTTP Server
const httpServer = http.createServer(app);
createSocketServer(httpServer);


httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
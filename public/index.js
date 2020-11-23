let socket;
let params;
let credentials;
let tabId;

let otSession;

const publishers = {};

const waitForReady = (callback) => {
  /in/.test(document.readyState) ? setTimeout('waitForReady('+callback+')', 9) : callback()
};

const reportError = (error) => {
  console.error(error);
  if (socket != null) {
    socket.emit('socketError', {
      code: error.code,
      message: error.message,
      response: error.response,
    });
  }
}

const reportLog = (message) => {
  console.log(message);
  if (socket != null) {
    socket.emit('socketLog', { message });
  }
}

const getParameters = () => {
  const searchString = window.location.search || '?';
  const query = searchString.slice(1);
  const components = query.split(/&/g);
  const params = {};

  for (let i = 0; i < components.length; i += 1) {
    const component = components[i];
    const splitIndex = component.indexOf('=');
    if (splitIndex >= 0) {
      const rawKey = component.slice(0, splitIndex);
      const rawValue = component.slice(splitIndex + 1);
      const key = decodeURIComponent(rawKey);
      const value = decodeURIComponent(rawValue);
      params[key] = value;
    }
  }

  return params;
};

const getCredentials = () => {
  if (params == null || params.token == null || params.token === '') {
    return null;
  }

  let apiKey = null;
  let sessionId = null;
  const token = params.token;

  // Decode Token
  const b64Encoded = token.slice(4);
  const buffer = atob(b64Encoded);
  const b64Decoded = buffer.toString('ascii');

  // Read Decoded Data for Api Key and Session Id
  const components = b64Decoded.split(/&|:/g);
  const data = {};
  for (let i = 0; i < components.length; i += 1) {
    const component = components[i];
    const firstEqualIndex = component.indexOf('=');
    if (firstEqualIndex <= 0) {
      continue;
    }

    const key = component.slice(0, firstEqualIndex);
    const value = component.slice(firstEqualIndex + 1);
    if (key === 'partner_id') {
      apiKey = value;
    } else if (key === 'session_id') {
      sessionId = value;
    }
  }

  return {
    apiKey,
    sessionId,
    token,
  };
};

const initializeSession = () => {
  otSession = OT.initSession(credentials.apiKey, credentials.sessionId);
  reportLog('Session created');
};

const connectSession = () => new Promise((resolve, reject) => {
  otSession.connect(credentials.token, (error) => {
    if (error) {
      reject(error);
      return;
    }

    reportLog('Session connected');
    resolve();
  });
});

const startCameraPublisher = async (id, publishAudio, publishVideo) => {
  try {
    const publisher = OT.initPublisher('container', {
      publishAudio, publishVideo, name: id,
      resolution: '320x240',
      frameRate: 15,
    }, (error) => {
      if (error) {
        reportLog(error);
        return;
      }

      otSession.publish(publisher, (error2) => {
        if (error2) {
          reportLog(error2);
          return;
        }

        reportLog(`Publisher '${id}' published`);
      });
    });

    publishers[id] = publisher;
    reportLog(`Publisher '${id}' added`);
    return Promise.resolve(id);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const stopPublisher = async (id) => {
  if (publishers[id] != null) {
    otSession.unpublish(publishers[id]);
    reportLog(`Publisher '${id}' unpublished`);
    delete publishers[id];
    reportLog(`Publisher '${id}' removed`);
  }
};

const enableVideo = (id, enabled) => {
  if (publishers[id] != null) {
    publishers[id].publishVideo(enabled);
    reportLog(`Publisher '${id}' video enabled: ${enabled}`);
  }
}

const enableAudio = (id, enabled) => {
  if (publishers[id] != null) {
    publishers[id].publishAudio(enabled);
    reportLog(`Publisher '${id}' audio enabled: ${enabled}`);
  }
}

const handleUserAction = (userAction) => {
  const { action, id, audio, video } = userAction;

  if (action === 'start_publisher') {
    const publishAudio = audio == null ? true : audio;
    const publishVideo = video == null ? true : video;
    startCameraPublisher(id, publishAudio, publishVideo);
  } else if (action === 'stop_publisher') {
    stopPublisher(id);
  } else if (action === 'stream_control') {
    if (audio != null) {
      enableAudio(id, audio);
    }

    if (video != null) {
      enableVideo(id, video);
    }
  }
}

const runSession = async () => {
  try {
    initializeSession();
    await connectSession();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
}


waitForReady(() => {
  const socketHost = window.location.origin;
  const path = '/socketData';
  socket = io(socketHost, { path });
  socket.on('userAction', (event) => handleUserAction(event));
  reportLog('Socket Created');

  params = getParameters();
  credentials = getCredentials();
  tabId = params.tabId;

  socket.emit('socketData', { tabId });

  runSession()
    .then(() => reportLog('done'))
    .catch(error => reportError(error));
});
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
  console.log('Session created');
};

const connectSession = () => new Promise((resolve, reject) => {
  otSession.connect(credentials.token, (error) => {
    if (error) {
      reject(error);
      return;
    }

    console.log('Session connected');
    resolve();
  });
});

const startCameraPublisher = async (id, publishAudio, publishVideo) => {
  try {
    const publisher = OT.initPublisher('container', { publishAudio, publishVideo, name: id }, (error) => {
      if (error) {
        console.error(error);
        return;
      }

      otSession.publish(publisher, (error2) => {
        if (error2) {
          console.error(error2);
          return;
        }

        console.log(`Publisher '${id}' published`);
      });
    });

    publishers[id] = publisher;
    console.log(`Publisher '${id}' added`);
    return Promise.resolve(id);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const stopPublisher = async (id) => {
  if (publishers[id] != null) {
    otSession.unpublish(publishers[id]);
    console.log(`Publisher '${id}' unpublished`);
    delete publishers[id];
    console.log(`Publisher '${id}' removed`);
  }
};

const enableVideo = (id, enabled) => {
  if (publishers[id] != null) {
    publishers[id].publishVideo(enabled);
    console.log(`Publisher '${id}' video enabled: ${enabled}`);
  }
}

const enableAudio = (id, enabled) => {
  if (publishers[id] != null) {
    publishers[id].publishAudio(enabled);
    console.log(`Publisher '${id}' audio enabled: ${enabled}`);
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
  console.log('Socket Created');

  params = getParameters();
  credentials = getCredentials();
  tabId = params.tabId;

  socket.emit('socketData', { tabId });

  runSession()
    .then(() => console.log('done'))
    .catch(error => reportError(error));
});
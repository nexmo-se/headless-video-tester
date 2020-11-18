let socket;
let params;
let credentials;

let otSession;

const publishers = {};

const waitForReady = (callback) => {
  /in/.test(document.readyState) ? setTimeout('waitForReady('+callback+')', 9) : callback()
};

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

const startCameraPublisher = async (publishAudio, publishVideo, name) => {
  try {
    let sanitizedName = name;
    if (publishers[name] != null) {
      console.log(`Publisher with name '${name}' already existed`);
      let count = 1;
      while (publisher[`${name}${count}`] != null) {
        count += 1;
      }

      sanitizedName = `${name}${count}`;
      console.log(`Using generated name: ${sanitizedName}`);
    }

    const publisher = OT.initPublisher('container', { publishAudio, publishVideo, name: sanitizedName }, (error) => {
      if (error) {
        console.error(error);
        return;
      }

      otSession.publish(publisher, (error2) => {
        if (error2) {
          console.error(error2);
          return;
        }

        console.log(`Publisher '${sanitizedName}' published`);
      });
    });

    publishers[sanitizedName] = publisher;
    console.log(`Publisher '${sanitizedName}' added`);
    return Promise.resolve(sanitizedName);
  } catch (error) {
    return Promise.reject(error);
  }
};

const stopPublisher = async (name) => {
  if (publishers[name] != null) {
    otSession.unpublish(publishers[name]);
    console.log(`Publisher '${name}' unpublished`);
    delete publishers[name];
    console.log(`Publisher '${name}' removed`);
  }
};

const enableVideo = (name, enabled) => {
  if (publishers[name] != null) {
    publishers[name].publishVideo(enabled);
    console.log(`Publisher '${name}' video enabled: ${enabled}`);
  }
}

const enableAudio = (name, enabled) => {
  if (publishers[name] != null) {
    publishers[name].publishAudio(enabled);
    console.log(`Publisher '${name}' audio enabled: ${enabled}`);
  }
}

const runSession = async () => {
  try {
    initializeSession();
    await connectSession();
  } catch (error) {
    return Promise.reject(error);
  }
}


waitForReady(() => {
  const socketHost = window.location.origin;
  const path = '/socketData';
  socket = io(socketHost, { path });
  console.log('Socket Created');

  params = getParameters();
  credentials = getCredentials();
  console.log(credentials);

  runSession()
    .then(() => console.log('done'))
    .catch(error => console.error(error));
});
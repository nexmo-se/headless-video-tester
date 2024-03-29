require('dotenv').config();

const axios = require('axios');

const HOST = process.env.HOST;
const TOKEN = process.env.TOKEN;

browsers = {};
tabs = {};
publishers = {};

const startBrowser = async (key) => {
  try {
    if (browsers[key] == null) {
      console.log(`Starting Browser ${key}`);
      const url = `${HOST}/testers`;
      const body = {
        videoFile: `${parseInt(key || '0', 10) % 10}`,
        audioFile: `${parseInt(key || '0', 10) % 10}`,
      };

      const response = await axios.post(url, body);
      const { testerId } = response.data;
      browsers[key] = testerId;
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const stopBrowser = async (key) => {
  try {
    await stopTab(key);

    if (browsers[key] == null) {
      console.log(`Browser ${key} does not exist, not stopping browser`);
      return Promise.resolve();
    }

    console.log(`Stopping Browser ${key}`);
    const browser = browsers[key];
    const url = `${HOST}/testers/${browser}`;
    const response = await axios.delete(url);

    delete browsers[key];
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const startTab = async (key) => {
  try {
    await startBrowser(key);
    const browser = browsers[key];

    if (tabs[key] == null) {
      console.log(`Starting Tab ${key}`);
      const url = `${HOST}/testers/${browser}/tabs`;
      const body = { token: TOKEN };

      const response = await axios.post(url, body);
      const { tabId } = response.data;
      tabs[key] = tabId;
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const stopTab = async (key) => {
  try {
    await stopPublisher(key);

    if (tabs[key] == null) {
      console.log(`Tab ${key} does not exist, not stopping tab`);
      return Promise.resolve();
    }

    console.log(`Stopping Tab ${key}`);
    const browser = browsers[key];
    const tab = tabs[key];
    const url = `${HOST}/testers/${browser}/tabs/${tab}`;
    const response = await axios.delete(url);

    delete tabs[key];
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const startPublisher = async (key, audio = true, video = true) => {
  try {
    await startBrowser(key);
    const browser = browsers[key];

    await startTab(key);
    const tab = tabs[key];

    if (publishers[key] == null) {
      console.log(`Starting Publisher ${key}`);
      const url = `${HOST}/testers/${browser}/tabs/${tab}/publishers`;
      const body = { video, audio };
      const response = await axios.post(url, body);
      const { publisherId } = response.data;
      publishers[key] = publisherId;
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const stopPublisher = async (key) => {
  try {
    if (publishers[key] == null) {
      console.log(`Publisher ${key} does not exist, not stopping publisher`);
      return Promise.resolve();
    }

    console.log(`Stopping Publisher ${key}`);
    const browser = browsers[key];
    const tab = tabs[key];
    const publisher = publishers[key];
    const url = `${HOST}/testers/${browser}/tabs/${tab}/publishers/${publisher}`;
    const response = await axios.delete(url);

    delete publishers[key];
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const controlPublisher = async (key, value = { audio: true, video: true }) => {
  try {
    if (publishers[key] == null) {
      console.log(`Publisher ${key} does not exist, not controlling publisher`);
      return Promise.resolve();
    }

    console.log(`Setting Publisher ${key} audio to ${value.audio}, video to ${value.video}`);
    const browser = browsers[key];
    const tab = tabs[key];
    const publisher = publishers[key];
    const url = `${HOST}/testers/${browser}/tabs/${tab}/publishers/${publisher}`;
    await axios.put(url, value);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

const wait = (duration) => new Promise(resolve => setTimeout(resolve, duration));

const closeAllBrowsers = async () => {
  try {
    const keys = Object.keys(browsers);
    const promises = keys.map(key => stopBrowser(key));
    await Promise.all(promises);
    console.log('All Browsers Closed');
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

Promise.resolve()
  // List of Actions
  .then(() => startPublisher('1', false, true))
  .then(() => startPublisher('2', false, true))
  .then(() => startPublisher('3', false, true))
  .then(() => startPublisher('4', false, true))
  .then(() => startPublisher('5', false, true))
  .then(() => startPublisher('6', false, true))
  .then(() => startPublisher('7', false, true))
  .then(() => startPublisher('8', false, true))
  .then(() => startPublisher('9', false, true))
  .then(() => startPublisher('10', false, true))
  .then(() => wait(60000))


  // All Done or Caught
  .then(() => {
    console.log('done');
    return closeAllBrowsers();
  })
  .catch(error => {
    console.error(error);
    return closeAllBrowsers();
  });
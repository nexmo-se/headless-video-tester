const uuid = require('uuid').v4;
const puppeteer = require('puppeteer');

const port = process.env.PORT || 8080;
const sampleVideoPath = process.env.VIDEO_FILE_PATH;
const sampleAudioPath = process.env.AUDIO_FILE_PATH;
const sampleVideoFile = process.env.VIDEO_FILE;
const sampleAudioFile = process.env.AUDIO_FILE;

const openBrowser = async (tester, videoFile = sampleVideoFile, audioFile = sampleAudioFile) => {
  try {
    const videoPath = `${sampleVideoPath}/${videoFile}.y4m`;
    const audioPath = `${sampleAudioPath}/${audioFile}.y4m`;

    console.log(`Browser Video: ${videoPath}`);
    console.log(`Browser Audio: ${audioPath}`);

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-experimental-web-platform-features',
      '--disable-infobars',
      '--ignore-certificate-errors',
      '--allow-http-screen-capture',
      '--enable-usermedia-screen-capturing',
      '--allow-file-access-from-files',
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-video-capture=${videoPath}`,
      `--use-file-for-fake-audio-capture=${audioPath}`,
      '--autoplay-policy=no-user-gesture-required',
    ];

    const options = {
      headless: false,
      ignoreDefaultArgs: ['--mute-audio'],
      args,
    };

    if (process.env.CHROMIUM_PATH && process.env.CHROMIUM_PATH !== '') {
      options.executablePath = process.env.CHROMIUM_PATH;
    }

    // Launch Browser
    console.log('Launching Browser');
    tester.browser = await puppeteer.launch(options);
    tester.tabs = {};
    console.log('Browser Launched');

    return Promise.resolve(tester);
  } catch (error) {
    return Promise.reject(error);
  }
};

const closeBrowser = async (tester) => {
  try {
    if (tester.browser == null) {
      return Promise.reject(new Error('No browser in tester'));
    }

    // Close Remaining Tabs
    await closeAllTabs(tester);

    // Close Browser
    console.log('Closing Browser');
    await tester.browser.close();
    console.log('Browser Closed');

    // Clean Up
    delete tester.browser;
    delete tester.tabs;
    return Promise.resolve(tester);
  } catch (error) {
    return Promise.reject(error);
  }
};

const openTab = async (tester, token) => {
  try {
    if (tester.browser == null) {
      return Promise.reject(new Error('No browser in tester'));
    }

    // Create Tab
    const tabId = uuid();
    const tab = await tester.browser.newPage();
    console.log(`Tab Created`);

    // Open Page
    console.log('Tab Page Opening');
    const url = `http://localhost:${port}?tabId=${tabId}&token=${token}`;
    await tab.goto(url);
    console.log(`Tab Page Opened`);

    // Add Tab to Tester
    tester.tabs[tabId] = tab;
    return Promise.resolve(tabId);
  } catch (error) {
    return Promise.reject(error);
  }
};

const closeTab = async (tester, tabId) => {
  try {
    if (tester.tabs == null || tester.tabs[tabId] == null) {
      return Promise.reject(new Error('No such tab in tester'));
    }

    // Close Tab
    const tab = tester.tabs[tabId];
    console.log(`Closing tab [${tabId}]`);
    await tab.close({ runBeforeUnload: false });
    console.log(`Tab Closed [${tabId}]`);

    delete tester.tabs[tabId];
    return Promise.resolve(tester);
  } catch (error) {
    return Promise.reject(error);
  }
};

const closeAllTabs = async (tester) => {
  try {
    // Close Tabs
    console.log(`Closing All Tabs`);
    const promises = Object.keys(tester.tabs)
      .map(tabId => closeTab(tester, tabId));
    await Promise.all(promises);
    console.log('All Tabs Closed');
    return Promise.resolve(tester);
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = {
  openBrowser,
  closeBrowser,

  openTab,
  closeTab,
  closeAllTabs,
};

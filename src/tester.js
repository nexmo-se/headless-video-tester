const uuid = require('uuid').v4;

const browserService = require('./browser');

const testers = {};

const createTester = async (videoFile, audioFile) => {
  try {
    const testerId = uuid();
    const tester = { id: testerId };
    
    console.log(`${testerId} - Creating Tester`);

    await browserService.openBrowser(tester, videoFile, audioFile);
    testers[testerId] = tester;

    console.log(`${testerId} - Tester Created`);
    return Promise.resolve(testerId);
  } catch (error) {
    return Promise.reject(error);
  }
};

const destroyTester = async (testerId) => {
  try {
    const tester = testers[testerId];
    if (tester == null) {
      return Promise.reject(new Error('Tester does not exist'));
    }

    console.log(`${testerId} - Destroying Tester`);
    await browserService.closeBrowser(tester);
    delete testers[testerId];
    console.log(`${testerId} - Tester Destroyed`);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const openTab = async (testerId, token) => {
  try {
    const tester = testers[testerId];
    if (tester == null) {
      return Promise.reject('Tester does not exist');
    }

    console.log(`${testerId} - Opening Tester Tab`);
    const tabId = await browserService.openTab(tester, token);
    console.log(`${testerId} - Tester Tab Opened [${tabId}]`);
    return Promise.resolve(tabId);
  } catch (error) {
    return Promise.reject(error);
  }
};

const closeTab = async (testerId, tabId) => {
  try {
    const tester = testers[testerId];
    if (tester == null) {
      return Promise.reject('Tester does not exist');
    }

    console.log(`${testerId} - Closing Tester Tab [${tabId}]`);
    await browserService.closeTab(tester, tabId);
    console.log(`${testerId} - Tester Tab Closed [${tabId}]`);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = {
  createTester,
  destroyTester,

  openTab,
  closeTab,
};

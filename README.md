# Simple Opentok Remote Tester
Simple Opentok Remote Tester

### Prerequisite (Ubuntu 20.04)
# NPM and Node (via NVM)
1. run `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash`
2. run `nvm list-remote` to view all available versions
3. run `nvm install VERSION` (replace `VERSION` with the version you want, ideally latest LTS)

# Browser (Option 1 - Chromium)
1. run `sudo apt install chromium-browser`
2. run `which chromium` to get the path to the executable
3. use this path in the env

# Browser (Option 2 - Google Chrome)
1. run `sudo apt install gdebi-core wget`
2. run `wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb`
3. run `sudo gdebi google-chrome-stable_current_amd64.deb`
4. run `which google-chrome` to get the path to the executable
5. use this path in the env

### Install (Local)
1. clone this repo
2. run `npm install`
3. setup `.env` according to `.env.example`
4. run `npm start`

# Concept
This application consists of 3 layers:
- Tester (headless chromium browser)
- Tab
- Publisher

Each tester can only have a single source of video and audio, as they have to be specified upon launching the tester (browser).

Each tester may open multiple tabs, each of them may (but need not) connect to a different Opentok session using a different Opentok token.

Each tab may start multiple publishers (currently on camera, using the video/audio source provided by the browser).

Screenshare and custom content are not supported in this version.


# Using the application

## Tester (Browser)

### Starting a Tester
*Request*

URL: `/testers`

Method: `POST`

*Response*

```
{
  'testerId': STRING // Instance ID of the tester
}
```

### Stopping a Tester
Note: the tester will not stop automatically, so it is crucial to manage your tester resource by stopping them after use.

*Request*

URL: `/testers/:testerId`

Method: `DELETE`

## Tab

### Opening a Tab
*Request*

URL: `/testers/:testerId/tabs`

Method: `POST`

Body:

```
{
  'token': STRING // Token to join to the Opentok Session
}
```

*Response*

```
{
  'testerId': STRING, // Instance ID of the tester
  'tabId': STRING // Instance ID of the tab
}
```

### Closing a Tab
*Request*

URL: `/testers/:testerId/tabs/:tabId`

Method: `DELETE`

## Publisher (Camera only)

### Publishing a Publisher
*Request*

URL: `/testers/:testerId/tabs/:tabId/publishers`

Method: `POST`

Body:

```
{
  'video': BOOLEAN, // whether to publish video
  'audio': BOOLEAN // whether to publish audio
}
```

*Response*

```
{
  'testerId': STRING, // Instance ID of the tester
  'tabId': STRING, // Instance ID of the tab
  'publisherId: STRING // Instance ID of the publisher
}
```

### Unpublishing a Publisher
*Request*

URL: `/testers/:testerId/tabs/:tabId/publishers/:publisherId`

Method: `DELETE`

### Controlling a Publisher
*Request*

URL: `/testers/:testerId/tabs/:tabId/publishers/:publisherId`

Method: `PUT`

Body:

```
{
  'video': BOOLEAN, // whether to publish video
  'audio': BOOLEAN // whether to publish audio
}
```
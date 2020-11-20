# Simple Opentok Remote Tester
Simple Opentok Remote Tester

### Setup (Local)
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
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */

import { BrowserWindow, app, ipcMain, net, protocol, session } from 'electron';
import authService from './auth-service';
import { createAppWindow } from './app';
import { createAuthWindow, createLogoutWindow } from './auth';
import path from 'path';
import { resolveHtmlPath } from './util';



let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

async function createWindow () {
  try {
    await authService.refreshTokens()
    mainWindow = await createAppWindow();
  } catch (err) {
    console.log('err', err)
    await createAuthWindow();
  }
}



/**
 * Add event listeners...
 */


// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.



app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// app.on('activate', async () => {
//   protocol.registerSchemesAsPrivileged([
//     { scheme: 'sqlpal', privileges: { supportFetchAPI: true, allowServiceWorkers: true, bypassCSP: true, corsEnabled: true, secure: true, standard: true, stream: true  } },
//     { scheme: 'file', privileges: { supportFetchAPI: true, allowServiceWorkers: true, bypassCSP: true, corsEnabled: true, secure: true, standard: true, stream: true  } },
//     // { scheme: 'https', privileges: { supportFetchAPI: true, allowServiceWorkers: true, bypassCSP: true, corsEnabled: true, secure: true, standard: true, stream: true } },
//   ])
// });

app
  .whenReady()
  .then(() => {
    // Handle IPC messages from the renderer process.
    ipcMain.handle('auth:get-profile', authService.getProfile);
    ipcMain.on('auth:log-out', () => {
      BrowserWindow.getAllWindows().forEach(window => window.close());
      createLogoutWindow();
    });

    // session.defaultSession.webRequest.onBeforeRequest({ urls: [`file:*`] },(details, callback) => {
    //   console.log(details.url)
    //   callback({
    //       redirectURL: resolveHtmlPath('index.html')
    //   })
    // });

    


    // protocol.interceptFileProtocol('sqlpal', (request, callback) => {
    //   console.log('sqlpal protocol is intercepted: ')
    //   // console.log('sqlpal protocol is intercepted: ', protocol.isProtocolIntercepted('sqlpal'))
    //   // const url = request.url.substr(7);    /* all urls start with 'file://' */
    //   console.log(request.url)
    //   callback({ path: resolveHtmlPath('index.html') });
    // });

    // protocol.interceptHttpProtocol('sqlpal', (request, callback) => {
    //   console.log('intercepted here?')
    //   // const url = request.url.substr(7);    /* all urls start with 'file://' */
    //   console.log(request.url)
    //   callback({ path: resolveHtmlPath('index.html') });
    // });

    // protocol.interceptFileProtocol('file', (request, callback) => {
    //   // const url = request.url.substr(7);    /* all urls start with 'file://' */
    //   callback({ path: resolveHtmlPath('index.html') });
    // });

  // protocol.interceptHttpProtocol('https', (request, callback) => {
  //   // just make the request call
  //   console.log(request.url);
  //   const req = net.request(request);
  //   console.log('req called')
  //   console.log('waiting response')
  //   req.on('response', (response) => {
  //     console.log('response received')
  //     response.on('data', (chunk) => {
  //       console.log('data received')
  //       callback({
  //         statusCode: response.statusCode,
  //         headers: response.headers,
  //         data: chunk,
  //       });
  //     });
  //   });
  //   req.on('error', (error) => {
  //     console.log('error received')
  //     console.log(JSON.stringify(error))
  //     callback({
  //       statusCode: 500,
  //       headers: {},
  //       data: error.message,
  //     });
  //   });
  // });

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

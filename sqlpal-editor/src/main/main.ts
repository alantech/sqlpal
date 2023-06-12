/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */

import { BrowserWindow, app, ipcMain } from 'electron';
import authService from './auth-service';
import { createAppWindow } from './app';
import { createAuthWindow, createLogoutWindow } from './auth';
import config from './config';

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

async function createWindow() {
  try {
    if (config?.auth) {
      await authService.refreshTokens();
    }
    mainWindow = await createAppWindow();
  } catch (err) {
    if (config?.auth) {
      await createAuthWindow();
    }
  }
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    // Handle IPC messages from the renderer process.
    ipcMain.handle('auth:get-profile', authService.getProfile);
    ipcMain.handle('auth:get-access-token', authService.getAccessToken);
    ipcMain.on('auth:log-out', () => {
      BrowserWindow.getAllWindows().forEach((window) => window.close());
      createLogoutWindow(createWindow);
    });
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

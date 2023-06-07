import { BrowserWindow } from 'electron';
import createAppWindow from './app';
import { getAuthenticationURL, getLogOutUrl, loadTokens, logout } from './services/auth';

let authWindow: BrowserWindow | null = null;

export function createAuthWindow() {
  destroyAuthWin();

  authWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  authWindow.loadURL(getAuthenticationURL());

  const {session: {webRequest}} = authWindow.webContents;

  const filter = {
    urls: [
      'http://localhost/callback*'
    ]
  };

  webRequest.onBeforeRequest(filter, async ({url}) => {
    await loadTokens(url);
    createAppWindow();
    return destroyAuthWin();
  });

  // todo: does this work?
  (authWindow as any).on('authenticated', () => {
    destroyAuthWin();
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });
}

function destroyAuthWin() {
  if (!authWindow) return;
  authWindow.close();
  authWindow = null;
}

export function createLogoutWindow() {
  const logoutWindow = new BrowserWindow({
    show: false,
  });

  logoutWindow.loadURL(getLogOutUrl());

  logoutWindow.on('ready-to-show', async () => {
    await logout();
    logoutWindow.close();
  });
}

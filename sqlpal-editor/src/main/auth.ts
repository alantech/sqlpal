import { BrowserWindow, session } from 'electron'
import authService from './auth-service'
import { createAppWindow } from './app';
import path from 'path';

let win: BrowserWindow | null = null

async function createAuthWindow () {
  destroyAuthWin()

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log(webContents.getURL())
    console.log(webContents.id)
    console.log(webContents.openDevTools({mode: 'detach'}))
    console.log(permission)
    // if (permission === 'openExternal') {
    //   return callback(true) // denied.
    // }
    callback(true)
  });

  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false,

    }
  })

  win.webContents.openDevTools({mode: 'detach'})
  console.log('url', authService.getAuthenticationURL())
  win.loadURL(authService.getAuthenticationURL())

 const {session: {webRequest}} = win.webContents;

 const filter = {
  urls: [
    'http://localhost/callback*',
    // 'file:///callback*',
  ]
};


  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log(webContents.getURL())
    console.log(webContents.id)
    console.log(webContents.openDevTools({mode: 'detach'}))
    console.log(permission)
    // if (permission === 'openExternal') {
    //   return callback(true) // denied.
    // }
    callback(true)
  });

  // session.defaultSession.webRequest.onBeforeRequest(filter,(details, callback) => {
  //   console.log(details.url)
  // });

  webRequest?.onBeforeRequest(filter, async ({ url }) => {
    console.log('trying here to load tokens?')
    console.log(url)
    await authService.loadTokens(url)
    createAppWindow()
    return destroyAuthWin()
  });

  console.log('all defined');

  (win as any).on('authenticated', () => {
    destroyAuthWin()
  })

  win.on('closed', () => {
    win = null
  })
}

function destroyAuthWin () {
  if (!win) return
  win.close()
  win = null
}

export default createAuthWindow;

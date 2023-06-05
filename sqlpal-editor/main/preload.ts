/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  message: {
    send: (payload: string) => ipcRenderer.send('message', payload),
    on: (handler: () => void) => ipcRenderer.on('message', handler),
    off: (handler: () => void) => ipcRenderer.off('message', handler),
  },
})

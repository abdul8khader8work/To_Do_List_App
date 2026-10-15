const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(_event, action));
  },
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
});

// Also expose ipcRenderer for direct access
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, func) => {
    const validChannels = ['menu-action'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => func(_event, ...args));
    }
  },
  removeListener: (channel, func) => {
    const validChannels = ['menu-action'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  },
});

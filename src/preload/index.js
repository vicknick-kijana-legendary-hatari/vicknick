const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  getConfig: () => ipcRenderer.invoke('app:get-config'),
  openExternal: url => ipcRenderer.invoke('app:open-external', url),
  downloads: {
    getAll: () => ipcRenderer.invoke('downloads:get-all'),
    pause: id => ipcRenderer.invoke('downloads:pause', id),
    resume: id => ipcRenderer.invoke('downloads:resume', id),
    cancel: id => ipcRenderer.invoke('downloads:cancel', id),
    onUpdate: callback => {
      const handler = (_event, payload) => callback(payload);
      ipcRenderer.on('downloads:update', handler);
      return () => ipcRenderer.removeListener('downloads:update', handler);
    }
  },
  onReloadWebview: callback => {
    const handler = () => callback();
    ipcRenderer.on('app:reload-webview', handler);
    return () => ipcRenderer.removeListener('app:reload-webview', handler);
  },
  onToggleDownloads: callback => {
    const handler = () => callback();
    ipcRenderer.on('app:toggle-downloads', handler);
    return () => ipcRenderer.removeListener('app:toggle-downloads', handler);
  }
});

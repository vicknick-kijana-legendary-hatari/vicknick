const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('vicknickSecureBridge', {
  app: 'Vicknick Video Pool'
});

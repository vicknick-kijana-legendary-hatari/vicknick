const path = require('node:path');
const { dialog, ipcMain } = require('electron');

class DownloadManager {
  constructor({ session, mainWindow }) {
    this.session = session;
    this.mainWindow = mainWindow;
    this.activeDownloads = new Map();
  }

  initialize() {
    this.session.on('will-download', (event, item) => {
      this.handleWillDownload(event, item);
    });

    ipcMain.handle('downloads:pause', (_event, id) => this.pause(id));
    ipcMain.handle('downloads:resume', (_event, id) => this.resume(id));
    ipcMain.handle('downloads:cancel', (_event, id) => this.cancel(id));
    ipcMain.handle('downloads:get-all', () => this.serializeDownloads());
  }

  async handleWillDownload(_event, item) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const suggestedFilename = item.getFilename();

    const saveResult = await dialog.showSaveDialog(this.mainWindow, {
      title: 'Save Video Download',
      defaultPath: path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads', suggestedFilename),
      buttonLabel: 'Save Video'
    });

    if (saveResult.canceled || !saveResult.filePath) {
      item.cancel();
      return;
    }

    item.setSavePath(saveResult.filePath);

    const state = {
      id,
      filename: suggestedFilename,
      fullPath: saveResult.filePath,
      totalBytes: item.getTotalBytes() || 0,
      receivedBytes: 0,
      speedBytesPerSecond: 0,
      status: 'downloading',
      startedAt: Date.now()
    };

    let previousBytes = 0;
    let previousAt = Date.now();

    this.activeDownloads.set(id, { item, state });
    this.sendUpdate(state);

    item.on('updated', (_evt, status) => {
      const now = Date.now();
      const received = item.getReceivedBytes();
      const elapsedSeconds = Math.max((now - previousAt) / 1000, 0.001);
      const speed = Math.max((received - previousBytes) / elapsedSeconds, 0);

      previousBytes = received;
      previousAt = now;

      state.receivedBytes = received;
      state.totalBytes = item.getTotalBytes() || state.totalBytes;
      state.speedBytesPerSecond = speed;
      state.status = status === 'interrupted' ? 'interrupted' : item.isPaused() ? 'paused' : 'downloading';

      this.sendUpdate(state);
    });

    item.once('done', (_evt, status) => {
      state.receivedBytes = item.getReceivedBytes();
      state.totalBytes = item.getTotalBytes() || state.totalBytes;
      state.speedBytesPerSecond = 0;
      state.status = status === 'completed' ? 'completed' : status;

      this.sendUpdate(state);
    });
  }

  pause(id) {
    const download = this.activeDownloads.get(id);
    if (download && !download.item.isPaused()) {
      download.item.pause();
      download.state.status = 'paused';
      this.sendUpdate(download.state);
    }
  }

  resume(id) {
    const download = this.activeDownloads.get(id);
    if (download && download.item.isPaused()) {
      download.item.resume();
      download.state.status = 'downloading';
      this.sendUpdate(download.state);
    }
  }

  cancel(id) {
    const download = this.activeDownloads.get(id);
    if (download) {
      download.item.cancel();
      download.state.status = 'cancelled';
      this.sendUpdate(download.state);
    }
  }

  serializeDownloads() {
    return [...this.activeDownloads.values()].map(({ state }) => state);
  }

  sendUpdate(state) {
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('downloads:update', state);
    }
  }
}

module.exports = {
  DownloadManager
};

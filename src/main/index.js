const path = require('node:path');
const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  ipcMain,
  shell,
  session,
  webContents
} = require('electron');
const { APP_URL } = require('./constants');
const { attachNavigationGuards, isAllowedUrl } = require('./security');
const { DownloadManager } = require('./download-manager');
const { AutoUpdaterService } = require('./services/auto-updater');
const { NotificationService } = require('./services/notifications');
const { SubscriptionVerificationService } = require('./services/subscription-verification');
const { AnalyticsService } = require('./services/analytics');
const { AdminUploadService } = require('./services/admin-upload');

let mainWindow;
let splashWindow;
let downloadManager;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 520,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));
}

function createMainWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#11131a',
    show: false,
    title: 'Vicknick Video Pool',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      spellcheck: false
    }
  });

  attachNavigationGuards(mainWindow.webContents);
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      mainWindow.show();
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const foundationServices = [
    new AutoUpdaterService(),
    new NotificationService(),
    new SubscriptionVerificationService(),
    new AnalyticsService(),
    new AdminUploadService()
  ];

  foundationServices.forEach(service => service.initialize());

  const persistentSession = session.fromPartition('persist:vicknick-videopool');
  downloadManager = new DownloadManager({ session: persistentSession, mainWindow });
  downloadManager.initialize();

  ipcMain.handle('app:get-config', () => ({
    appUrl: APP_URL,
    appVersion: app.getVersion(),
    environment: process.env.NODE_ENV || 'production'
  }));

  ipcMain.handle('app:open-external', (_event, url) => {
    if (!isAllowedUrl(url)) {
      shell.openExternal(url);
      return true;
    }
    return false;
  });
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+R', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:reload-webview');
    }
  });

  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:toggle-downloads');
    }
  });
}

function setupSecurityForWebviews() {
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() === 'webview') {
      attachNavigationGuards(contents);

    }
  });

  webContents.on('will-attach-webview', (event, webPreferences, params) => {
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.preload = path.join(__dirname, '../preload/webview.js');

    if (!isAllowedUrl(params.src)) {
      event.preventDefault();
    }
  });
}

function buildMenu() {
  const template = [
    {
      label: 'Application',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  setupSecurityForWebviews();
  createSplashWindow();
  createMainWindow();
  registerShortcuts();
  buildMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

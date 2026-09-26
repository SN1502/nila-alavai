// Nila Alavai desktop shell.
//
// Electron 22 is used on purpose: it is the last Electron release that runs on
// Windows 7, 8 and 8.1 as well as Windows 10 and 11. The whole app is the
// bundled app/index.html, so it works offline; settings are kept in the
// window's local storage between launches.

const { app, BrowserWindow, Menu, nativeTheme, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function isExternal(url) {
  return /^https?:\/\//i.test(url);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    title: 'Nila Alavai',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f1318' : '#eef1ea',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  // No menu bar; copy, paste and undo shortcuts still work in the text boxes.
  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Keep the app inside its window; open any web link in the normal browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) {
      event.preventDefault();
      if (isExternal(url)) shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// One window only: opening the app again focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    app.quit();
  });
}

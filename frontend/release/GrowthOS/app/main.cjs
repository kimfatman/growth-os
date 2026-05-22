const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 780,
    minWidth: 380,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: true,
    backgroundColor: '#09090b',
  });

  const isDev = process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.whenReady().then(() => {
      mainWindow = new BrowserWindow({
        width: 420, height: 780, minWidth: 380, minHeight: 600,
        webPreferences: {
          preload: path.join(__dirname, 'preload.cjs'),
          contextIsolation: true, nodeIntegration: false,
        },
        show: true,
        backgroundColor: '#09090b',
      });
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }
});

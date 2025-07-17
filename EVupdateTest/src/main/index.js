import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater';
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';

import log from 'electron-log';

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

log.info('App starting...');

autoUpdater.on('checking-for-update', () => log.info('Checking for updates...'));
autoUpdater.on('update-available', (info) => log.info('Update available:', info.version));
autoUpdater.on('update-not-available', (info) => log.info('No update available:', info.version));
autoUpdater.on('error', (err) => log.error('Error in auto-updater:', err));
autoUpdater.on('download-progress', (progress) => log.info(`Download speed: ${progress.bytesPerSecond}, Progress: ${progress.percent}%`));

// ########################## this auto installs it without asking the user to confirm ######
autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version);
  // autoUpdater.quitAndInstall();// auto updates without asking 
});


// ##########################  the main update code you want ###############
let userAcknowledgedUpdate = false;

autoUpdater.on('update-available', (info) => {
  console.log('[Updater] Update available:', info.version);
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new update is available. Downloading now...'
  }).then(()=>{
    userAcknowledgedUpdate = true
  })
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Update downloaded:', info.version);
  const waitForUserAck = () => {
    if (userAcknowledgedUpdate){
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Install & restart now?',
        buttons: ['Yes', 'Later']
      }).then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(); 
        }
      });    
    }else {
      setTimeout(waitForUserAck, 10000)
    }
  }
  waitForUserAck();
});



function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.openDevTools();

  console.log('[Updater] Calling checkForUpdatesAndNotify...');
  autoUpdater.checkForUpdatesAndNotify();
  console.log('[Updater] checkForUpdatesAndNotify called.');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


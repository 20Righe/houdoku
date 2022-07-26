/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import fs from 'fs';
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  MessageBoxReturnValue,
  OpenDialogReturnValue,
} from 'electron';
import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import log from 'electron-log';
import { ExtensionMetadata, WebviewFunc } from 'houdoku-extension-lib';
import { walk } from './util/filesystem';
import {
  createExtensionIpcHandlers,
  loadExtensions,
} from './services/extension';
import { loadInWebView } from './util/webview';
import ipcChannels from './constants/ipcChannels.json';
import packageJson from '../package.json';
import { createTrackerIpcHandlers } from './services/tracker';
import { createDiscordIpcHandlers } from './services/discord';

log.info(
  `Starting Houdoku main process (client version ${packageJson.version})`
);

const thumbnailsDir = path.join(app.getPath('userData'), 'thumbnails');
const pluginsDir = path.join(app.getPath('userData'), 'plugins');
const downloadsDir = path.join(app.getPath('userData'), 'downloads');
const logsDir = path.join(app.getPath('userData'), 'logs');
const extractDir = path.join(app.getPath('userData'), 'extracted');

let mainWindow: BrowserWindow | null = null;
let spoofWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch((err) => console.log(err));
};

const createWindows = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(__dirname, '../resources');
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    minWidth: 250,
    minHeight: 150,
    frame: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  spoofWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    spoofWindow?.close();
  });
  spoofWindow.on('closed', () => {
    spoofWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send(ipcChannels.WINDOW.SET_FULLSCREEN, true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send(ipcChannels.WINDOW.SET_FULLSCREEN, false);
  });
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindows).catch(log.error);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindows();
});

ipcMain.handle(ipcChannels.WINDOW.MINIMIZE, () => {
  mainWindow?.minimize();
});

ipcMain.handle(ipcChannels.WINDOW.MAX_RESTORE, () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.restore();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle(ipcChannels.WINDOW.CLOSE, () => {
  mainWindow?.close();
});

ipcMain.handle(ipcChannels.GET_PATH.THUMBNAILS_DIR, () => {
  return thumbnailsDir;
});

ipcMain.handle(ipcChannels.GET_PATH.PLUGINS_DIR, () => {
  return pluginsDir;
});

ipcMain.handle(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR, () => {
  return downloadsDir;
});

ipcMain.handle(ipcChannels.GET_PATH.LOGS_DIR, () => {
  return logsDir;
});

ipcMain.handle(ipcChannels.GET_ALL_FILES, (_event, rootPath: string) => {
  return walk(rootPath);
});

ipcMain.handle(ipcChannels.APP.CHECK_FOR_UPDATES, (event) => {
  log.debug('Handling check for updates request...');
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    log.info('Skipping update check because we are in dev environment');
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;

  const MB = 10 ** -6;
  const round = (x: number) => Math.ceil(x * 100) / 100;

  event.sender.send(ipcChannels.APP.SET_STATUS, `Checking for updates...`);

  autoUpdater.on('download-progress', (progress) => {
    log.debug(`Downloading update: ${progress.transferred}/${progress.total}`);
    event.sender.send(
      ipcChannels.APP.SET_STATUS,
      `Downloading update: ${round(progress.percent)}% (${round(
        progress.transferred * MB
      )}/${round(progress.total * MB)} MB) - ${round(
        progress.bytesPerSecond * MB
      )} MB/sec`
    );
  });

  autoUpdater.on('update-downloaded', () => {
    log.debug(`Finished update download`);
    event.sender.send(
      ipcChannels.APP.SET_STATUS,
      `Downloaded update successfully. Please restart Houdoku.`
    );
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Restart to Update',
        message: `Houdoku needs to be restarted in order to install the update. Restart now?`,
        buttons: ['Restart Houdoku', 'No'],
      })
      .then((value: MessageBoxReturnValue) => {
        // eslint-disable-next-line promise/always-return
        if (value.response === 0) {
          autoUpdater.quitAndInstall();
        }
      })
      .catch((err) => log.error(err));
  });

  autoUpdater.on('error', (err: Error) => {
    log.error(`Updater encountered error: ${err}`);
    event.sender.send(
      ipcChannels.APP.SET_STATUS,
      `Error while updating: ${err}`
    );
  });

  autoUpdater
    .checkForUpdates()
    // eslint-disable-next-line promise/always-return
    .then((result: UpdateCheckResult) => {
      if (result.updateInfo.version === packageJson.version) {
        log.info(`Already up-to-date at version ${packageJson.version}`);
        event.sender.send(ipcChannels.APP.SET_STATUS, `Houdoku is up-to-date.`);
        return null;
      }

      log.info(
        `Found update to version ${result.updateInfo.version} (from ${packageJson.version})`
      );
      event.sender.send(
        ipcChannels.APP.SET_STATUS,
        `Update available: version ${result.updateInfo.version}`
      );

      return dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `An update for Houdoku is available. Download it now?\n\nVersion: ${result.updateInfo.version}\nDate: ${result.updateInfo.releaseDate}`,
        buttons: ['Download Update', 'No'],
      });
    })
    .then((value: MessageBoxReturnValue | null) => {
      if (value === null) return null;

      if (value.response === 0) {
        return autoUpdater.downloadUpdate();
      }
      return null;
    })
    .catch((e) => log.error(e));
});

ipcMain.handle(
  ipcChannels.APP.SHOW_OPEN_DIALOG,
  (
    _event,
    // eslint-disable-next-line @typescript-eslint/default-param-last
    directory = false,
    // eslint-disable-next-line @typescript-eslint/default-param-last
    filters: { name: string; extensions: string[] }[] = [],
    title: string
  ) => {
    log.info(
      `Showing open dialog directory=${directory} filters=${filters.join(';')}`
    );

    if (mainWindow === null) {
      log.error('Aborting open dialog, mainWindow is null');
      return [];
    }

    return dialog
      .showOpenDialog(mainWindow, {
        properties: [directory ? 'openDirectory' : 'openFile'],
        filters,
        title,
      })
      .then((value: OpenDialogReturnValue) => {
        if (value.canceled) return [];
        return value.filePaths;
      })
      .catch((e) => log.error(e));
  }
);

ipcMain.handle(ipcChannels.APP.READ_ENTIRE_FILE, (_event, filepath: string) => {
  log.info(`Reading entire file: ${filepath}`);

  return fs.readFileSync(filepath).toString();
});

ipcMain.handle(
  ipcChannels.APP.SHOW_EXTENSION_UPDATE_DIALOG,
  (
    _event,
    updates: {
      [key: string]: { metadata: ExtensionMetadata; newVersion: string };
    }
  ) => {
    log.info('Showing extension update dialog...');

    const updatesStr = Object.values(updates)
      .map(
        (update) =>
          `- ${update.metadata.name} (${update.metadata.version}→${update.newVersion})`
      )
      .join('\n');

    dialog.showMessageBox({
      type: 'info',
      title: 'Extension Updates Available',
      message: `Updates are available for the following extensions:\n\n${updatesStr}\n\nPlease go to the Extensions tab to update.\nYou can disable this message in the settings.`,
      buttons: ['OK'],
    });
  }
);

// create ipc handlers for specific extension functionality
const webviewFn: WebviewFunc = (url, options) =>
  loadInWebView(spoofWindow, url, options);
createExtensionIpcHandlers(ipcMain, pluginsDir, extractDir, webviewFn);
loadExtensions(pluginsDir, extractDir, webviewFn);

createTrackerIpcHandlers(ipcMain);
createDiscordIpcHandlers(ipcMain);

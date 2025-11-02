const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const adb = require('adbkit');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 850,
    resizable: true,
    minWidth: 800,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'OMNILY Device Setup Tool',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ADB Client
const client = adb.createClient();

// IPC Handlers

// Detect connected devices and check current status
ipcMain.handle('detect-device', async () => {
  try {
    const devices = await client.listDevices();

    if (devices.length === 0) {
      return { success: true, devices: [], status: {} };
    }

    const deviceId = devices[0].id;

    // Check if APK is installed
    let apkInstalled = false;
    try {
      const pkgResult = await client.shell(deviceId, 'pm list packages | grep com.omnilypro.pos');
      let pkgOutput = '';
      pkgResult.on('data', (chunk) => { pkgOutput += chunk.toString(); });
      await new Promise((resolve) => { pkgResult.on('end', resolve); });
      apkInstalled = pkgOutput.includes('com.omnilypro.pos');
    } catch (e) { /* ignore */ }

    // Check if Device Owner is set
    let deviceOwnerSet = false;
    try {
      const doResult = await client.shell(deviceId, 'dumpsys device_policy');
      let doOutput = '';
      doResult.on('data', (chunk) => { doOutput += chunk.toString(); });
      await new Promise((resolve) => { doResult.on('end', resolve); });
      deviceOwnerSet = doOutput.includes('admin=ComponentInfo{com.omnilypro.pos/com.omnilypro.pos.mdm.MyDeviceAdminReceiver}');
    } catch (e) { /* ignore */ }

    return {
      success: true,
      devices,
      status: {
        apkInstalled,
        deviceOwnerSet
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Install APK
ipcMain.handle('install-apk', async (event, deviceId, apkPath, setupToken) => {
  try {
    await client.install(deviceId, apkPath);

    // Auto-launch app after installation WITH setup token
    try {
      if (setupToken) {
        // Pass setup token via deep link
        await client.shell(deviceId, `am start -a android.intent.action.VIEW -d "omnily://setup?token=${setupToken}" com.omnilypro.pos/.MainActivityFinal`);
        console.log(`App launched with setup token: ${setupToken}`);
      } else {
        // Launch without setup token (fallback)
        await client.shell(deviceId, 'am start -n com.omnilypro.pos/.MainActivityFinal');
      }
    } catch (launchError) {
      console.log('Could not auto-launch app:', launchError);
      // Non blocchiamo l'installazione se il launch fallisce
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set Device Owner
ipcMain.handle('set-device-owner', async (event, deviceId) => {
  try {
    const componentName = 'com.omnilypro.pos/.mdm.MyDeviceAdminReceiver';
    const result = await client.shell(deviceId, `dpm set-device-owner ${componentName}`);

    // Read the output
    let output = '';
    result.on('data', (chunk) => {
      output += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      result.on('end', resolve);
      result.on('error', reject);
    });

    if (output.includes('Success')) {
      return { success: true, output };
    } else {
      return { success: false, error: output };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check if Device Owner is already set
ipcMain.handle('check-device-owner', async (event, deviceId) => {
  try {
    const result = await client.shell(deviceId, 'dumpsys device_policy');

    let output = '';
    result.on('data', (chunk) => {
      output += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      result.on('end', resolve);
      result.on('error', reject);
    });

    // Check if our app is set as Device Owner
    const isSet = output.includes('admin=ComponentInfo{com.omnilypro.pos/com.omnilypro.pos.mdm.MyDeviceAdminReceiver}');
    return { success: true, isSet, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Remove existing accounts (required before setting Device Owner)
ipcMain.handle('remove-accounts', async (event, deviceId) => {
  try {
    // List all accounts
    const result = await client.shell(deviceId, 'pm list users');

    let output = '';
    result.on('data', (chunk) => {
      output += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      result.on('end', resolve);
      result.on('error', reject);
    });

    return { success: true, message: 'Check device - accounts must be removed manually via Settings' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Download APK from Supabase
ipcMain.handle('download-apk-from-supabase', async (event) => {
  try {
    const apkUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/apks/omnilybridgepos.apk';
    const tempPath = path.join(app.getPath('temp'), 'omnilybridgepos.apk');

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempPath);

      https.get(apkUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve({ success: true, path: tempPath });
        });
      }).on('error', (err) => {
        fs.unlink(tempPath, () => {}); // Delete partial file
        reject(err);
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Remove Device Owner
ipcMain.handle('remove-device-owner', async (event, deviceId) => {
  try {
    const componentName = 'com.omnilypro.pos/.mdm.MyDeviceAdminReceiver';
    const result = await client.shell(deviceId, `dpm remove-active-admin ${componentName}`);

    let output = '';
    result.on('data', (chunk) => {
      output += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      result.on('end', resolve);
      result.on('error', reject);
    });

    // Check if it worked by verifying Device Owner is removed
    const checkResult = await client.shell(deviceId, 'dumpsys device_policy');
    let checkOutput = '';
    checkResult.on('data', (chunk) => { checkOutput += chunk.toString(); });
    await new Promise((resolve) => { checkResult.on('end', resolve); });

    const isStillSet = checkOutput.includes('admin=ComponentInfo{com.omnilypro.pos/com.omnilypro.pos.mdm.MyDeviceAdminReceiver}');

    if (!isStillSet) {
      return { success: true, message: 'Device Owner rimosso con successo' };
    } else {
      return { success: false, error: 'Device Owner non può essere rimosso (potrebbe richiedere factory reset)' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Browse for APK file
ipcMain.handle('browse-for-apk', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Seleziona file APK',
      filters: [
        { name: 'APK Files', extensions: ['apk'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Download APK from custom URL
ipcMain.handle('download-apk-from-url', async (event, customUrl) => {
  try {
    const tempPath = path.join(app.getPath('temp'), 'omnilybridgepos_custom.apk');

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempPath);

      https.get(customUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          https.get(redirectUrl, (redirectResponse) => {
            if (redirectResponse.statusCode !== 200) {
              reject(new Error(`Failed to download: ${redirectResponse.statusCode}`));
              return;
            }

            redirectResponse.pipe(file);

            file.on('finish', () => {
              file.close();
              resolve({ success: true, path: tempPath });
            });
          }).on('error', (err) => {
            fs.unlink(tempPath, () => {}); // Delete partial file
            reject(err);
          });
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve({ success: true, path: tempPath });
        });
      }).on('error', (err) => {
        fs.unlink(tempPath, () => {}); // Delete partial file
        reject(err);
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Log Monitor
let logcatProcess = null;

ipcMain.handle('start-log-monitor', async (event, deviceId) => {
  try {
    if (logcatProcess) {
      logcatProcess.kill();
    }

    // Start adb logcat filtering relevant logs
    logcatProcess = spawn('adb', ['-s', deviceId, 'logcat', '-v', 'time', 'ProvisioningLogger:V', 'MainActivityFinal:D', '*:E']);

    logcatProcess.stdout.on('data', (data) => {
      const logLine = data.toString();
      mainWindow.webContents.send('log-data', logLine);
    });

    logcatProcess.stderr.on('data', (data) => {
      console.error('logcat error:', data.toString());
    });

    logcatProcess.on('close', (code) => {
      console.log('logcat process exited with code', code);
      logcatProcess = null;
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-log-monitor', async () => {
  try {
    if (logcatProcess) {
      logcatProcess.kill();
      logcatProcess = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

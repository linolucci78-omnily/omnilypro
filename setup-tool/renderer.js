const { ipcRenderer } = require('electron');
const path = require('path');

let currentDeviceId = null;
let apkSource = 'local'; // default
let customApkPath = null;
let customApkUrl = null;

// UI Elements
const detectBtn = document.getElementById('detectBtn');
const installBtn = document.getElementById('installBtn');
const activateBtn = document.getElementById('activateBtn');
const verifyBtn = document.getElementById('verifyBtn');
const removeDeviceOwnerBtn = document.getElementById('removeDeviceOwnerBtn');
const setupTokenInput = document.getElementById('setupTokenInput');
const apkSourceSelect = document.getElementById('apkSourceSelect');
const browseFileBtn = document.getElementById('browseFileBtn');
const customFilePath = document.getElementById('customFilePath');
const customUrl = document.getElementById('customUrl');
const customFilePathContainer = document.getElementById('customFilePathContainer');
const customUrlContainer = document.getElementById('customUrlContainer');

const detectStatus = document.getElementById('detectStatus');
const installStatus = document.getElementById('installStatus');
const activateStatus = document.getElementById('activateStatus');
const verifyStatus = document.getElementById('verifyStatus');
const removeDeviceOwnerStatus = document.getElementById('removeDeviceOwnerStatus');

const deviceInfo = document.getElementById('deviceInfo');

// Step 6: Log Monitor UI Elements
const startLogBtn = document.getElementById('startLogBtn');
const stopLogBtn = document.getElementById('stopLogBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const logViewer = document.getElementById('logViewer');
const logContent = document.getElementById('logContent');

// Helper functions
function showStatus(element, type, message) {
  element.className = `status ${type}`;
  element.textContent = message;
  element.style.display = 'block';
}

function hideStatus(element) {
  element.style.display = 'none';
}

function markStepCompleted(stepNumber) {
  const step = document.getElementById(`step${stepNumber}`);
  const icon = document.getElementById(`step${stepNumber}-icon`);
  step.classList.add('completed');
  icon.classList.add('completed');
  icon.textContent = '';  // Remove number, show checkmark via CSS
}

function setLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.innerHTML = button.textContent + ' <span class="spinner"></span>';
  } else {
    button.disabled = false;
    button.innerHTML = button.textContent.replace(/<span class="spinner"><\/span>/, '');
  }
}

// Step 1: Detect Device
detectBtn.addEventListener('click', async () => {
  setLoading(detectBtn, true);
  hideStatus(detectStatus);
  deviceInfo.style.display = 'none';

  try {
    const result = await ipcRenderer.invoke('detect-device');

    if (result.success && result.devices.length > 0) {
      const device = result.devices[0];
      currentDeviceId = device.id;

      const status = result.status || {};

      let statusText = '';
      if (status.apkInstalled) statusText += '✅ App già installata\n';
      if (status.deviceOwnerSet) statusText += '✅ Device Owner già attivo\n';

      deviceInfo.innerHTML = `
        <strong>Dispositivo rilevato:</strong><br>
        ID: ${device.id}<br>
        Tipo: ${device.type}<br>
        ${statusText ? '<br>' + statusText.replace(/\n/g, '<br>') : ''}
      `;
      deviceInfo.style.display = 'block';

      // Enable appropriate buttons based on status
      if (status.deviceOwnerSet) {
        showStatus(detectStatus, 'success', '✅ Setup già completato! Clicca "Verifica Setup" per confermare.');
        installBtn.disabled = true;
        activateBtn.disabled = true;
        verifyBtn.disabled = false;
        showStatus(installStatus, 'success', '✅ App già installata');
        showStatus(activateStatus, 'success', '✅ Device Owner già attivo');
        markStepCompleted(1);
        markStepCompleted(2);
        markStepCompleted(3);
      } else if (status.apkInstalled) {
        showStatus(detectStatus, 'success', '✅ Dispositivo rilevato! App già installata, procedi con Device Owner.');
        installBtn.disabled = true;
        activateBtn.disabled = false;
        showStatus(installStatus, 'success', '✅ App già installata');
        markStepCompleted(1);
        markStepCompleted(2);
      } else {
        showStatus(detectStatus, 'success', '✅ Dispositivo collegato correttamente!');
        installBtn.disabled = false;
        markStepCompleted(1);
      }
    } else {
      showStatus(detectStatus, 'error', '❌ Nessun dispositivo rilevato. Verifica connessione USB e Debug USB.');
    }
  } catch (error) {
    showStatus(detectStatus, 'error', `❌ Errore: ${error.message}`);
  } finally {
    setLoading(detectBtn, false);
  }
});

// Step 2: Install APK
installBtn.addEventListener('click', async () => {
  if (!currentDeviceId) {
    showStatus(installStatus, 'error', '❌ Rileva prima il dispositivo');
    return;
  }

  setLoading(installBtn, true);
  hideStatus(installStatus);

  try {
    let apkPath;

    // Handle different APK sources
    if (apkSource === 'supabase') {
      showStatus(installStatus, 'info', '☁️ Download APK da Supabase...');
      const downloadResult = await ipcRenderer.invoke('download-apk-from-supabase');

      if (!downloadResult.success) {
        showStatus(installStatus, 'error', `❌ Errore download: ${downloadResult.error}`);
        return;
      }

      apkPath = downloadResult.path;
      showStatus(installStatus, 'info', '📦 APK scaricato! Installazione in corso...');
    } else if (apkSource === 'browse') {
      // Use browsed file
      if (!customApkPath) {
        showStatus(installStatus, 'error', '❌ Seleziona prima un file APK');
        return;
      }

      apkPath = customApkPath;
      showStatus(installStatus, 'info', '📦 Installazione in corso... Attendi 30-60 secondi...');
    } else if (apkSource === 'custom-url') {
      // Download from custom URL
      if (!customApkUrl || customApkUrl.trim() === '') {
        showStatus(installStatus, 'error', '❌ Inserisci un URL valido');
        return;
      }

      showStatus(installStatus, 'info', '🌐 Download APK da URL personalizzato...');
      const downloadResult = await ipcRenderer.invoke('download-apk-from-url', customApkUrl);

      if (!downloadResult.success) {
        showStatus(installStatus, 'error', `❌ Errore download: ${downloadResult.error}`);
        return;
      }

      apkPath = downloadResult.path;
      showStatus(installStatus, 'info', '📦 APK scaricato! Installazione in corso...');
    } else {
      // Use local APK (default)
      apkPath = path.join(__dirname, 'resources', 'Omnily-Bridge-pos.apk');

      // Fallback to dev path if resources APK doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(apkPath)) {
        apkPath = path.join(__dirname, '..', 'android-bridge', 'app', 'build', 'outputs', 'apk', 'debug', 'Omnily-Bridge-pos.apk');
      }

      showStatus(installStatus, 'info', '📦 Installazione in corso... Attendi 30-60 secondi...');
    }

    // Get setup token from input field
    const setupToken = setupTokenInput.value.trim();
    if (!setupToken) {
      showStatus(installStatus, 'error', '❌ Inserisci il Setup Token prima di installare!');
      setLoading(installBtn, false);
      return;
    }

    const result = await ipcRenderer.invoke('install-apk', currentDeviceId, apkPath, setupToken);

    if (result.success) {
      showStatus(installStatus, 'success', '✅ App installata con successo con token configurato!');
      activateBtn.disabled = false;
      markStepCompleted(2);
    } else {
      showStatus(installStatus, 'error', `❌ Errore installazione: ${result.error}`);
    }
  } catch (error) {
    showStatus(installStatus, 'error', `❌ Errore: ${error.message}`);
  } finally {
    setLoading(installBtn, false);
  }
});

// Step 3: Activate Device Owner
activateBtn.addEventListener('click', async () => {
  if (!currentDeviceId) {
    showStatus(activateStatus, 'error', '❌ Rileva prima il dispositivo');
    return;
  }

  setLoading(activateBtn, true);
  hideStatus(activateStatus);

  try {
    showStatus(activateStatus, 'info', '🔐 Attivazione Device Owner in corso...');

    const result = await ipcRenderer.invoke('set-device-owner', currentDeviceId);

    if (result.success) {
      showStatus(activateStatus, 'success', '✅ Device Owner attivato! Il dispositivo è ora completamente gestito.');
      verifyBtn.disabled = false;
      markStepCompleted(3);
    } else {
      // Check common errors
      if (result.error.includes('Not allowed') || result.error.includes('accounts')) {
        showStatus(activateStatus, 'error', `❌ Errore: Rimuovi TUTTI gli account Google dal dispositivo prima di procedere.\n\nVai su Impostazioni > Account > Rimuovi account Google`);
      } else {
        showStatus(activateStatus, 'error', `❌ Errore: ${result.error}`);
      }
    }
  } catch (error) {
    showStatus(activateStatus, 'error', `❌ Errore: ${error.message}`);
  } finally {
    setLoading(activateBtn, false);
  }
});

// Step 4: Verify Setup
verifyBtn.addEventListener('click', async () => {
  if (!currentDeviceId) {
    showStatus(verifyStatus, 'error', '❌ Rileva prima il dispositivo');
    return;
  }

  setLoading(verifyBtn, true);
  hideStatus(verifyStatus);

  try {
    const result = await ipcRenderer.invoke('check-device-owner', currentDeviceId);

    if (result.success && result.isSet) {
      showStatus(verifyStatus, 'success', `✅ SETUP COMPLETATO!\n\nIl dispositivo è configurato correttamente come Device Owner.\n\nPuoi ora scollegare il POS e configurarlo da remoto tramite dashboard.`);
      markStepCompleted(4);
    } else if (result.success && !result.isSet) {
      showStatus(verifyStatus, 'error', '❌ Device Owner non è attivo. Riprova l\'attivazione.');
    } else {
      showStatus(verifyStatus, 'error', `❌ Errore verifica: ${result.error}`);
    }
  } catch (error) {
    showStatus(verifyStatus, 'error', `❌ Errore: ${error.message}`);
  } finally {
    setLoading(verifyBtn, false);
  }
});

// APK Source Selection
apkSourceSelect.addEventListener('change', (e) => {
  apkSource = e.target.value;
  console.log('APK source changed to:', apkSource);

  // Show/hide appropriate containers
  if (apkSource === 'browse') {
    customFilePathContainer.style.display = 'flex';
    customUrlContainer.style.display = 'none';
  } else if (apkSource === 'custom-url') {
    customFilePathContainer.style.display = 'none';
    customUrlContainer.style.display = 'flex';
  } else {
    customFilePathContainer.style.display = 'none';
    customUrlContainer.style.display = 'none';
  }
});

// Browse for APK file
browseFileBtn.addEventListener('click', async () => {
  try {
    const result = await ipcRenderer.invoke('browse-for-apk');

    if (result.success) {
      customApkPath = result.path;
      customFilePath.value = result.path;
      console.log('APK file selected:', customApkPath);
    } else if (!result.canceled) {
      alert('Errore nella selezione del file: ' + (result.error || 'Errore sconosciuto'));
    }
  } catch (error) {
    alert('Errore: ' + error.message);
  }
});

// Custom URL input with save confirmation
customUrl.addEventListener('blur', (e) => {
  const url = e.target.value;
  if (url && url.trim() !== '' && url !== customApkUrl) {
    customApkUrl = url;
    localStorage.setItem('customApkUrl', customApkUrl);
    alert('✅ URL salvato!\n\n' + customApkUrl + '\n\nVerrà ricaricato automaticamente la prossima volta.');
    console.log('Custom URL saved:', customApkUrl);
  }
});

customUrl.addEventListener('input', (e) => {
  customApkUrl = e.target.value;
});

// Load saved custom URL on startup
window.addEventListener('DOMContentLoaded', () => {
  const savedUrl = localStorage.getItem('customApkUrl');
  if (savedUrl) {
    customApkUrl = savedUrl;
    customUrl.value = savedUrl;
    console.log('Loaded saved custom URL:', savedUrl);
  }
});

// Remove Device Owner
removeDeviceOwnerBtn.addEventListener('click', async () => {
  if (!currentDeviceId) {
    showStatus(removeDeviceOwnerStatus, 'error', '❌ Rileva prima il dispositivo');
    return;
  }

  // Confirmation
  const confirmed = confirm('⚠️ ATTENZIONE!\n\nRimuovere Device Owner può rendere il dispositivo non gestito.\n\nNota: Su alcuni dispositivi, Device Owner può essere rimosso solo con factory reset.\n\nVuoi procedere?');

  if (!confirmed) return;

  setLoading(removeDeviceOwnerBtn, true);
  hideStatus(removeDeviceOwnerStatus);

  try {
    showStatus(removeDeviceOwnerStatus, 'info', '🔓 Rimozione Device Owner in corso...');

    const result = await ipcRenderer.invoke('remove-device-owner', currentDeviceId);

    if (result.success) {
      showStatus(removeDeviceOwnerStatus, 'success', `✅ ${result.message}\n\nIl dispositivo non è più gestito come Device Owner.`);
    } else {
      showStatus(removeDeviceOwnerStatus, 'error', `❌ ${result.error}\n\n💡 Suggerimento: Potrebbe essere necessario un factory reset per rimuovere Device Owner.`);
    }
  } catch (error) {
    showStatus(removeDeviceOwnerStatus, 'error', `❌ Errore: ${error.message}`);
  } finally {
    setLoading(removeDeviceOwnerBtn, false);
  }
});

// Step 6: Android Log Monitor
startLogBtn.addEventListener('click', async () => {
  if (!currentDeviceId) {
    alert('❌ Rileva prima il dispositivo prima di avviare il monitor log');
    return;
  }

  setLoading(startLogBtn, true);

  try {
    const result = await ipcRenderer.invoke('start-log-monitor', currentDeviceId);

    if (result.success) {
      logViewer.style.display = 'block';
      startLogBtn.disabled = true;
      stopLogBtn.disabled = false;
      clearLogBtn.disabled = false;

      // Add initial message
      const initialMsg = document.createElement('div');
      initialMsg.className = 'log-line log-info';
      initialMsg.textContent = '📋 Monitor avviato - In attesa di log da ProvisioningLogger e MainActivityFinal...';
      logContent.appendChild(initialMsg);
    } else {
      alert('❌ Errore avvio monitor: ' + (result.error || 'Errore sconosciuto'));
    }
  } catch (error) {
    alert('❌ Errore: ' + error.message);
  } finally {
    setLoading(startLogBtn, false);
  }
});

stopLogBtn.addEventListener('click', async () => {
  setLoading(stopLogBtn, true);

  try {
    const result = await ipcRenderer.invoke('stop-log-monitor');

    if (result.success) {
      startLogBtn.disabled = false;
      stopLogBtn.disabled = true;

      // Add stop message
      const stopMsg = document.createElement('div');
      stopMsg.className = 'log-line log-info';
      stopMsg.textContent = '⏸️ Monitor fermato';
      logContent.appendChild(stopMsg);

      // Auto-scroll
      logViewer.scrollTop = logViewer.scrollHeight;
    }
  } catch (error) {
    alert('❌ Errore: ' + error.message);
  } finally {
    setLoading(stopLogBtn, false);
  }
});

clearLogBtn.addEventListener('click', () => {
  logContent.innerHTML = '';
  console.log('Log cleared');
});

// Receive log data from main process
ipcRenderer.on('log-data', (event, logLine) => {
  const logDiv = document.createElement('div');
  logDiv.className = 'log-line';

  // Color code based on content
  if (logLine.includes('E/') || logLine.includes('❌') || logLine.includes('ERROR') || logLine.includes('Exception')) {
    logDiv.classList.add('log-error');
  } else if (logLine.includes('✅') || logLine.includes('Success') || logLine.includes('SUCCESS')) {
    logDiv.classList.add('log-success');
  } else if (logLine.includes('W/') || logLine.includes('⚠️') || logLine.includes('WARN')) {
    logDiv.classList.add('log-warning');
  } else if (logLine.includes('I/') || logLine.includes('INFO') || logLine.includes('ProvisioningLogger') || logLine.includes('MainActivityFinal')) {
    logDiv.classList.add('log-info');
  }

  logDiv.textContent = logLine;
  logContent.appendChild(logDiv);

  // Auto-scroll to bottom
  logViewer.scrollTop = logViewer.scrollHeight;
});

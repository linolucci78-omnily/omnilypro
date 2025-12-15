# 🦀 Guida Tauri per Raspberry Pi - Omnily Pro TV Display

Tauri permette di creare un'applicazione desktop nativa per il Raspberry Pi che è **molto più leggera** rispetto a un browser Chromium.

---

## 🎯 Perché Tauri?

| Feature | Tauri | Chromium Kiosk |
|---------|-------|----------------|
| Dimensione App | ~3-5 MB | ~100+ MB |
| Uso RAM | ~50-100 MB | ~300-500 MB |
| Avvio | ~1-2 secondi | ~5-10 secondi |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Auto-Update | ✅ Built-in | ❌ Manuale |

---

## 📋 Prerequisiti

### Sul Computer di Sviluppo (Mac/Linux/Windows)

```bash
# Installa Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verifica installazione
rustc --version
cargo --version

# Aggiungi target per Raspberry Pi (ARM64)
rustup target add aarch64-unknown-linux-gnu
```

### Sul Raspberry Pi 4

```bash
# Installa dipendenze necessarie
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

---

## 🚀 Setup Tauri nel Progetto

### 1. Installa Tauri CLI

```bash
cd /Users/pasqualelucci/omnilypro-clean/frontend

# Installa Tauri CLI
npm install --save-dev @tauri-apps/cli

# Installa Tauri API
npm install @tauri-apps/api
```

### 2. Inizializza Tauri

```bash
npx tauri init
```

**Configurazione durante l'init:**
- **App name:** `Omnily TV`
- **Window title:** `Omnily Pro TV Display`
- **Web assets location:** `../dist` (relativo a src-tauri)
- **Dev server URL:** `http://localhost:5173`
- **Frontend dev command:** `npm run dev`
- **Frontend build command:** `npm run build`

### 3. Configurazione Tauri

Modifica `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "OmnilyTV",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": false
      },
      "window": {
        "all": false,
        "close": false,
        "hide": false,
        "show": false,
        "maximize": true,
        "minimize": false,
        "unmaximize": false,
        "unminimize": false,
        "startDragging": false,
        "print": false,
        "requestUserAttention": false,
        "setResizable": false,
        "setTitle": false,
        "setMaximizable": false,
        "setMinimizable": false,
        "setClosable": false,
        "setDecorations": false,
        "setAlwaysOnTop": true,
        "setFullscreen": true,
        "setFocus": true
      }
    },
    "bundle": {
      "active": true,
      "targets": ["deb", "appimage"],
      "identifier": "com.omnilypro.tv",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": true,
        "resizable": false,
        "title": "Omnily TV Display",
        "width": 1920,
        "height": 1080,
        "decorations": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": true,
        "transparent": false,
        "url": "/tv/live"
      }
    ]
  }
}
```

---

## 🛠️ Build per Raspberry Pi

### Opzione A: Build Direttamente sul Raspberry Pi (Più Semplice)

```bash
# Sul Raspberry Pi
cd ~/omnily-tv/frontend

# Installa dipendenze
npm install

# Build Tauri
npm run tauri build

# L'eseguibile sarà in:
# src-tauri/target/release/omnily-tv
```

### Opzione B: Cross-Compile dal Mac/PC (Più Veloce)

```bash
# Sul tuo computer di sviluppo
cd /Users/pasqualelucci/omnilypro-clean/frontend

# Installa linker per ARM64
brew install FiloSottile/musl-cross/musl-cross  # Mac
# oppure
sudo apt install gcc-aarch64-linux-gnu  # Linux

# Configura Cargo per cross-compilation
mkdir -p ~/.cargo
cat >> ~/.cargo/config.toml << EOF
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
EOF

# Build per ARM64
npm run tauri build -- --target aarch64-unknown-linux-gnu

# Trasferisci il file al Raspberry Pi
scp src-tauri/target/aarch64-unknown-linux-gnu/release/omnily-tv pi@IP_RASPBERRY:~/
```

---

## 📦 Installazione sul Raspberry Pi

### Metodo 1: Eseguibile Diretto

```bash
# Sul Raspberry Pi
cd ~
chmod +x omnily-tv

# Test manuale
./omnily-tv
```

### Metodo 2: Pacchetto .deb (Consigliato)

```bash
# Se hai buildato un .deb
sudo dpkg -i src-tauri/target/release/bundle/deb/omnily-tv_1.0.0_arm64.deb

# L'app sarà installata in:
/usr/bin/omnily-tv
```

---

## 🔄 Auto-Start con Tauri

### 1. Crea Servizio Systemd

```bash
sudo nano /etc/systemd/system/omnily-tv.service
```

**Contenuto:**

```ini
[Unit]
Description=Omnily Pro TV Display
After=graphical.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/omnily-tv
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
```

```bash
# Abilita e avvia il servizio
sudo systemctl daemon-reload
sudo systemctl enable omnily-tv.service
sudo systemctl start omnily-tv.service

# Controlla status
sudo systemctl status omnily-tv.service
```

### 2. Script di Avvio Alternativo (LXDE Autostart)

```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/omnily-tv.desktop
```

**Contenuto:**

```ini
[Desktop Entry]
Type=Application
Name=Omnily TV
Exec=/usr/bin/omnily-tv
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
```

---

## 🎨 Personalizzazione App Tauri

### Gestire l'Org ID Dinamicamente

Crea `src-tauri/src/main.rs`:

```rust
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
use std::env;

fn main() {
    // Leggi Org ID da variabile d'ambiente o file config
    let org_id = env::var("OMNILY_ORG_ID")
        .unwrap_or_else(|_| "default-org-id".to_string());

    tauri::Builder::default()
        .setup(move |app| {
            let window = app.get_window("main").unwrap();

            // Costruisci URL con Org ID
            let url = format!("http://localhost:5173/tv/live/{}", org_id);

            // Carica URL
            window.eval(&format!("window.location.href = '{}'", url))?;

            // Fullscreen
            window.set_fullscreen(true)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Configurare Org ID

```bash
# Metodo 1: Variabile d'ambiente
echo "export OMNILY_ORG_ID=abc123xyz" >> ~/.bashrc
source ~/.bashrc

# Metodo 2: File di configurazione
echo "abc123xyz" > ~/.omnily-org-id

# Modifica main.rs per leggere da file
```

---

## 🔧 Aggiornamenti Automatici

Tauri supporta aggiornamenti automatici integrati!

### 1. Configura Updater

In `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://tuodominio.com/updates/{{target}}/{{current_version}}"
      ],
      "dialog": false,
      "pubkey": "TUA_CHIAVE_PUBBLICA"
    }
  }
}
```

### 2. Genera Chiavi per Aggiornamenti

```bash
npx tauri signer generate -w ~/.tauri/myapp.key
```

### 3. Server di Aggiornamenti

Hosted su un server che ritorna JSON:

```json
{
  "version": "1.1.0",
  "date": "2025-12-15T10:00:00Z",
  "platforms": {
    "linux-aarch64": {
      "signature": "FIRMA_BASE64",
      "url": "https://tuodominio.com/updates/omnily-tv_1.1.0_arm64.AppImage"
    }
  }
}
```

---

## 📊 Monitoraggio e Logging

### Visualizzare Log dell'App

```bash
# Se usi systemd
sudo journalctl -u omnily-tv.service -f

# Se usi script manuale
tail -f ~/.local/share/omnily-tv/logs/app.log
```

### Crash Recovery

Il servizio systemd riavvia automaticamente l'app in caso di crash grazie a `Restart=always`.

---

## 🎯 Vantaggi del Setup Tauri

✅ **Prestazioni:** 3-4x più veloce dell'avvio browser
✅ **Memoria:** Usa 70% meno RAM
✅ **Affidabilità:** Auto-restart integrato
✅ **Aggiornamenti:** Push updates automatici
✅ **Offline-First:** Funziona anche senza connessione (se configurato)
✅ **Sicurezza:** Sandbox nativo del sistema operativo

---

## 🔄 Workflow di Sviluppo

### Sviluppo Locale

```bash
# Sul tuo Mac/PC
npm run tauri dev
```

### Build e Deploy

```bash
# Build per Raspberry Pi
npm run tauri build -- --target aarch64-unknown-linux-gnu

# Trasferisci al Raspberry Pi
scp src-tauri/target/aarch64-unknown-linux-gnu/release/omnily-tv pi@IP_RASPBERRY:~/

# SSH e riavvia il servizio
ssh pi@IP_RASPBERRY "sudo systemctl restart omnily-tv"
```

---

## 🆚 Confronto: Tauri vs Chromium Kiosk

| Aspetto | Tauri App | Chromium Kiosk |
|---------|-----------|----------------|
| **Dimensione** | 3-5 MB | 100+ MB |
| **RAM Usata** | 50-100 MB | 300-500 MB |
| **Avvio** | 1-2 sec | 5-10 sec |
| **Auto-Update** | ✅ Nativo | ❌ Manuale |
| **Sicurezza** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Setup Iniziale** | Medio | Facile |
| **Manutenzione** | Bassa | Media |

---

## 🚀 Quick Start

```bash
# 1. Installa Tauri
npm install --save-dev @tauri-apps/cli
npm install @tauri-apps/api

# 2. Inizializza
npx tauri init

# 3. Build per Raspberry Pi
npm run tauri build

# 4. Installa sul Raspberry Pi
scp src-tauri/target/release/omnily-tv pi@IP_RASPBERRY:~/
ssh pi@IP_RASPBERRY
sudo mv omnily-tv /usr/bin/
sudo systemctl enable omnily-tv.service
sudo reboot
```

---

## 📞 Supporto

**Problemi Comuni:**

1. **"WebKit not found":** Installa `libwebkit2gtk-4.0-dev`
2. **"Cross-compile fails":** Usa build diretto sul Raspberry Pi
3. **"App doesn't start":** Controlla `journalctl -u omnily-tv -f`

---

**Creato per Omnily Pro TV Display System**
Ultima modifica: Dicembre 2025

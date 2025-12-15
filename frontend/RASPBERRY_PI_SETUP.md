# 📺 Guida Installazione Display TV su Raspberry Pi 4

Questa guida ti aiuterà a configurare un Raspberry Pi 4 come display TV dedicato per Omnily Pro, con avvio automatico in modalità kiosk full-screen.

---

## 📋 Requisiti

- **Hardware:**
  - Raspberry Pi 4 (2GB RAM minimo, 4GB consigliato)
  - MicroSD Card (16GB minimo, 32GB consigliato)
  - Alimentatore ufficiale Raspberry Pi (5V 3A USB-C)
  - Monitor/TV con HDMI
  - Tastiera e mouse USB (per configurazione iniziale)
  - Connessione internet (WiFi o Ethernet)

- **Software:**
  - Raspberry Pi OS Lite (64-bit) o Desktop

---

## 🚀 Installazione Step-by-Step

### 1. Preparazione Raspberry Pi OS

1. **Scarica Raspberry Pi Imager:**
   - Vai su https://www.raspberrypi.com/software/
   - Scarica e installa Raspberry Pi Imager

2. **Installa il Sistema Operativo:**
   - Inserisci la microSD nel computer
   - Apri Raspberry Pi Imager
   - Scegli: **Raspberry Pi OS (64-bit) con Desktop**
   - Seleziona la tua microSD
   - Clicca sull'icona ingranaggio ⚙️ per configurare:
     - ✅ Abilita SSH
     - ✅ Imposta username: `pi` e password
     - ✅ Configura WiFi (se necessario)
     - ✅ Imposta timezone: Europe/Rome
   - Clicca **WRITE** e attendi

3. **Primo Avvio:**
   - Inserisci la microSD nel Raspberry Pi
   - Collega monitor, tastiera, mouse
   - Accendi il Raspberry Pi
   - Completa la configurazione iniziale

---

### 2. Configurazione Sistema

Apri il terminale e esegui:

```bash
# Aggiorna il sistema
sudo apt update && sudo apt upgrade -y

# Installa Chromium e strumenti necessari
sudo apt install -y chromium-browser unclutter xdotool

# Installa Node.js (versione LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Verifica installazione
node --version
npm --version
```

---

### 3. Deploy dell'Applicazione

#### Opzione A: Build Locale (Consigliato per Produzione)

```bash
# Crea directory per l'app
mkdir -p ~/omnily-tv
cd ~/omnily-tv

# Clona il repository (sostituisci con il tuo URL)
git clone https://github.com/tuouser/omnilypro-clean.git .

# Vai nella directory frontend
cd frontend

# Installa dipendenze
npm install

# Build dell'applicazione
npm run build

# Installa serve per servire i file statici
sudo npm install -g serve
```

#### Opzione B: Connessione Diretta al Server (Più Semplice)

Se l'applicazione è già deployata online (es. Vercel, Netlify), puoi semplicemente puntare il browser all'URL:

```bash
# Salva l'URL dell'app
echo "https://tuodominio.com/tv/live/ORG_ID" > ~/tv-url.txt
```

---

### 4. Configurazione Auto-Start in Modalità Kiosk

#### 4.1 Crea lo Script di Avvio

```bash
# Crea lo script di avvio
nano ~/start-tv.sh
```

**Incolla questo contenuto:**

```bash
#!/bin/bash

# Aspetta che il sistema sia completamente avviato
sleep 10

# Disabilita il risparmio energetico dello schermo
xset s off
xset s noblank
xset -dpms

# Nascondi il cursore del mouse
unclutter -idle 0.1 &

# Opzione A: Se stai usando build locale
# serve -s ~/omnily-tv/frontend/dist -l 3000 &
# sleep 5
# URL="http://localhost:3000/tv/live/ORG_ID"

# Opzione B: Se stai usando server remoto
URL=$(cat ~/tv-url.txt)

# Avvia Chromium in modalità kiosk
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-features=TranslateUI \
  --disable-session-crashed-bubble \
  --disable-breakpad \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --start-fullscreen \
  "$URL"
```

**Salva con:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Rendi eseguibile lo script
chmod +x ~/start-tv.sh
```

#### 4.2 Configura Avvio Automatico con LXDE

```bash
# Crea directory autostart se non esiste
mkdir -p ~/.config/lxsession/LXDE-pi

# Crea file autostart
nano ~/.config/lxsession/LXDE-pi/autostart
```

**Incolla questo contenuto:**

```bash
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash

# Disabilita risparmio energetico
@xset s off
@xset -dpms
@xset s noblank

# Avvia il display TV
@/home/pi/start-tv.sh
```

**Salva con:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 5. Configurazione Display e Risoluzione

Per ottimizzare l'output HDMI a 1920x1080:

```bash
sudo nano /boot/config.txt
```

**Aggiungi/modifica queste righe:**

```bash
# Forza output HDMI
hdmi_force_hotplug=1

# Forza risoluzione 1080p 60Hz
hdmi_group=1
hdmi_mode=16

# Disabilita overscan (bordi neri)
disable_overscan=1

# Aumenta memoria GPU (per performance grafiche)
gpu_mem=256
```

**Salva e riavvia:**
```bash
sudo reboot
```

---

### 6. Ottimizzazioni Performance

#### 6.1 Disabilita Servizi Non Necessari

```bash
# Disabilita Bluetooth (se non serve)
sudo systemctl disable bluetooth
sudo systemctl disable hciuart

# Disabilita WiFi (se usi Ethernet)
# sudo rfkill block wifi
```

#### 6.2 Aumenta Swap (se hai 2GB RAM)

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
```

Modifica: `CONF_SWAPSIZE=2048`

```bash
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

### 7. Gestione Remota (Opzionale ma Consigliato)

#### Accesso SSH

```bash
# Abilita SSH se non già fatto
sudo raspi-config
# Interfacing Options > SSH > Enable
```

Ora puoi connetterti da remoto:
```bash
ssh pi@INDIRIZZO_IP_RASPBERRY
```

#### Controllo Remoto con VNC

```bash
# Installa VNC Server
sudo apt install realvnc-vnc-server realvnc-vnc-viewer

# Abilita VNC
sudo raspi-config
# Interfacing Options > VNC > Enable
```

---

### 8. Script di Manutenzione

#### Riavvio Automatico Notturno

```bash
# Apri crontab
crontab -e

# Aggiungi questa riga (riavvio ogni notte alle 3:00)
0 3 * * * /sbin/shutdown -r now
```

#### Script di Aggiornamento Remoto

```bash
nano ~/update-tv.sh
```

```bash
#!/bin/bash
cd ~/omnily-tv/frontend
git pull
npm install
npm run build
sudo reboot
```

```bash
chmod +x ~/update-tv.sh
```

---

## 🎯 URL di Accesso

### URL Personalizzato per Organizzazione

Sostituisci `ORG_ID` con l'ID della tua organizzazione:

**Produzione:**
```
https://tuodominio.com/tv/live/ORG_ID
```

**Locale:**
```
http://localhost:5173/tv/live/ORG_ID
```

**Esempio:**
```
https://app.omnilypro.com/tv/live/abc123xyz
```

---

## 🔧 Risoluzione Problemi

### Schermo Nero dopo Avvio
```bash
# Controlla se Chromium è in esecuzione
ps aux | grep chromium

# Controlla log errori
nano ~/.xsession-errors
```

### Browser Non si Avvia in Fullscreen
- Verifica che lo script `start-tv.sh` sia eseguibile
- Controlla il file autostart in `~/.config/lxsession/LXDE-pi/`

### Performance Basse
- Aumenta `gpu_mem` in `/boot/config.txt`
- Disabilita servizi non necessari
- Usa Ethernet invece di WiFi

### Cursore Visibile
```bash
# Reinstalla unclutter
sudo apt install --reinstall unclutter
```

---

## 📱 Controllo da Admin Panel

Una volta configurato il Raspberry Pi:

1. Vai su **Admin Panel > TV Control**
2. Le modifiche (background, ticker, lottery, etc.) si sincronizzeranno automaticamente
3. Usa **"Salva e Aggiorna Display"** per applicare i cambiamenti

---

## 🔐 Sicurezza

### Cambia Password Predefinita
```bash
passwd
```

### Firewall (Opzionale)
```bash
sudo apt install ufw
sudo ufw allow ssh
sudo ufw enable
```

---

## 📊 Monitoraggio

### Temperatura CPU
```bash
vcgencmd measure_temp
```

### Memoria e CPU
```bash
htop
```

---

## 🎉 Verifica Finale

Dopo aver completato tutti i passaggi:

1. ✅ Riavvia il Raspberry Pi: `sudo reboot`
2. ✅ Attendi 30 secondi
3. ✅ Il browser dovrebbe aprirsi automaticamente in fullscreen
4. ✅ Vedrai il display TV di Omnily Pro
5. ✅ Testa le modifiche dall'Admin Panel

---

## 📞 Supporto

Se hai problemi:
1. Controlla i log: `nano ~/.xsession-errors`
2. Verifica che Chromium sia in esecuzione: `ps aux | grep chromium`
3. Testa l'URL manualmente: apri Chromium e vai all'URL

---

## 🚀 Deployment Professionale (Opzionale)

Per un setup più robusto, considera:

- **Docker:** Containerizza l'applicazione
- **Watchdog:** Riavvia automaticamente in caso di crash
- **Backup Automatico:** Backup giornaliero della configurazione
- **Monitoraggio:** Uptime monitoring con servizi come UptimeRobot

---

**Creato per Omnily Pro TV Display System**
Ultima modifica: Dicembre 2025

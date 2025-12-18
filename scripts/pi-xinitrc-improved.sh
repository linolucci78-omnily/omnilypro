#!/bin/bash
# .xinitrc migliorato per OmnilyPro Digital Signage
# Questo file va copiato in /home/pi/.xinitrc sul Raspberry Pi

# Setup logging
LOG_FILE="/home/pi/omnilypro-app/startup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================="
echo "OmnilyPro Kiosk Startup - $(date)"
echo "========================================="

# Disabilita screensaver e power management
echo "Configurazione display..."
xset s off
xset -dpms
xset s noblank

# Aspetta che X11 sia completamente pronto
echo "Attesa inizializzazione X11..."
sleep 3

# Nascondi cursore
echo "Avvio unclutter..."
unclutter -idle 0.1 -root &

# Avvia window manager in background
echo "Avvio window manager..."
matchbox-window-manager -use_cursor no &
sleep 2

# Variabili d'ambiente per Tauri/Webkit
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export GDK_BACKEND=x11
export DISPLAY=:0

# Path all'app
APP_PATH="/home/pi/omnilypro-app/omnilypro-signage"

# Verifica che l'app esista
if [ ! -f "$APP_PATH" ]; then
    echo "ERROR: App non trovata in $APP_PATH"
    sleep 10
    exit 1
fi

# Verifica permessi esecuzione
if [ ! -x "$APP_PATH" ]; then
    echo "ERROR: App non ha permessi di esecuzione"
    chmod +x "$APP_PATH"
fi

echo "Avvio applicazione..."
echo "Path: $APP_PATH"

# Avvia l'app e cattura eventuali errori
"$APP_PATH" 2>&1 | tee -a "$LOG_FILE"

# Se l'app termina, logga l'exit code
EXIT_CODE=$?
echo "App terminata con exit code: $EXIT_CODE"

# Attendi prima di chiudere X11
sleep 5

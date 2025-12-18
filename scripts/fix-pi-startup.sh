#!/bin/bash
# Script per fixare i problemi di avvio su Raspberry Pi
# Esegui questo script SUL Raspberry Pi dopo aver copiato il binario

set -e

echo "================================"
echo "Fix Startup OmnilyPro Pi"
echo "================================"
echo ""

# 1. Copia .xinitrc migliorato
echo "📝 [1/4] Aggiornamento .xinitrc..."
cat > /home/pi/.xinitrc <<'EOF'
#!/bin/bash
# .xinitrc migliorato per OmnilyPro Digital Signage

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
EOF

chmod +x /home/pi/.xinitrc
echo "✅ .xinitrc aggiornato"

# 2. Crea directory app se non esiste
echo ""
echo "📁 [2/4] Verifica directory app..."
mkdir -p /home/pi/omnilypro-app
echo "✅ Directory pronta"

# 3. Verifica binario
echo ""
echo "🔍 [3/4] Verifica binario..."
if [ -f /home/pi/omnilypro-app/omnilypro-signage ]; then
    chmod +x /home/pi/omnilypro-app/omnilypro-signage
    echo "✅ Binario trovato e permessi impostati"
    ls -lh /home/pi/omnilypro-app/omnilypro-signage
else
    echo "⚠️  Binario non trovato!"
    echo "    Copia il binario compilato in:"
    echo "    /home/pi/omnilypro-app/omnilypro-signage"
fi

# 4. Crea script di test manuale
echo ""
echo "🧪 [4/4] Creazione script di test..."
cat > /home/pi/omnilypro-app/test-app.sh <<'EOF'
#!/bin/bash
# Script per testare l'app manualmente

echo "Test avvio OmnilyPro..."
echo "Logs verranno salvati in: startup.log"
echo ""

export WEBKIT_DISABLE_COMPOSITING_MODE=1
export GDK_BACKEND=x11
export DISPLAY=:0

/home/pi/omnilypro-app/omnilypro-signage 2>&1 | tee startup.log
EOF

chmod +x /home/pi/omnilypro-app/test-app.sh
echo "✅ Script di test creato"

echo ""
echo "================================"
echo "✅ FIX COMPLETATO!"
echo "================================"
echo ""
echo "📋 Prossimi passi:"
echo ""
echo "1. Se non l'hai già fatto, copia il binario compilato:"
echo "   scp frontend/src-tauri/target/release/omnilypro-signage pi@IP_PI:/home/pi/omnilypro-app/"
echo ""
echo "2. Per testare l'app SENZA reboot (da SSH):"
echo "   cd /home/pi/omnilypro-app"
echo "   ./test-app.sh"
echo ""
echo "3. Per vedere i log di startup:"
echo "   cat /home/pi/omnilypro-app/startup.log"
echo ""
echo "4. Quando sei pronto, riavvia per test completo:"
echo "   sudo reboot"
echo ""

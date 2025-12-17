#!/bin/bash

# Script completo per configurare Raspberry Pi in modalità Kiosk
# Esegui questo script sul Raspberry Pi client

set -e

echo "================================"
echo "OmnilyPro Kiosk Mode Setup"
echo "================================"
echo ""

# 1. Installa unclutter per nascondere cursore
echo "📦 Installazione unclutter..."
sudo apt update
sudo apt install -y unclutter

# 2. Nascondi messaggi di boot
echo "🔧 Configurazione boot silenzioso..."
sudo cp /boot/firmware/cmdline.txt /boot/firmware/cmdline.txt.backup
if ! grep -q "quiet splash" /boot/firmware/cmdline.txt; then
    # Rimuovi eventuali newline e aggiungi parametri alla fine
    sudo sed -i '$ s/$/ quiet splash loglevel=0 logo.nologo vt.global_cursor_default=0/' /boot/firmware/cmdline.txt
    echo "✅ Parametri boot aggiunti"
else
    echo "ℹ️ Parametri boot già presenti"
fi

# 3. Configura autostart LXDE
echo "🖥️ Configurazione autostart desktop..."
mkdir -p /home/pi/.config/lxsession/LXDE-pi

cat > /home/pi/.config/lxsession/LXDE-pi/autostart <<EOF
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
EOF

echo "✅ Autostart desktop configurato"

# 4. Crea autostart per l'app
echo "🚀 Configurazione autostart app..."
mkdir -p /home/pi/.config/autostart

cat > /home/pi/.config/autostart/omnilypro.desktop <<EOF
[Desktop Entry]
Type=Application
Name=OmnilyPro Signage
Exec=/home/pi/omnilypro-signage
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

echo "✅ Autostart app configurato"

# 5. Ferma e disabilita servizio systemd se esiste
echo "🛑 Rimozione servizio systemd..."
if systemctl is-enabled omnilypro-signage.service &>/dev/null; then
    sudo systemctl stop omnilypro-signage.service
    sudo systemctl disable omnilypro-signage.service
    echo "✅ Servizio systemd disabilitato"
else
    echo "ℹ️ Servizio systemd non trovato"
fi

# 6. Verifica che il binario esista
if [ ! -f /home/pi/omnilypro-signage ]; then
    echo "⚠️ ATTENZIONE: Il binario /home/pi/omnilypro-signage non esiste!"
    echo "   Devi copiarlo prima con: scp dal build Pi"
    exit 1
fi

# 7. Rendi eseguibile il binario
chmod +x /home/pi/omnilypro-signage
echo "✅ Binario reso eseguibile"

echo ""
echo "================================"
echo "✅ Setup Kiosk Mode Completato!"
echo "================================"
echo ""
echo "Configurazioni applicate:"
echo "  ✅ Boot silenzioso (no messaggi Linux)"
echo "  ✅ Cursore mouse nascosto automaticamente"
echo "  ✅ Screensaver disabilitato"
echo "  ✅ App parte automaticamente al boot"
echo "  ✅ Modalità fullscreen/kiosk"
echo ""
echo "🔄 RIAVVIA il Raspberry Pi per applicare le modifiche:"
echo "   sudo reboot"
echo ""

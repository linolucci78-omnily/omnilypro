#!/bin/bash

# Script completo per configurare Raspberry Pi OS Lite in modalità Kiosk
# Installa TUTTO: ambiente grafico minimo, compila l'app, configura kiosk mode
# Esegui questo script sul Raspberry Pi client con OS Lite

set -e

echo "================================"
echo "OmnilyPro Complete Kiosk Setup"
echo "================================"
echo ""
echo "Questo script:"
echo "  1. Installa ambiente grafico minimo (X11)"
echo "  2. Installa dipendenze per compilare Tauri"
echo "  3. Clona e compila l'app"
echo "  4. Configura modalità kiosk"
echo "  5. Configura autostart"
echo ""
read -p "Continua? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# ========================================
# 1. INSTALLA AMBIENTE GRAFICO MINIMO
# ========================================
echo ""
echo "📦 [1/5] Installazione ambiente grafico minimo..."
sudo apt update
sudo apt install -y \
    xserver-xorg \
    xinit \
    x11-xserver-utils \
    matchbox-window-manager \
    unclutter

echo "✅ Ambiente grafico installato"

# ========================================
# 2. INSTALLA DIPENDENZE TAURI + BUILD TOOLS
# ========================================
echo ""
echo "📦 [2/5] Installazione dipendenze Tauri e build tools..."

# Installa Node.js 20
if ! command -v node &> /dev/null; then
    echo "Installazione Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js già installato: $(node --version)"
fi

# Installa Rust
if ! command -v cargo &> /dev/null; then
    echo "Installazione Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "Rust già installato: $(rustc --version)"
fi

# Installa dipendenze sistema per Tauri
echo "Installazione librerie grafiche..."
sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    libssl-dev \
    librsvg2-dev \
    build-essential \
    curl \
    wget \
    file \
    git

echo "✅ Dipendenze Tauri installate"

# ========================================
# 3. CLONA E COMPILA L'APP
# ========================================
echo ""
echo "📥 [3/5] Clone repository e compilazione app..."
echo "⚠️  Questa fase richiede circa 20 minuti!"

# Rimuovi directory vecchia se esiste
if [ -d "$HOME/omnilypro-clean" ]; then
    echo "Rimozione directory vecchia..."
    rm -rf "$HOME/omnilypro-clean"
fi

# Clona repository
echo "Clone da GitHub..."
cd "$HOME"
git clone https://github.com/linolucci78-omnily/omnilypro.git omnilypro-clean
cd omnilypro-clean/frontend

# Installa dipendenze frontend
echo "Installazione dipendenze frontend..."
npm install

# Build frontend
echo "Build frontend..."
npm run build

# Compila Tauri (ARM64)
echo "Compilazione Tauri (questa è la parte più lunga)..."
source "$HOME/.cargo/env"
cd src-tauri
cargo build --release

# Copia binario in posizione finale
echo "Copia binario..."
mkdir -p /home/pi/omnilypro-app
cp target/release/omnilypro-signage /home/pi/omnilypro-app/
chmod +x /home/pi/omnilypro-app/omnilypro-signage

echo "✅ App compilata e installata"

# ========================================
# 4. CONFIGURA KIOSK MODE
# ========================================
echo ""
echo "🖥️  [4/5] Configurazione modalità kiosk..."

# Nascondi messaggi di boot
sudo cp /boot/firmware/cmdline.txt /boot/firmware/cmdline.txt.backup 2>/dev/null || true
if [ -f /boot/firmware/cmdline.txt ]; then
    if ! grep -q "quiet splash" /boot/firmware/cmdline.txt; then
        sudo sed -i '$ s/$/ quiet splash loglevel=0 logo.nologo vt.global_cursor_default=0/' /boot/firmware/cmdline.txt
        echo "✅ Boot silenzioso configurato"
    fi
fi

# Configura X11 per avviarsi automaticamente
echo "Configurazione autostart X11..."
cat > /home/pi/.xinitrc <<'EOF'
#!/bin/bash
# Disabilita screensaver e power management
xset s off
xset -dpms
xset s noblank

# Nascondi cursore
unclutter -idle 0.1 -root &

# Avvia window manager
matchbox-window-manager -use_cursor no &

# Avvia l'app in fullscreen
/home/pi/omnilypro-app/omnilypro-signage
EOF

chmod +x /home/pi/.xinitrc

echo "✅ Kiosk mode configurato"

# ========================================
# 5. CONFIGURA AUTOSTART AL BOOT
# ========================================
echo ""
echo "🚀 [5/5] Configurazione autostart..."

# Configura autologin
sudo raspi-config nonint do_boot_behaviour B2

# Aggiungi startx a .bash_profile per avvio automatico
if ! grep -q "startx" /home/pi/.bash_profile 2>/dev/null; then
    cat >> /home/pi/.bash_profile <<'EOF'

# Avvia X11 automaticamente al login
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    startx
fi
EOF
    echo "✅ Autostart configurato"
fi

echo ""
echo "================================"
echo "✅ SETUP COMPLETATO!"
echo "================================"
echo ""
echo "Configurazioni applicate:"
echo "  ✅ Ambiente grafico minimo installato"
echo "  ✅ Dipendenze Tauri installate"
echo "  ✅ App compilata e installata"
echo "  ✅ Boot silenzioso configurato"
echo "  ✅ Screensaver disabilitato"
echo "  ✅ Cursore nascosto"
echo "  ✅ Autostart al boot configurato"
echo "  ✅ Modalità kiosk attiva"
echo ""
echo "🔄 RIAVVIA il Raspberry Pi per avviare l'app:"
echo "   sudo reboot"
echo ""
echo "Dopo il reboot, l'app partirà automaticamente in fullscreen!"
echo ""

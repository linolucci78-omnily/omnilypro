#!/bin/bash

# Script di setup per Raspberry Pi Client
# Installa e configura l'app OmnilyPro per i clienti

set -e

echo "================================"
echo "OmnilyPro Client Setup"
echo "================================"
echo ""

# Verifica che sia eseguito su Raspberry Pi
if [[ ! -f /proc/device-tree/model ]] || ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo "⚠️  Attenzione: Questo script è progettato per Raspberry Pi"
    read -p "Vuoi continuare comunque? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Aggiornamento sistema..."
sudo apt update && sudo apt upgrade -y

echo ""
echo "📦 Installazione dipendenze runtime..."
sudo apt install -y \
    libwebkit2gtk-4.1-0 \
    libgtk-3-0 \
    libayatana-appindicator3-1 \
    curl \
    wget

echo ""
echo "📁 Creazione directory app..."
sudo mkdir -p /opt/omnilypro

echo ""
echo "📥 Download ultima versione app..."
GITHUB_REPO="linolucci78-omnily/omnilypro"
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_RELEASE" ]; then
    echo "❌ Errore: Nessuna release trovata"
    echo "Assicurati di aver creato almeno una release su GitHub"
    exit 1
fi

echo "Versione trovata: $LATEST_RELEASE"

DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$LATEST_RELEASE/omnilypro-signage"

echo "Download da: $DOWNLOAD_URL"
sudo curl -L -o /opt/omnilypro/omnilypro-signage "$DOWNLOAD_URL"
sudo chmod +x /opt/omnilypro/omnilypro-signage

echo ""
echo "⚙️  Creazione servizio systemd..."
sudo tee /etc/systemd/system/omnilypro-signage.service > /dev/null <<EOF
[Unit]
Description=OmnilyPro Digital Signage
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/omnilypro
ExecStart=/opt/omnilypro/omnilypro-signage
Restart=always
RestartSec=10
Environment="DISPLAY=:0"
Environment="XAUTHORITY=/home/pi/.Xauthority"

[Install]
WantedBy=graphical.target
EOF

echo ""
echo "🔄 Abilitazione auto-start..."
sudo systemctl daemon-reload
sudo systemctl enable omnilypro-signage
sudo systemctl start omnilypro-signage

echo ""
echo "✅ Setup completato!"
echo ""
echo "Stato servizio:"
sudo systemctl status omnilypro-signage --no-pager | head -10
echo ""
echo "Comandi utili:"
echo "  - Riavvia app:  sudo systemctl restart omnilypro-signage"
echo "  - Stop app:     sudo systemctl stop omnilypro-signage"
echo "  - Vedi log:     sudo journalctl -u omnilypro-signage -f"
echo "  - Stato:        sudo systemctl status omnilypro-signage"
echo ""
echo "L'app si aggiornerà automaticamente ogni 6 ore!"
echo ""

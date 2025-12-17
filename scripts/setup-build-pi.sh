#!/bin/bash

# Script di setup per Raspberry Pi Build Server
# Installa tutte le dipendenze necessarie per compilare l'app Tauri

set -e

echo "================================"
echo "OmnilyPro Build Server Setup"
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
echo "📦 Installazione dipendenze Tauri..."
sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libglib2.0-dev \
    pkg-config

echo ""
echo "📦 Installazione Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js già installato: $(node -v)"
fi

echo ""
echo "📦 Installazione Rust..."
if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "Rust già installato: $(rustc --version)"
fi

echo ""
echo "📦 Installazione GitHub Actions Runner..."
echo ""
echo "Per completare l'installazione del runner, segui questi passi:"
echo ""
echo "1. Vai su: https://github.com/TUO-USERNAME/TUO-REPO/settings/actions/runners/new"
echo "2. Seleziona 'Linux' e 'ARM64'"
echo "3. Esegui i comandi che ti vengono mostrati per scaricare e configurare il runner"
echo ""
echo "Dopo aver configurato il runner, esegui:"
echo "  cd ~/actions-runner"
echo "  sudo ./svc.sh install"
echo "  sudo ./svc.sh start"
echo ""

echo ""
echo "✅ Setup completato!"
echo ""
echo "Dipendenze installate:"
echo "  - Node.js: $(node -v)"
echo "  - npm: $(npm -v)"
echo "  - Rust: $(rustc --version 2>/dev/null || echo 'Ricarica la shell per usare Rust')"
echo "  - Cargo: $(cargo --version 2>/dev/null || echo 'Ricarica la shell per usare Cargo')"
echo ""
echo "Prossimi passi:"
echo "1. Configura il GitHub Actions runner seguendo le istruzioni sopra"
echo "2. Fai push del codice su GitHub"
echo "3. Il build partirà automaticamente!"
echo ""

#!/bin/zsh
# Script per fixare Node e dipendenze frontend su macOS

# Usa nvm per passare a Node v20
if command -v nvm >/dev/null 2>&1; then
  echo "Uso nvm per impostare Node v20..."
  nvm install 20
  nvm use 20
else
  echo "nvm non trovato. Assicurati di avere Node v20 installato!"
fi

# Vai nella cartella frontend
cd /Users/pasqualelucci/Desktop/omnilypro/frontend || exit 1

# Cancella dipendenze vecchie
rm -rf node_modules package-lock.json

# Reinstalla dipendenze
npm install

# Avvia il server frontend
npm run dev

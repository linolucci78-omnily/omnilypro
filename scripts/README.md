# Script di Setup Raspberry Pi

Questi script automatizzano la configurazione dei Raspberry Pi per OmnilyPro.

## setup-build-pi.sh

**Uso**: Configurare il Raspberry Pi che compila l'app (build server)

```bash
curl -sSL https://raw.githubusercontent.com/linolucci78-omnily/omnilypro/main/scripts/setup-build-pi.sh | bash
```

**Cosa fa**:
- Installa Node.js 20
- Installa Rust e Cargo
- Installa tutte le dipendenze Tauri
- Prepara il sistema per compilare l'app

**Quando usarlo**: Solo una volta, sul Raspberry Pi che userai come build server

---

## setup-client-pi.sh

**Uso**: Configurare i Raspberry Pi dei clienti

```bash
curl -sSL https://raw.githubusercontent.com/linolucci78-omnily/omnilypro/main/scripts/setup-client-pi.sh | bash
```

**Cosa fa**:
- Installa solo le dipendenze runtime (molto più leggero)
- Scarica l'ultima versione dell'app da GitHub Releases
- Configura l'app per partire al boot
- Abilita gli aggiornamenti automatici

**Quando usarlo**: Su ogni Raspberry Pi che dai ai clienti

---

## Workflow Completo

### 1. Setup Build Server (una volta sola)

```bash
# Sul Raspberry Pi di build
curl -sSL https://raw.githubusercontent.com/linolucci78-omnily/omnilypro/main/scripts/setup-build-pi.sh | bash

# Poi configura GitHub Actions Runner manualmente seguendo le istruzioni
```

### 2. Setup Cliente (per ogni nuovo cliente)

```bash
# Sul Raspberry Pi del cliente
curl -sSL https://raw.githubusercontent.com/linolucci78-omnily/omnilypro/main/scripts/setup-client-pi.sh | bash
```

### 3. Rilascio Nuova Versione

```bash
# Sul tuo Mac
git tag v1.0.0
git push origin main --tags

# GitHub compila automaticamente
# I Pi dei clienti si aggiornano automaticamente ogni 6 ore
```

---

## Requisiti

- Raspberry Pi OS Lite 64-bit
- Connessione internet
- Utente `pi` con sudo

---

## Troubleshooting

### Build fallisce

```bash
# Verifica le dipendenze
dpkg -l | grep libwebkit2gtk
dpkg -l | grep libgtk-3

# Reinstalla se mancano
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev
```

### App non parte sui clienti

```bash
# Verifica il servizio
sudo systemctl status omnilypro-signage

# Vedi i log
sudo journalctl -u omnilypro-signage -f

# Riavvia
sudo systemctl restart omnilypro-signage
```

### Aggiornamenti non funzionano

```bash
# Verifica la connessione a GitHub
curl -I https://github.com/linolucci78-omnily/omnilypro/releases/latest

# Forza aggiornamento manuale
sudo systemctl restart omnilypro-signage
```

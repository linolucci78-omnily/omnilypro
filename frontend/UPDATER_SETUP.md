# Setup Auto-Update per OmnilyPro Signage

## Cos'è l'Auto-Update?

Il sistema di auto-update permette ai Raspberry Pi dei tuoi clienti di **aggiorn arsi automaticamente** senza intervento manuale.

### Come funziona:

1. **Tu rilasci una nuova versione**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **GitHub Actions compila automaticamente**:
   - Crea i file `.deb` e `.AppImage` per ARM64
   - Firma i file con una chiave privata (sicurezza)
   - Pubblica la release su GitHub

3. **Il Raspberry Pi si aggiorna da solo**:
   - Ogni 6 ore controlla se c'è una nuova versione
   - Scarica l'aggiornamento in background
   - Installa l'aggiornamento
   - Riavvia l'app
   - **Il cliente non fa NULLA**

## Setup iniziale (da fare UNA SOLA VOLTA)

### 1. Genera le chiavi di firma

Le chiavi servono per firmare gli aggiornamenti e garantire sicurezza.

```bash
cd /Users/pasqualelucci/omnilypro-clean/frontend
npx @tauri-apps/cli signer generate -w ~/.tauri/omnilypro.key
```

Ti verrà chiesta una password. **Salvala in un posto sicuro** (es. 1Password).

Questo comando genera:
- **Chiave privata**: `~/.tauri/omnilypro.key` (NON condividere mai!)
- **Chiave pubblica**: stampata nel terminale (la usi nell'app)

### 2. Copia la chiave pubblica

Dopo aver generato le chiavi, vedrai qualcosa tipo:

```
Your keypair was generated successfully!
Private key path: /Users/pasqualelucci/.tauri/omnilypro.key
Public key: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDNCRUE3QzI5MjcyNzQzQUQKUldRWU52UHc2ekI2...
```

**Copia l'intera stringa della chiave pubblica**.

### 3. Aggiorna tauri.conf.json

Apri `src-tauri/tauri.conf.json` e sostituisci `UPDATER_PUBLIC_KEY_PLACEHOLDER` con la chiave pubblica:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api.github.com/repos/{{owner}}/{{repo}}/releases/latest"
      ],
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDNCRUE3QzI5MjcyNzQzQUQKUldRWU52UHc2ekI2..."
    }
  }
}
```

### 4. Aggiungi i secrets su GitHub

Vai su GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret

**Secret 1:**
- Name: `TAURI_SIGNING_PRIVATE_KEY`
- Value: Il contenuto del file `~/.tauri/omnilypro.key`

Per copiare il contenuto:
```bash
cat ~/.tauri/omnilypro.key | pbcopy
```
Poi incolla su GitHub.

**Secret 2:**
- Name: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Value: La password che hai scelto prima

### 5. Aggiorna il repository URL

In `tauri.conf.json`, sostituisci `{{owner}}` e `{{repo}}` con i tuoi valori:

```json
"endpoints": [
  "https://api.github.com/repos/TUOUSERNAME/TUOREPOSITORY/releases/latest"
]
```

Esempio:
```json
"endpoints": [
  "https://api.github.com/repos/pasqualelucci/omnilypro-clean/releases/latest"
]
```

## Come usarlo

### Rilasciare una nuova versione:

1. Aggiorna il numero di versione in `src-tauri/Cargo.toml`:
   ```toml
   [package]
   version = "1.0.1"  # <-- Cambia qui
   ```

2. Committa e crea un tag:
   ```bash
   git add .
   git commit -m "Release v1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```

3. GitHub Actions compilerà automaticamente

4. I Raspberry Pi si aggiorneranno automaticamente entro 6 ore

### Testare gli aggiornamenti manualmente:

Se vuoi forzare un check per aggiornamenti senza aspettare 6 ore, puoi riavviare l'app sul Raspberry Pi:

```bash
sudo systemctl restart omnilypro-signage
```

## Vantaggi per i clienti

- **Zero manutenzione**: Non devono fare nulla
- **Sempre aggiornati**: Ricevono automaticamente nuove funzionalità e fix
- **Sicuro**: Gli aggiornamenti sono firmati crittograficamente
- **Affidabile**: Se l'aggiornamento fallisce, l'app continua a funzionare con la versione precedente

## Scenario reale

**Esempio:**

1. **Lunedì**: Un parrucchiere installa il Raspberry Pi con la versione 1.0.0
2. **Mercoledì**: Tu rilasci la versione 1.0.1 con un fix importante
3. **Mercoledì sera**: GitHub compila e pubblica la release
4. **Giovedì mattina**: Il Raspberry Pi controlla (dopo 6h), trova l'aggiornamento, lo scarica e installa
5. **Giovedì mattina**: Il parrucchiere arriva al negozio e ha già la versione 1.0.1 - senza fare nulla

Il parrucchiere **non sa nemmeno che è successo un aggiornamento**. Tutto trasparente e automatico.

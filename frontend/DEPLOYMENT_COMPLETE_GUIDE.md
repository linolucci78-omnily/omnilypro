# 🚀 OmnilyPro Digital Signage - Guida Completa al Deployment

## 📋 Sistema Automatico di Distribuzione

Hai ora un sistema **completamente automatico** per distribuire l'app su tutti i Raspberry Pi dei tuoi clienti!

---

## 🎯 Come Funziona il Sistema

### **Per Te (Sviluppatore)**

1. Sviluppi nuove funzionalità sul tuo Mac
2. Fai commit e push su GitHub con un tag versione
3. GitHub Actions compila automaticamente per ARM64
4. **FINE!** Non devi fare altro

### **Per i Raspberry Pi (Automatico)**

1. Ogni 6 ore controllano se c'è una nuova versione
2. Scaricano e installano automaticamente l'aggiornamento
3. Si riavviano con la nuova versione
4. **I tuoi clienti non devono fare NULLA!**

---

## ⚙️ Setup Iniziale (DA FARE UNA SOLA VOLTA)

### **Passo 1: Configura GitHub Secrets**

Vai su: https://github.com/linolucci78-omnily/omnilypro/settings/secrets/actions

Aggiungi questi 2 secrets:

1. **TAURI_SIGNING_PRIVATE_KEY**
   ```
   dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5aTFPN3EvMmpVVHBINTdlYUVCbXY4dUxkVjMxdVR0djlDL1FOdTRTQnV5SUFBQkFBQUFBQUFBQUFBQUlBQUFBQVl2UEQxTjF1Z2JiLy9BRzQ4R1Y4b295NExxdytockllNitjZENJZzZtV01DajBFWWl4dGd5ZmRzemtqd0dtakpSS3dKa3UxcEN5Tlpjd09tY29BaUJzRU1Jdnp2VERrdDBhSG52a01yWEFOUkVXSFl1NlZPRWUrOGYxUk53N1NrMUJqNnRVS2srWm89Cg==
   ```

2. **TAURI_SIGNING_PRIVATE_KEY_PASSWORD**
   - Lascia vuoto (premi solo "Add secret")

---

## 🚀 Workflow di Rilascio

### **Scenario 1: Prima Release (v1.0.0)**

```bash
# 1. Assicurati che tutto sia committato
git status

# 2. Commit finale
git add .
git commit -m "chore: prepare for v1.0.0 release"

# 3. Crea il tag
git tag v1.0.0

# 4. Push tutto
git push origin main --tags
```

### **Scenario 2: Bug Fix (v1.0.1)**

```bash
# 1. Fix il bug
# 2. Commit
git add .
git commit -m "fix: resolve splash screen issue"

# 3. Tag
git tag v1.0.1

# 4. Push
git push origin main --tags
```

### **Scenario 3: Nuova Feature (v1.1.0)**

```bash
# 1. Sviluppa la feature
# 2. Commit
git add .
git commit -m "feat: add new template editor"

# 3. Tag
git tag v1.1.0

# 4. Push
git push origin main --tags
```

---

## 📦 Deployment Manuale (Per Test)

Se vuoi testare prima dell'auto-update, usa lo script di deployment:

```bash
./deploy-to-pi.sh 192.168.1.237
```

Lo script:
1. ✅ Scarica l'ultima release da GitHub
2. ✅ La copia sul Raspberry Pi
3. ✅ La installa in `/opt/omnilypro/`
4. ✅ Abilita il servizio

---

## 🔍 Monitoraggio e Debug

### **Verificare lo stato dell'app**

```bash
ssh pi@192.168.1.237
sudo systemctl status omnilypro-signage
```

### **Vedere i log in tempo reale**

```bash
ssh pi@192.168.1.237
sudo journalctl -u omnilypro-signage -f
```

### **Riavviare l'app**

```bash
ssh pi@192.168.1.237
sudo systemctl restart omnilypro-signage
```

### **Verificare la versione installata**

```bash
ssh pi@192.168.1.237
/opt/omnilypro/omnilypro-signage --version
```

---

## 📊 Verificare il Workflow su GitHub

Dopo aver fatto push con un tag:

1. Vai su: https://github.com/linolucci78-omnily/omnilypro/actions
2. Dovresti vedere il workflow "Build Tauri App" in esecuzione
3. Aspetta circa 10-15 minuti per la compilazione
4. Verifica che la release sia stata creata: https://github.com/linolucci78-omnily/omnilypro/releases

---

## 🎯 Checklist Pre-Release

Prima di ogni release, verifica:

- [ ] Tutti i test passano
- [ ] L'app funziona in modalità development
- [ ] Il numero di versione è corretto in `tauri.conf.json`
- [ ] Il CHANGELOG è aggiornato (se ne hai uno)
- [ ] Hai testato la splash screen (7 secondi)
- [ ] Hai testato la pairing page

---

## 🔐 Sicurezza

### **Chiavi di Firma**

Le chiavi sono salvate in:
- **Privata**: `~/.tauri/omnilypro-signage.key` (⚠️ NON CONDIVIDERE MAI!)
- **Pubblica**: `~/.tauri/omnilypro-signage.key.pub` (già in `tauri.conf.json`)

### **Backup della Chiave Privata**

⚠️ **IMPORTANTE**: Fai un backup sicuro della chiave privata!

```bash
# Backup su chiavetta USB
cp ~/.tauri/omnilypro-signage.key /Volumes/USB_BACKUP/

# O salvala in un password manager (1Password, LastPass, etc.)
cat ~/.tauri/omnilypro-signage.key
```

Se perdi la chiave privata, dovrai:
1. Generare nuove chiavi
2. Aggiornare i GitHub Secrets
3. Aggiornare `tauri.conf.json`
4. **Tutti i Raspberry Pi NON potranno più aggiornarsi automaticamente!**

---

## 🎨 Personalizzazione

### **Cambiare il Logo nella Splash Screen**

Modifica in `src/pages/TV/SplashPage.tsx`:
```typescript
src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png"
```

### **Cambiare la Durata della Splash Screen**

Modifica in `src/pages/TV/SplashPage.tsx`:
```typescript
setTimeout(() => navigate('/tv/pair'), 7000) // 7 secondi
```

### **Cambiare la Frequenza di Controllo Aggiornamenti**

Modifica in `src-tauri/src/main.rs`:
```rust
tokio::time::Duration::from_secs(6 * 60 * 60) // 6 ore
```

---

## 📱 Setup Nuovo Raspberry Pi

Per ogni nuovo cliente:

1. **Prepara la microSD**
   - Usa Raspberry Pi Imager
   - Scegli "Raspberry Pi OS Lite (64-bit)"
   - Configura SSH, WiFi, username: `pi`

2. **Installa il sistema**
   ```bash
   ssh pi@INDIRIZZO_IP
   curl -sSL https://raw.githubusercontent.com/linolucci78-omnily/omnilypro/main/raspberry-pi-setup.sh | sudo bash
   ```

3. **Deploy l'app**
   ```bash
   ./deploy-to-pi.sh INDIRIZZO_IP
   ```

4. **Riavvia**
   ```bash
   ssh pi@INDIRIZZO_IP 'sudo reboot'
   ```

5. **FATTO!** Il Raspberry Pi ora si aggiornerà automaticamente ogni 6 ore

---

## 🆘 Troubleshooting

### **GitHub Actions fallisce**

- Verifica che i secrets siano configurati correttamente
- Controlla i log su: https://github.com/linolucci78-omnily/omnilypro/actions

### **Raspberry Pi non si aggiorna**

```bash
# Verifica connessione internet
ssh pi@IP 'ping -c 3 github.com'

# Verifica log dell'updater
ssh pi@IP 'sudo journalctl -u omnilypro-signage -f | grep update'
```

### **App non parte al boot**

```bash
# Verifica che il servizio sia abilitato
ssh pi@IP 'sudo systemctl is-enabled omnilypro-signage'

# Abilita se necessario
ssh pi@IP 'sudo systemctl enable omnilypro-signage'
```

---

## 📞 Support

Per problemi o domande:
- GitHub Issues: https://github.com/linolucci78-omnily/omnilypro/issues
- Email: [tua email]

---

**Fatto con ❤️ da OmnilyPro**

🎉 **Complimenti! Hai ora un sistema di distribuzione automatica completamente funzionante!**

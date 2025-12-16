# 🔐 GitHub Setup - OmnilyPro Auto-Update System

## 📋 Configurazione GitHub Secrets

Per abilitare il sistema di auto-update, devi configurare questi secrets su GitHub:

### **PASSO 1: Vai su GitHub Secrets**

1. Vai su: https://github.com/linolucci78-omnily/omnilypro/settings/secrets/actions
2. Clicca su **"New repository secret"**

### **PASSO 2: Aggiungi TAURI_SIGNING_PRIVATE_KEY**

- **Name**: `TAURI_SIGNING_PRIVATE_KEY`
- **Value**: Copia ESATTAMENTE questo contenuto (incluse tutte le righe):

```
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5aTFPN3EvMmpVVHBINTdlYUVCbXY4dUxkVjMxdVR0djlDL1FOdTRTQnV5SUFBQkFBQUFBQUFBQUFBQUlBQUFBQVl2UEQxTjF1Z2JiLy9BRzQ4R1Y4b295NExxdytockllNitjZENJZzZtV01DajBFWWl4dGd5ZmRzemtqd0dtakpSS3dKa3UxcEN5Tlpjd09tY29BaUJzRU1Jdnp2VERrdDBhSG52a01yWEFOUkVXSFl1NlZPRWUrOGYxUk53N1NrMUJqNnRVS2srWm89Cg==
```

### **PASSO 3: Aggiungi TAURI_SIGNING_PRIVATE_KEY_PASSWORD**

- **Name**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- **Value**: Lascia vuoto (premi solo Save)

---

## 🚀 Come Funziona

### **Rilascio Automatico**

Quando vuoi rilasciare una nuova versione:

```bash
# 1. Commit le modifiche
git add .
git commit -m "feat: nuova funzionalità"

# 2. Crea un tag con la versione
git tag v1.0.1

# 3. Push tutto
git push origin main --tags
```

### **Cosa Succede Automaticamente**

1. ✅ GitHub Actions inizia la compilazione
2. ✅ Compila l'app per ARM64 (Raspberry Pi)
3. ✅ Firma l'app con la chiave privata
4. ✅ Crea una release su GitHub
5. ✅ Tutti i Raspberry Pi si aggiornano automaticamente entro 6 ore!

---

## 📱 Aggiornamento sui Raspberry Pi

**Automatico**: Ogni Raspberry Pi controlla GitHub ogni 6 ore e si aggiorna automaticamente quando trova una nuova versione.

**Log in tempo reale**:
```bash
ssh pi@192.168.1.237
sudo journalctl -u omnilypro-signage -f
```

---

## 🔒 Sicurezza

- ⚠️ **NON condividere mai** la chiave privata (`~/.tauri/omnilypro-signage.key`)
- ⚠️ **NON committare** la chiave privata su Git
- ✅ La chiave è salvata in GitHub Secrets (criptata)
- ✅ Solo tu puoi creare release firmate

---

## 🎯 Versioning

Usa il [Semantic Versioning](https://semver.org/):

- **v1.0.0** → Prima release
- **v1.0.1** → Bug fix
- **v1.1.0** → Nuove funzionalità (compatibili)
- **v2.0.0** → Breaking changes

---

**Fatto con ❤️ da OmnilyPro**

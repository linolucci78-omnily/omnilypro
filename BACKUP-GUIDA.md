# 🛡️ Sistema di Backup OmnilyPro

## ✅ Sistema Attivo

Il tuo progetto è ora protetto con un sistema di backup automatico professionale!

## 📍 Dove Sono i Backup?

**Percorso:** `/Users/pasqualelucci/Backups/omnilypro/`

I backup vengono salvati come file `.tar.gz` compres si con la data nel nome:
- `omnilypro-backup-20251104_214014.tar.gz`

## ⏰ Backup Automatico

- **Frequenza:** Ogni giorno alle 2:00 AM
- **Automatico:** Sì, non devi fare nulla
- **Conservazione:** Ultimi 30 backup (circa 1 mese di storico)
- **Dimensione:** ~110MB per backup

## 🚀 Backup Manuale

Se vuoi fare un backup immediatamente:

```bash
~/backup-omnilypro.sh
```

## 📊 Vedere i Backup Disponibili

```bash
ls -lht ~/Backups/omnilypro/
```

## 🔄 Ripristinare un Backup

Se devi ripristinare il progetto da un backup:

```bash
# 1. Vai nella directory Desktop
cd ~/Desktop

# 2. Estrai il backup che vuoi ripristinare
tar -xzf ~/Backups/omnilypro/omnilypro-backup-YYYYMMDD_HHMMSS.tar.gz -C omnilypro-restored

# 3. Reinstalla le dipendenze
cd omnilypro-restored/frontend
npm install

# 4. Avvia il server
npm run dev
```

## 🔥 In Caso di Emergenza

Se perdi tutto sul Mac, hai 3 copie:

1. ✅ **Backup locali** in `~/Backups/omnilypro/`
2. ✅ **GitHub** - repository completo su https://github.com/linolucci78-omnily/omnilypro
3. ✅ **Vercel** - deploy attivo

### Ripristino Totale da GitHub:

```bash
cd ~/Desktop
git clone https://github.com/linolucci78-omnily/omnilypro.git
cd omnilypro/frontend
npm install
npm run dev
```

## 📝 Log dei Backup

I log vengono salvati in:
- Output: `~/backup-omnilypro.log`
- Errori: `~/backup-omnilypro-error.log`

## ⚙️ Gestione Sistema Automatico

### Disabilitare backup automatico:
```bash
launchctl unload ~/Library/LaunchAgents/com.omnilypro.backup.plist
```

### Riabilitare:
```bash
launchctl load ~/Library/LaunchAgents/com.omnilypro.backup.plist
```

### Verificare stato:
```bash
launchctl list | grep omnilypro
```

## 💡 Consigli

1. **Controlla i backup periodicamente** - Ogni settimana dai un'occhiata a `~/Backups/omnilypro/`
2. **Testa il ripristino** - Ogni tanto prova a estrarre un backup per verificare che funzioni
3. **GitHub è la tua rete di sicurezza** - Fai `git push` spesso!
4. **Time Machine** - Se hai un disco esterno, attiva Time Machine per backup dell'intero Mac

## 📞 Supporto

Se hai problemi con il sistema di backup:
1. Controlla i log: `cat ~/backup-omnilypro.log`
2. Verifica spazio disco: `df -h`
3. Il backup manuale funziona sempre: `~/backup-omnilypro.sh`

---

**La tua futura azienda è protetta! 🚀**

# 🎨 Come Testare le Animazioni di Notifica

## ✅ Setup Completato

Ho integrato con successo il sistema di animazioni nel customer-app! Ora puoi vedere e testare le animazioni.

## 🧪 Animation Tester

Ho aggiunto un componente di test che appare **SOLO in development** (non sarà visibile in produzione).

### Dove lo Trovo?

Il pannello di test appare nell'**angolo in basso a destra** dell'app, con 4 pulsanti colorati:

- 🪙 **Coin Fountain** (giallo) - Fontana di monete dal pulsante QR
- 🎉 **Confetti** (rosa) - Coriandoli colorati
- 🏆 **Trophy** (viola) - Trofeo tier upgrade (per ora fa confetti)
- ✨ **Sparkles** (blu) - Brillantini (placeholder)

### Come Usarlo

1. Avvia il dev server (già avviato su `http://localhost:5174/`)
2. Apri l'app nel browser
3. Fai login in qualsiasi organizzazione
4. Vedrai il pannello 🧪 Animation Test in basso a destra
5. Clicca su uno dei bottoni per vedere l'animazione!

## 🪙 Coin Fountain Animation

Questa è l'animazione principale che volevi! Ecco cosa fa:

### Comportamento
- **Le monete partono dal centro in basso** (dietro il pulsante QR della navbar)
- **Effetto fontana**: sparano verso l'alto a ventaglio
- **Fisica realistica**: gravità, velocità, rotazione
- **Durata**: 1 secondo di spawn continuo (~240 monete)
- **z-index 40**: dietro la navbar (z-50) ma sopra il contenuto

### Immagine Moneta
L'animazione usa l'immagine:
```
https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/moneyomily.png
```

Se vuoi cambiarla, modifica `NotificationAnimations.tsx:41`

## 🎉 Confetti Animation

- **150 coriandoli colorati** che esplodono dal centro
- **6 colori** (rosso, arancione, verde, blu, viola, rosa)
- **Fade out** graduale
- Perfetto per tier upgrades e celebrazioni!

## 🔗 Integrazione con OneSignal

Le animazioni sono già collegate a OneSignal! Quando arriva una notifica push con dati custom, l'animazione parte automaticamente:

### Esempio Payload Notifica
```json
{
  "app_id": "YOUR_ONESIGNAL_APP_ID",
  "contents": { "en": "Hai guadagnato 50 punti!" },
  "data": {
    "animation_type": "points",
    "animation_data": { "points": 50 }
  }
}
```

Tipo di animazioni supportate:
- `"points"` → Coin fountain
- `"confetti"` → Confetti colorati
- `"trophy"` → Trophy (per ora fa confetti)
- `"sparkles"` → Sparkles (placeholder)

## 📝 Prossimi Step

1. **Testare le animazioni** usando il pannello di test
2. **Configurare OneSignal** seguendo `ONESIGNAL_SETUP.md`
3. **Implementare Trophy animation** (attualmente è un placeholder)
4. **Implementare Sparkles animation** (attualmente è un placeholder)
5. **Creare NotificationEditor** per gestire campagne dal frontend

## 🐛 Debugging

Se le animazioni non funzionano:

1. **Controlla la console del browser** per messaggi di errore
2. **Verifica che l'immagine moneta sia caricata**: guarda i log `"Coin image loaded successfully"`
3. **z-index issues**: se le monete non sono visibili, potrebbero essere dietro altri elementi
4. **Performance**: se l'animazione lagga, riduci il numero di particelle in `NotificationAnimations.tsx:113` (attualmente 4 per frame)

## 🎯 Files Creati

1. **NotificationAnimations.tsx** - Componente canvas con tutte le animazioni
2. **useNotificationAnimations.ts** - Hook React per facile utilizzo
3. **AnimationTester.tsx** - Pannello di test (solo development)
4. **App.tsx** - Aggiornato per includere le animazioni globalmente

## 🚀 Come Funziona

```
OneSignal Notification
    ↓
window.dispatchEvent('onesignal-animation')
    ↓
useNotificationAnimations hook ascolta l'evento
    ↓
Chiama animationsRef.current?.triggerXXX()
    ↓
Canvas rendering con requestAnimationFrame
    ↓
60 FPS smooth animation! 🎨
```

---

**Buon divertimento con le animazioni!** 🎉

Se hai domande o vuoi modificare qualcosa, fammi sapere!

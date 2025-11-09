# 🧪 Guida Test: Login NFC Operatori POS

## Step 1: Eseguire Migration SQL

1. Vai su **Supabase Dashboard**: https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** (icona database a sinistra)
4. Clicca **"+ New query"**
5. Copia e incolla il contenuto del file:
   ```
   frontend/database/migrations/050_create_operator_nfc_cards.sql
   ```
6. Clicca **"Run"** (o `Ctrl/Cmd + Enter`)
7. Verifica che non ci siano errori

### Verifica tabelle create:
```sql
-- Esegui questa query per verificare
SELECT * FROM public.operator_nfc_cards;
SELECT * FROM public.operator_nfc_login_logs;
```

---

## Step 2: Test Pannello Admin (Desktop)

### A. Accedi come Admin
1. Apri: http://localhost:5173
2. Login con account admin
3. Vai su **Dashboard**

### B. Apri Gestione Tessere Operatori
1. Clicca sulla sidebar: **Impostazioni** ⚙️
2. Nella pagina Settings Hub, cerca la card:
   **"Tessere Operatori POS"** (icona smartphone 📱, colore rosso)
3. Clicca sulla card → Si apre il pannello laterale

### C. Associa una Tessera (Desktop - senza NFC fisico)
Poiché stai testando da desktop, simuliamo la lettura NFC:

1. Nel pannello, vai su tab **"Associa Tessera"**
2. Clicca **"Avvicina Tessera"**
3. Apri la **Console del Browser** (F12)
4. Simula la lettura NFC con:
   ```javascript
   // Simula lettura tessera NFC
   if (window.operatorNFCManagementHandler) {
     window.operatorNFCManagementHandler({ uid: "TEST-NFC-001" });
   }
   ```
5. La UI dovrebbe mostrare: ✅ "Tessera letta" + UID
6. Seleziona un operatore dalla lista
7. Il nome viene compilato automaticamente (puoi modificarlo)
8. Clicca **"Associa Tessera"**
9. Verifica il messaggio di successo

### D. Verifica Lista Tessere
1. Torna al tab **"Tessere Attive"**
2. Dovresti vedere la tessera appena creata
3. Prova i pulsanti:
   - 🔌 **Power**: Disattiva/Riattiva tessera
   - 🗑️ **Trash**: Elimina tessera

### E. Verifica Database
Torna su Supabase SQL Editor:
```sql
SELECT * FROM public.operator_nfc_cards;
-- Dovresti vedere la tessera TEST-NFC-001
```

---

## Step 3: Test Login POS (con NFC simulato)

### A. Apri POS Mode
1. Apri in una nuova tab/finestra:
   ```
   http://localhost:5173/?pos
   ```
2. Verifica che vedi la schermata di login POS

### B. Verifica UI Toggle
1. Dovresti vedere 2 pulsanti toggle:
   - **Tessera NFC** (attivo di default, rosso)
   - **Password** (inattivo, grigio)
2. Verifica che **"Tessera NFC"** sia già selezionato

### C. Test Login NFC (Simulato)
1. Clicca **"Avvicina la Tessera"**
2. Vedi l'animazione pulsante con icona tessera
3. Apri **Console del Browser** (F12)
4. Simula la lettura NFC:
   ```javascript
   // Simula lettura della tessera associata
   if (window.loginNFCHandler) {
     window.loginNFCHandler({ uid: "TEST-NFC-001" });
   }
   ```
5. **Cosa dovrebbe succedere:**
   - ✅ Appare schermata "Operatore Riconosciuto"
   - ✅ Mostra il nome dell'operatore
   - ✅ Testo "Accesso in corso..."
   - ✅ Dopo 1.5 secondi → Login automatico
   - ✅ Toast di successo
   - ✅ Redirect al dashboard

### D. Test Tessera Non Riconosciuta
1. Torna alla schermata login POS
2. Clicca "Avvicina la Tessera"
3. Simula tessera sconosciuta:
   ```javascript
   if (window.loginNFCHandler) {
     window.loginNFCHandler({ uid: "UNKNOWN-CARD-999" });
   }
   ```
4. **Dovrebbe mostrare:**
   - ❌ Toast errore: "Tessera non riconosciuta"
   - Il form resta attivo

### E. Test Fallback Password
1. Clicca sul toggle **"Password"**
2. Verifica che appare il form email/password
3. Fai login normalmente con email e password
4. Dovrebbe funzionare come sempre

---

## Step 4: Test con App Android (NFC Reale)

### Prerequisiti
- App POS Android installata
- Tessere NFC fisiche
- Dispositivo Android con NFC abilitato

### A. Build e Deploy App
```bash
# Assicurati che il codice sia sincronizzato
cd /path/to/android-app
./gradlew assembleDebug
# Installa l'APK sul dispositivo
```

### B. Associa Tessera Fisica
1. Desktop: Apri pannello "Tessere Operatori POS"
2. Su Android: Apri l'app POS (connessa allo stesso backend)
3. Desktop: Clicca "Associa Tessera" → "Avvicina Tessera"
4. Android: Avvicina la tessera NFC fisica al dispositivo
5. Desktop: La tessera viene letta e l'UID appare
6. Desktop: Seleziona operatore e associa

### C. Test Login con Tessera Fisica
1. Android: Apri app POS → Schermata Login
2. Verifica che il toggle "Tessera NFC" sia attivo
3. Tocca "Avvicina la Tessera"
4. Avvicina la tessera fisica al dispositivo
5. **Dovrebbe:**
   - ✅ Riconoscere la tessera
   - ✅ Mostrare nome operatore
   - ✅ Login automatico in 1-2 secondi

---

## Step 5: Verifica Log Accessi

### SQL Query per vedere i log
```sql
SELECT
  l.*,
  c.operator_name,
  c.nfc_uid,
  u.email as user_email
FROM public.operator_nfc_login_logs l
LEFT JOIN public.operator_nfc_cards c ON l.operator_card_id = c.id
LEFT JOIN auth.users u ON l.user_id = u.id
ORDER BY l.created_at DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

### Problema: "Funzione NFC non disponibile"
**Causa**: Bridge Android non presente (stai testando da browser desktop)
**Soluzione**: Usa la simulazione JavaScript nella console

### Problema: "Tessera non riconosciuta"
**Verifica:**
```sql
SELECT * FROM public.operator_nfc_cards WHERE nfc_uid = 'TUO-UID-QUI';
```
- Se la tessera non c'è → associala prima
- Se c'è ma `is_active = false` → riattivala

### Problema: Login non funziona dopo riconoscimento
**Causa**: L'operatore non ha un account Supabase Auth
**Soluzione**:
1. Verifica che l'utente esista in `auth.users`
2. L'operatore deve avere un account email/password valido

### Problema: RLS Policy Error
**Causa**: Le RLS policies non permettono l'accesso
**Fix**: Esegui di nuovo la migration SQL, controlla che le policies siano create

---

## 📊 Checklist Test Completo

### Admin Panel
- [ ] Pannello si apre da SettingsHub
- [ ] Tab "Tessere Attive" mostra la lista
- [ ] Tab "Associa Tessera" permette di leggere NFC
- [ ] Selezione operatore funziona
- [ ] Associazione salva nel database
- [ ] Attiva/Disattiva tessera funziona
- [ ] Elimina tessera funziona

### Login POS
- [ ] Toggle NFC/Password visibile
- [ ] NFC selezionato di default
- [ ] Lettura NFC avvia animazione
- [ ] Tessera riconosciuta mostra operatore
- [ ] Login automatico dopo 1.5s
- [ ] Toast di successo
- [ ] Redirect al dashboard
- [ ] Fallback password funziona

### Database
- [ ] Tabelle create senza errori
- [ ] Tessere salvate correttamente
- [ ] Log accessi registrati
- [ ] RLS policies funzionanti

---

## 🎯 Scenario Test Completo

1. **Setup** (1 volta)
   - ✅ Esegui migration SQL
   - ✅ Crea 2-3 account operatori

2. **Test Admin** (Desktop)
   - ✅ Associa 2-3 tessere a operatori diversi
   - ✅ Verifica lista tessere
   - ✅ Disattiva una tessera

3. **Test Login** (Simulato)
   - ✅ Login con tessera attiva → Successo
   - ✅ Login con tessera disattivata → Errore
   - ✅ Login con tessera sconosciuta → Errore
   - ✅ Fallback password → Successo

4. **Test Reale** (Android + NFC fisico)
   - ✅ Associa tessera fisica
   - ✅ Login con tessera fisica
   - ✅ Verifica log accessi

---

## 🎉 Test Completato!

Se tutti i test passano, il sistema è pronto per la produzione! 🚀

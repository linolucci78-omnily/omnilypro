# OmnilyPro - Audit Checklist Rapido

## ✅ Test da Fare Ora (15 minuti)

### 1. Login & Auth
- [ ] Vai su `http://localhost:5173/login`
- [ ] Prova a fare login con le tue credenziali
- [ ] **Funziona?** → Sì / No / Errore: ___________

### 2. Dashboard
- [ ] Dopo login, vedi la dashboard?
- [ ] Vedi i dati (clienti, transazioni, statistiche)?
- [ ] **Funziona?** → Sì / No / Errore: ___________

### 3. Gestione Clienti
- [ ] Vai su `/dashboard/customers`
- [ ] Riesci a vedere la lista clienti?
- [ ] Riesci ad aggiungere un cliente di test?
- [ ] **Funziona?** → Sì / No / Errore: ___________

### 4. POS Interface (ZCS108S)
- [ ] Vai su `http://localhost:5173/?posomnily=true`
- [ ] Vedi l'interfaccia POS?
- [ ] Riesci a simulare una vendita?
- [ ] **Funziona?** → Sì / No / Errore: ___________

### 5. NFC/Loyalty Points
- [ ] Nel POS, riesci a "dare punti" a un cliente?
- [ ] I punti si salvano nel database?
- [ ] **Funziona?** → Sì / No / Errore: ___________

### 6. Database Supabase
- [ ] Apri Supabase dashboard
- [ ] Vedi le tabelle (customers, transactions, organizations)?
- [ ] I dati si salvano correttamente?
- [ ] **Funziona?** → Sì / No / Errore: ___________

---

## 📊 Risultati

**Moduli Funzionanti:** _____ / 6
**Moduli da Sistemare:** _____________________
**Priorità Fix:** _____________________________

---

## 🚀 Prossimo Step

Se **4+ moduli funzionano** → Procediamo con OmnyCoin
Se **meno di 4 funzionano** → Sistemiamo prima i bug critici
